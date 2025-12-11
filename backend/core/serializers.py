from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    UserProfile, Student, Teacher, Course, Group, Subject, 
    Schedule, Attendance, LeaveRequest, Notification
)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined']
        read_only_fields = ['date_joined']

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'role']

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['id', 'name', 'year']

class GroupSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    course_id = serializers.IntegerField(write_only=True)
    student_count = serializers.SerializerMethodField()
    
    def get_student_count(self, obj):
        """Группадагы студенттердин санын эсептөө"""
        return obj.student_set.count()
    
    class Meta:
        model = Group
        fields = ['id', 'name', 'course', 'course_id', 'student_count']

class StudentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    course = CourseSerializer(read_only=True)
    group = GroupSerializer(read_only=True)
    full_name = serializers.CharField(source='name', read_only=True)
    profile_photo = serializers.SerializerMethodField()
    
    def get_profile_photo(self, obj):
        """Студенттин профиль фотосун алуу"""
        try:
            if obj.user and obj.user.userprofile.profile_photo:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.user.userprofile.profile_photo.url)
        except:
            pass
        return None
    
    class Meta:
        model = Student
        fields = ['id', 'name', 'full_name', 'user', 'course', 'group', 'profile_photo']

class TeacherSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    name = serializers.CharField()
    
    class Meta:
        model = Teacher
        fields = ['id', 'name', 'user', 'degree', 'department']

class SubjectSerializer(serializers.ModelSerializer):
    teacher = TeacherSerializer(read_only=True)
    course = CourseSerializer(read_only=True)
    name = serializers.CharField(source='subject_name', read_only=True)
    
    class Meta:
        model = Subject
        fields = ['id', 'subject_name', 'name', 'teacher', 'course']

class ScheduleSerializer(serializers.ModelSerializer):
    subject = SubjectSerializer(read_only=True)
    group = GroupSerializer(read_only=True)
    teacher = TeacherSerializer(read_only=True)
    time_slot = serializers.SerializerMethodField()
    time_slot_id = serializers.IntegerField(required=False, allow_null=True)
    day_of_week = serializers.CharField(source='day', read_only=True)
    
    # Writable fields for create/update
    subject_id = serializers.IntegerField(write_only=True, required=False)
    group_id = serializers.IntegerField(write_only=True, required=False)
    teacher_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Schedule
        fields = [
            'id', 'subject', 'group', 'teacher', 'day', 'day_of_week', 
            'start_time', 'end_time', 'time_slot', 'time_slot_id', 'room',
            'subject_id', 'group_id', 'teacher_id'
        ]
    
    def get_time_slot(self, obj):
        """Time slot маалыматын кайтаруу"""
        if obj.time_slot:
            return {
                'id': obj.time_slot.id,
                'name': obj.time_slot.name,
                'start_time': str(obj.time_slot.start_time),
                'end_time': str(obj.time_slot.end_time)
            }
        return None
    
    def create(self, validated_data):
        """Жаңы schedule кошуу"""
        return Schedule.objects.create(**validated_data)
    
    def update(self, instance, validated_data):
        """Schedule өзгөртүү"""
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

class AttendanceSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)
    subject = SubjectSerializer(read_only=True)
    schedule = ScheduleSerializer(read_only=True)
    created_by = UserSerializer(read_only=True)
    
    class Meta:
        model = Attendance
        fields = ['id', 'student', 'subject', 'schedule', 'date', 'status', 'created_by']

class AttendanceCreateSerializer(serializers.ModelSerializer):
    """Катышууну жазуу үчүн serializer"""
    class Meta:
        model = Attendance
        fields = ['student', 'subject', 'schedule', 'date', 'status']

class LeaveRequestSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)
    approved_by = UserSerializer(read_only=True)
    
    class Meta:
        model = LeaveRequest
        fields = [
            'id', 'student', 'leave_type', 'start_date', 'end_date', 
            'reason', 'document', 'status', 'approved_by', 'rejection_reason',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['approved_by', 'created_at', 'updated_at']

class LeaveRequestCreateSerializer(serializers.ModelSerializer):
    """Бошотуу сурамын түзүү үчүн serializer"""
    class Meta:
        model = LeaveRequest
        fields = ['leave_type', 'start_date', 'end_date', 'reason', 'document']

class NotificationSerializer(serializers.ModelSerializer):
    recipient = UserSerializer(read_only=True)
    sender = UserSerializer(read_only=True)
    student = StudentSerializer(read_only=True)
    leave_request = LeaveRequestSerializer(read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'sender', 'notification_type', 'title', 
            'message', 'created_at', 'is_read', 'student', 'leave_request'
        ]
        read_only_fields = ['sender', 'created_at']

# ============= СТАТИСТИКА СЕРИАЛАЙЗЕРЛЕРИ =============

class AttendanceStatsSerializer(serializers.Serializer):
    """Катышуу статистикасы үчүн"""
    total_records = serializers.IntegerField()
    present_count = serializers.IntegerField()
    absent_count = serializers.IntegerField()
    late_count = serializers.IntegerField()
    excused_count = serializers.IntegerField()
    attendance_percentage = serializers.FloatField()

class GroupStatsSerializer(serializers.Serializer):
    """Группа статистикасы үчүн"""
    group_name = serializers.CharField()
    total_students = serializers.IntegerField()
    total_records = serializers.IntegerField()
    present_count = serializers.IntegerField()
    attendance_percentage = serializers.FloatField()
