from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Q
from datetime import date, timedelta
from .models import Student, Teacher, Group, Subject, Schedule, Attendance, Course, UserProfile


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Dashboard статистикасы"""
    user = request.user
    
    try:
        profile = user.userprofile
        role = profile.role
    except:
        return Response({'error': 'Profile not found'}, status=400)
    
    stats = {}
    today = date.today()
    
    # ADMIN/MANAGER статистикасы
    if role in ['ADMIN', 'MANAGER']:
        stats = {
            'total_students': Student.objects.count(),
            'total_teachers': Teacher.objects.count(),
            'total_groups': Group.objects.count(),
            'total_subjects': Subject.objects.count(),
            
            # Бүгүнкү статистика
            'today_total': Attendance.objects.filter(
                date=today
            ).count(),
            'today_present': Attendance.objects.filter(
                date=today,
                status='Present'
            ).count(),
            'today_absent': Attendance.objects.filter(
                date=today,
                status='Absent'
            ).count(),
            'today_late': Attendance.objects.filter(
                date=today,
                status='Late'
            ).count(),
        }
        
        # Пайыздарды эсептөө
        if stats['today_total'] > 0:
            stats['today_present_rate'] = round(
                (stats['today_present'] / stats['today_total']) * 100, 1
            )
            stats['today_absent_rate'] = round(
                (stats['today_absent'] / stats['today_total']) * 100, 1
            )
            stats['today_late_rate'] = round(
                (stats['today_late'] / stats['today_total']) * 100, 1
            )
        else:
            stats['today_present_rate'] = 0
            stats['today_absent_rate'] = 0
            stats['today_late_rate'] = 0
        
        # Группалар боюнча статистика
        groups = Group.objects.all()
        groups_stats = []
        
        for group in groups:
            total_records = Attendance.objects.filter(
                student__group=group
            ).count()
            
            present_count = Attendance.objects.filter(
                student__group=group,
                status='Present'
            ).count()
            
            absent_count = Attendance.objects.filter(
                student__group=group,
                status='Absent'
            ).count()
            
            attendance_rate = 0
            if total_records > 0:
                attendance_rate = round((present_count / total_records) * 100, 1)
            
            groups_stats.append({
                'id': group.id,
                'name': group.name,
                'course': {
                    'id': group.course.id,
                    'name': group.course.name
                } if group.course else None,
                'total_records': total_records,
                'present_count': present_count,
                'absent_count': absent_count,
                'attendance_rate': attendance_rate
            })
        
        stats['groups_stats'] = groups_stats
    
    # TEACHER статистикасы
    elif role == 'TEACHER':
        try:
            teacher = Teacher.objects.get(user=user)
            
            # Бүгүнкү күндүн атын алабыз (Monday, Tuesday, ...)
            from datetime import datetime
            weekday_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            today_name = weekday_names[today.weekday()]
            
            # Бүгүнкү сабактар (бүгүнкү күнгө дал келген расписание)
            today_classes = Schedule.objects.filter(
                teacher=teacher,
                day=today_name
            )
            
            # Мугалимдин группалары жана студенттери
            teacher_schedules = Schedule.objects.filter(teacher=teacher)
            teacher_groups = Group.objects.filter(
                id__in=teacher_schedules.values_list('group_id', flat=True)
            ).distinct()
            my_students = Student.objects.filter(group__in=teacher_groups).distinct()
            
            stats = {
                'today_classes_count': today_classes.count(),
                'my_students_count': my_students.count(),
                'total_groups': teacher_groups.count()
            }
        except Teacher.DoesNotExist:
            stats = {
                'today_classes_count': 0,
                'my_students_count': 0,
                'total_groups': 0
            }
    
    # STUDENT статистикасы
    elif role == 'STUDENT':
        try:
            student = Student.objects.get(user=user)
            
            # Жалпы катышуу
            total_attendance = Attendance.objects.filter(student=student)
            present_days = total_attendance.filter(status='Present').count()
            absent_days = total_attendance.filter(status='Absent').count()
            total_days = total_attendance.count()
            
            attendance_percentage = 0
            if total_days > 0:
                attendance_percentage = round((present_days / total_days) * 100, 1)
            
            stats = {
                'attendance_percentage': attendance_percentage,
                'present_days': present_days,
                'absent_days': absent_days,
                'total_days': total_days
            }
        except Student.DoesNotExist:
            stats = {
                'attendance_percentage': 0,
                'present_days': 0,
                'absent_days': 0,
                'total_days': 0
            }
    
    # PARENT статистикасы
    elif role == 'PARENT':
        # parent_profiles - бул Student.parents ManyToMany байланышынын related_name'и
        children = profile.parent_profiles.all()
        my_children = []
        
        for child in children:
            total_attendance = Attendance.objects.filter(student=child)
            present_count = total_attendance.filter(status='Present').count()
            absent_count = total_attendance.filter(status='Absent').count()
            total_count = total_attendance.count()
            
            attendance_percentage = 0
            if total_count > 0:
                attendance_percentage = round((present_count / total_count) * 100, 1)
            
            my_children.append({
                'id': child.id,
                'name': child.name,  # Student.name колдонобуз, анткени Student.user null болушу мүмкүн
                'group': {
                    'id': child.group.id,
                    'name': child.group.name,
                    'course': {
                        'id': child.group.course.id,
                        'name': child.group.course.name
                    } if child.group.course else None
                } if child.group else None,
                'course': {
                    'id': child.course.id,
                    'name': child.course.name
                } if child.course else None,
                'present_count': present_count,
                'absent_count': absent_count,
                'attendance_percentage': attendance_percentage
            })
        
        stats = {'my_children': my_children}
    
    return Response(stats)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile_update(request):
    """Профиль маалыматын көрүү жана өзгөртүү"""
    user = request.user
    
    try:
        profile = user.userprofile
    except UserProfile.DoesNotExist:
        return Response(
            {'error': 'Profile not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        # Профиль маалыматын кайтаруу
        data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'full_name': user.get_full_name() or user.username,
            'role': profile.role,
            'phone_number': profile.phone_number or '',
            'address': profile.address or '',
            'emergency_contact_name': profile.emergency_contact_name or '',
            'emergency_contact_phone': profile.emergency_contact_phone or '',
            'profile_photo': request.build_absolute_uri(profile.profile_photo.url) if profile.profile_photo else None,
        }
        
        # Role'го жараша кошумча маалымат
        if profile.role == 'STUDENT':
            try:
                # Student user менен OneToOne байланышта
                student = user.student
                data['student_id'] = student.id
                data['group'] = {
                    'id': student.group.id,
                    'name': student.group.name,
                    'course': {
                        'id': student.group.course.id,
                        'name': student.group.course.name
                    } if student.group.course else None
                } if student.group else None
            except Exception as e:
                print(f"Student маалыматын алууда ката: {e}")
                pass
        elif profile.role == 'TEACHER':
            try:
                # Teacher user менен OneToOne байланышта
                teacher = user.teacher
                data['teacher_id'] = teacher.id
                data['subjects'] = [
                    {'id': s.id, 'name': s.subject_name} 
                    for s in teacher.subject_set.all()
                ]
            except Exception as e:
                print(f"Teacher маалыматын алууда ката: {e}")
                pass
        
        return Response(data)
    
    elif request.method == 'PATCH':
        # Профиль өзгөртүү
        data = request.data
        
        # User жалпы маалыматтары
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'email' in data:
            user.email = data['email']
        user.save()
        
        # Profile маалыматтары
        if 'phone_number' in data:
            profile.phone_number = data['phone_number']
        if 'address' in data:
            profile.address = data['address']
        if 'emergency_contact_name' in data:
            profile.emergency_contact_name = data['emergency_contact_name']
        if 'emergency_contact_phone' in data:
            profile.emergency_contact_phone = data['emergency_contact_phone']
        
        # Профиль фотосун сактоо
        if 'profile_photo' in request.FILES:
            profile.profile_photo = request.FILES['profile_photo']
        
        profile.save()
        
        # Жаңыланган маалыматты кайтаруу
        updated_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'full_name': user.get_full_name() or user.username,
            'role': profile.role,
            'phone_number': profile.phone_number or '',
            'address': profile.address or '',
            'emergency_contact_name': profile.emergency_contact_name or '',
            'emergency_contact_phone': profile.emergency_contact_phone or '',
            'profile_photo': request.build_absolute_uri(profile.profile_photo.url) if profile.profile_photo else None,
        }
        
        # Role'го жараша кошумча маалымат
        if profile.role == 'STUDENT':
            try:
                student = user.student
                updated_data['student_id'] = student.id
                updated_data['group'] = {
                    'id': student.group.id,
                    'name': student.group.name,
                    'course': {
                        'id': student.group.course.id,
                        'name': student.group.course.name
                    } if student.group.course else None
                } if student.group else None
            except Exception as e:
                print(f"Student маалыматын алууда ката (PATCH): {e}")
                pass
        elif profile.role == 'TEACHER':
            try:
                teacher = user.teacher
                updated_data['subjects'] = [
                    {'id': s.id, 'name': s.subject_name} 
                    for s in teacher.subject_set.all()
                ]
            except Exception as e:
                print(f"Teacher маалыматын алууда ката (PATCH): {e}")
                pass
        
        return Response(updated_data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Паролду өзгөртүү"""
    user = request.user
    data = request.data
    
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    
    # Validation
    if not current_password or not new_password:
        return Response(
            {'error': 'Учурдагы жана жаңы пароль талап кылынат'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Учурдагы паролду текшерүү
    if not user.check_password(current_password):
        return Response(
            {'error': 'Учурдагы пароль туура эмес'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Жаңы пароль узундугун текшерүү
    if len(new_password) < 6:
        return Response(
            {'error': 'Пароль кеминде 6 белгиден турушу керек'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Паролду өзгөртүү
    user.set_password(new_password)
    user.save()
    
    return Response({
        'success': True,
        'message': 'Пароль ийгиликтүү өзгөртүлдү'
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_username(request):
    """Логин (username) өзгөртүү"""
    user = request.user
    data = request.data
    
    new_username = data.get('new_username')
    password = data.get('password')
    
    # Validation
    if not new_username or not password:
        return Response(
            {'error': 'Жаңы логин жана пароль талап кылынат'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Паролду текшерүү
    if not user.check_password(password):
        return Response(
            {'error': 'Пароль туура эмес'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Логин узундугун текшерүү
    if len(new_username) < 3:
        return Response(
            {'error': 'Логин кеминде 3 белгиден турушу керек'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Логиндин уникалдуулугун текшерүү
    from django.contrib.auth.models import User
    if User.objects.filter(username=new_username).exclude(id=user.id).exists():
        return Response(
            {'error': 'Бул логин алдын ала колдонулууда'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Логинди өзгөртүү
    user.username = new_username
    user.save()
    
    return Response({
        'success': True,
        'message': 'Логин ийгиликтүү өзгөртүлдү',
        'username': new_username
    })
