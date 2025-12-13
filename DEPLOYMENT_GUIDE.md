# 🚀 Attendance System - Deployment Guide

Бул жерде проектти бекер серверлерге жайгаштыруу боюнча толук нускама берилген.

## 📋 Мазмуну

1. [Backend - PythonAnywhere](#backend---pythonanywhere)
2. [Frontend - Vercel](#frontend---vercel)
3. [Тестирлөө жана Текшерүү](#тестирлөө-жана-текшерүү)

---

## 🐍 Backend - PythonAnywhere

### 1-Кадам: Аккаунт түзүү

1. **PythonAnywhere** сайтына киргиле: https://www.pythonanywhere.com
2. **Sign up** басып, бекер аккаунт түзгүлө (Beginner account)
3. Email тастыктагыла

### 2-Кадам: Файлдарды жүктөө

Эки жол бар:

#### Вариант A: Git аркылуу (сунушталат)
```bash
# PythonAnywhere консолунда:
cd ~
git clone https://github.com/<your-username>/attendance-3.git
cd attendance-3/backend
```

#### Вариант B: Manual жүктөө
1. PythonAnywhere Dashboard → Files
2. `backend` папкасын ZIP кылып жүктөгүлө
3. PythonAnywhere'де zip файлын upload кылгыла
4. Консолдо: `unzip backend.zip`

### 3-Кадам: Virtual Environment түзүү

```bash
# PythonAnywhere Bash консолунда:
cd ~/attendance-3/backend
mkvirtualenv --python=/usr/bin/python3.10 attendance-env
workon attendance-env

# Dependencies орнотуу:
pip install -r requirements.txt
```

### 4-Кадам: Database миграциясы

```bash
workon attendance-env
cd ~/attendance-3/backend

# Миграцияларды чыгаруу:
python manage.py makemigrations
python manage.py migrate

# Static файлдарды чогултуу:
python manage.py collectstatic --noinput

# Superuser түзүү:
python manage.py createsuperuser
```

### 5-Кадам: Web App конфигурациясы

1. **PythonAnywhere Dashboard** → **Web** → **Add a new web app**
2. **Manual configuration** → **Python 3.10**
3. **Virtual Environment** секциясында:
   ```
   /home/<your-username>/.virtualenvs/attendance-env
   ```

4. **Code** секциясында **WSGI configuration file** ачыгыла:
   ```python
   import os
   import sys
   
   # Проектиңиздин жолу:
   path = '/home/<your-username>/attendance-3/backend'
   if path not in sys.path:
       sys.path.insert(0, path)
   
   # Settings файлы:
   os.environ['DJANGO_SETTINGS_MODULE'] = 'attendance_system.settings'
   
   from django.core.wsgi import get_wsgi_application
   application = get_wsgi_application()
   ```

5. **Static files** секциясында:
   - URL: `/static/`
   - Directory: `/home/<your-username>/attendance-3/backend/staticfiles`
   
   - URL: `/media/`
   - Directory: `/home/<your-username>/attendance-3/backend/media`

6. **Reload** баскычын басыгыла

### 6-Кадам: Environment Variables

PythonAnywhere консолунда `.env` файл түзгүлө:

```bash
cd ~/attendance-3/backend
nano .env
```

Ичине мындай жазгыла:
```
SECRET_KEY=django-insecure-a#fhk5(u^2defh7#&ddq&pp4q#l3x_!dsf9q*v21#)pb%=pnjb
DEBUG=False
ALLOWED_HOSTS=<your-username>.pythonanywhere.com
```

### ✅ Backend даяр!

Браузерде ачыгыла: `https://<your-username>.pythonanywhere.com`

---

## ⚛️ Frontend - Vercel

### 1-Кадам: GitHub'га жүктөө

Эгер проект GitHub'да жок болсо:

```bash
# Локалдык компьютериңизде:
cd /Users/k_beknazarovicloud.com/Desktop/attandance_su
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/attendance-3.git
git push -u origin main
```

### 2-Кадам: Vercel аккаунт түзүү

1. **Vercel** сайтына киргиле: https://vercel.com
2. **Sign up** → GitHub аккаунтуңуз менен киргиле
3. GitHub'га жеткиликти бергиле

### 3-Кадам: Proектти жайгаштыруу

1. **Vercel Dashboard** → **Add New** → **Project**
2. GitHub репозиторийиңизди тандагыла (`attendance-3`)
3. **Configure Project**:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Environment Variables** кошугула:
   - Key: `VITE_API_URL`
   - Value: `https://<your-username>.pythonanywhere.com/api`

5. **Deploy** баскычын басыгыла

### 4-Кадам: Domain алуу

Vercel автоматтык түрдө domain берет:
- `https://attendance-3.vercel.app` же
- `https://attandance-su.vercel.app`

### 5-Кадам: Backend'ти жаңыртуу

PythonAnywhere'дагы Django settings'те Vercel domain'ди кошуу керек:

```bash
# PythonAnywhere консолунда:
cd ~/attendance-3/backend
nano attendance_system/settings.py
```

`CORS_ALLOWED_ORIGINS` жаңыртыгыла:
```python
CORS_ALLOWED_ORIGINS = [
    'https://attendance-3.vercel.app',  # Өз domain'иңизди жазыгыла
]
```

Web app'ти reload кылгыла.

### ✅ Frontend даяр!

Браузерде ачыгыла: `https://attendance-3.vercel.app`

---

## 🧪 Тестирлөө жана Текшерүү

### Backend тестирлөө:

1. Admin panel: `https://<your-username>.pythonanywhere.com/admin`
2. API endpoints:
   - `https://<your-username>.pythonanywhere.com/api/users/`
   - `https://<your-username>.pythonanywhere.com/api/courses/`

### Frontend тестирлөө:

1. Login page: `https://attendance-3.vercel.app/login`
2. Dashboard: `https://attendance-3.vercel.app/dashboard`
3. Browser Console'до хаталарды текшергиле (F12)

### CORS текшерүү:

Браузердин Network tab'ында (F12):
- API request'тер жасалабы?
- CORS хаталары жокпу?

---

## 🔧 Кеңештер жана Troubleshooting

### Backend (PythonAnywhere)

**Хата: 502 Bad Gateway**
```bash
# Error log текшергиле:
cd /var/log
cat <your-username>.pythonanywhere.com.error.log
```

**Хата: ModuleNotFoundError**
```bash
# Virtual environment туура активдештирилгенби?
workon attendance-env
pip list  # Орнотулган packages көргүлө
```

**Static files көрүнбөйт**
```bash
# Collectstatic кайра иштетигиле:
python manage.py collectstatic --clear --noinput
```

### Frontend (Vercel)

**Хата: 404 on refresh**
- `vercel.json` файл туура конфигурацияланганбы текшергиле

**API connection issues**
- Environment variable туурабы: `VITE_API_URL`
- Backend CORS настройкасы туурабы

**Build fails**
```bash
# Локалдык билдириңизде тестирлөңүз:
cd frontend
npm run build
```

### Database Issues

**SQLite file permissions**
```bash
# PythonAnywhere консолунда:
chmod 664 ~/attendance-3/backend/db.sqlite3
chmod 775 ~/attendance-3/backend
```

---

## 📞 Колдоо

Суроолоруңуз болсо:
- PythonAnywhere Help: https://help.pythonanywhere.com/
- Vercel Docs: https://vercel.com/docs
- GitHub Issues: https://github.com/<your-username>/attendance-3/issues

---

## 🎉 Ийгилик!

Проектиңиз азыр онлайн режиминде иштеп жатат!

- **Backend**: `https://<your-username>.pythonanywhere.com`
- **Frontend**: `https://attendance-3.vercel.app`

Кайра deployment кылуу үчүн:
- **Backend**: PythonAnywhere Web tab'да "Reload" басыгыла
- **Frontend**: GitHub'га push кылганда автоматтык түрдө deploy болот
