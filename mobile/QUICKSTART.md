# 🚀 Quick Start Guide

Бул тез баштоо гиди. 5-10 мүнөттө тиркемени иштетүү үчүн.

## ⚡ Тез баштоо

### 1. Prerequisites (Алдын ала даярдык)

```bash
# Node.js текшериңиз (v14+):
node --version

# Expo CLI орнотуңуз (эгер жок болсо):
npm install -g expo-cli
```

### 2. Installation (Орнотуу)

```bash
# Mobile папкага өтүңүз:
cd mobile

# Dependencies орнотуңуз:
npm install
```

### 3. Backend даярдоо

```bash
# Жаңы terminal'да:
cd backend

# Backend иштетиңиз:
python manage.py runserver
```

**Текшериңиз:** http://127.0.0.1:8000/admin/ ачылышы керек

### 4. API URL конфигурациялоо

`mobile/app.json` файлын ачыңыз:

**Android эмулятор үчүн:**
```json
"extra": {
  "API_URL": "http://10.0.2.2:8000/api"
}
```

**iOS симулятор үчүн:**
```json
"extra": {
  "API_URL": "http://127.0.0.1:8000/api"
}
```

**Физикалык телефон үчүн:**
```json
"extra": {
  "API_URL": "http://YOUR_LOCAL_IP:8000/api"
}
```

### 5. Mobile app иштетүү

```bash
# Mobile папкада:
npm start

# Же:
expo start
```

Terminal'да менюдан:
- **a** - Android эмулятор
- **i** - iOS симулятор (macOS гана)
- **QR код** - Физикалык телефон (Expo Go тиркемеси менен)

### 6. Login маалыматтары

Эгер backend'те колдонуучу жок болсо:

```bash
cd backend
python manage.py createsuperuser

# Username: admin
# Password: admin123
```

Же тестирование үчүн:

```bash
python manage.py shell

from django.contrib.auth.models import User
from core.models import UserProfile

user = User.objects.create_user('test', 'test@test.com', 'test123')
UserProfile.objects.create(user=user, role='STUDENT', full_name='Test User')
```

## 📱 Тиркемени колдонуу

### Кирүү
1. Username: `admin` (же `test`)
2. Password: `admin123` (же `test123`)
3. "Кирүү" баскычы

### Navigation
- **🏠 Башкы бет:** Dashboard
- **📅 Расписание:** Сабак расписаниеси
- **✓ Катышуу:** Белгилөө (Teacher гана)
- **📝 Арыздар:** Ооруга арыздар (Student/Parent)
- **🔔 Билдирмелер:** Notifications
- **👤 Профиль:** Колдонуучу маалыматы

## 🔧 Жалпы көйгөйлөр

### "Network request failed"

**Чечими:**
1. Backend иштегенин текшериңиз:
   ```bash
   curl http://127.0.0.1:8000/api/
   ```

2. API URL туураланганын текшериңиз (`app.json`)

3. Backend ALLOWED_HOSTS текшериңиз:
   ```python
   # backend/attendance_system/settings.py
   ALLOWED_HOSTS = ['*']  # Development үчүн
   ```

### "Could not connect to Metro"

**Чечими:**
```bash
# Cache тазалоо:
expo start -c
```

### Android эмулятор ачылбайт

**Чечими:**
```bash
# Android Studio ачып, AVD Manager'ден эмулятор иштетиңиз
# Же:
expo start
# a басыңыз
```

### iOS симулятор ачылбайт (macOS)

**Чечими:**
```bash
# Xcode орнотулганын текшериңиз:
xcode-select --install

# Симулятор иштетиңиз:
expo start
# i басыңиз
```

### Телефонго (физикалык) жүктөө

1. **Expo Go орнотуңуз:**
   - iOS: App Store
   - Android: Google Play Store

2. **QR код сканерлеңиз:**
   - Terminal'дагы QR кодду Expo Go менен сканерлеңиз

3. **Эгер иштебесе:**
   ```bash
   # Tunnel режим:
   expo start --tunnel
   ```

## 📚 Кененирээк маалымат

- **Негизги документация:** `README.md`
- **Толук документация:** `DOCUMENTATION.md`
- **Көйгөйлөрдү чечүү:** `TROUBLESHOOTING.md`

## ✅ Даяр!

Азыр тиркеме иштеши керек! 🎉

Эгер көйгөй бар болсо, `TROUBLESHOOTING.md` караңыз.

---

**Кеңеш:** Development режимде тиркеме бир аз жай иштеши мүмкүн. Production build түзгөндө тезирээк болот.
