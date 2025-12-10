"""
Системага баштапкы demo маалыматтарды жүктөө
- TimeSlot (убакыт периоддору)
- Course (курстар)
- Group (группалар)
- Subject (сабактар)
- Teacher (мугалимдер)
- Student (студенттер)
- Parent (ата-энелер)
- Schedule (расписание)
- Sample Attendance (мисал катышуу маалыматтары)
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import (
    UserProfile, Student, Teacher, Course, Group, Subject, 
    Schedule, TimeSlot, Attendance
)
from datetime import time, date, timedelta
import random


class Command(BaseCommand):
    help = 'Load sample/demo data into the system'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Мурдагы маалыматтарды тазалоо (эскертүү: бардык маалымат жок болот!)',
        )

    def handle(self, *args, **options):
        self.stdout.write("="*70)
        self.stdout.write("🎓 САЛЫМБЕКОВ УНИВЕРСИТЕТИ - БАШТАПКЫ МААЛЫМАТТАРДЫ ЖҮКТӨӨ")
        self.stdout.write("="*70)
        
        # Эгер --clear опциясы берилсе, маалыматтарды тазалоо
        if options['clear']:
            self.stdout.write("\n⚠️  ЭСКЕРТҮҮ: Бардык маалыматтар тазаланат!")
            confirm = input("Улантууну каалайсызбы? (yes/no): ")
            if confirm.lower() != 'yes':
                self.stdout.write("❌ Токтотулду.")
                return
            
            self.stdout.write("\n🗑️  Мурдагы маалыматтарды тазалоо...")
            Attendance.objects.all().delete()
            Schedule.objects.all().delete()
            TimeSlot.objects.all().delete()
            Subject.objects.all().delete()
            Student.objects.all().delete()
            Teacher.objects.all().delete()
            Group.objects.all().delete()
            Course.objects.all().delete()
            
            # Superuser'лерди калтыруу
            User.objects.filter(is_superuser=False).delete()
            UserProfile.objects.filter(user__is_superuser=False).delete()
            
            self.stdout.write(self.style.SUCCESS("✅ Тазаланды!"))
        
        # 1. TimeSlot (убакыт периоддору) түзүү
        self.create_timeslots()
        
        # 2. Course жана Group түзүү
        self.create_courses_and_groups()
        
        # 3. Мугалимдерди түзүү
        self.create_teachers()
        
        # 4. Студенттерди жана ата-энелерди түзүү
        self.create_students_and_parents()
        
        # 5. Subject (сабактар) түзүү
        self.create_subjects()
        
        # 6. Schedule (расписание) түзүү
        self.create_schedule()
        
        # 7. Sample Attendance (мисал катышуу) түзүү
        self.create_sample_attendance()
        
        # Жыйынтык статистика
        self.print_statistics()
        
        self.stdout.write("\n" + "="*70)
        self.stdout.write(self.style.SUCCESS("🎉 БАШТАПКЫ МААЛЫМАТТАР ИЙГИЛИКТҮҮ ЖҮКТӨЛДҮ!"))
        self.stdout.write("="*70)

    def create_timeslots(self):
        """Убакыт периоддорун түзүү"""
        self.stdout.write("\n📅 1. УБАКЫТ ПЕРИОДДОРУН ТҮЗҮҮ...")
        
        timeslots_data = [
            {'name': '1-пара', 'start': '08:00', 'end': '09:30', 'order': 1},
            {'name': '2-пара', 'start': '09:40', 'end': '11:10', 'order': 2},
            {'name': '3-пара', 'start': '11:30', 'end': '13:00', 'order': 3},
            {'name': 'Түшкү үзүлүш', 'start': '13:00', 'end': '14:00', 'order': 4},
            {'name': '4-пара', 'start': '14:00', 'end': '15:30', 'order': 5},
            {'name': '5-пара', 'start': '15:40', 'end': '17:10', 'order': 6},
        ]
        
        for ts_data in timeslots_data:
            ts, created = TimeSlot.objects.get_or_create(
                name=ts_data['name'],
                defaults={
                    'start_time': time(*map(int, ts_data['start'].split(':'))),
                    'end_time': time(*map(int, ts_data['end'].split(':'))),
                    'order': ts_data['order'],
                    'is_active': ts_data['name'] != 'Түшкү үзүлүш'
                }
            )
            if created:
                self.stdout.write(f"  ✅ {ts.name}: {ts.start_time} - {ts.end_time}")
            else:
                self.stdout.write(f"  ⏭️  {ts.name} (дагы деле бар)")

    def create_courses_and_groups(self):
        """Курстар жана группаларды түзүү"""
        self.stdout.write("\n🎓 2. КУРСТАР ЖАНА ГРУППАЛАРДЫ ТҮЗҮҮ...")
        
        courses_data = [
            {'name': '1-курс', 'year': 1, 'faculty': 'Информатика жана Технологиялар'},
            {'name': '2-курс', 'year': 2, 'faculty': 'Информатика жана Технологиялар'},
            {'name': '3-курс', 'year': 3, 'faculty': 'Бизнес жана Башкаруу'},
            {'name': '4-курс', 'year': 4, 'faculty': 'Бизнес жана Башкаруу'},
        ]
        
        for course_data in courses_data:
            course, created = Course.objects.get_or_create(
                name=course_data['name'],
                year=course_data['year'],
                defaults={'faculty': course_data['faculty']}
            )
            if created:
                self.stdout.write(f"  ✅ {course.name} ({course.faculty})")
            
            # Ар бир курс үчүн 2 группа түзүү
            group_names = ['А-группа', 'Б-группа'] if course.year <= 2 else ['ИТ-группа', 'БМ-группа']
            
            for group_name in group_names:
                group, g_created = Group.objects.get_or_create(
                    name=f"{course.name} - {group_name}",
                    defaults={'course': course, 'capacity': 25}
                )
                if g_created:
                    self.stdout.write(f"     └─ {group.name} (макс: {group.capacity})")

    def create_teachers(self):
        """Мугалимдерди түзүү"""
        self.stdout.write("\n👨‍🏫 3. МУГАЛИМДЕРДИ ТҮЗҮҮ...")
        
        teachers_data = [
            {
                'username': 'teacher_aida',
                'first_name': 'Айда',
                'last_name': 'Токтосунова',
                'email': 'aida.toktosunova@salymbekov.kg',
                'password': 'teacher123',
                'degree': 'PROFESSOR',
                'department': 'Математика жана Информатика'
            },
            {
                'username': 'teacher_bektur',
                'first_name': 'Бектур',
                'last_name': 'Сыдыков',
                'email': 'bektur.sydykov@salymbekov.kg',
                'password': 'teacher123',
                'degree': 'DOCENT',
                'department': 'Физика жана Техника'
            },
            {
                'username': 'teacher_jyldyz',
                'first_name': 'Жылдыз',
                'last_name': 'Асанова',
                'email': 'jyldyz.asanova@salymbekov.kg',
                'password': 'teacher123',
                'degree': 'LECTURER',
                'department': 'Тил жана Адабият'
            },
            {
                'username': 'teacher_erkin',
                'first_name': 'Эркин',
                'last_name': 'Мамбетов',
                'email': 'erkin.mambetov@salymbekov.kg',
                'password': 'teacher123',
                'degree': 'LECTURER',
                'department': 'Экономика жана Бизнес'
            },
        ]
        
        for t_data in teachers_data:
            if User.objects.filter(username=t_data['username']).exists():
                self.stdout.write(f"  ⏭️  {t_data['username']} (дагы деле бар)")
                continue
            
            user = User.objects.create_user(
                username=t_data['username'],
                first_name=t_data['first_name'],
                last_name=t_data['last_name'],
                email=t_data['email'],
                password=t_data['password']
            )
            
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.role = 'TEACHER'
            profile.phone_number = f"+996 555 {random.randint(100000, 999999)}"
            profile.save()
            
            teacher, _ = Teacher.objects.get_or_create(
                user=user,
                defaults={
                    'name': f"{t_data['first_name']} {t_data['last_name']}",
                    'degree': t_data['degree'],
                    'department': t_data['department']
                }
            )
            
            self.stdout.write(f"  ✅ {teacher.name} ({teacher.get_degree_display()})")
            self.stdout.write(f"     Логин: {t_data['username']} | Пароль: {t_data['password']}")

    def create_students_and_parents(self):
        """Студенттер жана ата-энелерди түзүү"""
        self.stdout.write("\n👨‍🎓 4. СТУДЕНТТЕР ЖАНА АТА-ЭНЕЛЕРДИ ТҮЗҮҮ...")
        
        # 1-курс студенттери
        students_data = [
            # 1-курс А-группа
            {'first': 'Нурлан', 'last': 'Алымбеков', 'course_year': 1, 'group_suffix': 'А-группа'},
            {'first': 'Асел', 'last': 'Жумабекова', 'course_year': 1, 'group_suffix': 'А-группа'},
            {'first': 'Элдар', 'last': 'Касымов', 'course_year': 1, 'group_suffix': 'А-группа'},
            {'first': 'Айгерим', 'last': 'Токтомушева', 'course_year': 1, 'group_suffix': 'А-группа'},
            {'first': 'Бекзат', 'last': 'Маматов', 'course_year': 1, 'group_suffix': 'А-группа'},
            
            # 1-курс Б-группа
            {'first': 'Гүлнара', 'last': 'Исмаилова', 'course_year': 1, 'group_suffix': 'Б-группа'},
            {'first': 'Темирлан', 'last': 'Жолдошев', 'course_year': 1, 'group_suffix': 'Б-группа'},
            {'first': 'Айнура', 'last': 'Садыкова', 'course_year': 1, 'group_suffix': 'Б-группа'},
            
            # 2-курс
            {'first': 'Канат', 'last': 'Бектуров', 'course_year': 2, 'group_suffix': 'А-группа'},
            {'first': 'Чолпон', 'last': 'Эрматова', 'course_year': 2, 'group_suffix': 'А-группа'},
        ]
        
        for s_data in students_data:
            username = f"student_{s_data['first'].lower()}"
            
            if User.objects.filter(username=username).exists():
                self.stdout.write(f"  ⏭️  {username} (дагы деле бар)")
                continue
            
            # Course жана Group табуу
            course = Course.objects.filter(year=s_data['course_year']).first()
            if not course:
                self.stdout.write(f"  ⚠️  {s_data['course_year']}-курс табылган жок!")
                continue
            
            group = Group.objects.filter(
                name=f"{course.name} - {s_data['group_suffix']}",
                course=course
            ).first()
            
            if not group:
                self.stdout.write(f"  ⚠️  {course.name} - {s_data['group_suffix']} группасы табылган жок!")
                continue
            
            # Студент колдонуучусун түзүү
            user = User.objects.create_user(
                username=username,
                first_name=s_data['first'],
                last_name=s_data['last'],
                email=f"{username}@student.salymbekov.kg",
                password='student123'
            )
            
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.role = 'STUDENT'
            profile.phone_number = f"+996 700 {random.randint(100000, 999999)}"
            profile.save()
            
            student, _ = Student.objects.get_or_create(
                user=user,
                defaults={
                    'name': f"{s_data['first']} {s_data['last']}",
                    'course': course,
                    'group': group
                }
            )
            
            self.stdout.write(f"  ✅ {student.name} ({group.name})")
            
            # Ата-энесин түзүү (10% үчүн гана)
            if random.random() < 0.3:  # 30% үчүн ата-эне
                parent_username = f"parent_{s_data['last'].lower()}"
                
                if not User.objects.filter(username=parent_username).exists():
                    parent_user = User.objects.create_user(
                        username=parent_username,
                        first_name=random.choice(['Асанбек', 'Жамиля', 'Токтогул', 'Гүлжан']),
                        last_name=s_data['last'],
                        email=f"{parent_username}@parent.kg",
                        password='parent123'
                    )
                    
                    parent_profile, _ = UserProfile.objects.get_or_create(user=parent_user)
                    parent_profile.role = 'PARENT'
                    parent_profile.phone_number = f"+996 555 {random.randint(100000, 999999)}"
                    parent_profile.save()
                    
                    # Студентти ата-энеге байлоо
                    parent_profile.students.add(student)
                    
                    self.stdout.write(f"     └─ Ата-энеси: {parent_user.get_full_name()}")

    def create_subjects(self):
        """Сабактарды түзүү"""
        self.stdout.write("\n📚 5. САБАКТАРДЫ ТҮЗҮҮ...")
        
        # Мугалимдерди алуу
        teachers = list(Teacher.objects.all())
        
        subjects_data = [
            # 1-курс сабактары
            {'name': 'Математика I', 'course_year': 1},
            {'name': 'Программалоо Негиздери', 'course_year': 1},
            {'name': 'Англис тили', 'course_year': 1},
            {'name': 'Физика', 'course_year': 1},
            {'name': 'Кыргыз тили', 'course_year': 1},
            
            # 2-курс сабактары
            {'name': 'Математика II', 'course_year': 2},
            {'name': 'Маалымат Структуралары', 'course_year': 2},
            {'name': 'Базалар Теориясы', 'course_year': 2},
            {'name': 'Web Программалоо', 'course_year': 2},
            
            # 3-курс сабактары
            {'name': 'Алгоритмдер жана Татаалдык', 'course_year': 3},
            {'name': 'Долбоорду Башкаруу', 'course_year': 3},
            
            # 4-курс сабактары
            {'name': 'Дипломдук Долбоор', 'course_year': 4},
        ]
        
        for subj_data in subjects_data:
            course = Course.objects.filter(year=subj_data['course_year']).first()
            if not course:
                continue
            
            teacher = random.choice(teachers)
            
            subject, created = Subject.objects.get_or_create(
                subject_name=subj_data['name'],
                course=course,
                defaults={'teacher': teacher}
            )
            
            if created:
                self.stdout.write(f"  ✅ {subject.subject_name} ({course.name}) - {teacher.name}")
            else:
                self.stdout.write(f"  ⏭️  {subject.subject_name} (дагы деле бар)")

    def create_schedule(self):
        """Расписание түзүү"""
        self.stdout.write("\n📅 6. РАСПИСАНИЕ ТҮЗҮҮ...")
        
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        timeslots = TimeSlot.objects.filter(is_active=True).order_by('order')
        
        # 1-курс А-группа үчүн расписание
        course1 = Course.objects.filter(year=1).first()
        if not course1:
            self.stdout.write("  ⚠️  1-курс табылган жок!")
            return
            
        group1a = Group.objects.filter(name=f"1-курс - А-группа", course=course1).first()
        if not group1a:
            self.stdout.write("  ⚠️  1-курс А-группа табылган жок!")
            return
        subjects_1 = Subject.objects.filter(course=course1)[:5]
        
        schedule_count = 0
        for day_idx, day in enumerate(days):
            # Күнүнө 2-3 сабак
            day_subjects = list(subjects_1)[:3]
            
            for subj_idx, subject in enumerate(day_subjects):
                timeslot = timeslots[subj_idx]
                
                schedule, created = Schedule.objects.get_or_create(
                    subject=subject,
                    group=group1a,
                    day=day,
                    time_slot=timeslot,
                    defaults={
                        'teacher': subject.teacher,
                        'room': f'{random.randint(100, 500)}',
                        'is_active': True
                    }
                )
                
                if created:
                    schedule_count += 1
        
        self.stdout.write(f"  ✅ {group1a.name} үчүн {schedule_count} сабак кошулду")
        
        # 2-курс үчүн да кошуу
        course2 = Course.objects.filter(year=2).first()
        if not course2:
            return
            
        group2a = Group.objects.filter(name=f"2-курс - А-группа", course=course2).first()
        if not group2a:
            return
        subjects_2 = Subject.objects.filter(course=course2)[:4]
        
        schedule_count_2 = 0
        for day_idx, day in enumerate(days[:4]):  # 4 күн гана
            day_subjects = list(subjects_2)[:2]
            
            for subj_idx, subject in enumerate(day_subjects):
                timeslot = timeslots[subj_idx]
                
                schedule, created = Schedule.objects.get_or_create(
                    subject=subject,
                    group=group2a,
                    day=day,
                    time_slot=timeslot,
                    defaults={
                        'teacher': subject.teacher,
                        'room': f'{random.randint(100, 500)}',
                        'is_active': True
                    }
                )
                
                if created:
                    schedule_count_2 += 1
        
        self.stdout.write(f"  ✅ {group2a.name} үчүн {schedule_count_2} сабак кошулду")

    def create_sample_attendance(self):
        """Мисал катышуу маалыматтарын түзүү (соңку 7 күн)"""
        self.stdout.write("\n✅ 7. МИСАЛ КАТЫШУУ МААЛЫМАТТАРЫН ТҮЗҮҮ...")
        
        today = date.today()
        statuses = ['Present', 'Present', 'Present', 'Absent', 'Late']  # Көбүнчө Present
        
        # 1-курс А-группа студенттери
        course1 = Course.objects.filter(year=1).first()
        if not course1:
            self.stdout.write("  ⚠️  1-курс табылган жок!")
            return
            
        group1a = Group.objects.filter(name=f"1-курс - А-группа", course=course1).first()
        if not group1a:
            self.stdout.write("  ⚠️  Группа табылган жок!")
            return
        students = Student.objects.filter(group=group1a)
        schedules = Schedule.objects.filter(group=group1a)
        
        attendance_count = 0
        
        # Соңку 7 күн үчүн
        for days_ago in range(7):
            check_date = today - timedelta(days=days_ago)
            weekday = check_date.weekday()  # 0=Monday, 6=Sunday
            
            # Күндүн англисче аты
            day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            day_name = day_names[weekday]
            
            # Ошол күндүн расписаниеси
            day_schedules = schedules.filter(day=day_name)
            
            for schedule in day_schedules:
                for student in students:
                    # Attendance түзүү
                    attendance, created = Attendance.objects.get_or_create(
                        student=student,
                        subject=schedule.subject,
                        schedule=schedule,
                        date=check_date,
                        defaults={
                            'status': random.choice(statuses),
                            'student_name': student.name,
                            'subject_name': schedule.subject.subject_name,
                            'is_active': True
                        }
                    )
                    
                    if created:
                        attendance_count += 1
        
        self.stdout.write(f"  ✅ {attendance_count} attendance маалымат түзүлдү (соңку 7 күн)")

    def print_statistics(self):
        """Жыйынтык статистика"""
        self.stdout.write("\n" + "="*70)
        self.stdout.write("📊 СИСТЕМАДАГЫ МААЛЫМАТТАР:")
        self.stdout.write("="*70)
        
        stats = {
            'TimeSlot': TimeSlot.objects.count(),
            'Course': Course.objects.count(),
            'Group': Group.objects.count(),
            'Teacher': Teacher.objects.count(),
            'Student': Student.objects.count(),
            'Subject': Subject.objects.count(),
            'Schedule': Schedule.objects.count(),
            'Attendance': Attendance.objects.count(),
        }
        
        # Колдонуучулар
        users_stats = {
            'ADMIN': User.objects.filter(userprofile__role='ADMIN').count(),
            'MANAGER': User.objects.filter(userprofile__role='MANAGER').count(),
            'TEACHER': User.objects.filter(userprofile__role='TEACHER').count(),
            'STUDENT': User.objects.filter(userprofile__role='STUDENT').count(),
            'PARENT': User.objects.filter(userprofile__role='PARENT').count(),
        }
        
        for key, value in stats.items():
            self.stdout.write(f"  {key:20s}: {value:4d}")
        
        self.stdout.write("\n📝 Колдонуучулар (ролдор боюнча):")
        for role, count in users_stats.items():
            self.stdout.write(f"  {role:20s}: {count:4d}")
        
        self.stdout.write(f"\n💡 Жалпы колдонуучулар: {User.objects.count()}")
