# 🔧 Troubleshooting Guide - Көйгөйлөрдү чечүү

## Жалпы көйгөйлөр

### 1. "Unable to connect to backend" / Backend менен байланыш жок

**Себептери:**
- Backend иштебейт
- Туура эмес API URL
- CORS көйгөйлөрү

**Чечими:**
```bash
# 1. Backend иштегенин текшериңиз:
cd backend
python manage.py runserver

# 2. API URL туураланганын текшериңиз:
# Android эмулятор: http://10.0.2.2:8000/api
# iOS симулятор: http://127.0.0.1:8000/api
# Физикалык телефон: http://YOUR_LOCAL_IP:8000/api

# 3. Backend ALLOWED_HOSTS текшериңиз (backend/attendance_system/settings.py):
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '10.0.2.2', 'YOUR_LOCAL_IP']

# 4. CORS settings (backend/attendance_system/settings.py):
CORS_ALLOW_ALL_ORIGINS = True  # Development үчүн
# Же
CORS_ALLOWED_ORIGINS = [
    "http://localhost:8081",
    "http://127.0.0.1:8081",
]
```

### 2. "Network request failed" ката

**Чечими:**
```bash
# 1. Компьютердин IP дарегин табыңыз:
# macOS/Linux:
ifconfig | grep "inet "
# Windows:
ipconfig

# 2. app.json файлында API_URL өзгөртүңүз:
{
  "expo": {
    "extra": {
      "API_URL": "http://YOUR_IP:8000/api"
    }
  }
}

# 3. Backend кайра иштетиңиз:
python manage.py runserver 0.0.0.0:8000
```

### 3. Login иштебейт / "Invalid credentials"

**Текшерүүлөр:**
1. Username жана password туурабы?
2. Backend колдонуучу түзүлгөнбү?
3. Backend admin панелинде текшериңиз: http://127.0.0.1:8000/admin

**Тест колдонуучу түзүү:**
```bash
cd backend
python manage.py shell

from django.contrib.auth.models import User
from core.models import UserProfile

# Admin түзүү
user = User.objects.create_user('admin', 'admin@test.com', 'admin123')
profile = UserProfile.objects.create(user=user, role='ADMIN', full_name='Test Admin')

# Student түзүү
user = User.objects.create_user('student1', 'student@test.com', 'student123')
profile = UserProfile.objects.create(user=user, role='STUDENT', full_name='Test Student')
```

### 4. Metro Bundler көйгөйлөрү

**Чечими:**
```bash
# Cache тазалоо:
expo start -c

# Же:
rm -rf node_modules
npm cache clean --force
npm install
expo start
```

### 5. "Expo Go" тиркемесинде QR код ачылбайт

**Чечими:**
1. Телефон жана компьютер бир WiFi тармагында болсун
2. VPN өчүрүлгөн болсун
3. Firewall блоктобосун (port 19000-19006)

**Tunnel режимин колдонуу:**
```bash
expo start --tunnel
```

### 6. iOS симуляторунда "Unable to resolve module"

**Чечими:**
```bash
# Watchman орнотуу (macOS):
brew install watchman

# Cache тазалоо:
watchman watch-del-all
rm -rf node_modules
npm install
```

### 7. Android эмуляторунда "Could not connect to development server"

**Чечими:**
```bash
# ADB reverse орнотуу:
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8000 tcp:8000

# Же app.json'до tunnel колдонуу:
expo start --tunnel
```

## Backend көйгөйлөрү

### Django migration ката

```bash
cd backend

# Бардык миграцияларды жокко чыгаруу (маалымат жоголот!):
python manage.py migrate --fake core zero
python manage.py migrate core

# Же:
rm db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```

### JWT token катасы

**Settings текшериңиз (backend/attendance_system/settings.py):**
```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),  # Тестирование үчүн узартыңыз
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}
```

### CORS катасы

**settings.py текшериңиз:**
```python
INSTALLED_APPS = [
    # ...
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Эң биринчи
    # ...
]

# Development үчүн:
CORS_ALLOW_ALL_ORIGINS = True

# Production үчүн:
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:8081",
]
```

## Mobile App көйгөйлөрү

### AsyncStorage катасы

**Чечими:**
```bash
# Package кайра орнотуу:
expo install @react-native-async-storage/async-storage
```

### Navigation катасы

**Чечими:**
```bash
# Бардык navigation packages кайра орнотуу:
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
expo install react-native-screens react-native-safe-area-context
```

### LinearGradient иштебейт

**Чечими:**
```bash
expo install expo-linear-gradient
```

## Performance көйгөйлөрү

### Mobile app жай иштейт

**Оптимизация:**
1. Development режимден Production режимге өтүү
2. Expo Go ордуна standalone build колдонуу
3. Сүрөттөрдү оптимизациялоо
4. FlatList колдонуу (ScrollView ордуна чоң тизмелер үчүн)

### Backend жай иштейт

**Оптимизация:**
```python
# settings.py
DEBUG = False  # Production үчүн

# Database индекстер кошуу (models.py):
class Meta:
    indexes = [
        models.Index(fields=['created_at']),
        models.Index(fields=['status']),
    ]
```

## Debugging Tips

### Mobile app debug кылуу:

```bash
# React Native Debugger орнотуу:
brew install --cask react-native-debugger

# Expo dev tools ачуу:
expo start
# Browser'де: http://localhost:19002
```

### Backend API тестирлөө:

```bash
# curl менен:
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Python requests менен:
python manage.py shell
import requests
response = requests.post('http://127.0.0.1:8000/api/auth/login/', 
                        json={'username': 'admin', 'password': 'admin123'})
print(response.json())
```

### Console logs көрүү:

**Mobile:**
```bash
# Expo logs:
expo start
# Terminal'да logs көрүнөт

# Же React Native Debugger колдонуңуз
```

**Backend:**
```bash
# Django logs:
python manage.py runserver --noreload --traceback
```

## Жардам алуу

Эгер көйгөй чечилбесе:

1. **Expo Documentation:** https://docs.expo.dev/
2. **React Native Documentation:** https://reactnative.dev/docs/getting-started
3. **Django REST Framework:** https://www.django-rest-framework.org/

4. **GitHub Issues:** Тиркеменин repository'синде Issue түзүңүз

5. **Stack Overflow:** Жалпы React Native/Django суроолору үчүн

---

**Белгилөө:** Эгер көйгөй чечилбесе, console'дон толук error message алып, GitHub Issues'ке жазыңыз.
