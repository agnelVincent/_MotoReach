from rest_framework import status, generics, permissions, parsers
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import ServiceRequest, WorkshopConnection, ServiceExecution, ServiceMessage
from accounts.models import Workshop, Mechanic
from .serializers import ServiceRequestSerializer, NearbyWorkshopSerializer, WorkshopConnectionSerializer, ServiceExecutionMechanicSerializer, ServiceMessageSerializer
from django.utils import timezone
from datetime import timedelta
from .utils import check_request_expiration, get_nearby_workshops


def check_expired_connections(queryset):
    expiration_threshold = timezone.now() - timedelta(minutes=10) 
    
    expired_requests = queryset.filter(
        status='REQUESTED', 
        requested_at__lt=expiration_threshold
    )
    
    updated_count = 0
    for conn in expired_requests:
        conn.status = 'AUTO_REJECTED'
        conn.responded_at = timezone.now()
        conn.save()

        if conn.service_request.status == 'CONNECTING':
            conn.service_request.status = 'PLATFORM_FEE_PAID'
            conn.service_request.save()
        updated_count += 1
    
    return updated_count

class CreateServiceRequestView(generics.CreateAPIView):
    serializer_class = ServiceRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def perform_create(self, serializer):
        serializer.save(user = self.request.user)

    def create(self, request , *args, **kwargs):
        serializer = self.get_serializer(data = request.data)
        serializer.is_valid(raise_exception = True)

        self.perform_create(serializer)

        u_lat = serializer.data['user_latitude']
        u_long = serializer.data['user_longitude']

        nearby_list = get_nearby_workshops(u_lat, u_long)
        print(nearby_list)
        nearby_serializer = NearbyWorkshopSerializer(nearby_list, many = True)
    
        return Response({
            'request' : serializer.data,
            'nearby_workshops' : nearby_serializer.data
        }, status=status.HTTP_201_CREATED)

    

class ServiceRequestDetailView(generics.RetrieveAPIView):
    serializer_class = ServiceRequestSerializer
    queryset = ServiceRequest.objects.all()

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        check_request_expiration(instance)
        instance.refresh_from_db()

        u_lat = instance.user_latitude
        u_lon = instance.user_longitude
        
        nearby_list = get_nearby_workshops(u_lat, u_lon)
        
        req_serializer = self.get_serializer(instance)
        
        active_connection = WorkshopConnection.objects.filter(
            service_request=instance
        ).exclude(status__in=['REJECTED', 'AUTO_REJECTED', 'CANCELLED', 'WITHDRAWN']).first()
        
        connection_data = None
        if active_connection:
            connection_data = WorkshopConnectionSerializer(active_connection).data
            
        ws_serializer = NearbyWorkshopSerializer(nearby_list, many=True)
        
        return Response({
            "request": req_serializer.data,
            "nearby_workshops": ws_serializer.data,
            "active_connection": connection_data
        })


class UserServiceRequestListView(generics.ListAPIView):
    serializer_class = ServiceRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
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

class ConnectWorkshopView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            service_request = ServiceRequest.objects.get(pk=pk, user=request.user)
        except ServiceRequest.DoesNotExist:
            return Response({"error": "Service request not found"}, status=status.HTTP_404_NOT_FOUND)
        
        workshop_id = request.data.get('workshop_id')
        try:
            workshop = Workshop.objects.get(pk=workshop_id)
        except Workshop.DoesNotExist:
            return Response({"error": "Workshop not found"}, status=status.HTTP_404_NOT_FOUND)

        if not service_request.platform_fee_paid:
             return Response({"error": "Platform fee not paid"}, status=status.HTTP_400_BAD_REQUEST)
        
        if service_request.status == 'EXPIRED':
             return Response({"error": "This service request has expired."}, status=status.HTTP_400_BAD_REQUEST)
        
        existing_connection = WorkshopConnection.objects.filter(
            service_request=service_request, 
            status__in=['REQUESTED', 'ACCEPTED']
        ).exists()

        if existing_connection:
            return Response({"error": "You already have an active connection request for this service."}, status=status.HTTP_400_BAD_REQUEST)
        
        previous_attempts = WorkshopConnection.objects.filter(
            service_request=service_request,
            workshop=workshop
        ).count()

        if previous_attempts >= 3:
            return Response({"error": "You have reached the maximum limit of 3 connection attempts for this workshop."}, status=status.HTTP_400_BAD_REQUEST)
        
        WorkshopConnection.objects.create(
            service_request=service_request,
            workshop=workshop,
            status='REQUESTED'
        )
        
        service_request.status = 'CONNECTING'
        service_request.save()

        return Response({"message": "Connection requested successfully"}, status=status.HTTP_201_CREATED)


class WorkshopConnectionRequestsView(APIView):

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
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


class AcceptConnectionRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
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


class RejectConnectionRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
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

        return Response({"message": "Connection request rejected successfully"}, status=status.HTTP_200_OK)


class CancelConnectionRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
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

        connection.status = 'CANCELLED'
        connection.cancelled_by = 'WORKSHOP'
        connection.responded_at = timezone.now()
        connection.save()
        
        try:
            execution = connection.service_request.execution
            for mechanic in execution.mechanics.all():
                mechanic.availability = 'AVAILABLE'
                mechanic.save()
            execution.delete()
        except ServiceExecution.DoesNotExist:
            pass
        
        connection.service_request.status = 'PLATFORM_FEE_PAID'
        connection.service_request.save()

        return Response({"message": "Connection cancelled successfully"}, status=status.HTTP_200_OK)

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

                return Response({"error": "No active connection found to cancel"}, status=status.HTTP_404_NOT_FOUND)
                
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
             
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
                 execution.delete()
             except ServiceExecution.DoesNotExist:
                 pass

        connection.responded_at = timezone.now()
        connection.save()
        
        connection.service_request.status = 'PLATFORM_FEE_PAID'
        connection.service_request.save()
        
        return Response({"message": "Connection cancelled"}, status=status.HTTP_200_OK)
        
class DeleteServiceRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
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

class AssignMechanicView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        if request.user.role != 'workshop_admin':
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        mechanic_id = request.data.get('mechanic_id')
        if not mechanic_id:
             return Response({"error": "Mechanic ID required"}, status=status.HTTP_400_BAD_REQUEST)
             
        try:
            service_request = ServiceRequest.objects.get(pk=pk)
            
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
                 return Response({"error": "Unauthorized for this service"}, status=status.HTTP_403_FORBIDDEN)

            mechanic = Mechanic.objects.get(pk=mechanic_id, workshop=request.user.workshop)
            
            if mechanic in execution.mechanics.all():
                 return Response({"message": "Mechanic already assigned"}, status=status.HTTP_200_OK)
            
            execution.mechanics.add(mechanic)
            mechanic.availability = 'BUSY'
            mechanic.save()
            
            return Response({"message": "Mechanic assigned successfully"})
            
        except ServiceRequest.DoesNotExist:
             return Response({"error": "Service Request not found"}, status=status.HTTP_404_NOT_FOUND)
        except Mechanic.DoesNotExist:
             return Response({"error": "Mechanic not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
             return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

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
                  
             return Response({"message": "Mechanic removed successfully"})
             
        except Exception as e:
             return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ServiceMessageListCreateView(generics.ListCreateAPIView):
    serializer_class = ServiceMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        service_request_id = self.kwargs['pk']
        service_request = generics.get_object_or_404(ServiceRequest, id=service_request_id)
        
        # Check permissions
        if not self._has_chat_access(service_request):
            return ServiceMessage.objects.none()
        
        return ServiceMessage.objects.filter(service_request=service_request).order_by('created_at')

    def perform_create(self, serializer):
        service_request_id = self.kwargs['pk']
        service_request = generics.get_object_or_404(ServiceRequest, id=service_request_id)
        
        if not self._has_chat_access(service_request):
            raise permissions.PermissionDenied("You don't have access to this chat")
        
        # Determine sender type and set appropriate fields
        if self.request.user.role == 'user':
            serializer.save(
                service_request=service_request,
                sender_type='USER',
                sender_user=self.request.user,
                sender_workshop=None
            )
        elif self.request.user.role == 'workshop_admin':
            try:
                workshop = self.request.user.workshop
                serializer.save(
                    service_request=service_request,
                    sender_type='WORKSHOP',
                    sender_user=None,
                    sender_workshop=workshop
                )
            except AttributeError:
                raise permissions.PermissionDenied("Workshop not found")
        else:
            raise permissions.PermissionDenied("Invalid role for sending messages")

    def _has_chat_access(self, service_request):
        user = self.request.user
        
        # User side: must be the service request owner
        if user.role == 'user':
            return service_request.user == user
        
        # Workshop side: must be connected to this service request
        elif user.role == 'workshop_admin':
            try:
                workshop = user.workshop
                # Check if workshop has an active connection or execution for this request
                return WorkshopConnection.objects.filter(
                    service_request=service_request,
                    workshop=workshop,
                    status='ACCEPTED'
                ).exists() or ServiceExecution.objects.filter(
                    service_request=service_request,
                    workshop=workshop
                ).exists()
            except AttributeError:
                return False
        
        return False


class MarkServiceMessagesReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            service_request = ServiceRequest.objects.get(id=pk)
            
            # Check permissions (same logic as chat access)
            view = ServiceMessageListCreateView()
            view.request = request
            if not view._has_chat_access(service_request):
                return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)
            
            messages = ServiceMessage.objects.filter(service_request=service_request)
            updated_count = 0
            
            if request.user.role == 'user':
                # Mark messages as read by user
                updated_count = messages.filter(read_by_user=False).update(read_by_user=True)
            elif request.user.role == 'workshop_admin':
                # Mark messages as read by workshop
                updated_count = messages.filter(read_by_workshop=False).update(read_by_workshop=True)
            
            return Response({
                "message": f"Marked {updated_count} messages as read",
                "updated_count": updated_count
            }, status=status.HTTP_200_OK)
            
        except ServiceRequest.DoesNotExist:
            return Response({"error": "Service request not found"}, status=status.HTTP_404_NOT_FOUND)


class UnreadMessagesSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        if user.role == 'user':
            # Get all unread messages for user's service requests
            unread_messages = ServiceMessage.objects.filter(
                service_request__user=user,
                read_by_user=False
            ).select_related('service_request', 'sender_workshop')
            
            # Group by service request
            summary = {}
            for message in unread_messages:
                sr_id = message.service_request.id
                if sr_id not in summary:
                    summary[sr_id] = {
                        'service_request_id': sr_id,
                        'other_party_name': message.sender_workshop.workshop_name if message.sender_workshop else 'Unknown',
                        'unread_count': 0,
                        'last_message_excerpt': message.content[:50] + '...' if len(message.content) > 50 else message.content,
                        'last_message_time': message.created_at
                    }
                summary[sr_id]['unread_count'] += 1
                
                # Update last message if this is more recent
                if message.created_at > summary[sr_id]['last_message_time']:
                    summary[sr_id]['last_message_excerpt'] = message.content[:50] + '...' if len(message.content) > 50 else message.content
                    summary[sr_id]['last_message_time'] = message.created_at
        
        elif user.role == 'workshop_admin':
            try:
                workshop = user.workshop
                
                # Get all service requests where this workshop is connected
                from django.db import models
                connected_requests = ServiceRequest.objects.filter(
                    models.Q(connections__workshop=workshop, connections__status='ACCEPTED') |
                    models.Q(execution__workshop=workshop)
                ).distinct()
                
                # Get unread messages for those requests
                unread_messages = ServiceMessage.objects.filter(
                    service_request__in=connected_requests,
                    read_by_workshop=False
                ).select_related('service_request', 'sender_user')
                
                # Group by service request
                summary = {}
                for message in unread_messages:
                    sr_id = message.service_request.id
                    if sr_id not in summary:
                        summary[sr_id] = {
                            'service_request_id': sr_id,
                            'other_party_name': message.sender_user.full_name if message.sender_user else 'Unknown',
                            'unread_count': 0,
                            'last_message_excerpt': message.content[:50] + '...' if len(message.content) > 50 else message.content,
                            'last_message_time': message.created_at
                        }
                    summary[sr_id]['unread_count'] += 1
                    
                    # Update last message if this is more recent
                    if message.created_at > summary[sr_id]['last_message_time']:
                        summary[sr_id]['last_message_excerpt'] = message.content[:50] + '...' if len(message.content) > 50 else message.content
                        summary[sr_id]['last_message_time'] = message.created_at
                        
            except AttributeError:
                summary = {}
        else:
            summary = {}
        
        items = list(summary.values())
        total_unread_count = sum(item['unread_count'] for item in items)
        
        # Sort by last message time (most recent first)
        items.sort(key=lambda x: x['last_message_time'], reverse=True)
        
        return Response({
            'total_unread_count': total_unread_count,
            'items': items
        })

    @staticmethod
    def _get_unread_summary_for_user(user):
        """Helper method to get unread summary for a specific user"""
        unread_messages = ServiceMessage.objects.filter(
            service_request__user=user,
            read_by_user=False
        ).select_related('service_request', 'sender_workshop')
        
        summary = {}
        for message in unread_messages:
            sr_id = message.service_request.id
            if sr_id not in summary:
                summary[sr_id] = {
                    'service_request_id': sr_id,
                    'other_party_name': message.sender_workshop.workshop_name if message.sender_workshop else 'Unknown',
                    'unread_count': 0,
                    'last_message_excerpt': message.content[:50] + '...' if len(message.content) > 50 else message.content,
                    'last_message_time': message.created_at
                }
            summary[sr_id]['unread_count'] += 1
            
            # Update last message if this is more recent
            if message.created_at > summary[sr_id]['last_message_time']:
                summary[sr_id]['last_message_excerpt'] = message.content[:50] + '...' if len(message.content) > 50 else message.content
                summary[sr_id]['last_message_time'] = message.created_at
        
        items = list(summary.values())
        total_unread_count = sum(item['unread_count'] for item in items)
        items.sort(key=lambda x: x['last_message_time'], reverse=True)
        
        return {
            'total_unread_count': total_unread_count,
            'items': items
        }

    @staticmethod
    def _get_unread_summary_for_workshop(workshop):
        """Helper method to get unread summary for a specific workshop"""
        from django.db import models
        connected_requests = ServiceRequest.objects.filter(
            models.Q(connections__workshop=workshop, connections__status='ACCEPTED') |
            models.Q(execution__workshop=workshop)
        ).distinct()
        
        unread_messages = ServiceMessage.objects.filter(
            service_request__in=connected_requests,
            read_by_workshop=False
        ).select_related('service_request', 'sender_user')
        
        summary = {}
        for message in unread_messages:
            sr_id = message.service_request.id
            if sr_id not in summary:
                summary[sr_id] = {
                    'service_request_id': sr_id,
                    'other_party_name': message.sender_user.full_name if message.sender_user else 'Unknown',
                    'unread_count': 0,
                    'last_message_excerpt': message.content[:50] + '...' if len(message.content) > 50 else message.content,
                    'last_message_time': message.created_at
                }
            summary[sr_id]['unread_count'] += 1
            
            # Update last message if this is more recent
            if message.created_at > summary[sr_id]['last_message_time']:
                summary[sr_id]['last_message_excerpt'] = message.content[:50] + '...' if len(message.content) > 50 else message.content
                summary[sr_id]['last_message_time'] = message.created_at
        
        items = list(summary.values())
        total_unread_count = sum(item['unread_count'] for item in items)
        items.sort(key=lambda x: x['last_message_time'], reverse=True)
        
        return {
            'total_unread_count': total_unread_count,
            'items': items
        }
