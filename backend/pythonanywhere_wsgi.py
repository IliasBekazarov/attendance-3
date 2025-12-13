"""
WSGI config for attendance_system project on PythonAnywhere.

This file contains the WSGI configuration required to serve up your
web application at http://<your-username>.pythonanywhere.com.
It works by setting the variable 'application' to a WSGI handler of some
description.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/wsgi/
"""

import os
import sys

# Add your project directory to the sys.path
project_home = '/home/<your-username>/attendance-3/backend'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Set environment variable to tell Django where your settings.py is
os.environ['DJANGO_SETTINGS_MODULE'] = 'attendance_system.settings'

# Activate your virtual environment
# This is not needed if you're using the 'workon' command in your bash session
# activate_this = '/home/<your-username>/.virtualenvs/attendance-env/bin/activate_this.py'
# exec(open(activate_this).read(), {'__file__': activate_this})

# Import Django's WSGI handler
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
