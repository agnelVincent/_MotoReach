from rest_framework import status, generics, permissions, parsers
from rest_framework.views import APIView
from rest_framework.response import Response
from django.core.mail import send_mail
from django.conf import settings
from .models import (
    ServiceRequest, WorkshopConnection, ServiceExecution, 
    Estimate, WorkshopReview, MechanicReview, MechanicEarning
)
from accounts.models import Workshop, Mechanic
from .serializers import (
    ServiceRequestSerializer, NearbyWorkshopSerializer, WorkshopConnectionSerializer,
    ServiceExecutionMechanicSerializer, EstimateSerializer, EstimateCreateSerializer,
    EstimateUpdateSerializer, ComplaintCreateSerializer
)
from django.utils import timezone
from datetime import timedelta
from .utils import check_request_expiration, get_nearby_workshops, notify_service_flow_update, push_connection_count_to_workshop, push_assigned_task_count_to_mechanic
from django.db import DatabaseError, transaction
from chat.models import ChatMessageRecipient
import logging
from django.db.models import Sum, F, Count, Q
from accounts.utils import generate_otp_code
from payments.models import Payment, Wallet, WalletTransaction
from decimal import Decimal
from dateutil.relativedelta import relativedelta

logger = logging.getLogger(__name__)

def check_expired_connections(queryset):
    expiration_threshold = timezone.now() - timedelta(minutes=30)

    expired_requests = queryset.filter(
        status='REQUESTED',
        requested_at__lt=expiration_threshold
    )

    updated_count = 0

    for conn in expired_requests:
        try:
            with transaction.atomic():
                conn.status = 'AUTO_REJECTED'
                conn.responded_at = timezone.now()
                conn.save(update_fields=['status', 'responded_at'])

                service_request = conn.service_request

                if service_request.status == 'CONNECTING':
                    service_request.status = 'PLATFORM_FEE_PAID'
                    service_request.save(update_fields=['status'])

                    notify_service_flow_update(service_request.id)

            updated_count += 1

        except Exception as e:
            logger.exception(
                "Failed to process expired connection. "
                f"connection_id={conn.id}, error={str(e)}"
            )
            continue

        try:
            push_connection_count_to_workshop(conn.workshop.user.id)
        except Exception:
            logger.exception(
                f"Failed to push workshop count for connection_id={conn.id}"
            )

    return updated_count

class CreateServiceRequestView(generics.CreateAPIView):
    serializer_class = ServiceRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def perform_create(self, serializer):
        serializer.save(user = self.request.user)

    def create(self, request , *args, **kwargs):
        try:
            serializer = self.get_serializer(data = request.data)
            serializer.is_valid(raise_exception = True)

            self.perform_create(serializer)

            u_lat = serializer.data['user_latitude']
            u_long = serializer.data['user_longitude']

            nearby_list = get_nearby_workshops(u_lat, u_long)
            nearby_serializer = NearbyWorkshopSerializer(nearby_list, many = True)
        
            return Response({
                'request' : serializer.data,
                'nearby_workshops' : nearby_serializer.data
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    

class ServiceRequestDetailView(generics.RetrieveAPIView):
    serializer_class = ServiceRequestSerializer
    queryset = ServiceRequest.objects.all()

    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            
            check_request_expiration(instance)
            instance.refresh_from_db()

            u_lat = instance.user_latitude
            u_lon = instance.user_longitude
            
            nearby_list = get_nearby_workshops(u_lat, u_lon)
            
            req_serializer = self.get_serializer(instance)
            ws_serializer = NearbyWorkshopSerializer(nearby_list, many=True)
            
            return Response({
                "request": req_serializer.data,
                "nearby_workshops": ws_serializer.data,
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ServiceFlowDetailView(generics.RetrieveAPIView):
    #used for socket api call
    serializer_class = ServiceRequestSerializer
    queryset = ServiceRequest.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()

            check_request_expiration(instance)
            instance.refresh_from_db()

            req_serializer = self.get_serializer(instance)

            return Response({
                "request": req_serializer.data,
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserServiceRequestListView(generics.ListAPIView):
    serializer_class = ServiceRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        try:
            qs = ServiceRequest.objects.filter(user=self.request.user).order_by('-created_at')
            
            user_connections = WorkshopConnection.objects.filter(
                service_request__in=qs,
                status='REQUESTED'
            )
            check_expired_connections(user_connections)
            
            for req in qs:
                check_request_expiration(req)
                
            qs = ServiceRequest.objects.filter(user=self.request.user).order_by('-created_at')

            return qs
        except Exception as e:
            return ServiceRequest.objects.none()


class ConnectWorkshopView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        workshop_id = request.data.get('workshop_id')

        try:
            service_request = ServiceRequest.objects.get(
                pk=pk,
                user=request.user
            )
        except ServiceRequest.DoesNotExist:
            return Response(
                {"error": "Service request not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            workshop = Workshop.objects.get(pk=workshop_id)
        except Workshop.DoesNotExist:
            return Response(
                {"error": "Workshop not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if not service_request.platform_fee_paid:
            return Response(
                {"error": "Platform fee not paid"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if service_request.status == 'EXPIRED':
            return Response(
                {"error": "This service request has expired."},
                status=status.HTTP_400_BAD_REQUEST
            )

        existing_connection = WorkshopConnection.objects.filter(
            service_request=service_request,
            status__in=['REQUESTED', 'ACCEPTED']
        ).exists()

        if existing_connection:
            return Response(
                {"error": "You already have an active connection request for this service."},
                status=status.HTTP_400_BAD_REQUEST
            )

        previous_attempts = WorkshopConnection.objects.filter(
            service_request=service_request,
            workshop=workshop
        ).count()

        if previous_attempts >= 3:
            return Response(
                {
                    "error": (
                        "You have reached the maximum limit of "
                        "3 connection attempts for this workshop."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                WorkshopConnection.objects.create(
                    service_request=service_request,
                    workshop=workshop,
                    status='REQUESTED'
                )

                service_request.status = 'CONNECTING'
                service_request.save(update_fields=['status'])

            try:
                push_connection_count_to_workshop(workshop.user.id)
            except Exception:
                logger.exception(
                    "Failed to push connection count",
                    extra={
                        "workshop_id": workshop.id,
                        "service_request_id": service_request.id,
                    }
                )

            return Response(
                {"message": "Connection requested successfully"},
                status=status.HTTP_201_CREATED
            )

        except Exception:
            logger.exception(
                "Failed to create workshop connection",
                extra={
                    "user_id": request.user.id,
                    "service_request_id": service_request.id,
                    "workshop_id": workshop.id,
                }
            )

            return Response(
                {"error": "Something went wrong. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class WorkshopConnectionRequestsView(APIView):

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            if request.user.role != 'workshop_admin':
                return Response({"error": "Only workshop admins can access this"}, status=status.HTTP_403_FORBIDDEN)
            
            try:
                workshop = request.user.workshop
            except AttributeError:
                return Response({"error": "Workshop not found"}, status=status.HTTP_404_NOT_FOUND)
            
            check_expired_connections(WorkshopConnection.objects.filter(workshop=workshop))

            connections = WorkshopConnection.objects.filter(workshop=workshop).order_by('-requested_at')
            serializer = WorkshopConnectionSerializer(connections, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AcceptConnectionRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            if request.user.role != 'workshop_admin':
                return Response({"error": "Only workshop admins can accept requests"}, status=status.HTTP_403_FORBIDDEN)
            
            try:
                workshop = request.user.workshop
            except AttributeError:
                return Response({"error": "Workshop not found"}, status=status.HTTP_404_NOT_FOUND)

            try:
                connection = WorkshopConnection.objects.get(pk=pk, workshop=workshop)
            except WorkshopConnection.DoesNotExist:
                return Response({"error": "Connection request not found"}, status=status.HTTP_404_NOT_FOUND)

            if connection.status != 'REQUESTED':
                return Response({"error": f"Connection request is already {connection.status}"}, status=status.HTTP_400_BAD_REQUEST)

            connection.status = 'ACCEPTED'
            connection.responded_at = timezone.now()
            connection.save()

            connection.service_request.status = 'CONNECTED'
            connection.service_request.save()
            push_connection_count_to_workshop(workshop.user.id)
            notify_service_flow_update(connection.service_request_id)

            execution, created = ServiceExecution.objects.get_or_create(
                service_request=connection.service_request,
                defaults={
                    'workshop': workshop,
                    'assigned_to': request.user,
                    'estimate_amount': 0
                }
            )
            
            if not created:
                execution.workshop = workshop
                execution.assigned_to = request.user
                execution.save()

            return Response({"message": "Connection request accepted successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
             return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RejectConnectionRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            if request.user.role != 'workshop_admin':
                return Response({"error": "Only workshop admins can reject requests"}, status=status.HTTP_403_FORBIDDEN)
            
            try:
                workshop = request.user.workshop
            except AttributeError:
                return Response({"error": "Workshop not found"}, status=status.HTTP_404_NOT_FOUND)

            try:
                connection = WorkshopConnection.objects.get(pk=pk, workshop=workshop)
            except WorkshopConnection.DoesNotExist:
                return Response({"error": "Connection request not found"}, status=status.HTTP_404_NOT_FOUND)

            if connection.status != 'REQUESTED':
                return Response({"error": f"Connection request is already {connection.status}"}, status=status.HTTP_400_BAD_REQUEST)

            connection.status = 'REJECTED'
            connection.responded_at = timezone.now()
            connection.save()

            connection.service_request.status = 'PLATFORM_FEE_PAID'
            connection.service_request.save()
            push_connection_count_to_workshop(workshop.user.id)
            notify_service_flow_update(connection.service_request_id)

            return Response({"message": "Connection request rejected successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
             return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CancelConnectionRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            if request.user.role != 'workshop_admin':
                return Response({"error": "Only workshop admins can cancel connections"}, status=status.HTTP_403_FORBIDDEN)
            
            try:
                workshop = request.user.workshop
            except AttributeError:
                return Response({"error": "Workshop not found"}, status=status.HTTP_404_NOT_FOUND)

            try:
                connection = WorkshopConnection.objects.get(pk=pk, workshop=workshop)
            except WorkshopConnection.DoesNotExist:
                return Response({"error": "Connection request not found"}, status=status.HTTP_404_NOT_FOUND)

            if connection.status != 'ACCEPTED':
                return Response({"error": "Only accepted connections can be cancelled"}, status=status.HTTP_400_BAD_REQUEST)

            sr = connection.service_request
            if sr.status in ('SERVICE_AMOUNT_PAID', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED'):
                return Response(
                    {"error": "Cannot cancel connection after the customer has paid. Contact support if needed."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            connection.status = 'CANCELLED'
            connection.cancelled_by = 'WORKSHOP'
            connection.responded_at = timezone.now()
            connection.save()
            push_connection_count_to_workshop(workshop.user.id)
            ChatMessageRecipient.objects.filter(
                message__service_request=connection.service_request,
                is_read=False
            ).update(is_read=True)
            
            try:
                execution = connection.service_request.execution
                for mechanic in execution.mechanics.all():
                    mechanic.availability = 'AVAILABLE'
                    mechanic.save()
                
                execution.mechanics.clear()
                execution.assigned_to = None
                execution.estimate_amount = 0
                execution.escrow_paid = False
                execution.escrow_txn_id = None
                execution.otp_code = None
                execution.cancelled_at = timezone.now()
                execution.started_at = None
                execution.completed_at = None
                execution.save()
                
            except ServiceExecution.DoesNotExist:
                pass
            
            connection.service_request.status = 'PLATFORM_FEE_PAID'
            connection.service_request.save()
            notify_service_flow_update(connection.service_request_id)

            return Response({"message": "Connection cancelled successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserCancelConnectionView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        try:
            connection = WorkshopConnection.objects.filter(
                service_request_id=pk, 
                service_request__user=request.user,
                status__in=['REQUESTED', 'ACCEPTED']
            ).first()
            
            if not connection:
                service_request = ServiceRequest.objects.filter(pk=pk, user=request.user).first()
                if service_request and service_request.status == 'PLATFORM_FEE_PAID':
                     return Response({"message": "Connection already cancelled"}, status=status.HTTP_200_OK)
                return Response({"error": "No active connection found to cancel"}, status=status.HTTP_404_NOT_FOUND)

            if connection.service_request.status in ('SERVICE_AMOUNT_PAID', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED'):
                return Response(
                    {"error": "Cannot cancel connection after payment has been made."},
                    status=status.HTTP_400_BAD_REQUEST
                )
                 
            if connection.status == 'REQUESTED':
                connection.status = 'WITHDRAWN'
                connection.cancelled_by = 'USER'
            else:
                 connection.status = 'CANCELLED'
                 connection.cancelled_by = 'USER'
                 try:
                     execution = connection.service_request.execution
                     for mechanic in execution.mechanics.all():
                         mechanic.availability = 'AVAILABLE'
                         mechanic.save()
                     
                     # Clear mechanics and reset execution details instead of deletion
                     execution.mechanics.clear()
                     execution.assigned_to = None
                     execution.estimate_amount = 0
                     execution.escrow_paid = False
                     execution.escrow_txn_id = None
                     execution.otp_code = None
                     execution.cancelled_at = timezone.now()
                     execution.started_at = None
                     execution.completed_at = None
                     execution.save()
                     ChatMessageRecipient.objects.filter(
                        message__service_request=connection.service_request,
                        is_read=False
                    ).update(is_read=True)

                 except ServiceExecution.DoesNotExist:
                     pass

            connection.responded_at = timezone.now()
            connection.save()
            push_connection_count_to_workshop(connection.workshop.user.id)
            
            connection.service_request.status = 'PLATFORM_FEE_PAID'
            connection.service_request.save()
            notify_service_flow_update(connection.service_request_id)

            return Response({"message": "Connection cancelled"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class DeleteServiceRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        try:
            try:
                service_request = ServiceRequest.objects.get(pk=pk, user=request.user)
            except ServiceRequest.DoesNotExist:
                return Response({"error": "Service request not found"}, status=status.HTTP_404_NOT_FOUND)

            if service_request.platform_fee_paid:
                return Response({"error": "Cannot delete request because platform fee is already paid."}, status=status.HTTP_400_BAD_REQUEST)
            
            if service_request.status not in ['CREATED', 'CANCELLED', 'EXPIRED']:
                return Response({"error": "Cannot delete active or processed service request."}, status=status.HTTP_400_BAD_REQUEST)

            active_connections = WorkshopConnection.objects.filter(
                service_request=service_request,
                status__in=['REQUESTED', 'ACCEPTED']
            ).exists()
            
            if active_connections:
                 return Response({"error": "Cannot delete request with ongoing connections."}, status=status.HTTP_400_BAD_REQUEST)

            service_request.delete()
            return Response({"message": "Service request deleted successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class WorkshopMechanicsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if request.user.role != 'workshop_admin':
             return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        try:
             mechanics = Mechanic.objects.filter(workshop=request.user.workshop)
             serializer = ServiceExecutionMechanicSerializer(mechanics, many=True)
             return Response(serializer.data)
        except Exception as e:
             return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MechanicAssignedServicesView(APIView):

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != "mechanic":
            return Response(
                {"error": "Unauthorized"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            mechanic = request.user.mechanic

        except Mechanic.DoesNotExist:
            logger.warning(
                "Mechanic profile missing user_id=%s",
                request.user.id
            )
            return Response(
                {"error": "Mechanic profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        except Exception:
            logger.exception(
                "Error fetching mechanic profile user_id=%s",
                request.user.id
            )
            return Response(
                {"error": "Failed to fetch mechanic profile"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        try:
            qs = ServiceRequest.objects.filter(
                execution__mechanics=mechanic
            ).select_related("user").order_by("-created_at")

            serializer = ServiceRequestSerializer(qs, many=True)

            return Response(
                serializer.data,
                status=status.HTTP_200_OK
            )

        except DatabaseError:
            logger.exception(
                "DB error while fetching assigned services mechanic_id=%s",
                mechanic.id
            )
            return Response(
                {"error": "Database error while fetching services"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        except Exception:
            logger.exception(
                "Unexpected error while fetching assigned services mechanic_id=%s",
                mechanic.id
            )
            return Response(
                {"error": "Failed to fetch assigned services"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        

class AssignMechanicView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        if request.user.role != "workshop_admin":
            return Response(
                {"error": "Unauthorized"},
                status=status.HTTP_403_FORBIDDEN
            )

        mechanic_id = request.data.get("mechanic_id")
        if not mechanic_id:
            return Response(
                {"error": "Mechanic ID required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            service_request = ServiceRequest.objects.get(pk=pk)

        except ServiceRequest.DoesNotExist:
            logger.warning("ServiceRequest not found id=%s", pk)
            return Response(
                {"error": "Service Request not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        except DatabaseError:
            logger.exception("DB error fetching ServiceRequest id=%s", pk)
            return Response(
                {"error": "Database error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        try:
            try:
                execution = service_request.execution
            except ServiceExecution.DoesNotExist:
                execution = ServiceExecution.objects.create(
                    service_request=service_request,
                    workshop=request.user.workshop,
                    assigned_to=request.user,
                    estimate_amount=0
                )

            if execution.workshop != request.user.workshop:
                return Response(
                    {"error": "Unauthorized for this service"},
                    status=status.HTTP_403_FORBIDDEN
                )

            mechanic = Mechanic.objects.get(
                pk=mechanic_id,
                workshop=request.user.workshop
            )

            if mechanic in execution.mechanics.all():
                return Response(
                    {"message": "Mechanic already assigned"},
                    status=status.HTTP_200_OK
                )

            execution.mechanics.add(mechanic)
            mechanic.availability = "BUSY"
            mechanic.save()

            push_assigned_task_count_to_mechanic(mechanic.user.id)
            notify_service_flow_update(pk, event="mechanic_assigned")

            return Response(
                {"message": "Mechanic assigned successfully"},
                status=status.HTTP_200_OK
            )

        except Mechanic.DoesNotExist:
            logger.warning(
                "Mechanic not found id=%s workshop_id=%s",
                mechanic_id,
                request.user.workshop.id
            )
            return Response(
                {"error": "Mechanic not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        except DatabaseError:
            logger.exception(
                "DB error assigning mechanic mechanic_id=%s service_request_id=%s",
                mechanic_id,
                pk
            )
            return Response(
                {"error": "Database error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        except Exception:
            logger.exception(
                "Unexpected error assigning mechanic mechanic_id=%s service_request_id=%s",
                mechanic_id,
                pk
            )
            return Response(
                {"error": "Failed to assign mechanic"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class RemoveMechanicView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        if request.user.role != 'workshop_admin':
             return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
             
        mechanic_id = request.data.get('mechanic_id')
        
        try:
             service_request = ServiceRequest.objects.get(pk=pk)
             execution = service_request.execution
             
             if execution.workshop != request.user.workshop:
                  return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
                  
             mechanic = Mechanic.objects.get(pk=mechanic_id)
             
             if mechanic in execution.mechanics.all():
                  execution.mechanics.remove(mechanic)
                  mechanic.availability = 'AVAILABLE'
                  mechanic.save()
                  push_assigned_task_count_to_mechanic(mechanic.user.id)
                  notify_service_flow_update(execution.service_request_id, event='mechanic_removed')
             return Response({"message": "Mechanic removed successfully"})
             
        except Exception as e:
             return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CreateEstimateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, connection_id):
        """Create a new estimate for an accepted connection"""
        if request.user.role != 'workshop_admin':
            return Response({"error": "Only workshop admins can create estimates"}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            workshop = request.user.workshop
        except AttributeError:
            return Response({"error": "Workshop not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            connection = WorkshopConnection.objects.get(
                pk=connection_id,
                workshop=workshop,
                status='ACCEPTED'
            )
        except WorkshopConnection.DoesNotExist:
            return Response({"error": "Connection not found or not accepted"}, status=status.HTTP_404_NOT_FOUND)

        # Check if estimate already exists
        existing_estimate = Estimate.objects.filter(
            workshop_connection=connection,
            status__in=['DRAFT', 'SENT']
        ).first()
        
        if existing_estimate:
            return Response(
                {"error": "An active estimate already exists. Please update or delete it first."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = EstimateCreateSerializer(data=request.data)
        if serializer.is_valid():
            with transaction.atomic():
                estimate = serializer.save(
                    workshop_connection=connection,
                    service_request=connection.service_request,
                )
                return Response(EstimateSerializer(estimate).data, status=status.HTTP_201_CREATED)
        logger.warning("CreateEstimate serializer errors: %s", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UpdateEstimateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, estimate_id):
        """Update an existing estimate (only DRAFT status)"""
        if request.user.role != 'workshop_admin':
            return Response({"error": "Only workshop admins can update estimates"}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            workshop = request.user.workshop
        except AttributeError:
            return Response({"error": "Workshop not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            estimate = Estimate.objects.get(
                pk=estimate_id,
                workshop_connection__workshop=workshop
            )
        except Estimate.DoesNotExist:
            return Response({"error": "Estimate not found"}, status=status.HTTP_404_NOT_FOUND)

        if estimate.status not in ('DRAFT', 'REJECTED'):
            return Response(
                {"error": f"Cannot update estimate with status: {estimate.status}. Only DRAFT or REJECTED estimates can be updated."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = EstimateUpdateSerializer(estimate, data=request.data, partial=True)
        if serializer.is_valid():
            with transaction.atomic():
                estimate = serializer.save()
                if estimate.status == 'REJECTED':
                    estimate.status = 'DRAFT'
                    estimate.rejected_at = None
                    estimate.save()
                return Response(EstimateSerializer(estimate).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SendEstimateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, estimate_id):
        """Send estimate to user (change status from DRAFT to SENT)"""
        if request.user.role != 'workshop_admin':
            return Response({"error": "Only workshop admins can send estimates"}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            workshop = request.user.workshop
        except AttributeError:
            return Response({"error": "Workshop not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            estimate = Estimate.objects.get(
                pk=estimate_id,
                workshop_connection__workshop=workshop
            )
        except Estimate.DoesNotExist:
            return Response({"error": "Estimate not found"}, status=status.HTTP_404_NOT_FOUND)

        if estimate.status != 'DRAFT':
            return Response(
                {"error": f"Can only send DRAFT estimates. Current status: {estimate.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if estimate.line_items.count() == 0:
            return Response(
                {"error": "Cannot send estimate without line items"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if estimate.total_amount <= 0:
            return Response(
                {"error": "Cannot send estimate with zero or negative total amount"},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            estimate.status = 'SENT'
            estimate.sent_at = timezone.now()
            estimate.save()

            # Update service request status
            service_request = estimate.service_request
            if service_request.status == 'CONNECTED':
                service_request.status = 'ESTIMATE_SHARED'
                service_request.save()
            notify_service_flow_update(service_request.id, event='estimate_sent')

        return Response(EstimateSerializer(estimate).data, status=status.HTTP_200_OK)


class ApproveEstimateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, estimate_id):

        try:
            estimate = Estimate.objects.get(pk=estimate_id)
        except Estimate.DoesNotExist:
            return Response({"error": "Estimate not found"}, status=status.HTTP_404_NOT_FOUND)

        # Verify user owns the service request
        if estimate.service_request.user != request.user:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        if estimate.status != 'SENT':
            return Response(
                {"error": f"Can only approve SENT estimates. Current status: {estimate.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if estimate.expires_at and timezone.now() > estimate.expires_at:
            return Response(
                {"error": "This estimate has expired"},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            estimate.status = 'APPROVED'
            estimate.approved_at = timezone.now()
            estimate.save()

            # Update ServiceExecution with estimate amount
            try:
                execution = estimate.service_request.execution
                execution.estimate_amount = estimate.total_amount
                execution.estimate = estimate
                execution.save()
            except ServiceExecution.DoesNotExist:
                # Create execution if it doesn't exist
                connection = estimate.workshop_connection
                ServiceExecution.objects.create(
                    service_request=estimate.service_request,
                    workshop=connection.workshop,
                    assigned_to=connection.workshop.user,
                    estimate_amount=estimate.total_amount,
                    estimate=estimate
                )
            notify_service_flow_update(estimate.service_request_id, event='estimate_approved')

        return Response(EstimateSerializer(estimate).data, status=status.HTTP_200_OK)


class RejectEstimateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, estimate_id):
        """User rejects an estimate"""
        try:
            estimate = Estimate.objects.get(pk=estimate_id)
        except Estimate.DoesNotExist:
            return Response({"error": "Estimate not found"}, status=status.HTTP_404_NOT_FOUND)

        # Verify user owns the service request
        if estimate.service_request.user != request.user:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        if estimate.status != 'SENT':
            return Response(
                {"error": f"Can only reject SENT estimates. Current status: {estimate.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            estimate.status = 'REJECTED'
            estimate.rejected_at = timezone.now()
            estimate.save()
            notify_service_flow_update(estimate.service_request_id, event='estimate_rejected')

        return Response(EstimateSerializer(estimate).data, status=status.HTTP_200_OK)


class ResendEstimateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, estimate_id):
        """Workshop re-sends a rejected estimate to the user (status REJECTED -> SENT)"""
        if request.user.role != 'workshop_admin':
            return Response({"error": "Only workshop admins can resend estimates"}, status=status.HTTP_403_FORBIDDEN)
        try:
            workshop = request.user.workshop
        except AttributeError:
            return Response({"error": "Workshop not found"}, status=status.HTTP_404_NOT_FOUND)
        try:
            estimate = Estimate.objects.get(
                pk=estimate_id,
                workshop_connection__workshop=workshop
            )
        except Estimate.DoesNotExist:
            return Response({"error": "Estimate not found"}, status=status.HTTP_404_NOT_FOUND)
        if estimate.status != 'REJECTED':
            return Response(
                {"error": f"Can only resend REJECTED estimates. Current status: {estimate.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        with transaction.atomic():
            estimate.status = 'SENT'
            estimate.sent_at = timezone.now()
            estimate.rejected_at = None
            estimate.save()
            
            service_request = estimate.service_request
            if service_request.status == 'CONNECTED':
                service_request.status = 'ESTIMATE_SHARED'
                service_request.save()
            notify_service_flow_update(service_request.id, event='estimate_resent')

        return Response(EstimateSerializer(estimate).data, status=status.HTTP_200_OK)


class ReportComplaintView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            service_request = ServiceRequest.objects.get(pk=pk)

        except ServiceRequest.DoesNotExist:
            logger.warning("ServiceRequest not found id=%s", pk)
            return Response(
                {"error": "Service request not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        except DatabaseError:
            logger.exception("DB error fetching ServiceRequest id=%s", pk)
            return Response(
                {"error": "Database error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        try:
            # =====================================================
            # Determine reported user
            # =====================================================

            if request.user == service_request.user:

                active_connection = WorkshopConnection.objects.filter(
                    service_request=service_request,
                    status="ACCEPTED"
                ).first()

                if not active_connection:
                    return Response(
                        {"error": "No active workshop connection found to report"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                reported_user = active_connection.workshop.user

            elif (
                request.user.role == "workshop_admin"
                and hasattr(request.user, "workshop")
            ):

                active_connection = WorkshopConnection.objects.filter(
                    service_request=service_request,
                    workshop=request.user.workshop,
                    status="ACCEPTED"
                ).first()

                if not active_connection:
                    return Response(
                        {"error": "You are not connected to this service request"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                reported_user = service_request.user

            else:
                return Response(
                    {"error": "Unauthorized"},
                    status=status.HTTP_403_FORBIDDEN
                )

            # =====================================================
            # Validate and save complaint
            # =====================================================

            serializer = ComplaintCreateSerializer(data=request.data)

            if serializer.is_valid():
                serializer.save(
                    reporter=request.user,
                    reported_user=reported_user,
                    service_request=service_request
                )

                return Response(
                    {"message": "Complaint submitted successfully"},
                    status=status.HTTP_201_CREATED
                )

            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        except DatabaseError:
            logger.exception(
                "DB error while reporting complaint user_id=%s service_request_id=%s",
                request.user.id,
                pk
            )
            return Response(
                {"error": "Database error while submitting complaint"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        except Exception:
            logger.exception(
                "Unexpected error in ReportComplaintView user_id=%s service_request_id=%s",
                request.user.id,
                pk
            )
            return Response(
                {"error": "Failed to submit complaint"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



class GetEstimateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, estimate_id):
        try:
            estimate = Estimate.objects.get(pk=estimate_id)

        except Estimate.DoesNotExist:
            logger.warning("Estimate not found id=%s", estimate_id)
            return Response(
                {"error": "Estimate not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        except DatabaseError:
            logger.exception("DB error fetching estimate id=%s", estimate_id)
            return Response(
                {"error": "Database error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        except Exception:
            logger.exception(
                "Unexpected error fetching estimate id=%s",
                estimate_id
            )
            return Response(
                {"error": "Failed to fetch estimate"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        try:
            is_workshop_admin = (
                request.user.role == "workshop_admin"
                and hasattr(request.user, "workshop")
                and estimate.workshop_connection.workshop == request.user.workshop
            )

            is_service_owner = estimate.service_request.user == request.user

            is_mechanic = False
            if request.user.role == "mechanic":
                try:
                    execution = estimate.service_request.execution
                    is_mechanic = execution.mechanics.filter(
                        user=request.user
                    ).exists()
                except Exception:
                    logger.exception(
                        "Error checking mechanic access user_id=%s estimate_id=%s",
                        request.user.id,
                        estimate_id
                    )

            if not (is_workshop_admin or is_service_owner or is_mechanic):
                return Response(
                    {"error": "Unauthorized"},
                    status=status.HTTP_403_FORBIDDEN
                )

            return Response(
                EstimateSerializer(estimate).data,
                status=status.HTTP_200_OK
            )

        except DatabaseError:
            logger.exception(
                "DB error while validating access estimate_id=%s user_id=%s",
                estimate_id,
                request.user.id
            )
            return Response(
                {"error": "Database error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        except Exception:
            logger.exception(
                "Unexpected error in GetEstimateView estimate_id=%s user_id=%s",
                estimate_id,
                request.user.id
            )
            return Response(
                {"error": "Failed to process request"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ListEstimatesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, connection_id):
        try:
            connection = WorkshopConnection.objects.get(pk=connection_id)

        except WorkshopConnection.DoesNotExist:
            logger.warning("WorkshopConnection not found id=%s", connection_id)
            return Response(
                {"error": "Connection not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        except DatabaseError:
            logger.exception("DB error fetching connection id=%s", connection_id)
            return Response(
                {"error": "Database error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        try:
            is_workshop_admin = (
                request.user.role == "workshop_admin"
                and hasattr(request.user, "workshop")
                and connection.workshop == request.user.workshop
            )

            is_service_owner = connection.service_request.user == request.user

            is_mechanic = False
            if request.user.role == "mechanic":
                try:
                    execution = connection.service_request.execution
                    is_mechanic = execution.mechanics.filter(
                        user=request.user
                    ).exists()
                except Exception:
                    logger.exception(
                        "Error checking mechanic access user_id=%s connection_id=%s",
                        request.user.id,
                        connection_id
                    )

            if not (is_workshop_admin or is_service_owner or is_mechanic):
                return Response(
                    {"error": "Unauthorized"},
                    status=status.HTTP_403_FORBIDDEN
                )

            try:
                estimates = Estimate.objects.filter(
                    workshop_connection=connection
                ).order_by("-created_at")

                serializer = EstimateSerializer(estimates, many=True)

                return Response(
                    serializer.data,
                    status=status.HTTP_200_OK
                )

            except DatabaseError:
                logger.exception(
                    "DB error fetching estimates connection_id=%s",
                    connection_id
                )
                return Response(
                    {"error": "Database error while fetching estimates"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        except Exception:
            logger.exception(
                "Unexpected error in ListEstimatesView connection_id=%s user_id=%s",
                connection_id,
                request.user.id
            )
            return Response(
                {"error": "Failed to fetch estimates"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DeleteEstimateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, estimate_id):
        if request.user.role != "workshop_admin":
            return Response(
                {"error": "Only workshop admins can delete estimates"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            workshop = request.user.workshop
        except AttributeError:
            logger.warning("Workshop missing for user_id=%s", request.user.id)
            return Response(
                {"error": "Workshop not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            estimate = Estimate.objects.get(
                pk=estimate_id,
                workshop_connection__workshop=workshop
            )

        except Estimate.DoesNotExist:
            logger.warning(
                "Estimate not found id=%s workshop_id=%s",
                estimate_id,
                workshop.id
            )
            return Response(
                {"error": "Estimate not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        except DatabaseError:
            logger.exception(
                "DB error fetching estimate id=%s",
                estimate_id
            )
            return Response(
                {"error": "Database error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        try:
            if estimate.status != "DRAFT":
                return Response(
                    {
                        "error": (
                            f"Cannot delete estimate with status: "
                            f"{estimate.status}. Only DRAFT estimates can be deleted."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            estimate.delete()

            return Response(
                {"message": "Estimate deleted successfully"},
                status=status.HTTP_200_OK
            )

        except DatabaseError:
            logger.exception(
                "DB error deleting estimate id=%s",
                estimate_id
            )
            return Response(
                {"error": "Database error while deleting estimate"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        except Exception:
            logger.exception(
                "Unexpected error deleting estimate id=%s user_id=%s",
                estimate_id,
                request.user.id
            )
            return Response(
                {"error": "Failed to delete estimate"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        


class StartServiceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            service_request = ServiceRequest.objects.get(pk=pk)
            execution = service_request.execution

        except ServiceRequest.DoesNotExist:
            logger.warning("ServiceRequest not found id=%s", pk)
            return Response(
                {"error": "Service request not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        except DatabaseError:
            logger.exception("DB error fetching service request id=%s", pk)
            return Response(
                {"error": "Database error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        except Exception:
            logger.exception("Unexpected error fetching service request id=%s", pk)
            return Response(
                {"error": "Failed to fetch service request"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        try:
            is_workshop_admin = (
                getattr(request.user, "role", "") == "workshop_admin"
                and execution.workshop == getattr(request.user, "workshop", None)
            )

            is_mechanic = execution.mechanics.filter(
                user=request.user
            ).exists()

            if not (is_workshop_admin or is_mechanic):
                return Response(
                    {"error": "Unauthorized"},
                    status=status.HTTP_403_FORBIDDEN
                )

            if service_request.status != "SERVICE_AMOUNT_PAID":
                return Response(
                    {"error": "Cannot start the service. Service amount not paid yet"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            with transaction.atomic():
                service_request.status = "IN_PROGRESS"
                service_request.save()

                execution.started_at = timezone.now()
                execution.save()

            notify_service_flow_update(pk, event="service_started")

            return Response(
                {"message": "Service started successfully"},
                status=status.HTTP_200_OK
            )

        except DatabaseError:
            logger.exception("DB error starting service id=%s", pk)
            return Response(
                {"error": "Database error while starting service"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        except Exception:
            logger.exception(
                "Unexpected error starting service id=%s user_id=%s",
                pk,
                request.user.id
            )
            return Response(
                {"error": "Failed to start service"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        

class EndServiceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            service_request = ServiceRequest.objects.get(pk=pk)
            execution = service_request.execution

        except ServiceRequest.DoesNotExist:
            logger.warning("ServiceRequest not found id=%s", pk)
            return Response(
                {"error": "Service request not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        except AttributeError:
            logger.warning("ServiceExecution missing for service_request_id=%s", pk)
            return Response(
                {"error": "Service execution not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        except DatabaseError:
            logger.exception("DB error fetching service id=%s", pk)
            return Response(
                {"error": "Database error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        except Exception:
            logger.exception("Unexpected error fetching service id=%s", pk)
            return Response(
                {"error": "Failed to fetch service"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        try:
            is_workshop_admin = (
                getattr(request.user, "role", "") == "workshop_admin"
                and execution.workshop == getattr(request.user, "workshop", None)
            )

            is_mechanic = execution.mechanics.filter(
                user=request.user
            ).exists()

            if not (is_workshop_admin or is_mechanic):
                return Response(
                    {"error": "Unauthorized"},
                    status=status.HTTP_403_FORBIDDEN
                )

            if service_request.status != "IN_PROGRESS":
                return Response(
                    {"error": f"Cannot complete. Current status: {service_request.status}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            with transaction.atomic():
                service_request.status = "COMPLETED"
                service_request.save()

                execution.completed_at = timezone.now()
                execution.save()

            notify_service_flow_update(pk, event="service_completed")

            return Response(
                {"message": "Service completed successfully"},
                status=status.HTTP_200_OK
            )

        except DatabaseError:
            logger.exception("DB error completing service id=%s", pk)
            return Response(
                {"error": "Database error while completing service"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        except Exception:
            logger.exception(
                "Unexpected error completing service id=%s user_id=%s",
                pk,
                request.user.id
            )
            return Response(
                {"error": "Failed to complete service"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


def _can_generate_service_otp(user, execution):
    """True if user is workshop admin or assigned mechanic."""

    if not user or not execution:
        return False

    try:
        if user.role == "workshop_admin":
            return execution.workshop == getattr(user, "workshop", None)

        if user.role == "mechanic":
            return execution.mechanics.filter(user=user).exists()

    except Exception:
        logger.exception(
            "Error checking OTP permission user_id=%s execution_id=%s",
            getattr(user, "id", None),
            getattr(execution, "id", None),
        )
        return False

    return False


class GenerateServiceOTPView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            execution = ServiceExecution.objects.get(pk=pk)

        except ServiceExecution.DoesNotExist:
            logger.warning("ServiceExecution not found id=%s", pk)
            return Response(
                {"error": "Execution not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        except DatabaseError:
            logger.exception("DB error fetching ServiceExecution id=%s", pk)
            return Response(
                {"error": "Database error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        except Exception:
            logger.exception("Unexpected error fetching ServiceExecution id=%s", pk)
            return Response(
                {"error": "Failed to fetch execution"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        if not _can_generate_service_otp(request.user, execution):
            return Response(
                {"error": "Only workshop admin or assigned mechanic can generate OTP"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not execution.escrow_paid:
            return Response(
                {"error": "Service amount must be paid (escrowed) before generating OTP"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:

            otp = generate_otp_code(length=6)
            execution.otp_code = otp
            execution.save()

            notify_service_flow_update(
                execution.service_request_id,
                event="otp_generated"
            )

            user = execution.service_request.user

            subject = f"Service completion OTP for request #{execution.service_request.id}"

            message = "\n".join([
                f"Hello {getattr(user, 'full_name', user.email)},",
                "",
                "Your service provider has marked the service as ready for completion.",
                "Please use the following One-Time Password (OTP) in the app to verify",
                "that the service has been completed. Once verified, the payment held",
                "in escrow will be released to the workshop.",
                "",
                f"OTP: {otp}",
                "",
                "If you did not request this or believe this is a mistake, please contact support.",
                "",
                "Thanks,",
                f"{settings.DEFAULT_FROM_EMAIL} Team",
            ])

            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )

            return Response(
                {"message": "OTP generated and sent to the customer's email."},
                status=status.HTTP_200_OK,
            )

        except Exception:
            logger.exception(
                "Failed generating/sending OTP execution_id=%s user_id=%s",
                pk,
                request.user.id
            )

            execution.otp_code = None
            execution.save(update_fields=["otp_code"])

            return Response(
                {"error": "Failed to send OTP email. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class VerifyServiceOTPView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        """User (service request owner) verifies OTP. Marks service completed and releases escrow to workshop."""
        otp = (request.data.get("otp") or "").strip()
        if not otp or len(otp) != 6:
            return Response({"error": "Valid 6-digit OTP required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            execution = ServiceExecution.objects.get(pk=pk)
        except ServiceExecution.DoesNotExist:
            logger.warning("Execution not found pk=%s", pk)
            return Response({"error": "Execution not found"}, status=status.HTTP_404_NOT_FOUND)

        if execution.service_request.user != request.user:
            return Response({"error": "Only the service request owner can verify OTP"}, status=status.HTTP_403_FORBIDDEN)

        if execution.otp_code != otp:
            return Response({"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)


        try:
            with transaction.atomic():
                # Mark execution complete
                execution.completed_at = timezone.now()
                execution.otp_code = None
                execution.save(update_fields=["completed_at", "otp_code"])

                service_request = execution.service_request
                service_request.status = "COMPLETED"
                service_request.save(update_fields=["status"])

                # Process escrow payment
                escrow_payment = Payment.objects.filter(
                    service_request=service_request,
                    payment_type="SERVICE_ESCROW",
                    status="COMPLETED",
                    escrow_released=False
                ).first()

                if escrow_payment:
                    workshop_user = execution.workshop.user
                    MECHANIC_SHARE_PERCENTAGE = Decimal("0.20")
                    mechanics = list(execution.mechanics.all())

                    if mechanics:
                        mechanic_pool = (escrow_payment.amount * MECHANIC_SHARE_PERCENTAGE).quantize(Decimal("0.01"))
                        workshop_share = escrow_payment.amount - mechanic_pool
                        per_mechanic_amount = (mechanic_pool / len(mechanics)).quantize(Decimal("0.01"))
                    else:
                        workshop_share = escrow_payment.amount
                        mechanic_pool = Decimal("0.00")
                        per_mechanic_amount = Decimal("0.00")

                    # Credit workshop
                    wallet, _ = Wallet.objects.get_or_create(user=workshop_user)
                    wallet.balance = F("balance") + workshop_share
                    wallet.save(update_fields=["balance"])
                    WalletTransaction.objects.create(
                        wallet=wallet,
                        amount=workshop_share,
                        transaction_type="CREDIT",
                        description=f"Service completion payout for request #{service_request.id}"
                    )

                    # Credit mechanics
                    for mechanic in mechanics:
                        m_wallet, _ = Wallet.objects.get_or_create(user=mechanic.user)
                        m_wallet.balance = F("balance") + per_mechanic_amount
                        m_wallet.save(update_fields=["balance"])
                        WalletTransaction.objects.create(
                            wallet=m_wallet,
                            amount=per_mechanic_amount,
                            transaction_type="CREDIT",
                            description=f"Service share (20% / {len(mechanics)} mechanic(s)) for request #{service_request.id}"
                        )
                        MechanicEarning.objects.create(
                            mechanic=mechanic,
                            service_execution=execution,
                            amount=per_mechanic_amount,
                            earning_type="SERVICE_SHARE",
                            description=f"Auto share from service #{service_request.id}"
                        )

                    escrow_payment.escrow_released = True
                    escrow_payment.save(update_fields=["escrow_released"])

                service_request.status = "VERIFIED"
                service_request.save(update_fields=["status"])
                notify_service_flow_update(service_request.id)

        except Exception as e:
            logger.exception("Failed verifying service OTP execution_id=%s user_id=%s", pk, request.user.id)
            return Response({"error": "Failed to verify service. Please try again later."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"message": "Service verified. Payment released to workshop."}, status=status.HTTP_200_OK)
    


class WorkshopDashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if getattr(request.user, "role", "") != "workshop_admin" or not hasattr(request.user, "workshop"):
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        workshop = request.user.workshop

        try:

            # 1. Total Revenue
            wallet = Wallet.objects.filter(user=request.user).first()
            total_revenue = float(wallet.balance) if wallet else 0.0

            # 2. Active Requests
            active_requests = WorkshopConnection.objects.filter(
                workshop=workshop,
                status="ACCEPTED"
            ).exclude(
                service_request__status__in=["COMPLETED", "VERIFIED", "CANCELLED", "EXPIRED"]
            ).count()

            # 3. Completed Services
            completed_services = ServiceRequest.objects.filter(
                execution__workshop=workshop,
                status__in=["COMPLETED", "VERIFIED"]
            ).count()

            # 4. Active Mechanics
            active_mechanics = Mechanic.objects.filter(workshop=workshop).count()

            # 5. Recent Requests
            recent_connections = WorkshopConnection.objects.filter(
                workshop=workshop,
                status="ACCEPTED"
            ).select_related("service_request__user").order_by("-requested_at")[:5]

            recent_requests_data = []
            for conn in recent_connections:
                sr = conn.service_request
                recent_requests_data.append({
                    "id": f"#REQ-{sr.id}",
                    "customer": getattr(sr.user, "full_name", sr.user),
                    "service": sr.issue_category,
                    "status": sr.get_status_display(),
                    "time": conn.requested_at.strftime("%I:%M %p, %b %d"),
                    "priority": "high" if "Emergency" in sr.issue_category else "medium"
                })

            # 6. Top Mechanics
            top_mechanics = Mechanic.objects.filter(workshop=workshop).annotate(
                completed_count=Count(
                    "assigned_executions",
                    filter=Q(assigned_executions__service_request__status__in=["COMPLETED", "VERIFIED"])
                )
            ).order_by("-completed_count")[:3]

            top_mechanics_data = []
            for mech in top_mechanics:
                top_mechanics_data.append({
                    "name": mech.user.full_name,
                    "completed": mech.completed_count,
                    "rating": 4.5,  # Placeholder; can be replaced with actual ratings
                    "earnings": "N/A"  # Placeholder
                })

            # 7. Monthly Revenue for last 6 months
            now = timezone.now()
            monthly_data = []
            for i in range(5, -1, -1):
                target_date = now - relativedelta(months=i)
                revenue = 0
                if wallet:
                    revenue = WalletTransaction.objects.filter(
                        wallet=wallet,
                        transaction_type="CREDIT",
                        created_at__year=target_date.year,
                        created_at__month=target_date.month
                    ).aggregate(total=Sum("amount"))["total"] or 0
                monthly_data.append({
                    "month": target_date.strftime("%b"),
                    "revenue": float(revenue)
                })

            return Response({
                "total_revenue": total_revenue,
                "active_requests": active_requests,
                "completed_services": completed_services,
                "active_mechanics": active_mechanics,
                "recent_requests": recent_requests_data,
                "top_mechanics": top_mechanics_data,
                "monthly_data": monthly_data,
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception("Failed to fetch workshop dashboard stats for user_id=%s", request.user.id)
            return Response({"error": "Failed to fetch dashboard stats"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

        
class SubmitRatingView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            execution = ServiceExecution.objects.get(pk=pk)
        except ServiceExecution.DoesNotExist:
            return Response(
                {"error": "Service Execution not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if execution.service_request.user != request.user:
            return Response(
                {"error": "Unauthorized to review this service"},
                status=status.HTTP_403_FORBIDDEN
            )

        if execution.service_request.status not in ['COMPLETED', 'VERIFIED']:
            return Response(
                {"error": "You can only rate completed services"},
                status=status.HTTP_400_BAD_REQUEST
            )

        workshop_rating_data = request.data.get('workshop_rating')
        mechanic_ratings_data = request.data.get('mechanic_ratings', [])

        try:
            with transaction.atomic():
                # Workshop rating
                if workshop_rating_data:
                    rating = workshop_rating_data.get('rating')
                    comment = workshop_rating_data.get('comment', '')
                    if rating is not None:
                        WorkshopReview.objects.update_or_create(
                            service_execution=execution,
                            workshop=execution.workshop,
                            reviewer=request.user,
                            defaults={
                                'rating': rating,
                                'comment': comment
                            }
                        )

                # Mechanic ratings
                for mech_data in mechanic_ratings_data:
                    mech_id = mech_data.get('mechanic_id')
                    rating = mech_data.get('rating')
                    comment = mech_data.get('comment', '')
                    if mech_id and rating is not None:
                        if execution.mechanics.filter(id=mech_id).exists():
                            mechanic = execution.mechanics.get(id=mech_id)
                            MechanicReview.objects.update_or_create(
                                service_execution=execution,
                                mechanic=mechanic,
                                reviewer=request.user,
                                defaults={
                                    'rating': rating,
                                    'comment': comment
                                }
                            )
                        else:
                            logger.warning(
                                "User %s tried to rate mechanic %s not assigned to execution %s",
                                request.user.id, mech_id, execution.id
                            )

            return Response({"message": "Ratings submitted successfully!"}, status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception(
                "Failed to submit ratings for execution %s by user %s",
                execution.id, request.user.id
            )
            return Response(
                {"error": "Failed to submit ratings. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        

class MechanicDashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'mechanic' or not hasattr(request.user, 'mechanic'):
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        mechanic = request.user.mechanic

        try:
            today = timezone.now().date()

            # 1. Today's Earnings
            todays_earnings = MechanicEarning.objects.filter(
                mechanic=mechanic,
                created_at__date=today
            ).aggregate(total=Sum('amount'))['total'] or 0.00

            # 2. Completed Today
            completed_today = ServiceExecution.objects.filter(
                mechanics=mechanic,
                completed_at__date=today,
                service_request__status__in=['COMPLETED', 'VERIFIED']
            ).count()

            # 3. Active Jobs
            active_jobs = ServiceExecution.objects.filter(
                mechanics=mechanic
            ).exclude(
                service_request__status__in=['COMPLETED', 'VERIFIED', 'CANCELLED', 'EXPIRED']
            ).count()

            # 4. Rating
            rating = getattr(mechanic, 'rating_avg', 0)

            # 5. Workshop State
            workshop_join_state = getattr(mechanic, 'joining_status', None)
            workshop_name = getattr(mechanic.workshop, 'workshop_name', None)

            # 6. Recent Requests
            recent_executions = ServiceExecution.objects.filter(
                mechanics=mechanic
            ).order_by('-started_at', '-service_request__created_at')[:5]

            recent_requests_data = []
            for execution in recent_executions:
                sr = execution.service_request
                recent_requests_data.append({
                    "userId": f"USR-{sr.user.id}",
                    "requestId": f"REQ-{sr.id}",
                    "problem": sr.issue_category,
                    "status": sr.get_status_display(),
                    "priority": "high" if "Emergency" in sr.issue_category else "medium",
                    "location": getattr(sr, 'location', 'Client Location'),
                    "scheduledTime": sr.created_at.strftime("%I:%M %p, %b %d"),
                    "customerName": getattr(sr.user, 'full_name', sr.user.email)
                })

            return Response({
                "todays_earnings": float(todays_earnings),
                "completed_today": completed_today,
                "active_jobs": active_jobs,
                "rating": rating,
                "workshop_join_state": workshop_join_state,
                "workshop_name": workshop_name,
                "recent_requests": recent_requests_data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception("Failed to fetch mechanic dashboard stats for user %s", request.user.id)
            return Response(
                {"error": "Failed to fetch dashboard stats. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )