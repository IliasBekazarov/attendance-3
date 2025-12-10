"""
UserProfile.students (student_profiles) дан Student.parents (parent_profiles) га маалыматты которуу
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'attendance_system.settings')
django.setup()

from core.models import Student, UserProfile

def migrate_parent_relationships():
    """Мурунку байланыштарды жаңы моделге которуу"""
    
    print("🔄 Ата-эне-бала байланыштарын которуу башталды...")
    
    # Бардык ата-энелерди табуу
    parents = UserProfile.objects.filter(role='PARENT')
    
    total_parents = parents.count()
    migrated = 0
    
    for parent in parents:
        # Эгер мурунку байланыштар бар болсо
        # (student_profiles таблицасы али жок болушу мүмкүн, ошондуктан try-except)
        try:
            # Мурунку таблицадан маалыматты окуу мүмкүн эмес, анткени талаа алынып салынган
            # Ошондуктан тике SQL аркылуу окубуз
            from django.db import connection
            
            with connection.cursor() as cursor:
                # Эски байланыштарды табуу
                cursor.execute("""
                    SELECT student_id 
                    FROM core_userprofile_students 
                    WHERE userprofile_id = %s
                """, [parent.id])
                
                student_ids = [row[0] for row in cursor.fetchall()]
                
                if student_ids:
                    print(f"👤 {parent.user.username}: {len(student_ids)} бала табылды")
                    
                    # Жаңы байланышты түзүү
                    for student_id in student_ids:
                        try:
                            student = Student.objects.get(id=student_id)
                            # Student.parents аркылуу байланышты түзүү
                            student.parents.add(parent)
                            print(f"  ✅ {student.name} байланышты")
                        except Student.DoesNotExist:
                            print(f"  ⚠️ Student {student_id} табылган жок")
                    
                    migrated += 1
        
        except Exception as e:
            # Эгер таблица жок болсо же башка ката болсо
            print(f"  ℹ️ {parent.user.username} үчүн эски маалымат жок: {e}")
            continue
    
    print(f"\n✅ Бүттү! {migrated}/{total_parents} ата-эне үчүн маалыматтар которулду")
    
    # Жыйынтык статистика
    print("\n📊 Жыйынтык статистика:")
    all_parents = UserProfile.objects.filter(role='PARENT')
    for parent in all_parents:
        children_count = parent.parent_profiles.count()
        if children_count > 0:
            children_names = ", ".join([c.name for c in parent.parent_profiles.all()])
            print(f"  {parent.user.username}: {children_count} бала - {children_names}")
        else:
            print(f"  {parent.user.username}: балдар жок")

if __name__ == '__main__':
    migrate_parent_relationships()
