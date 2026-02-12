from django.urls import path
from .views import (
    CreateServiceRequestView,
    ServiceRequestDetailView,
    UserServiceRequestListView,
    ConnectWorkshopView,
    WorkshopConnectionRequestsView,
    AcceptConnectionRequestView,
    RejectConnectionRequestView,
    CancelConnectionRequestView,
    UserCancelConnectionView,
    DeleteServiceRequestView,
    WorkshopMechanicsView,
    AssignMechanicView,
    RemoveMechanicView,
    ServiceMessageListCreateView,
    MarkServiceMessagesReadView,
    UnreadMessagesSummaryView,
)

urlpatterns = [
    path('create/', CreateServiceRequestView.as_view(), name='service-request-initiation'),
    path('<int:pk>/nearby/', ServiceRequestDetailView.as_view(), name='request-nearby'),
    path('user-requests/', UserServiceRequestListView.as_view(), name='user-requests'),
    path('<int:pk>/connect/', ConnectWorkshopView.as_view(), name='connect-workshop'),
    path('<int:pk>/delete/', DeleteServiceRequestView.as_view(), name='delete-service-request'),
    path('connection/<int:pk>/cancel/', UserCancelConnectionView.as_view(), name='user-cancel-connection'),
    path('workshop/connection-requests/', WorkshopConnectionRequestsView.as_view(), name='workshop-connection-requests'),
    path('workshop/connection-requests/<int:pk>/accept/', AcceptConnectionRequestView.as_view(), name='accept-connection'),
    path('workshop/connection-requests/<int:pk>/reject/', RejectConnectionRequestView.as_view(), name='reject-connection'),
    path('workshop/connection-requests/<int:pk>/cancel/', CancelConnectionRequestView.as_view(), name='cancel-connection'),

    # Mechanic Assignment
    path('workshop/my-mechanics/', WorkshopMechanicsView.as_view(), name='workshop-my-mechanics'),
    path('execution/<int:pk>/assign/', AssignMechanicView.as_view(), name='assign-mechanic'),
    path('execution/<int:pk>/remove/', RemoveMechanicView.as_view(), name='remove-mechanic'),

    # Chat REST endpoints
    path('<int:pk>/messages/', ServiceMessageListCreateView.as_view(), name='service-messages'),
    path('<int:pk>/messages/mark-read/', MarkServiceMessagesReadView.as_view(), name='service-messages-mark-read'),
    path('messages/unread-summary/', UnreadMessagesSummaryView.as_view(), name='unread-message-summary'),
]
