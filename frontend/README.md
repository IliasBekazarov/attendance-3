# 📚 Attendance System - React Frontend

Django Attendance System үчүн React негизинде иштелген заманбап frontend. Vite, React Router жана Axios колдонулган.

## 🚀 Технологиялар

- **React 18.2** - UI фреймворк
- **Vite 5.0** - Тез жана заманбап bundler
- **React Router 6.20** - Client-side routing
- **Axios 1.6** - HTTP клиент (JWT auth менен)
- **Context API** - State management
- **Chart.js 4.4** - Графиктер
- **Font Awesome** - Иконкалар

## 📁 Структура

```
frontend/
├── public/              # Static файлдар
├── src/
│   ├── components/      # Компоненттер
│   │   ├── Layout.jsx       # Негизги layout (sidebar, header)
│   │   └── PrivateRoute.jsx # Коргоолуу роуттар
│   ├── context/         # Context providers
│   │   ├── AuthContext.jsx      # Authentication
│   │   └── LanguageContext.jsx  # Тил (ky/ru/en)
│   ├── pages/           # Беттер
│   │   ├── Login.jsx           # Кирүү бети
│   │   ├── Dashboard.jsx       # Башкы бет
│   │   ├── Schedule.jsx        # Расписание
│   │   ├── Profile.jsx         # Профиль
│   │   ├── Notifications.jsx   # Билдирүүлөр
│   │   └── LeaveRequests.jsx   # Өтүнмөлөр
│   ├── services/        # API сервистер
│   │   └── api.js              # Axios instance
│   ├── App.jsx          # Негизги app компоненти
│   ├── main.jsx         # Entry point
│   └── style.css        # Стилдер
├── package.json
├── vite.config.js
└── index.html
```

## ⚙️ Орнотуу

### 1. Dependencies орнотуу

```bash
cd frontend
npm install
```

### 2. Django backend'ти иштетүү

Башка терминалда:

```bash
cd ..
python manage.py runserver
```

Django `http://127.0.0.1:8000` дарегинде иштей баштайт.

### 3. React frontend'ти иштетүү

```bash
npm run dev
```

Браузер ачылып, `http://localhost:3000` дарегине өтөт.

## 🔑 Негизги функциялар

### Authentication (JWT)
- Login/logout
- Token сактоо (localStorage)
- Automatic token refresh
- 401 катасын кармоо

### Тилдер (i18n)
- Кыргызча (ky)
- Орусча (ru)
- Англисче (en)
- localStorage'де сакталат

### Роуттар
```
/login             - Кирүү бети (public)
/dashboard         - Башкы бет (protected)
/schedule          - Расписание (protected)
/profile           - Профиль (protected)
/notifications     - Билдирүүлөр (protected)
/leave-requests    - Өтүнмөлөр (protected)
```

### Ролдор
- **ADMIN/MANAGER** - Толук статистика, группалар боюнча маалымат
- **TEACHER** - Өзүнүн сабактары, катышуу белгилөө
- **STUDENT** - Өзүнүн катышуу маалыматы
- **PARENT** - Баланын маалыматы

## 🔌 API Integration

Backend API базасы: `http://127.0.0.1:8000/api`

### Auth endpoints (керектүү)
```
POST /api/auth/login/         - Login
GET  /api/auth/me/            - Current user
POST /api/auth/logout/        - Logout
```

### Dashboard endpoints
```
GET /api/dashboard/stats/     - Dashboard статистика
```

### Schedule endpoints
```
GET  /api/schedule/           - Расписаниелер
POST /api/attendance/         - Катышуу белгилөө
```

### Profile endpoints
```
PATCH /api/profile/update/    - Профиль жаңыртуу
```

### Notifications endpoints
```
GET    /api/notifications/              - Билдирүүлөр
PATCH  /api/notifications/{id}/         - Окулган деп белгилөө
DELETE /api/notifications/{id}/         - Өчүрүү
POST   /api/notifications/mark-all-read/ - Баарын окуу
```

### Leave requests endpoints
```
GET   /api/leave-requests/      - Өтүнмөлөр
POST  /api/leave-requests/      - Жаңы өтүнмө
PATCH /api/leave-requests/{id}/ - Статусту өзгөртүү
```

## 🎨 Styling

`style.css` файлында:
- CSS Variables (`:root`)
- Responsive design (mobile-first)
- Modern градиенттер
- Font Awesome иконкалар
- Touch-friendly (mobile)

Негизги түстөр:
- Primary: `#667eea` (фиолет)
- Success: `#48bb78` (жашыл)
- Danger: `#f56565` (кызыл)
- Warning: `#ed8936` (сары)
- Info: `#4299e1` (көк)

## 📱 Responsive Design

- **Desktop**: Full sidebar + content
- **Tablet (768px)**: Collapsible sidebar
- **Mobile (480px)**: Hamburger menu, overlay sidebar

## 🛠️ Development

### Dev server
```bash
npm run dev
```

### Build production
```bash
npm run build
```

### Preview production
```bash
npm run preview
```

## 🔧 Configuration

### vite.config.js
```javascript
export default {
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://127.0.0.1:8000'  // Django backend
    }
  }
}
```

### Environment variables (optional)
`.env` файл түзсөңүз болот:
```
VITE_API_URL=http://127.0.0.1:8000/api
```

## 📝 Next Steps

### Backend'те кылуу керектер:

1. **Django REST API түзүү**
```bash
cd ..
python manage.py startapp api
```

2. **Serializers түзүү** (`core/serializers.py`):
```python
from rest_framework import serializers
from .models import UserProfile, Student, Attendance, etc.

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = '__all__'
```

3. **ViewSets түзүү** (`core/api_views.py`):
```python
from rest_framework import viewsets
from .models import *
from .serializers import *

class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
```

4. **URLs кошуу** (`core/api_urls.py`):
```python
from rest_framework.routers import DefaultRouter
from .api_views import *

router = DefaultRouter()
router.register('users', UserProfileViewSet)

urlpatterns = router.urls
```

5. **CORS орнотуу**:
```bash
pip install django-cors-headers
```

`settings.py`:
```python
INSTALLED_APPS += ['corsheaders']
MIDDLEWARE = ['corsheaders.middleware.CorsMiddleware', ...] + MIDDLEWARE
CORS_ALLOWED_ORIGINS = ['http://localhost:3000']
```

6. **JWT орнотуу**:
```bash
pip install djangorestframework-simplejwt
```

`settings.py`:
```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
}
```

## 🐛 Troubleshooting

### Port busy
```bash
# Kill процесс
lsof -ti:3000 | xargs kill -9
```

### API CORS errors
Django'до `django-cors-headers` орнотуңуз.

### 404 on routes
React Router `BrowserRouter` колдонгондуктан, Django'до catch-all route керек:
```python
# urls.py
urlpatterns += [
    re_path(r'^.*', TemplateView.as_view(template_name='index.html'))
]
```

## 📚 Документация

- [React](https://react.dev)
- [Vite](https://vitejs.dev)
- [React Router](https://reactrouter.com)
- [Axios](https://axios-http.com)
- [Chart.js](https://www.chartjs.org)

## ✅ Checklist

- [x] React project structure
- [x] Authentication (JWT)
- [x] i18n (ky/ru/en)
- [x] Protected routes
- [x] Layout component
- [x] All pages (Login, Dashboard, Schedule, Profile, Notifications, LeaveRequests)
- [x] Comprehensive CSS
- [ ] Backend REST API
- [ ] API integration testing
- [ ] Production build

---

**Түзүлгөн:** 2024
**Тил:** Кыргызча, Орусча, Англисче
**Frontend:** React 18 + Vite
**Backend:** Django 4.2 + DRF
