"""
Биргелешкен статистика функциялары
Dashboard жана Report үчүн бирдиктүү маалыматтар
"""
from django.utils import timezone
from datetime import datetime, timedelta
from django.db.models import Count, Q
from .models import Student, Teacher, Group, Subject, Attendance
import json


def get_unified_statistics(start_date=None, end_date=None, group_id=None, student_id=None):
    """
    Биргелешкен статистика функциясы
    Dashboard жана Report үчүн бирдиктүү маалыматтарды берет
    """
    today = timezone.now().date()
    
    # Базалык queryset
    attendances = Attendance.objects.all()
    
    # Дата фильтри
    if start_date:
        attendances = attendances.filter(date__gte=start_date)
    if end_date:
        attendances = attendances.filter(date__lte=end_date)
    if group_id:
        attendances = attendances.filter(student__group_id=group_id)
    if student_id:
        attendances = attendances.filter(student_id=student_id)
    
    # Негизги саныктар
    total_students = Student.objects.count()
    total_teachers = Teacher.objects.count()
    total_groups = Group.objects.count()
    total_subjects = Subject.objects.count()
    
    # Attendance статистикасы
    total_records = attendances.count()
    present_count = attendances.filter(status='Present').count()
    absent_count = attendances.filter(status='Absent').count()
    late_count = attendances.filter(status='Late').count()
    excused_count = attendances.filter(status='Excused').count()
    
    # Пайыздар
    if total_records > 0:
        present_rate = round((present_count / total_records) * 100, 1)
        absent_rate = round((absent_count / total_records) * 100, 1)
        late_rate = round((late_count / total_records) * 100, 1)
        excused_rate = round((excused_count / total_records) * 100, 1)
    else:
        present_rate = absent_rate = late_rate = excused_rate = 0
    
    # Бүгүнкү статистика
    today_attendances = Attendance.objects.filter(date=today)
    today_total = today_attendances.count()
    today_present = today_attendances.filter(status='Present').count()
    today_absent = today_attendances.filter(status='Absent').count()
    today_late = today_attendances.filter(status='Late').count()
    today_excused = today_attendances.filter(status='Excused').count()
    
    if today_total > 0:
        today_present_rate = round((today_present / today_total) * 100, 1)
        today_absent_rate = round((today_absent / today_total) * 100, 1)
        today_late_rate = round((today_late / today_total) * 100, 1)
        today_excused_rate = round((today_excused / today_total) * 100, 1)
    else:
        today_present_rate = today_absent_rate = today_late_rate = today_excused_rate = 0
    
    # Группалар боюнча статистика
    groups_stats = []
    group_total_records = 0
    group_total_present = 0
    group_total_absent = 0
    
    for group in Group.objects.all():
        # Фильтр менен же фильтрсиз attendance
        if group_id and str(group.id) != str(group_id):
            continue
            
        group_attendances = attendances.filter(student__group=group)
        group_total = group_attendances.count()
        group_present = group_attendances.filter(status='Present').count()
        group_absent = group_attendances.filter(status='Absent').count()
        
        if group_total > 0:
            group_rate = round((group_present / group_total) * 100, 1)
        else:
            group_rate = 0
        
        groups_stats.append({
            'id': group.id,
            'name': group.name,
            'course': group.course,
            'students_count': Student.objects.filter(group=group).count(),
            'total_records': group_total,
            'present_count': group_present,
            'absent_count': group_absent,
            'attendance_rate': group_rate,
            'subjects_count': Subject.objects.filter(schedule__group=group).distinct().count(),
        })
        
        group_total_records += group_total
        group_total_present += group_present
        group_total_absent += group_absent
    
    # Жалпы группалардын attendance rate
    if group_total_records > 0:
        overall_attendance_rate = round((group_total_present / group_total_records) * 100, 1)
    else:
        overall_attendance_rate = 0
    
    # Соңку 7 күндүн тренди
    weekly_trend_result = get_weekly_trend_data(today, total_students)
    weekly_data = weekly_trend_result['json']
    
    # Эң көп жок болгон студенттер (топ 10)
    top_absent_students = Student.objects.annotate(
        absent_count=Count('attendance', filter=Q(attendance__status='Absent'))
    ).filter(absent_count__gt=0).order_by('-absent_count')[:10]
    
    return {
        # Негизги сандар
        'total_students': total_students,
        'total_teachers': total_teachers,
        'total_groups': total_groups,
        'total_subjects': total_subjects,
        
        # Attendance статистикасы
        'total_records': total_records,
        'present_count': present_count,
        'absent_count': absent_count,
        'late_count': late_count,
        'excused_count': excused_count,
        
        # Пайыздар
        'present_rate': present_rate,
        'absent_rate': absent_rate,
        'late_rate': late_rate,
        'excused_rate': excused_rate,
        'attendance_percentage': present_rate,  # Report үчүн compatibility
        
        # Бүгүнкү статистика
        'today_total': today_total,
        'today_present': today_present,
        'today_absent': today_absent,
        'today_late': today_late,
        'today_excused': today_excused,
        'today_present_rate': today_present_rate,
        'today_absent_rate': today_absent_rate,
        'today_late_rate': today_late_rate,
        'today_excused_rate': today_excused_rate,
        
        # Группалар статистикасы
        'groups_stats': groups_stats,
        'total_all_records': group_total_records,
        'total_present': group_total_present,
        'total_absent': group_total_absent,
        'overall_attendance_rate': overall_attendance_rate,
        
        # Тренд маалыматтары
        'weekly_attendance_data': {
            **weekly_data,
            'daily_trend_json': weekly_trend_result['daily_trend_json']
        },
        'top_absent_students': top_absent_students,
        
        # Кошумча маалыматтар
        'today': today,
        'attendances': attendances,  # Report үчүн
    }


def get_weekly_trend_data(today, total_students_count):
    """
    Соңку 7 күндүн тренд маалыматтарын алуу
    """
    weekly_data = {
        'labels': [],
        'present': [],
        'absent': [],
        'late': [],
        'excused': [],
        'daily_trend': []  # Report үчүн
    }
    
    for i in range(6, -1, -1):
        day_date = today - timedelta(days=i)
        day_attendances = Attendance.objects.filter(date=day_date)
        
        day_total = day_attendances.count()
        day_present = day_attendances.filter(status='Present').count()
        day_absent = day_attendances.filter(status='Absent').count()
        day_late = day_attendances.filter(status='Late').count()
        day_excused = day_attendances.filter(status='Excused').count()
        
        # Жалпы студенттерден пайыз эсептөө (Dashboard үчүн)
        if total_students_count > 0:
            present_percent = round((day_present / total_students_count) * 100, 1)
            absent_percent = round((day_absent / total_students_count) * 100, 1)
            late_percent = round((day_late / total_students_count) * 100, 1)
            excused_percent = round((day_excused / total_students_count) * 100, 1)
        else:
            present_percent = absent_percent = late_percent = excused_percent = 0
        
        # Күндүк пайыз (Report үчүн)
        if day_total > 0:
            day_percentage = round((day_present / day_total) * 100, 1)
        else:
            day_percentage = 0
        
        # Күндүн аталышы
        day_name = day_date.strftime('%A')
        day_translations = {
            'Monday': 'Mon', 'Tuesday': 'Tue', 'Wednesday': 'Wed',
            'Thursday': 'Thu', 'Friday': 'Fri', 'Saturday': 'Sat', 'Sunday': 'Sun'
        }
        translated_day = day_translations.get(day_name, day_name[:3])
        final_label = f"{day_date.strftime('%d.%m')} ({translated_day})"
        
        weekly_data['labels'].append(final_label)
        weekly_data['present'].append(present_percent)
        weekly_data['absent'].append(absent_percent)
        weekly_data['late'].append(late_percent)
        weekly_data['excused'].append(excused_percent)
        
        # Report үчүн daily trend
        weekly_data['daily_trend'].append({
            'date': day_date.strftime('%m-%d'),
            'percentage': day_percentage,
            'total': day_total,
            'present': day_present,
            'absent': day_absent
        })
    
    # JSON форматка которуу (Dashboard үчүн)
    weekly_json = {
        'labels': json.dumps(weekly_data['labels']),
        'present': json.dumps(weekly_data['present']),
        'absent': json.dumps(weekly_data['absent']),
        'late': json.dumps(weekly_data['late']),
        'excused': json.dumps(weekly_data['excused'])
    }
    
    return {
        'json': weekly_json,
        'raw': weekly_data,
        'daily_trend_json': json.dumps(weekly_data['daily_trend'])
    }