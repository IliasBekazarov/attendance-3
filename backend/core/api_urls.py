from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token
from .api_views import (
    StudentViewSet, TeacherViewSet, TimeSlotViewSet, AttendanceViewSet, LeaveRequestViewSet,
    NotificationViewSet, CourseViewSet, GroupViewSet,
    SubjectViewSet, ScheduleViewSet, ReportViewSet
)
from .dashboard_api import dashboard_stats, profile_update, change_password, change_username, delete_profile_photo

# API Router
router = DefaultRouter()
router.register(r'students', StudentViewSet)
router.register(r'teachers', TeacherViewSet)
router.register(r'timeslots', TimeSlotViewSet, basename='timeslot')
router.register(r'attendance', AttendanceViewSet)
router.register(r'leave-requests', LeaveRequestViewSet)
router.register(r'notifications', NotificationViewSet)
router.register(r'courses', CourseViewSet)
router.register(r'groups', GroupViewSet)
router.register(r'subjects', SubjectViewSet)
router.register(r'schedules', ScheduleViewSet)
router.register(r'reports', ReportViewSet, basename='report')

urlpatterns = [
    # Dashboard stats
    path('dashboard/stats/', dashboard_stats, name='dashboard_stats'),
    
    # Profile update
    path('profile/update/', profile_update, name='profile_update'),
    
    # Password & Username change
    path('profile/change-password/', change_password, name='change_password'),
    path('profile/change-username/', change_username, name='change_username'),
    path('profile/delete-photo/', delete_profile_photo, name='delete_profile_photo'),
    
    # API endpoints
    path('', include(router.urls)),
    
    # Token Authentication
    path('auth/token/', obtain_auth_token, name='api_token_auth'),
    
    # API Auth (login/logout for browsable API)
    path('auth/', include('rest_framework.urls', namespace='rest_framework')),
]
