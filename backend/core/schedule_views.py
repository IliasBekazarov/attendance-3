"""
Жаңы Schedule систем view'лери
Талаптарга ылайык курс/группа фильтрациясы жана ролдор боюнча функциялар
"""

from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q, Prefetch, Count
from django.utils import timezone
from django.utils.translation import gettext as _
from django.contrib.admin.models import LogEntry, CHANGE
from django.contrib.contenttypes.models import ContentType
from django.core.paginator import Paginator
from datetime import datetime, date, timedelta
import json
import calendar

from .models import (
    UserProfile, Student, Teacher, Course, Group, Attendance, 
    Subject, Schedule, TimeSlot, Notification
)


@login_required
def unified_schedule(request):
    """
    Биргелешкен расписание системасы
    Ролдор боюнча ар кандай функциялар
    """
    user_profile = request.user.userprofile
    
    # Алгач колдонуучунун ролун аныктайбыз
    context = {
        'user_role': user_profile.role,
        'user_profile': user_profile,
    }
    
    # СТУДЕНТ үчүн - Өзүнүн группасын гана көрө алат
    if user_profile.role == 'STUDENT':
        try:
            student = Student.objects.get(user=request.user)
            if student.group:
                context.update({
                    'user_course': student.course,
                    'user_group': student.group,
                    'is_restricted_view': True,
                })
        except Student.DoesNotExist:
            messages.error(request, 'Студент профили табылган жок.')
            return redirect('dashboard')
    
    # АТА-ЭНЕ үчүн - Балдарынын группаларын көрө алат
    elif user_profile.role == 'PARENT':
        # Ата-энелер өз балдарынын группаларын көрө алат
        linked_students = user_profile.parent_profiles.all()
        print(f"DEBUG: Parent {user_profile.user.username} has {linked_students.count()} linked students")
        for student in linked_students:
            print(f"DEBUG: - Student: {student.name} in group {student.group.name if student.group else 'No group'}")
        
        if linked_students.exists():
            context.update({
                'linked_students': linked_students,
                'is_restricted_view': True,
                'user_role': 'PARENT',  # JavaScript үчүн керек
            })
            print(f"DEBUG: Parent context prepared with {linked_students.count()} students")
        else:
            messages.warning(request, 'Сизге эч кандай студент байланышкан эмес.')
            return redirect('dashboard')
    
    # МУГАЛИМ/АДМИН/МЕНЕДЖЕР үчүн - Бардык расписаниени көрө алат
    else:
        context['is_restricted_view'] = False
        
        # Мугалим үчүн өзүнүн сабактарын белгилөө
        if user_profile.role == 'TEACHER':
            try:
                teacher = Teacher.objects.get(user=request.user)
                context['teacher_profile'] = teacher
            except Teacher.DoesNotExist:
                pass
    
    # Бардык курстар жана группалар (фильтрация үчүн)
    courses = Course.objects.all().order_by('year', 'name')
    groups = Group.objects.select_related('course').all().order_by('course__year', 'name')
    time_slots = TimeSlot.objects.filter(is_active=True).order_by('order')
    
    # Админ/Менеджер үчүн сабактар жана мугалимдер
    subjects = Subject.objects.select_related('teacher', 'course').all().order_by('subject_name')
    teachers = Teacher.objects.all().order_by('name')
    
    # Мугалимдердин кайсы сабактарды окутканын билүү үчүн маалымат даярдоо
    teachers_with_subjects = []
    for teacher in teachers:
        teacher_subjects = Subject.objects.filter(teacher=teacher).values_list('id', flat=True)
        teachers_with_subjects.append({
            'id': teacher.id,
            'name': teacher.name,
            'subjects': list(teacher_subjects)
        })
    
    context.update({
        'courses': courses,
        'groups': groups, 
        'time_slots': time_slots,
        'subjects': subjects,
        'teachers': teachers,
        'teachers_with_subjects': json.dumps(teachers_with_subjects),  # JSON форматта frontend үчүн
        'days': Schedule.DAY_CHOICES,
    })
    
    return render(request, 'unified_schedule.html', context)


@login_required
def get_schedule_data(request):
    """
    AJAX API: Расписание маалыматтарын алуу
    Course жана Group фильтрлери менен
    """
    course_id = request.GET.get('course_id')
    group_id = request.GET.get('group_id')
    user_profile = request.user.userprofile
    
    print(f"DEBUG: get_schedule_data called - course_id: {course_id}, group_id: {group_id}, user_role: {user_profile.role}")
    
    # Уруксаттарды текшерүү
    if user_profile.role == 'STUDENT':
        try:
            student = Student.objects.get(user=request.user)
            print(f"DEBUG: Student found - group: {student.group.id if student.group else 'None'}")
            if group_id and str(student.group.id) != group_id:
                return JsonResponse({'error': 'Сизде бул группанын расписаниесин көрүү укугу жок'}, status=403)
        except Student.DoesNotExist:
            print(f"DEBUG: Student profile not found for user {request.user.username}")
            return JsonResponse({'error': 'Студент профили табылган жок'}, status=404)
    
    elif user_profile.role == 'PARENT':
        # Ата-энелер балдарынын группаларын гана көрө алат
        linked_groups = [student.group.id for student in user_profile.parent_profiles.all() if student.group]
        print(f"DEBUG: Parent {user_profile.user.username} linked groups: {linked_groups}")
        if group_id and int(group_id) not in linked_groups:
            return JsonResponse({'error': 'Сизде бул группанын расписаниесин көрүү укугу жок'}, status=403)
    
    # Фильтрлерди колдонуп расписаниени алуу
    schedules_query = Schedule.objects.select_related(
        'subject', 'teacher', 'group', 'time_slot'
    ).filter(is_active=True)
    
    print(f"DEBUG: Initial query - Total active schedules: {schedules_query.count()}")
    
    if course_id:
        schedules_query = schedules_query.filter(group__course_id=course_id)
        print(f"DEBUG: After course filter (course_id={course_id}): {schedules_query.count()} schedules")
    
    if group_id:
        schedules_query = schedules_query.filter(group_id=group_id)
        print(f"DEBUG: After group filter (group_id={group_id}): {schedules_query.count()} schedules")
    
    schedules = schedules_query.order_by('day', 'time_slot__order')
    
    print(f"DEBUG: Final result: Found {schedules.count()} schedules for group_id={group_id}, course_id={course_id}")
    
    # Ар бир расписанинин деталдарын логго жазуу
    for schedule in schedules[:5]:  # Биринчи 5ин көрсөтүү
        print(f"DEBUG: Schedule {schedule.id}: {schedule.subject.subject_name} - Group {schedule.group.name} ({schedule.group.course.name}) - {schedule.day}")
    
    # Маалыматтарды структуралашуу
    schedule_data = {}
    time_slots = TimeSlot.objects.filter(is_active=True).order_by('order')
    
    print(f"DEBUG: Found {time_slots.count()} active time slots")
    
    # Бүгүнкү күндү аныктоо
    today = date.today()
    today_day_name = calendar.day_name[today.weekday()]  # Monday, Tuesday, ...
    
    for schedule in schedules:
        # time_slot NULL болсо, бул schedule'ди өткөрүп кетебиз
        if not schedule.time_slot:
            print(f"DEBUG: Skipping schedule {schedule.id} - no time_slot")
            continue
            
        day = schedule.day
        time_slot_id = str(schedule.time_slot.id)
        
        if day not in schedule_data:
            schedule_data[day] = {}
        
        # Бүгүнкү сабакбы текшерүү
        is_today_lesson = (day == today_day_name)
        
        # Мугалим бүгүнкү сабактарга гана жоктоо коё алат
        can_mark_today = False
        if user_profile.role == 'TEACHER' and is_today_lesson:
            if hasattr(request.user, 'teacher'):
                teacher_can_mark = (
                    schedule.teacher == request.user.teacher if schedule.teacher else 
                    schedule.subject.teacher == request.user.teacher
                )
                can_mark_today = teacher_can_mark
        
        # Attendance маалыматын алуу (STUDENT же PARENT үчүн)
        attendance_status = None
        attendance_text = None
        
        if user_profile.role in ['STUDENT', 'PARENT']:
            # Кайсы студенттин attendance'ын алуу керекпиз?
            target_student = None
            
            if user_profile.role == 'STUDENT':
                try:
                    target_student = Student.objects.get(user=request.user)
                except Student.DoesNotExist:
                    pass
            elif user_profile.role == 'PARENT':
                # Ата-эне үчүн: group_id менен дал келген баланын attendance'ын алабыз
                # Эгер group_id берилген болсо, ошол группадагы баланы табабыз
                if group_id:
                    try:
                        target_student = user_profile.parent_profiles.filter(group_id=group_id).first()
                        print(f"DEBUG: Parent - found child in group {group_id}: {target_student.name if target_student else 'None'}")
                    except Exception as e:
                        print(f"DEBUG: Error finding child in group: {e}")
                        target_student = user_profile.parent_profiles.first()
                else:
                    # Эгер group_id жок болсо, биринчи баланы алабыз
                    target_student = user_profile.parent_profiles.first()
            
            if target_student:
                # Соңку аптадагы attendance табуу
                # date и timedelta уже импортированы вверху файла
                today = date.today()
                week_start = today - timedelta(days=today.weekday())  # Дүйшөмбү
                week_end = week_start + timedelta(days=6)  # Жекшемби
                
                from core.models import Attendance
                latest_attendance = Attendance.objects.filter(
                    student=target_student,
                    subject=schedule.subject,
                    date__range=[week_start, week_end]
                ).order_by('-date').first()
                
                if latest_attendance:
                    attendance_status = latest_attendance.status
                    if attendance_status == 'Present':
                        attendance_text = 'Катышкан'
                    elif attendance_status == 'Absent':  
                        attendance_text = 'Катышпаган'
                    elif attendance_status == 'Late':
                        attendance_text = 'Кечиккен'
                    else:
                        attendance_text = 'Белгилене элек'
                else:
                    attendance_text = 'Белгилене элек'
                    
                print(f"DEBUG: Attendance for {target_student.name} in {schedule.subject.subject_name}: {attendance_text}")

        schedule_data[day][time_slot_id] = {
            'id': schedule.id,
            'subject': schedule.subject.subject_name,
            'teacher': schedule.teacher.name if schedule.teacher else schedule.subject.teacher.name,
            'room': schedule.room or 'Кабинет белгиленген эмес',
            'group': schedule.group.name,
            'attendance_status': attendance_status,  # Кошулду
            'attendance_text': attendance_text,       # Кошулду
            'time_slot': {
                'id': schedule.time_slot.id,
                'name': schedule.time_slot.name,
                'start_time': schedule.time_slot.start_time.strftime('%H:%M'),
                'end_time': schedule.time_slot.end_time.strftime('%H:%M'),
            },
            'can_edit': user_profile.role in ['ADMIN', 'MANAGER'],
            'can_mark_attendance': can_mark_today,  # Бүгүнкү сабакка гана
            'is_today': is_today_lesson,  # Бул маалыматты frontend үчүн кошобуз
        }
    
    return JsonResponse({
        'schedule_data': schedule_data,
        'time_slots': [
            {
                'id': ts.id,
                'name': ts.name,
                'start_time': ts.start_time.strftime('%H:%M'),
                'end_time': ts.end_time.strftime('%H:%M'),
                'order': ts.order
            } for ts in time_slots
        ],
        'days': {
            'Monday': 'Monday',
            'Tuesday': 'Tuesday', 
            'Wednesday': 'Wednesday',
            'Thursday': 'Thursday',
            'Friday': 'Friday',
            'Saturday': 'Saturday',
        },
        'user_permissions': {
            'can_edit': user_profile.role in ['ADMIN', 'MANAGER'],
            'can_mark_attendance': user_profile.role == 'TEACHER',
            'is_student': user_profile.role == 'STUDENT',
            'is_parent': user_profile.role == 'PARENT',
        }
    })


@login_required
def get_groups_for_course(request):
    """Курс боюнча группаларды алуу (AJAX)"""
    course_id = request.GET.get('course_id')
    
    print(f"DEBUG get_groups_for_course: course_id={course_id}")
    
    if not course_id:
        return JsonResponse({'error': 'Course ID керек'}, status=400)
    
    try:
        groups_data = []
        groups = Group.objects.filter(course_id=course_id).select_related('course')
        
        for group in groups:
            # Студент саны
            student_count = group.student_set.count()
            groups_data.append({
                'id': group.id,
                'name': group.name,
                'course__name': group.course.name,
                'student_count': student_count
            })
        
        print(f"DEBUG get_groups_for_course: Found {len(groups_data)} groups")
        
        return JsonResponse({
            'groups': groups_data
        })
    except Exception as e:
        print(f"ERROR in get_groups_for_course: {str(e)}")
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)
def check_admin_or_manager(user):
    try:
        return user.userprofile.role in ['ADMIN', 'MANAGER']
    except:
        return False


@user_passes_test(check_admin_or_manager)
@csrf_exempt
def save_schedule_lesson(request):
    """
    Сабакты сактоо/өзгөртүү (Админ/Менеджер үчүн)
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'POST метод керек'}, status=405)
    
    try:
        print(f"DEBUG save_schedule_lesson: Request body: {request.body}")
        data = json.loads(request.body)
        print(f"DEBUG save_schedule_lesson: Parsed data: {data}")
        lesson_id = data.get('lesson_id')
        
        # Керектүү маалыматтарды алуу
        time_slot_id = data.get('time_slot_id')
        day = data.get('day')
        subject_id = data.get('subject_id')
        teacher_id = data.get('teacher_id')
        group_id = data.get('group_id')
        room = data.get('room', '')
        
        print(f"DEBUG save_schedule_lesson: time_slot_id={time_slot_id}, day={day}, subject_id={subject_id}, teacher_id={teacher_id}, group_id={group_id}, room={room}")
        
        if not all([time_slot_id, day, subject_id, group_id]):
            missing_fields = []
            if not time_slot_id: missing_fields.append('time_slot_id')
            if not day: missing_fields.append('day')
            if not subject_id: missing_fields.append('subject_id')
            if not group_id: missing_fields.append('group_id')
            
            error_msg = f'Төмөнкү талаалар толтурулган жок: {", ".join(missing_fields)}'
            print(f"DEBUG save_schedule_lesson: Missing fields error: {error_msg}")
            return JsonResponse({'error': error_msg}, status=400)
        
        # Объекттерди алуу
        time_slot = get_object_or_404(TimeSlot, id=time_slot_id, is_active=True)
        subject = get_object_or_404(Subject, id=subject_id)
        group = get_object_or_404(Group, id=group_id)
        
        # Мугалимди аныктоо: же тандалган мугалим, же Subject'тин мугалими
        teacher = None
        if teacher_id:
            teacher = get_object_or_404(Teacher, id=teacher_id)
        else:
            # Эгерде мугалим тандалбаса, Subject'тин мугалимин колдонобуз
            teacher = subject.teacher
        
        print(f"DEBUG save_schedule_lesson: Objects found - time_slot={time_slot}, subject={subject}, group={group}, teacher={teacher}")
        
        # Конфликттерди текшерүү
        existing_schedule = Schedule.objects.filter(
            group=group,
            day=day,
            time_slot=time_slot,
            is_active=True
        ).exclude(id=lesson_id if lesson_id else None).first()
        
        print(f"DEBUG save_schedule_lesson: Existing schedule check: {existing_schedule}")
        
        if existing_schedule:
            return JsonResponse({
                'error': f'Бул убакытта {group.name} группасында башка сабак бар'
            }, status=400)
        
        # Мугалим конфликтин текшерүү - ЛЕКЦИЯЛАР ҮЧҮН ӨЧҮРҮЛДҮ
        # Лекцияларда мугалим бир убакытта көп группага сабак өтө алат
        # Ошондуктан мугалим конфликтин текшерүүнү алып салдык
        
        print(f"DEBUG save_schedule_lesson: Teacher conflict check skipped for lectures")
        
        # Сактоо же жаңылоо
        if lesson_id:
            # Жаңылоо
            schedule = get_object_or_404(Schedule, id=lesson_id)
            schedule.time_slot = time_slot
            schedule.day = day
            schedule.subject = subject
            schedule.teacher = teacher
            schedule.group = group
            schedule.room = room
            schedule.save()
            
            return JsonResponse({
                'success': True,
                'message': 'Сабак ийгиликтүү жаңыланды',
                'lesson_id': schedule.id
            })
        else:
            # Жаңы кошуу
            schedule = Schedule.objects.create(
                time_slot=time_slot,
                day=day,
                subject=subject,
                teacher=teacher,
                group=group,
                room=room,
                is_active=True
            )
            
            return JsonResponse({
                'success': True,
                'message': 'Жаңы сабак ийгиликтүү кошулду',
                'lesson_id': schedule.id
            })
            
    except json.JSONDecodeError:
        print("DEBUG save_schedule_lesson: JSON decode error")
        return JsonResponse({'error': 'JSON форматы туура эмес'}, status=400)
    except Exception as e:
        print(f"DEBUG save_schedule_lesson: Exception occurred: {str(e)}")
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)


@user_passes_test(check_admin_or_manager)
@csrf_exempt
def delete_schedule_lesson(request):
    """
    Сабакты өчүрүү - SOFT DELETE (маалыматтарды сактап калуу менен)
    Расписание өзгөргөндө эски маалыматтар сакталат
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'POST метод керек'}, status=405)
    
    try:
        data = json.loads(request.body)
        lesson_id = data.get('lesson_id')
        
        if not lesson_id:
            return JsonResponse({'error': 'Lesson ID керек'}, status=400)
        
        schedule = get_object_or_404(Schedule, id=lesson_id)
        
        # Бул сабак үчүн attendance маалыматтары барбы текшерүү
        attendance_count = Attendance.objects.filter(schedule=schedule).count()
        
        # SOFT DELETE: is_active = False жасоо (толугу менен өчүрбөйбүз)
        schedule.is_active = False
        schedule.save()
        
        # Логко жазуу
        print(f"DEBUG: Schedule {lesson_id} soft deleted. Attendance records preserved: {attendance_count}")
        
        message = f'Сабак жашырылды'
        if attendance_count > 0:
            message += f' ({attendance_count} жоктоо маалыматы сакталды)'
        
        return JsonResponse({
            'success': True,
            'message': message,
            'attendance_preserved': attendance_count
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON форматы туура эмес'}, status=400)
    except Exception as e:
        print(f"ERROR in delete_schedule_lesson: {str(e)}")
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)


@user_passes_test(check_admin_or_manager)
@csrf_exempt
def restore_schedule_lesson(request):
    """
    Жашырылган сабакты кайтарып калыбына келтирүү
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'POST метод керек'}, status=405)
    
    try:
        data = json.loads(request.body)
        lesson_id = data.get('lesson_id')
        
        if not lesson_id:
            return JsonResponse({'error': 'Lesson ID керек'}, status=400)
        
        schedule = get_object_or_404(Schedule, id=lesson_id)
        
        # Конфликттерди текшерүү - ушул убакытта башка активдүү сабак барбы
        existing_active = Schedule.objects.filter(
            group=schedule.group,
            day=schedule.day,
            time_slot=schedule.time_slot,
            is_active=True
        ).exclude(id=lesson_id).first()
        
        if existing_active:
            return JsonResponse({
                'error': f'Бул убакытта {schedule.group.name} группасында башка сабак бар. Алгач аны жашырыңыз же өзгөртүңүз.'
            }, status=400)
        
        # Калыбына келтирүү
        schedule.is_active = True
        schedule.save()
        
        # Бул сабак үчүн attendance маалыматтары барбы текшерүү
        attendance_count = Attendance.objects.filter(schedule=schedule).count()
        
        message = f'Сабак калыбына келтирилди'
        if attendance_count > 0:
            message += f' ({attendance_count} жоктоо маалыматы кайтарылды)'
        
        return JsonResponse({
            'success': True,
            'message': message,
            'attendance_restored': attendance_count
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON форматы туура эмес'}, status=400)
    except Exception as e:
        print(f"ERROR in restore_schedule_lesson: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)


@login_required
def get_lesson_students(request):
    """Сабак үчүн студенттердин тизмесин алуу (Мугалим/Админ/Менеджер үчүн)"""
    lesson_id = request.GET.get('lesson_id')
    
    if not lesson_id:
        return JsonResponse({'error': 'Lesson ID керек'}, status=400)
    
    try:
        schedule = get_object_or_404(Schedule, id=lesson_id, is_active=True)
        user_profile = request.user.userprofile
        
        # Мугалим үчүн укук текшерүү
        if user_profile.role == 'TEACHER':
            try:
                user_teacher = Teacher.objects.get(user=request.user)
                if schedule.teacher != user_teacher and schedule.subject.teacher != user_teacher:
                    return JsonResponse({'error': 'Сизде бул сабакка жетүү укугу жок'}, status=403)
            except Teacher.DoesNotExist:
                return JsonResponse({'error': 'Мугалим профили табылган жок'}, status=404)
        elif user_profile.role not in ['ADMIN', 'MANAGER']:
            return JsonResponse({'error': 'Сизде жетүү укугу жок'}, status=403)
        
        # Группанын студенттерин алуу
        students = Student.objects.filter(
            group=schedule.group
        ).select_related('user').order_by('user__last_name', 'user__first_name')
        
        students_data = []
        for student in students:
            # Бул күндүн келүү-кетүүсүн алуу
            today = date.today()
            attendance = Attendance.objects.filter(
                student=student,
                schedule=schedule,
                date=today
            ).first()
            
            # Student атын алуу (бардык варианттарды текшерүү)
            student_name = ""
            if student.user:
                # User объектисинен аты
                first_name = (student.user.first_name or "").strip()
                last_name = (student.user.last_name or "").strip()
                if first_name and last_name:
                    student_name = f"{last_name} {first_name}"
                elif first_name:
                    student_name = first_name
                elif last_name:
                    student_name = last_name
                elif student.user.username:
                    # User аттары бош болсо, username колдонобуз
                    student_name = student.user.username
            
            # Эгер User объектисинен ат алынбаса же user жок болсо, student.name колдонобуз
            if not student_name or student_name.strip() == "":
                student_name = student.name or f"Студент #{student.id}"
            
            # Эгер дагы деле аты жок болсо, ID колдонобуз
            if not student_name or student_name.strip() == "":
                student_name = f"Студент #{student.id}"
            
            print(f"DEBUG: Student ID={student.id}, final name='{student_name}'")  # Debug log
            
            students_data.append({
                'id': student.id,
                'name': student_name,
                'current_status': attendance.status if attendance else 'Present',
                'attendance_id': attendance.id if attendance else None,
                'is_marked': bool(attendance),  # Белгиленгенби көрсөтүү
                'marked_by': attendance.created_by.username if attendance and attendance.created_by else None,
                'marked_at': attendance.marked_at.strftime('%H:%M') if attendance else None,
            })
        
        return JsonResponse({
            'students': students_data,
            'lesson_info': {
                'id': schedule.id,
                'subject': schedule.subject.subject_name,
                'group': schedule.group.name,
                'teacher': schedule.teacher.name if schedule.teacher else schedule.subject.teacher.name,
                'room': schedule.room or 'Кабинет белгиленген эмес',
                'time': f"{schedule.time_slot.start_time.strftime('%H:%M')} - {schedule.time_slot.end_time.strftime('%H:%M')}",
                'day': schedule.get_day_display(),
            }
        })
        
    except Exception as e:
        print(f"ERROR in get_lesson_students: {str(e)}")
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)


@login_required
def save_attendance(request):
    """Келүү-кетүү маалыматтарын сактоо (Мугалим/Админ/Менеджер)"""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST метод керек'}, status=405)
    
    try:
        data = json.loads(request.body)
        lesson_id = data.get('lesson_id')
        attendance_data = data.get('attendance_data', {})
        
        print(f"DEBUG save_attendance: lesson_id={lesson_id}, attendance_data={attendance_data}")
        
        if not lesson_id or not attendance_data:
            return JsonResponse({'error': 'Lesson ID жана attendance data керек'}, status=400)
        
        schedule = get_object_or_404(Schedule, id=lesson_id, is_active=True)
        user_profile = request.user.userprofile
        
        # Укук текшерүү
        if user_profile.role == 'TEACHER':
            try:
                user_teacher = Teacher.objects.get(user=request.user)
                if schedule.teacher != user_teacher and schedule.subject.teacher != user_teacher:
                    return JsonResponse({'error': 'Сизде бул сабакка жетүү укугу жок'}, status=403)
            except Teacher.DoesNotExist:
                return JsonResponse({'error': 'Мугалим профили табылган жок'}, status=404)
        elif user_profile.role not in ['ADMIN', 'MANAGER']:
            return JsonResponse({'error': 'Сизде жетүү укугу жок'}, status=403)
        
        today = date.today()
        saved_count = 0
        
        print(f"DEBUG: Processing {len(attendance_data)} students")
        
        skipped_students = []  # Алдын ала белгиленген студенттердин тизмеси
        
        for student_id, status in attendance_data.items():
            try:
                print(f"DEBUG: Processing student_id={student_id}, status={status}")
                student = Student.objects.get(id=student_id, group=schedule.group)
                print(f"DEBUG: Found student: {student.name}")
                
                # Бул студенттин attendance алдын ала белгиленгенби текшерүү
                # UNIQUE constraint: student, subject, date (без schedule)
                existing_attendance = Attendance.objects.filter(
                    student=student,
                    subject=schedule.subject,
                    date=today
                ).first()
                
                if existing_attendance:
                    print(f"DEBUG: Student {student.name} attendance already marked as {existing_attendance.status}")
                    skipped_students.append(student.name)
                    # Эгер алдын ала белгиленген болсо, өзгөртүүгө болбойт
                    continue
                
                # Жаңы attendance түзүү
                attendance = Attendance.objects.create(
                    student=student,
                    subject=schedule.subject,
                    schedule=schedule,
                    date=today,
                    status=status,
                    created_by=request.user,
                    marked_at=datetime.now()
                )
                
                print(f"DEBUG: Saved attendance for {student.name}: {status}")
                saved_count += 1
                
            except Student.DoesNotExist:
                print(f"DEBUG: Student {student_id} not found")
                continue
            except Exception as e:
                print(f"DEBUG: Error processing student {student_id}: {str(e)}")
                import traceback
                traceback.print_exc()
                continue
        
        # Жооп түзүү
        if saved_count > 0 and len(skipped_students) > 0:
            message = f'{saved_count} студенттин келүү-кетүүсү сакталды. {len(skipped_students)} студенттин attendance алдын ала белгиленген ({", ".join(skipped_students[:3])}{"..." if len(skipped_students) > 3 else ""})'
        elif saved_count > 0:
            message = f'{saved_count} студенттин келүү-кетүүсү сакталды'
        elif len(skipped_students) > 0:
            message = f'Бардык студенттердин attendance алдын ала белгиленген ({len(skipped_students)} студент)'
        else:
            message = 'Эч кандай attendance сакталган жок'
            
        return JsonResponse({
            'success': True,
            'message': message,
            'saved_count': saved_count,
            'skipped_count': len(skipped_students),
            'skipped_students': skipped_students
        })
        
    except json.JSONDecodeError as e:
        print(f"ERROR: JSON decode error: {str(e)}")
        return JsonResponse({'error': 'JSON форматы туура эмес'}, status=400)
    except Exception as e:
        print(f"ERROR in save_attendance: {str(e)}")
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)


@login_required
@csrf_exempt
def edit_attendance(request):
    """Мурдагы attendance маалыматтарын өзгөртүү (Мугалим/Админ/Менеджер)"""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST метод керек'}, status=405)
    
    try:
        data = json.loads(request.body)
        attendance_id = data.get('attendance_id')
        new_status = data.get('new_status')
        edit_reason = data.get('edit_reason', '')
        
        print(f"DEBUG edit_attendance: attendance_id={attendance_id}, new_status={new_status}")
        
        if not attendance_id or not new_status:
            return JsonResponse({'error': 'Attendance ID жана жаңы статус керек'}, status=400)
        
        # Статус валидация
        VALID_STATUSES = ['Present', 'Absent', 'Late', 'Excused']
        if new_status not in VALID_STATUSES:
            return JsonResponse({'error': 'Туура эмес статус'}, status=400)
        
        attendance = get_object_or_404(Attendance, id=attendance_id)
        user_profile = request.user.userprofile
        
        # Укук текшерүү
        if user_profile.role == 'TEACHER':
            try:
                user_teacher = Teacher.objects.get(user=request.user)
                # Мугалим өзүнүн сабагын гана өзгөртө алат
                if (attendance.schedule and attendance.schedule.teacher != user_teacher and 
                    attendance.subject.teacher != user_teacher):
                    return JsonResponse({'error': 'Сизде бул attendance өзгөртүү укугу жок'}, status=403)
            except Teacher.DoesNotExist:
                return JsonResponse({'error': 'Мугалим профили табылган жок'}, status=404)
        elif user_profile.role not in ['ADMIN', 'MANAGER']:
            return JsonResponse({'error': 'Сизде жетүү укугу жок'}, status=403)
        
        # Эски маалыматты сактоо (audit trail үчүн)
        old_status = attendance.status
        old_marked_at = attendance.marked_at
        
        # Attendance өзгөртүү
        attendance.status = new_status
        attendance.marked_at = timezone.now()
        attendance.save()
        
        # Edit log түзүү (кийин admin панелден көрүү үчүн)
        from django.contrib.admin.models import LogEntry, CHANGE
        from django.contrib.contenttypes.models import ContentType
        
        LogEntry.objects.log_action(
            user_id=request.user.id,
            content_type_id=ContentType.objects.get_for_model(Attendance).id,
            object_id=attendance.id,
            object_repr=str(attendance),
            action_flag=CHANGE,
            change_message=f"Статус өзгөртүлдү: {old_status} → {new_status}. Себеби: {edit_reason}"
        )
        
        print(f"DEBUG: Attendance {attendance_id} статус өзгөртүлдү: {old_status} → {new_status}")
        
        return JsonResponse({
            'success': True,
            'message': f'Attendance статус өзгөртүлдү: {old_status} → {new_status}',
            'old_status': old_status,
            'new_status': new_status,
            'student_name': attendance.student.name,
            'date': attendance.date.strftime('%Y-%m-%d')
        })
        
    except json.JSONDecodeError as e:
        print(f"ERROR: JSON decode error: {str(e)}")
        return JsonResponse({'error': 'JSON форматы туура эмес'}, status=400)
    except Exception as e:
        print(f"ERROR in edit_attendance: {str(e)}")
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)


@login_required
def get_attendance_history(request):
    """Студенттин attendance тарыхын алуу"""
    if request.method != 'GET':
        return JsonResponse({'error': 'GET метод керек'}, status=405)
    
    try:
        student_id = request.GET.get('student_id')
        subject_id = request.GET.get('subject_id')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        
        if not student_id:
            return JsonResponse({'error': 'Student ID керек'}, status=400)
        
        # Base query
        attendance_query = Attendance.objects.filter(student_id=student_id)
        
        # Filters
        if subject_id:
            attendance_query = attendance_query.filter(subject_id=subject_id)
        if start_date:
            attendance_query = attendance_query.filter(date__gte=start_date)
        if end_date:
            attendance_query = attendance_query.filter(date__lte=end_date)
        
        # Order by date (latest first)
        attendance_list = attendance_query.select_related(
            'student', 'subject', 'schedule', 'created_by'
        ).order_by('-date', '-marked_at')
        
        # Жооп түзүү
        attendance_data = []
        for att in attendance_list:
            attendance_data.append({
                'id': att.id,
                'date': att.date.strftime('%Y-%m-%d'),
                'subject': att.subject.subject_name,
                'status': att.status,
                'status_display': att.get_status_display(),
                'marked_at': att.marked_at.strftime('%Y-%m-%d %H:%M:%S') if att.marked_at else None,
                'created_by': att.created_by.get_full_name() if att.created_by else 'System',
                'schedule_id': att.schedule.id if att.schedule else None,
                'can_edit': True  # Frontend'те permission check болот
            })
        
        return JsonResponse({
            'success': True,
            'attendance_data': attendance_data,
            'total_count': len(attendance_data)
        })
        
    except Exception as e:
        print(f"ERROR in get_attendance_history: {str(e)}")
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)


@login_required
def teacher_attendance_history(request):
    """Мугалим үчүн жоктоо тарыхы бети"""
    
    # Мугалим эканын текшерүү
    user_profile = getattr(request.user, 'userprofile', None)
    if not user_profile or user_profile.role != 'TEACHER':
        messages.error(request, 'Сизде бул бетке кирүү укугу жок!')
        return redirect('dashboard')
    
    try:
        teacher = Teacher.objects.get(user=user_profile.user)
    except Teacher.DoesNotExist:
        messages.error(request, 'Мугалим профили табылган жок!')
        return redirect('dashboard')
    
    # Фильтр параметрлери
    subject_filter = request.GET.get('subject')
    group_filter = request.GET.get('group')
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')
    status_filter = request.GET.get('status')
    student_filter = request.GET.get('student')
    
    # Мугалимдин сабактары
    teacher_subjects = Subject.objects.filter(teacher=teacher)
    
    # Жоктоо маалыматтарын алуу
    attendance_query = Attendance.objects.filter(
        subject__in=teacher_subjects
    ).select_related(
        'student', 'subject', 'student__group'
    ).order_by('-date', '-marked_at')
    
    # Фильтрлөө
    if subject_filter:
        attendance_query = attendance_query.filter(subject_id=subject_filter)
        
    if group_filter:
        attendance_query = attendance_query.filter(student__group_id=group_filter)
        
    if date_from:
        try:
            date_from_obj = datetime.strptime(date_from, '%Y-%m-%d').date()
            attendance_query = attendance_query.filter(date__gte=date_from_obj)
        except ValueError:
            pass
            
    if date_to:
        try:
            date_to_obj = datetime.strptime(date_to, '%Y-%m-%d').date()
            attendance_query = attendance_query.filter(date__lte=date_to_obj)
        except ValueError:
            pass
            
    if status_filter:
        attendance_query = attendance_query.filter(status=status_filter)
        
    if student_filter:
        attendance_query = attendance_query.filter(
            Q(student__name__icontains=student_filter) |
            Q(student__student_id__icontains=student_filter)
        )
    
    # Paginator
    paginator = Paginator(attendance_query, 50)  # 50 record per page
    page_number = request.GET.get('page')
    attendance_records = paginator.get_page(page_number)
    
    # Мугалимдин группалары (сабактары аркылуу)
    teacher_groups = Group.objects.filter(
        student__attendance__subject__in=teacher_subjects
    ).distinct()
    
    # Статистика
    total_records = attendance_query.count()
    present_count = attendance_query.filter(status='Present').count()
    absent_count = attendance_query.filter(status='Absent').count()
    late_count = attendance_query.filter(status='Late').count()
    excused_count = attendance_query.filter(status='Excused').count()
    
    context = {
        'attendance_records': attendance_records,
        'teacher_subjects': teacher_subjects,
        'teacher_groups': teacher_groups,
        'filters': {
            'subject': subject_filter,
            'group': group_filter,
            'date_from': date_from,
            'date_to': date_to,
            'status': status_filter,
            'student': student_filter,
        },
        'statistics': {
            'total': total_records,
            'present': present_count,
            'absent': absent_count,
            'late': late_count,
            'excused': excused_count,
        },
        'status_choices': Attendance.STATUS_CHOICES,
    }
    
    return render(request, 'teacher_attendance_history.html', context)


@login_required
def get_teacher_attendance_history_api(request):
    """Мугалимдин жоктоо тарыхын API аркылуу алуу"""
    
    if request.method != 'GET':
        return JsonResponse({'success': False, 'error': 'Туура эмес запрос'})
    
    # Мугалим эканын текшерүү
    user_profile = getattr(request.user, 'userprofile', None)
    if not user_profile or user_profile.role != 'TEACHER':
        return JsonResponse({'success': False, 'error': 'Укук жок'})
    
    try:
        teacher = Teacher.objects.get(user=user_profile.user)
        teacher_subjects = Subject.objects.filter(teacher=teacher)
        
        # Фильтрлер
        subject_id = request.GET.get('subject_id')
        group_id = request.GET.get('group_id')
        date_from = request.GET.get('date_from')
        date_to = request.GET.get('date_to')
        
        query = Attendance.objects.filter(subject__in=teacher_subjects)
        
        if subject_id:
            query = query.filter(subject_id=subject_id)
        if group_id:
            query = query.filter(student__group_id=group_id)
        if date_from:
            query = query.filter(date__gte=date_from)
        if date_to:
            query = query.filter(date__lte=date_to)
            
        attendance_data = []
        for attendance in query.select_related('student', 'subject', 'student__group')[:100]:
            attendance_data.append({
                'id': attendance.id,
                'student_name': attendance.student.name,
                'student_id': attendance.student.student_id,
                'group_name': attendance.student.group.name,
                'subject_name': attendance.subject.subject_name,
                'date': attendance.date.strftime('%Y-%m-%d'),
                'status': attendance.status,
                'status_display': attendance.get_status_display(),
                'marked_by': attendance.created_by.get_full_name() if attendance.created_by else '',
                'marked_at': attendance.marked_at.strftime('%Y-%m-%d %H:%M'),
            })
        
        return JsonResponse({
            'success': True,
            'data': attendance_data,
            'total': query.count()
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


@login_required
@csrf_exempt
def bulk_edit_attendance(request):
    """Бир нече жоктоону бир учурда өзгөртүү"""
    
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'POST метод керек'})
    
    # Мугалим же админ эканын текшерүү
    user_profile = getattr(request.user, 'userprofile', None)
    if not user_profile or user_profile.role not in ['TEACHER', 'ADMIN', 'MANAGER']:
        return JsonResponse({'success': False, 'error': 'Укук жок'})
    
    try:
        data = json.loads(request.body)
        attendance_ids = data.get('attendance_ids', [])
        new_status = data.get('new_status')
        reason = data.get('reason', '')
        
        if not attendance_ids or not new_status:
            return JsonResponse({'success': False, 'error': 'Маалыматтар толук эмес'})
        
        if new_status not in ['Present', 'Absent', 'Late', 'Excused']:
            return JsonResponse({'success': False, 'error': 'Туура эмес статус'})
        
        # Мугалим болсо өз сабактарын гана өзгөртө алат
        attendance_query = Attendance.objects.filter(id__in=attendance_ids)
        
        if user_profile.role == 'TEACHER':
            try:
                teacher = Teacher.objects.get(user=user_profile.user)
                teacher_subjects = Subject.objects.filter(teacher=teacher)
                attendance_query = attendance_query.filter(subject__in=teacher_subjects)
            except Teacher.DoesNotExist:
                return JsonResponse({'success': False, 'error': 'Мугалим профили табылган жок'})
        
        updated_count = 0
        for attendance in attendance_query:
            old_status = attendance.status
            if old_status != new_status:
                attendance.status = new_status
                attendance.save()
                
                # Audit log
                LogEntry.objects.log_action(
                    user_id=request.user.id,
                    content_type_id=ContentType.objects.get_for_model(Attendance).id,
                    object_id=attendance.id,
                    object_repr=f"{attendance.student.name} - {attendance.subject.subject_name}",
                    action_flag=CHANGE,
                    change_message=f"Массалык өзгөртүү: {old_status} -> {new_status}. Себеби: {reason}"
                )
                updated_count += 1
        
        return JsonResponse({
            'success': True, 
            'message': f'{updated_count} жазуу ийгиликтүү өзгөртүлдү',
            'updated_count': updated_count
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': f'Ката: {str(e)}'})