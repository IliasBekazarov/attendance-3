from django.db.models.signals import post_save
from django.contrib.auth.models import User
from django.dispatch import receiver
from .models import UserProfile, Student, Course, Group, Teacher, Attendance, Notification, Subject, LeaveRequest
from datetime import timedelta

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Жаңы колдонуучу катталганда автоматтык түрдө профил түзүү"""
    if created:
        # Эгер superuser болсо - ADMIN роль берүү
        if instance.is_superuser:
            role = 'ADMIN'
        # Эгер staff болсо - MANAGER роль берүү  
        elif instance.is_staff:
            role = 'MANAGER'
        # Башкача учурда ролду көрсөтпөө (же NULL)
        else:
            # Профилди ролсуз түзүү - кийин админ же менеджер коёт
            profile = UserProfile.objects.create(user=instance)
            profile.check_profile_completeness()
            return
            
        profile = UserProfile.objects.create(user=instance, role=role)
        profile.check_profile_completeness()

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """User сакталганда профилди да сактоо"""
    try:
        instance.userprofile.save()
    except UserProfile.DoesNotExist:
        # Эгер профил жок болсо, жаңысын түзүү (ролсуз)
        if not instance.is_superuser and not instance.is_staff:
            UserProfile.objects.create(user=instance)
        elif instance.is_superuser:
            UserProfile.objects.create(user=instance, role='ADMIN')
        elif instance.is_staff:
            UserProfile.objects.create(user=instance, role='MANAGER')

@receiver(post_save, sender=UserProfile)
def create_student_or_teacher(sender, instance, created, **kwargs):
    """Ролго жараша Student же Teacher профилин түзүү"""
    if created and instance.role:  # Эгер роль аныкталса гана
        if instance.role == 'STUDENT':
            # Default course жана group бар экенин текшерүү
            default_course = Course.objects.first()
            if not default_course:
                default_course = Course.objects.create(name='1-курс', year=1, faculty='Жалпы')
            
            default_group = Group.objects.first()
            if not default_group:
                default_group = Group.objects.create(name='А-группа', course=default_course, capacity=25)
            
            # Student профилин түзүү
            Student.objects.get_or_create(
                user=instance.user,
                defaults={
                    'name': instance.user.get_full_name() or instance.user.username,
                    'course': default_course,
                    'group': default_group
                }
            )
        elif instance.role == 'TEACHER':
            # Teacher профилин түзүү
            Teacher.objects.get_or_create(
                user=instance.user,
                defaults={
                    'name': instance.user.get_full_name() or instance.user.username,
                    'degree': 'TEACHER',
                    'department': 'Жалпы'
                }
            )
            
@receiver(post_save, sender=Attendance)
def create_absent_notification(sender, instance, created, **kwargs):
    if created and instance.status == 'Absent':
        teacher = instance.subject.teacher
        if teacher and teacher.user:
            Notification.objects.create(
                recipient=teacher.user,
                notification_type='ABSENCE',
                title='Студент катышкан жок',
                message=f"{instance.student.name} {instance.subject.subject_name} сабагына катышкан жок ({instance.date}).",
                student=instance.student
            )

@receiver(post_save, sender=LeaveRequest)
def handle_leave_request_approval(sender, instance, **kwargs):
    """
    Leave Request APPROVED болгондо автоматтык Excused attendance түзүү
    """
    # Эгер approved болсо жана мурда attendance түзүлбөгөн болсо
    if instance.status == 'APPROVED':
        from .models import Schedule
        
        # Start date дан end date га чейинки бардык күндөр
        current_date = instance.start_date
        while current_date <= instance.end_date:
            # Күндүн английс атын табуу
            weekday_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            day_name = weekday_names[current_date.weekday()]
            
            # Студенттин группасы боюнча ошол күндөгү сабактар
            schedules = Schedule.objects.filter(
                group=instance.student.group,
                day=day_name,
                is_active=True
            )
            
            for schedule in schedules:
                try:
                    # Алгач attendance бар болсо текшерүү
                    existing_attendance = Attendance.objects.filter(
                        student=instance.student,
                        subject=schedule.subject,
                        date=current_date
                    ).first()
                    
                    if existing_attendance:
                        # Эгер дагы деле бар болсо, Excused кылуу
                        existing_attendance.status = 'Excused'
                        existing_attendance.leave_request = instance
                        existing_attendance.save()
                    else:
                        # Жаңы attendance түзүү
                        Attendance.objects.create(
                            student=instance.student,
                            subject=schedule.subject,
                            schedule=schedule,
                            date=current_date,
                            status='Excused',
                            created_by=instance.approved_by,
                            student_name=instance.student.name,
                            subject_name=schedule.subject.subject_name,
                            leave_request=instance,
                            is_active=True
                        )
                except Exception as e:
                    # Ката болсо, лог жазып өтүү
                    print(f"Error creating attendance: {e}")
                    continue
            
            # Кийинки күнгө өтүү
            current_date += timedelta(days=1)
        
        # Студентке notification жөнөтүү
        if instance.student.user:
            try:
                Notification.objects.create(
                    recipient=instance.student.user,
                    notification_type='LEAVE_APPROVED',
                    title='Бошотуу сурамы бекитилди',
                    message=f"Сиздин {instance.start_date} - {instance.end_date} аралыгындагы бошотуу сурамыңыз бекитилди.",
                    student=instance.student,
                    leave_request=instance
                )
            except Exception as e:
                print(f"Error creating notification: {e}")