from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """JWT token менен user маалыматын кайтаруу"""
    
    def validate(self, attrs):
        # Username жана password алуу
        username = attrs.get('username')
        password = attrs.get('password')
        
        # User'ди аутентификациялоо
        user = authenticate(username=username, password=password)
        
        if user is None:
            from rest_framework_simplejwt.exceptions import AuthenticationFailed
            raise AuthenticationFailed('Invalid credentials')
        
        # Token генерациялоо
        data = super().validate(attrs)
        
        # User маалыматын кошуу
        data['user'] = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'full_name': user.get_full_name() or user.username,
        }
        
        # UserProfile маалыматы бар болсо
        if hasattr(user, 'userprofile'):
            profile = user.userprofile
            data['user'].update({
                'role': profile.role,
                'phone_number': profile.phone_number,
                'profile_photo': profile.profile_photo.url if profile.profile_photo else None,
                'address': profile.address,
                'emergency_contact_name': profile.emergency_contact_name,
                'emergency_contact_phone': profile.emergency_contact_phone,
            })
            
            # Student болсо, группа маалыматын кошуу
            if hasattr(user, 'student') and user.student:
                student = user.student
                data['user']['student_id'] = student.id
                if student.group:
                    data['user']['group'] = {
                        'id': student.group.id,
                        'name': student.group.name,
                        'course': {
                            'id': student.group.course.id,
                            'name': student.group.course.name
                        } if student.group.course else None
                    }
            
            # Teacher болсо, предметтерди кошуу
            if hasattr(user, 'teacher') and user.teacher:
                teacher = user.teacher
                data['user']['teacher_id'] = teacher.id
                data['user']['subjects'] = [
                    {'id': subject.id, 'name': subject.subject_name}
                    for subject in teacher.subject_set.all()
                ]
        
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT login endpoint"""
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer
