from django.contrib import admin
from .models import (
    UserProfile, Student, Teacher, Course, Group, Subject, 
    Schedule, TimeSlot, Attendance, LeaveRequest, Notification
)

@admin.register(TimeSlot)
class TimeSlotAdmin(admin.ModelAdmin):
    list_display = ('name', 'start_time', 'end_time', 'order', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name',)
    ordering = ('order', 'start_time')

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'phone_number', 'created_at', 'is_profile_complete', 'get_children')
    list_filter = ('role', 'is_profile_complete', 'gender')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'phone_number')
    readonly_fields = ('created_at', 'updated_at', 'get_children_info')
    
    fieldsets = (
        ('Колдонуучу маалыматы', {
            'fields': ('user', 'role')
        }),
        ('Жеке маалыматтар', {
            'fields': ('profile_photo', 'phone_number', 'birth_date', 'gender', 'address', 'bio')
        }),
        ('Тез кырдаал байланышы', {
            'fields': ('emergency_contact_name', 'emergency_contact_phone')
        }),
        ('Ата-эне байланышы (PARENT үчүн)', {
            'fields': ('get_children_info',),
            'classes': ('collapse',),
            'description': 'Студенттерди өзгөртүү үчүн Student админ панелине өтүңүз жана ошол жерден parents талаасын колдонуңуз.'
        }),
        ('Система маалыматтары', {
            'fields': ('created_at', 'updated_at', 'is_profile_complete'),
            'classes': ('collapse',)
        }),
    )
    
    def get_children(self, obj):
        """Ата-эненин балдарын көрсөтүү (list үчүн)"""
        if obj.role == 'PARENT':
            children = obj.parent_profiles.all()
            return f"{children.count()} бала"
        return "-"
    get_children.short_description = 'Балдар'
    
    def get_children_info(self, obj):
        """Ата-эненин балдарынын толук маалыматы"""
        if obj.role == 'PARENT':
            children = obj.parent_profiles.all()
            if children.exists():
                info = []
                for child in children:
                    group_info = f"{child.group.name}" if child.group else "Группасыз"
                    info.append(f"• {child.name} ({group_info})")
                return "\n".join(info)
            return "Эч кандай бала байланышкан эмес"
        return "Бул колдонуучу ата-эне эмес"
    get_children_info.short_description = 'Балдар маалыматы'
    
    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        # Role талаасын мажбурлуу эмес кылуу
        if 'role' in form.base_fields:
            form.base_fields['role'].required = False
            form.base_fields['role'].help_text = 'Колдонуучунун ролун тандаңыз. Эгер тандалбаса, кийин коё аласыз.'
        return form

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'course', 'group', 'get_parents')
    list_filter = ('course', 'group')
    search_fields = ('name',)
    filter_horizontal = ('parents',)  # Ата-энелерди тандоо үчүн оңой интерфейс
    
    def get_parents(self, obj):
        """Студенттин ата-энелерин көрсөтүү"""
        return ", ".join([p.user.username for p in obj.parents.all()])
    get_parents.short_description = 'Ата-энелер'

@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'degree')
    list_filter = ('degree',)
    search_fields = ('name',)

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('name', 'year', 'faculty')
    list_filter = ('year',)
    search_fields = ('name',)

@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'course', 'capacity')
    list_filter = ('course',)
    search_fields = ('name',)

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('subject_name', 'teacher', 'course')
    list_filter = ('course',)
    search_fields = ('subject_name',)

@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    list_display = ('subject', 'group', 'day', 'time_slot', 'room')
    list_filter = ('day', 'time_slot')
    search_fields = ('subject__subject_name', 'group__name')

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('student', 'subject', 'date', 'status')
    list_filter = ('status', 'date')
    search_fields = ('student__name',)

@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = ('student', 'leave_type', 'start_date', 'end_date', 'status')
    list_filter = ('status', 'leave_type')
    search_fields = ('student__name',)

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'recipient', 'notification_type', 'is_read')
    list_filter = ('notification_type', 'is_read')
    search_fields = ('title',)
