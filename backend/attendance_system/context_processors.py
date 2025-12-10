# -*- coding: utf-8 -*-
"""
Site Configuration Context Processor
Template ичинде site configuration маалыматтарын колдонуу үчүн
"""

from django.conf import settings

def site_config(request):
    """
    Site configuration маалыматтарын template ичинде жеткиликтүү кылат
    """
    try:
        return {
            'SITE_NAME': getattr(settings, 'SITE_NAME', 'Salymbekov University'),
            'UNIVERSITY_INFO': getattr(settings, 'UNIVERSITY_INFO', {}),
            'SYSTEM_CONFIG': getattr(settings, 'SYSTEM_CONFIG', {}),
            'LANGUAGE_CONFIG': getattr(settings, 'LANGUAGE_CONFIG', {}),
            'THEME_CONFIG': getattr(settings, 'THEME_CONFIG', {}),
            'ACADEMIC_CONFIG': getattr(settings, 'ACADEMIC_CONFIG', {}),
            'SOCIAL_MEDIA': getattr(settings, 'SOCIAL_MEDIA', {}),
            'FOOTER_CONFIG': getattr(settings, 'FOOTER_CONFIG', {}),
        }
    except Exception as e:
        # Эгер ката болсо, жөнөкөй default маалыматтар кайтарат
        return {
            'SITE_NAME': 'Salymbekov University',
            'UNIVERSITY_INFO': {'name': 'Salymbekov University'},
            'SYSTEM_CONFIG': {'version': '1.0.0'},
        }


def unread_notifications(request):
    """
    Окулбаган билдирүүлөрдүн санын template ичинде жеткиликтүү кылат
    """
    if request.user.is_authenticated:
        try:
            from core.models import Notification
            count = Notification.objects.filter(
                user=request.user,
                is_read=False
            ).count()
            return {
                'unread_notifications_count': count
            }
        except Exception as e:
            # Эгер модель жок болсо же ката болсо
            return {
                'unread_notifications_count': 0
            }
    return {
        'unread_notifications_count': 0
    }