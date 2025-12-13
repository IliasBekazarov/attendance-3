# 🚀 Quick Deployment Steps

## Backend - PythonAnywhere

### 1. Аккаунт түзүү
```
https://www.pythonanywhere.com/registration/register/beginner/
```

### 2. Файлдарды жүктөө
```bash
cd ~
git clone <your-repo-url> attendance-3
cd attendance-3/backend
```

### 3. Virtual Environment
```bash
mkvirtualenv --python=/usr/bin/python3.10 attendance-env
workon attendance-env
pip install -r requirements.txt
```

### 4. Database Setup
```bash
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

### 5. Web App Configuration
- Dashboard → Web → Add new web app
- Manual configuration → Python 3.10
- Virtual environment path: `/home/<username>/.virtualenvs/attendance-env`
- WSGI file: `pythonanywhere_wsgi.py` ичиндеги кодду копировать кылгыла
- Static files: `/static/` → `/home/<username>/attendance-3/backend/staticfiles`
- Reload!

### 6. Environment Variables
```bash
cp .env.example .env
nano .env  # Өз маалыматтарыңызды жазыңыз
```

---

## Frontend - Vercel

### 1. GitHub'га Push
```bash
git add .
git commit -m "Ready for deployment"
git push
```

### 2. Vercel Deployment
```
https://vercel.com/new
```
- Import repository: `attendance-3`
- Framework: Vite
- Root directory: `frontend`
- Environment Variables:
  - `VITE_API_URL` = `https://<username>.pythonanywhere.com/api`
- Deploy!

### 3. Backend Settings жаңыртуу
PythonAnywhere'де `settings.py` ачып:
```python
CORS_ALLOWED_ORIGINS = [
    'https://<your-vercel-domain>.vercel.app',
]

CSRF_TRUSTED_ORIGINS = [
    'https://<your-vercel-domain>.vercel.app',
]
```
Web app'ти reload кылгыла!

---

## ✅ Тестирлөө

1. Backend: `https://<username>.pythonanywhere.com/admin`
2. Frontend: `https://<your-app>.vercel.app`
3. Login аркылуу кирип көргүлө!

---

## 🆘 Көп кездешкен хаталар

### Backend 502 Error
```bash
# Error logs текшергиле:
cat /var/log/<username>.pythonanywhere.com.error.log
```

### Frontend API Connection Error
- `VITE_API_URL` туурабы?
- Backend CORS settings туурабы?
- Backend иштеп жатабы?

### Static Files көрүнбөйт
```bash
python manage.py collectstatic --clear --noinput
```

---

Толук нускама: `DEPLOYMENT_GUIDE.md` файлда!
