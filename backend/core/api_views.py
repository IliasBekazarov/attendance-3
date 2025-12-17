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
                    # schedule_id дагы жаңылайбыз
                    if record.get('schedule_id'):
                        existing.schedule_id = record.get('schedule_id')
                    existing.save()
                    updated_records.append(existing)
                else:
                    # Жаңыны түзөбүз
                    attendance = Attendance.objects.create(
                        student=student,
                        date=record.get('date'),
                        subject_id=record.get('subject_id'),
                        time_slot_id=record.get('time_slot_id'),
                        schedule_id=record.get('schedule_id'),  # schedule_id кошулду
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
        queryset = LeaveRequest.objects.select_related('student', 'student__user', 'student__group').all()
        
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
        elif profile.role == 'TEACHER':
            # Мугалимдер өз арыздарын көрүшөт
            try:
                student = Student.objects.get(user=user)
                queryset = queryset.filter(student=student)
            except Student.DoesNotExist:
                queryset = LeaveRequest.objects.none()
        # ADMIN жана MANAGER бардык арыздарды көрүшөт
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        """Бошотуу сурамын түзгөндө студентти автоматтык көрсөтүү"""
        try:
            profile = self.request.user.userprofile
        except:
            raise serializers.ValidationError("Колдонуучу профили табылган жок")
        
        if profile.role in ['STUDENT', 'TEACHER']:
            try:
                student = Student.objects.get(user=self.request.user)
                serializer.save(student=student)
            except Student.DoesNotExist:
                raise serializers.ValidationError("Студент профили табылган жок")
        else:
            raise serializers.ValidationError("Бул функция студенттер жана мугалимдер үчүн гана")
    
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
        
        # Четке кагуунун себебин сактоо
        rejection_reason = request.data.get('rejection_reason', '')
        if rejection_reason:
            leave_request.rejection_reason = rejection_reason
        
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
        """Сабактын студенттерин алуу (attendance үчүн)
        Эгер мугалим ошол эле убакытта бир нече группага окутса,
        бардык группалардын студенттерин кайтарат
        """
        schedule = self.get_object()
        
        if not schedule.group:
            return Response({'error': 'Schedule has no group'}, status=400)
        
        students_list = []
        today = date.today()
        
        # Ошол эле teacher, time_slot, day үчүн бардык параллелдүү сабактарды табуу
        parallel_schedules = Schedule.objects.filter(
            teacher=schedule.teacher,
            time_slot=schedule.time_slot,
            day=schedule.day
        ).select_related('group', 'subject', 'teacher')
        
        all_groups = []
        for sched in parallel_schedules:
            if sched.group:
                all_groups.append(sched.group)
        
        # Бардык группалардын студенттерин чогултуу
        for group in all_groups:
            students = Student.objects.filter(group=group).select_related('user')
            
            for student in students:
                # Бүгүн бул teacher, time_slot үчүн attendance бар бы текшерүү
                attendance = Attendance.objects.filter(
                    student=student,
                    date=today,
                    time_slot=schedule.time_slot,
                    subject=schedule.subject
                ).first()
                
                student_data = {
                    'id': student.id,
                    'name': student.user.get_full_name() or student.user.username,
                    'full_name': student.user.get_full_name() or student.user.username,
                    'group': group.name,  # Группаны көрсөтүү
                    'is_marked': attendance is not None,
                    'current_status': attendance.status if attendance else 'Present',
                    'marked_at': attendance.marked_at.strftime('%H:%M') if attendance and attendance.marked_at else None,
                    'marked_by': attendance.created_by.get_full_name() if attendance and attendance.created_by else None,
                }
                students_list.append(student_data)
        
        # Группа боюнча сортировка
        students_list.sort(key=lambda x: (x['group'], x['name']))
        
        return Response({
            'students': students_list,
            'lesson_info': {
                'subject': schedule.subject.subject_name if schedule.subject else 'Белгиленген эмес',
                'teacher': schedule.teacher.name if schedule.teacher else 'Белгиленген эмес',
                'room': schedule.room or 'Белгиленген эмес',
                'groups': ', '.join([g.name for g in all_groups]) if all_groups else 'Белгиленген эмес',
                'total_groups': len(all_groups),
                'total_students': len(students_list),
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


class ReportViewSet(viewsets.ViewSet):
    """Reports API - көп функционалдуу отчеттор"""
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    @action(detail=False, methods=['get'])
    def attendance(self, request):
        """Attendance отчету - фильтрлер менен"""
        user = request.user
        profile = user.userprofile
        
        # Фильтрлер
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        group_id = request.query_params.get('group')
        student_id = request.query_params.get('student')
        subject_id = request.query_params.get('subject')
        teacher_id = request.query_params.get('teacher')
        status_filter = request.query_params.get('status')  # Present, Absent, Late
        
        # Базалык queryset
        queryset = Attendance.objects.all().select_related(
            'student', 'student__user', 'student__group',
            'subject', 'schedule', 'schedule__teacher'
        )
        
        # Ролго жараша фильтр
        if profile.role == 'TEACHER':
            try:
                teacher = Teacher.objects.get(user=user)
                queryset = queryset.filter(schedule__teacher=teacher)
            except Teacher.DoesNotExist:
                queryset = queryset.none()
        elif profile.role == 'STUDENT':
            try:
                student = Student.objects.get(user=user)
                queryset = queryset.filter(student=student)
            except Student.DoesNotExist:
                queryset = queryset.none()
        elif profile.role == 'PARENT':
            children_ids = profile.students.values_list('id', flat=True)
            queryset = queryset.filter(student_id__in=children_ids)
        # ADMIN/MANAGER - бардык маалыматтар
        
        # Датага карата фильтр
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        # Башка фильтрлер
        if group_id:
            queryset = queryset.filter(student__group_id=group_id)
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if subject_id:
            queryset = queryset.filter(subject_id=subject_id)
        if teacher_id:
            queryset = queryset.filter(schedule__teacher_id=teacher_id)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Маалыматтарды форматтоо
        attendance_data = []
        for att in queryset.order_by('-date', 'student__user__last_name'):
            attendance_data.append({
                'id': att.id,
                'date': att.date.strftime('%Y-%m-%d'),
                'student_name': att.student.user.get_full_name() or att.student.user.username,
                'student_id': att.student.id,
                'group': att.student.group.name if att.student.group else '-',
                'subject': att.subject.subject_name if att.subject else '-',
                'teacher': att.schedule.teacher.name if att.schedule and att.schedule.teacher else '-',
                'status': att.status,
                'status_display': self._get_status_display(att.status),
                'marked_at': att.marked_at.strftime('%H:%M') if att.marked_at else '-',
                'marked_by': att.created_by.get_full_name() if att.created_by else '-',
            })
        
        # Статистика
        total = queryset.count()
        present_count = queryset.filter(status='Present').count()
        absent_count = queryset.filter(status='Absent').count()
        late_count = queryset.filter(status='Late').count()
        
        statistics = {
            'total': total,
            'present': present_count,
            'absent': absent_count,
            'late': late_count,
            'present_percentage': round((present_count / total * 100) if total > 0 else 0, 2),
            'absent_percentage': round((absent_count / total * 100) if total > 0 else 0, 2),
            'late_percentage': round((late_count / total * 100) if total > 0 else 0, 2),
        }
        
        return Response({
            'attendance': attendance_data,
            'statistics': statistics,
            'filters_applied': {
                'start_date': start_date,
                'end_date': end_date,
                'group': group_id,
                'student': student_id,
                'subject': subject_id,
                'teacher': teacher_id,
                'status': status_filter,
            }
        })
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Жалпы статистика - диаграммалар үчүн"""
        user = request.user
        profile = user.userprofile
        
        # Фильтрлер
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        group_id = request.query_params.get('group')
        
        # Базалык queryset
        queryset = Attendance.objects.all()
        
        # Ролго жараша фильтр
        if profile.role == 'TEACHER':
            try:
                teacher = Teacher.objects.get(user=user)
                queryset = queryset.filter(schedule__teacher=teacher)
            except Teacher.DoesNotExist:
                queryset = queryset.none()
        elif profile.role == 'STUDENT':
            try:
                student = Student.objects.get(user=user)
                queryset = queryset.filter(student=student)
            except Student.DoesNotExist:
                queryset = queryset.none()
        elif profile.role == 'PARENT':
            children_ids = profile.students.values_list('id', flat=True)
            queryset = queryset.filter(student_id__in=children_ids)
        
        # Датага карата фильтр
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        if group_id:
            queryset = queryset.filter(student__group_id=group_id)
        
        # Статус боюнча саноо
        stats_by_status = {
            'present': queryset.filter(status='Present').count(),
            'absent': queryset.filter(status='Absent').count(),
            'late': queryset.filter(status='Late').count(),
        }
        
        # Күн боюнча статистика (акыркы 7 күн)
        daily_stats = []
        if start_date and end_date:
            current_date = date.fromisoformat(start_date)
            end = date.fromisoformat(end_date)
        else:
            end = date.today()
            current_date = end - timedelta(days=6)
        
        while current_date <= end:
            day_data = queryset.filter(date=current_date)
            daily_stats.append({
                'date': current_date.strftime('%Y-%m-%d'),
                'date_display': current_date.strftime('%d.%m'),
                'present': day_data.filter(status='Present').count(),
                'absent': day_data.filter(status='Absent').count(),
                'late': day_data.filter(status='Late').count(),
                'total': day_data.count(),
            })
            current_date += timedelta(days=1)
        
        # Группа боюнча статистика (Admin/Manager үчүн)
        group_stats = []
        if profile.role in ['ADMIN', 'MANAGER']:
            groups = Group.objects.all()
            for group in groups:
                group_attendance = queryset.filter(student__group=group)
                total = group_attendance.count()
                present = group_attendance.filter(status='Present').count()
                group_stats.append({
                    'group_id': group.id,
                    'group_name': group.name,
                    'total': total,
                    'present': present,
                    'percentage': round((present / total * 100) if total > 0 else 0, 2),
                })
        
        # Эң көп келбеген студенттер (Admin/Manager/Teacher үчүн)
        top_absent_students = []
        if profile.role in ['ADMIN', 'MANAGER', 'TEACHER']:
            absent_by_student = queryset.filter(status='Absent').values(
                'student__id', 'student__user__first_name', 'student__user__last_name',
                'student__group__name'
            ).annotate(absent_count=Count('id')).order_by('-absent_count')[:10]
            
            for item in absent_by_student:
                top_absent_students.append({
                    'student_id': item['student__id'],
                    'student_name': f"{item['student__user__first_name']} {item['student__user__last_name']}",
                    'group': item['student__group__name'],
                    'absent_count': item['absent_count'],
                })
        
        return Response({
            'stats_by_status': stats_by_status,
            'daily_stats': daily_stats,
            'group_stats': group_stats,
            'top_absent_students': top_absent_students,
        })
    
    def _get_status_display(self, status):
        """Статусту көрсөтүү"""
        status_map = {
            'Present': '✅ Келди',
            'Absent': '❌ Келбеди',
            'Late': '⏰ Кечикти',
        }
        return status_map.get(status, status)
