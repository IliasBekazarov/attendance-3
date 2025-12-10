from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import Student, Teacher, UserProfile
import random

class Command(BaseCommand):
    help = 'Create 10 users: 2 teachers and 8 students with parents'

    def handle(self, *args, **options):
        # Мугалимдер маалыматтары
        teachers_data = [
            {
                'username': 'teacher_aida',
                'first_name': 'Айда',
                'last_name': 'Токтосунова',
                'email': 'aida.toktosunova@school.kg',
                'password': 'teacher123',
                'subject': 'Математика'
            },
            {
                'username': 'teacher_bektur',
                'first_name': 'Бектур',
                'last_name': 'Сыдыков',
                'email': 'bektur.sydykov@school.kg', 
                'password': 'teacher456',
                'subject': 'Физика'
            }
        ]

        # Студенттер жана ата-энелер маалыматтары
        students_data = [
            {
                'student': {
                    'username': 'student_nurlan',
                    'first_name': 'Нурлан',
                    'last_name': 'Алымбеков',
                    'email': 'nurlan.alymbekov@student.kg',
                    'password': 'student123'
                },
                'father': {
                    'username': 'parent_askar',
                    'first_name': 'Аскар',
                    'last_name': 'Алымбеков',
                    'email': 'askar.alymbekov@parent.kg',
                    'password': 'parent123'
                },
                'mother': {
                    'username': 'parent_gulmira',
                    'first_name': 'Гүлмира',
                    'last_name': 'Алымбекова',
                    'email': 'gulmira.alymbekova@parent.kg',
                    'password': 'parent123'
                }
            },
            {
                'student': {
                    'username': 'student_asel',
                    'first_name': 'Асел',
                    'last_name': 'Жумабекова',
                    'email': 'asel.zhumabekova@student.kg',
                    'password': 'student456'
                },
                'father': {
                    'username': 'parent_erkin',
                    'first_name': 'Эркин',
                    'last_name': 'Жумабеков',
                    'email': 'erkin.zhumabekov@parent.kg',
                    'password': 'parent456'
                },
                'mother': {
                    'username': 'parent_nazira',
                    'first_name': 'Назира',
                    'last_name': 'Жумабекова',
                    'email': 'nazira.zhumabekova@parent.kg',
                    'password': 'parent456'
                }
            },
            {
                'student': {
                    'username': 'student_eldar',
                    'first_name': 'Элдар',
                    'last_name': 'Касымов',
                    'email': 'eldar.kasymov@student.kg',
                    'password': 'student789'
                },
                'father': {
                    'username': 'parent_omurbek',
                    'first_name': 'Омурбек',
                    'last_name': 'Касымов',
                    'email': 'omurbek.kasymov@parent.kg',
                    'password': 'parent789'
                },
                'mother': {
                    'username': 'parent_baktigul',
                    'first_name': 'Бактыгүл',
                    'last_name': 'Касымова',
                    'email': 'baktigul.kasymova@parent.kg',
                    'password': 'parent789'
                }
            },
            {
                'student': {
                    'username': 'student_aigerim',
                    'first_name': 'Айгерим',
                    'last_name': 'Токтомушева',
                    'email': 'aigerim.toktomusheva@student.kg',
                    'password': 'student111'
                },
                'father': {
                    'username': 'parent_ruslan',
                    'first_name': 'Руслан',
                    'last_name': 'Токтомушев',
                    'email': 'ruslan.toktomushev@parent.kg',
                    'password': 'parent111'
                },
                'mother': {
                    'username': 'parent_cholpon',
                    'first_name': 'Чолпон',
                    'last_name': 'Токтомушева',
                    'email': 'cholpon.toktomusheva@parent.kg',
                    'password': 'parent111'
                }
            },
            {
                'student': {
                    'username': 'student_bekzat',
                    'first_name': 'Бекзат',
                    'last_name': 'Маматов',
                    'email': 'bekzat.mamatov@student.kg',
                    'password': 'student222'
                },
                'father': {
                    'username': 'parent_dastan',
                    'first_name': 'Дастан',
                    'last_name': 'Маматов',
                    'email': 'dastan.mamatov@parent.kg',
                    'password': 'parent222'
                },
                'mother': {
                    'username': 'parent_jyldyz',
                    'first_name': 'Жылдыз',
                    'last_name': 'Маматова',
                    'email': 'jyldyz.mamatova@parent.kg',
                    'password': 'parent222'
                }
            }
        ]

        self.stdout.write("=== 10 USER ТҮЗҮҮ БАШТАЛДЫ ===\n")

        # 1. Мугалимдерди түзүү
        self.stdout.write("1. МУГАЛИМДЕР:")
        for teacher_data in teachers_data:
            # Username дубликатын текшерүү
            if User.objects.filter(username=teacher_data['username']).exists():
                self.stdout.write(f"⚠️  {teacher_data['username']} дагы деле бар, өткөрүп жиберүү")
                continue
                
            # User түзүү
            user = User.objects.create_user(
                username=teacher_data['username'],
                first_name=teacher_data['first_name'],
                last_name=teacher_data['last_name'],
                email=teacher_data['email'],
                password=teacher_data['password']
            )

            # UserProfile автоматтык түзүлөт (signals.py аркылуу)
            # Ролду жаңылайм
            profile = user.userprofile
            profile.role = 'TEACHER'
            profile.save()

            # Teacher автоматтык түзүлөт же жаңылап коё
            try:
                teacher = Teacher.objects.get(user=user)
                teacher.name = f"{teacher_data['first_name']} {teacher_data['last_name']}"
                teacher.subject = teacher_data['subject']
                teacher.save()
            except Teacher.DoesNotExist:
                teacher = Teacher.objects.create(
                    user=user,
                    name=f"{teacher_data['first_name']} {teacher_data['last_name']}",
                    subject=teacher_data['subject']
                )

            self.stdout.write(f"✅ Мугалим: {teacher.name}")
            self.stdout.write(f"   Логин: {teacher_data['username']}")
            self.stdout.write(f"   Пароль: {teacher_data['password']}")
            self.stdout.write(f"   Email: {teacher_data['email']}")
            self.stdout.write(f"   Сабагы: {teacher_data['subject']}\n")

        # 2. Студенттер жана ата-энелерди түзүү
        self.stdout.write("2. СТУДЕНТТЕР ЖАНА АТА-ЭНЕЛЕР:")
        
        # Course жана Group алуу же түзүү
        from core.models import Course, Group
        
        course, created = Course.objects.get_or_create(
            name="1-курс",
            year=1,
            defaults={'faculty': 'Информатика'}
        )
        
        group, created = Group.objects.get_or_create(
            name="ИТ-1",
            defaults={'course': course}
        )

        for i, family_data in enumerate(students_data, 1):
            self.stdout.write(f"\n--- {i}-ҮЙЛӨӨ ---")
            
            # Студент түзүү
            student_info = family_data['student']
            if User.objects.filter(username=student_info['username']).exists():
                self.stdout.write(f"⚠️  {student_info['username']} дагы деле бар, бул үйлөөнү өткөрүп жиберүү")
                continue
                
            student_user = User.objects.create_user(
                username=student_info['username'],
                first_name=student_info['first_name'],
                last_name=student_info['last_name'],
                email=student_info['email'],
                password=student_info['password']
            )

            student_profile = student_user.userprofile
            student_profile.role = 'STUDENT'
            student_profile.save()

            # Student автоматтык түзүлөт, жаңылап коё
            try:
                student = Student.objects.get(user=student_user)
                student.name = f"{student_info['first_name']} {student_info['last_name']}"
                student.course = course
                student.group = group
                student.save()
            except Student.DoesNotExist:
                student = Student.objects.create(
                    user=student_user,
                    name=f"{student_info['first_name']} {student_info['last_name']}",
                    course=course,
                    group=group
                )

            self.stdout.write(f"👨‍🎓 Студент: {student.name}")
            self.stdout.write(f"   Логин: {student_info['username']}")
            self.stdout.write(f"   Пароль: {student_info['password']}")
            self.stdout.write(f"   Email: {student_info['email']}")

            # Атасын түзүү
            father_info = family_data['father']
            father_user = User.objects.create_user(
                username=father_info['username'],
                first_name=father_info['first_name'],
                last_name=father_info['last_name'],
                email=father_info['email'],
                password=father_info['password']
            )

            father_profile = father_user.userprofile
            father_profile.role = 'PARENT'
            father_profile.save()

            self.stdout.write(f"👨 Атасы: {father_info['first_name']} {father_info['last_name']}")
            self.stdout.write(f"   Логин: {father_info['username']}")
            self.stdout.write(f"   Пароль: {father_info['password']}")
            self.stdout.write(f"   Email: {father_info['email']}")

            # Энесин түзүү
            mother_info = family_data['mother']
            mother_user = User.objects.create_user(
                username=mother_info['username'],
                first_name=mother_info['first_name'],
                last_name=mother_info['last_name'],
                email=mother_info['email'],
                password=mother_info['password']
            )

            mother_profile = mother_user.userprofile
            mother_profile.role = 'PARENT'
            mother_profile.save()

            self.stdout.write(f"👩 Энеси: {mother_info['first_name']} {mother_info['last_name']}")
            self.stdout.write(f"   Логин: {mother_info['username']}")
            self.stdout.write(f"   Пароль: {mother_info['password']}")
            self.stdout.write(f"   Email: {mother_info['email']}")

        # Жыйынтык статистика
        self.stdout.write("\n" + "="*50)
        self.stdout.write("📊 СТАТИСТИКА:")
        self.stdout.write(f"Мугалимдер: {User.objects.filter(userprofile__role='TEACHER').count()}")
        self.stdout.write(f"Студенттер: {User.objects.filter(userprofile__role='STUDENT').count()}")
        self.stdout.write(f"Ата-энелер: {User.objects.filter(userprofile__role='PARENT').count()}")
        self.stdout.write(f"Жалпы колдонуучулар: {User.objects.count()}")
        self.stdout.write("\n✅ 10 USER ИЙГИЛИКТҮҮ ТҮЗҮЛДҮ!")