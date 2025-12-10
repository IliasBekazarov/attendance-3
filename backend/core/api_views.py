from rest_framework import viewsets, status, permissions, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.db.models import Count, Q
from datetime import date, timedelta
from django.shortcuts import get_object_or_404

from .models import (
    UserProfile, Student, Teacher, Course, Group, Subject,
    Schedule, Attendance, LeaveRequest, Notification
)
from .serializers import (
    UserProfileSerializer, StudentSerializer, TeacherSerializer,
    CourseSerializer, GroupSerializer, SubjectSerializer,
    ScheduleSerializer, AttendanceSerializer, AttendanceCreateSerializer,
    LeaveRequestSerializer, LeaveRequestCreateSerializer,
    NotificationSerializer, AttendanceStatsSerializer, GroupStatsSerializer
)

class RoleBasedPermission(permissions.BasePermission):
    """Ролго негизделген кирүү укуктары"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return hasattr(request.user, 'userprofile')

class AdminOrManagerPermission(permissions.BasePermission):
    """Админ же менеджер укугу"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        try:
            return request.user.userprofile.role in ['ADMIN', 'MANAGER']
        except:
            return False

class StudentViewSet(viewsets.ReadOnlyModelViewSet):
    """Студенттер API"""
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        """Ролго жараша фильтр"""
        user = self.request.user
        
        # UserProfile барбы текшерүү
        try:
            profile = user.userprofile
        except:
            return Student.objects.none()
            
        if profile.role == 'STUDENT':
            # Студент өзүн гана көрө алат
            return Student.objects.filter(user=user)
        elif profile.role == 'PARENT':
            # Ата-эне өз балдарын көрөт (Student.parents related_name='parent_profiles')
            return profile.parent_profiles.all()
        else:
            # Админ, менеджер, мугалим бардыгын көрө алат
            queryset = Student.objects.all()
            
            # Group боюнча фильтр
            group_id = self.request.query_params.get('group')
            if group_id:
                queryset = queryset.filter(group_id=group_id)
            
            return queryset

class TeacherViewSet(viewsets.ReadOnlyModelViewSet):
    """Мугалимдер API"""
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        """Бардык мугалимдерди кайтаруу"""
        return Teacher.objects.all()

class TimeSlotViewSet(viewsets.ReadOnlyModelViewSet):
    """Убакыт слоттары API"""
    from .models import TimeSlot
    queryset = TimeSlot.objects.filter(is_active=True)
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def list(self, request, *args, **kwargs):
        """Убакыт слоттарын тизме катары кайтаруу"""
        from .models import TimeSlot
        timeslots = TimeSlot.objects.filter(is_active=True).order_by('order')
        
        data = []
        for ts in timeslots:
            data.append({
                'id': ts.id,
                'name': ts.name,
                'start_time': ts.start_time.strftime('%H:%M'),
                'end_time': ts.end_time.strftime('%H:%M'),
                'order': ts.order
            })
        
        return Response(data)

class AttendanceViewSet(viewsets.ModelViewSet):
    """Катышуу API"""
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return AttendanceCreateSerializer
        return AttendanceSerializer
    
    def get_queryset(self):
        """Ролго жараша фильтр"""
        user = self.request.user
        queryset = Attendance.objects.all()
        
        # UserProfile барбы текшерүү
        try:
            profile = user.userprofile
        except:
            return Attendance.objects.none()
        
        if profile.role == 'STUDENT':
            try:
                student = Student.objects.get(user=user)
                queryset = queryset.filter(student=student)
            except Student.DoesNotExist:
                queryset = Attendance.objects.none()
        elif profile.role == 'PARENT':
            # Ата-энелер өз балдарынын катышуусун көрө алат
            student_ids = profile.parent_profiles.values_list('id', flat=True)
            queryset = queryset.filter(student_id__in=student_ids)
        
        # Дата фильтри
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        return queryset.order_by('-date')
    
    def perform_create(self, serializer):
        """Катышууну жазганда created_by көрсөтүү"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Катышуу статистикасы"""
        queryset = self.get_queryset()
        
        total_records = queryset.count()
        present_count = queryset.filter(status='Present').count()
        absent_count = queryset.filter(status='Absent').count()
        late_count = queryset.filter(status='Late').count()
        excused_count = queryset.filter(status='Excused').count()
        
        attendance_percentage = (present_count / total_records * 100) if total_records > 0 else 0
        
        stats_data = {
            'total_records': total_records,
            'present_count': present_count,
            'absent_count': absent_count,
            'late_count': late_count,
            'excused_count': excused_count,
            'attendance_percentage': round(attendance_percentage, 2)
        }
        
        serializer = AttendanceStatsSerializer(stats_data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def bulk(self, request):
        """Бир топ катышууну белгилөө"""
        attendance_records = request.data.get('attendance_records', [])
        
        if not attendance_records:
            return Response(
                {'error': 'Катышуу маалыматтары керек'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        created_records = []
        updated_records = []
        errors = []
        
        for record in attendance_records:
            try:
                # Студентти табуу
                student = Student.objects.get(id=record.get('student_id'))
                
                # Бар катышууну текшерүү
                existing = Attendance.objects.filter(
                    student=student,
                    date=record.get('date'),
                    subject_id=record.get('subject_id'),
                    time_slot_id=record.get('time_slot_id')
                ).first()
                
                if existing:
                    # Эгерде бар болсо, жаңылайбыз
                    existing.status = record.get('status', 'Present')
                    existing.created_by = request.user
                    existing.save()
                    updated_records.append(existing)
                else:
                    # Жаңыны түзөбүз
                    attendance = Attendance.objects.create(
                        student=student,
                        date=record.get('date'),
                        subject_id=record.get('subject_id'),
                        time_slot_id=record.get('time_slot_id'),
                        status=record.get('status', 'Present'),
                        created_by=request.user
                    )
                    created_records.append(attendance)
                    
            except Student.DoesNotExist:
                errors.append(f"Студент ID {record.get('student_id')} табылган жок")
            except Exception as e:
                errors.append(f"Ката: {str(e)}")
        
        response_data = {
            'success': len(created_records) + len(updated_records),
            'created': len(created_records),
            'updated': len(updated_records),
            'errors': errors
        }
        
        return Response(response_data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def history(self, request):
        """Катышуу тарыхы - дата боюнча группаланган"""
        queryset = self.get_queryset()
        
        # Студент боюнча фильтр
        student_id = request.query_params.get('student_id')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        
        # Группа боюнча фильтр
        group_id = request.query_params.get('group_id')
        if group_id:
            queryset = queryset.filter(student__group_id=group_id)
        
        # Subject боюнча фильтр
        subject_id = request.query_params.get('subject_id')
        if subject_id:
            queryset = queryset.filter(subject_id=subject_id)
        
        # Date range фильтри
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        # Serializer менен кайтаруу
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class LeaveRequestViewSet(viewsets.ModelViewSet):
    """Бошотуу сурамдары API"""
    queryset = LeaveRequest.objects.all()
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return LeaveRequestCreateSerializer
        return LeaveRequestSerializer
    
    def get_queryset(self):
        """Ролго жараша фильтр"""
        user = self.request.user
        queryset = LeaveRequest.objects.all()
        
        # UserProfile барбы текшерүү
        try:
            profile = user.userprofile
        except:
            return LeaveRequest.objects.none()
        
        if profile.role == 'STUDENT':
            try:
                student = Student.objects.get(user=user)
                queryset = queryset.filter(student=student)
            except Student.DoesNotExist:
                queryset = LeaveRequest.objects.none()
        elif profile.role == 'PARENT':
            # Ата-энелер өз балдарынын арыздарын көрүшөт
            student_ids = profile.parent_profiles.values_list('id', flat=True)
            queryset = queryset.filter(student_id__in=student_ids)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        """Бошотуу сурамын түзгөндө студентти автоматтык көрсөтүү"""
        try:
            profile = self.request.user.userprofile
        except:
            raise serializers.ValidationError("Колдонуучу профили табылган жок")
        
        if profile.role == 'STUDENT':
            try:
                student = Student.objects.get(user=self.request.user)
                serializer.save(student=student)
            except Student.DoesNotExist:
                raise serializers.ValidationError("Студент профили табылган жок")
        else:
            raise serializers.ValidationError("Бул функция студенттер үчүн гана")
    
    @action(detail=True, methods=['post'], permission_classes=[AdminOrManagerPermission])
    def approve(self, request, pk=None):
        """Бошотуу сурамын бекитүү"""
        leave_request = self.get_object()
        leave_request.status = 'APPROVED'
        leave_request.approved_by = request.user
        leave_request.save()
        
        # Билдирме жөнөтүү логикасы кошулушу мүмкүн
        
        serializer = self.get_serializer(leave_request)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[AdminOrManagerPermission])
    def reject(self, request, pk=None):
        """Бошотуу сурамын четке кагуу"""
        leave_request = self.get_object()
        leave_request.status = 'REJECTED'
        leave_request.approved_by = request.user
        leave_request.save()
        
        # Билдирме жөнөтүү логикасы кошулушу мүмкүн
        
        serializer = self.get_serializer(leave_request)
        return Response(serializer.data)

class NotificationViewSet(viewsets.ModelViewSet):
    """Билдирмелер API"""
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete', 'head', 'options']  # PUT/PATCH жок
    
    def get_queryset(self):
        """Колдонуучунун өз билдирмелери"""
        return Notification.objects.filter(recipient=self.request.user).order_by('-created_at')
    
    def perform_destroy(self, instance):
        """Билдирмени өчүрүү - толук өз билдирмелерин гана"""
        if instance.recipient != self.request.user:
            raise PermissionDenied("Башка адамдын билдирмелерин өчүрүүгө болбойт")
        instance.delete()
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Билдирмени окулган деп белгилөө"""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Бардык билдирмелерди окулган деп белгилөө"""
        updated = Notification.objects.filter(
            recipient=request.user, 
            is_read=False
        ).update(is_read=True)
        
        return Response({'updated': updated})

# ============= READ-ONLY VIEWSETS =============

class CourseViewSet(viewsets.ReadOnlyModelViewSet):
    """Курстар API (окуу гана)"""
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]

class GroupViewSet(viewsets.ReadOnlyModelViewSet):
    """Группалар API (окуу гана)"""
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        """Курс боюнча фильтрлөө"""
        queryset = Group.objects.all()
        course_id = self.request.query_params.get('course', None)
        
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        return queryset.order_by('name')
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Группанын статистикасы"""
        group = self.get_object()
        attendances = Attendance.objects.filter(student__group=group)
        
        total_students = Student.objects.filter(group=group).count()
        total_records = attendances.count()
        present_count = attendances.filter(status='Present').count()
        attendance_percentage = (present_count / total_records * 100) if total_records > 0 else 0
        
        stats_data = {
            'group_name': group.name,
            'total_students': total_students,
            'total_records': total_records,
            'present_count': present_count,
            'attendance_percentage': round(attendance_percentage, 2)
        }
        
        serializer = GroupStatsSerializer(stats_data)
        return Response(serializer.data)

class SubjectViewSet(viewsets.ReadOnlyModelViewSet):
    """Сабактар API (окуу гана)"""
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]

class ScheduleViewSet(viewsets.ModelViewSet):
    """Расписание API (CRUD)"""
    queryset = Schedule.objects.all()
    serializer_class = ScheduleSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        """Фильтрлөө"""
        queryset = Schedule.objects.all()
        
        # Day боюнча фильтр (Monday, Tuesday, ...)
        day = self.request.query_params.get('day')
        if day:
            queryset = queryset.filter(day=day)
        
        # Group боюнча фильтр
        group_id = self.request.query_params.get('group')
        if group_id:
            queryset = queryset.filter(group_id=group_id)
        
        # Teacher боюнча фильтр
        teacher_id = self.request.query_params.get('teacher')
        if teacher_id:
            queryset = queryset.filter(teacher_id=teacher_id)
        
        return queryset.select_related('subject', 'teacher', 'group', 'group__course', 'time_slot')
    
    @action(detail=False, methods=['get'])
    def my_schedule(self, request):
        """Мугалимдин өз сабактары"""
        user = request.user
        
        try:
            profile = user.userprofile
        except:
            return Response({'error': 'Profile not found'}, status=400)
        
        if profile.role == 'TEACHER':
            try:
                teacher = Teacher.objects.get(user=user)
                queryset = Schedule.objects.filter(teacher=teacher)
                
                # Day фильтри
                day = request.query_params.get('day')
                if day:
                    queryset = queryset.filter(day=day)
                
                serializer = self.get_serializer(queryset, many=True)
                return Response(serializer.data)
            except Teacher.DoesNotExist:
                return Response({'error': 'Teacher profile not found'}, status=404)
        elif profile.role == 'STUDENT':
            try:
                student = Student.objects.get(user=user)
                if student.group:
                    queryset = Schedule.objects.filter(group=student.group)
                    
                    # Day фильтри
                    day = request.query_params.get('day')
                    if day:
                        queryset = queryset.filter(day=day)
                    
                    serializer = self.get_serializer(queryset, many=True)
                    return Response(serializer.data)
                else:
                    return Response({'error': 'Student has no group'}, status=404)
            except Student.DoesNotExist:
                return Response({'error': 'Student profile not found'}, status=404)
        else:
            return Response({'error': 'This endpoint is for teachers and students only'}, status=403)
    
    @action(detail=True, methods=['get'])
    def students(self, request, pk=None):
        """Сабактын студенттерин алуу (attendance үчүн)"""
        schedule = self.get_object()
        
        if not schedule.group:
            return Response({'error': 'Schedule has no group'}, status=400)
        
        students_list = []
        today = date.today()
        
        # Группанын бардык студенттери
        students = Student.objects.filter(group=schedule.group).select_related('user')
        
        for student in students:
            # Бүгүн бул сабак үчүн attendance бар бы текшерүү
            attendance = Attendance.objects.filter(
                student=student,
                schedule=schedule,
                date=today
            ).first()
            
            student_data = {
                'id': student.id,
                'name': student.user.get_full_name() or student.user.username,
                'full_name': student.user.get_full_name() or student.user.username,
                'is_marked': attendance is not None,
                'current_status': attendance.status if attendance else 'Present',
                'marked_at': attendance.marked_at.strftime('%H:%M') if attendance and attendance.marked_at else None,
                'marked_by': attendance.created_by.get_full_name() if attendance and attendance.created_by else None,
            }
            students_list.append(student_data)
        
        return Response({
            'students': students_list,
            'lesson_info': {
                'subject': schedule.subject.subject_name if schedule.subject else 'Белгиленген эмес',
                'teacher': schedule.teacher.name if schedule.teacher else 'Белгиленген эмес',
                'room': schedule.room or 'Белгиленген эмес',
                'group': schedule.group.name if schedule.group else 'Белгиленген эмес',
            }
        })
    
    def perform_create(self, serializer):
        """Жаңы сабак кошуу"""
        serializer.save()
    
    def perform_update(self, serializer):
        """Сабакты өзгөртүү"""
        serializer.save()
    
    def perform_destroy(self, instance):
        """Сабакты өчүрүү"""
        instance.delete()
