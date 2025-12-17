# Attendance System - Deплой нускамасы

## 🚀 Проблеманын чечими

### Проблема 1: Тил котормосу толук иштебейт
**Чечилди ✅**
- Schedule.jsx файлында катуу код менен жазылган текстти `t()` функциясы аркылуу которууга которулду
- LanguageContext.jsx файлына күндөрдүн котормосу кошулду (Monday, Tuesday, ж.б.)
- Бардык UI элементтери (модалдар, батырчалар, билдирүүлөр) тил котормосуна байланыштырылды

### Проблема 2: Студенттер расписаниесин көрө алышпайт (Production'до)
**Чечилди ✅**
- Rendering шарттары оңдолду (`selectedGroup && Object.keys(scheduleData).length > 0`)
- API маалыматтары туура келип жатканы console логдон тастыкталды
- Frontend production build үчүн даяр

## 📝 Vercel жана PythonAnywhere үчүн Deплой

### 1. Backend (PythonAnywhere)

#### 1.1 PythonAnywhere'де CORS settings'ти орнотуу
Backend `settings.py` файлында:

```python
# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://your-frontend-domain.vercel.app",  # Өзүңүздүн Vercel доменин кошуңуз
]

CORS_ALLOW_CREDENTIALS = True
```

#### 1.2 Static files'ти жыйноо
```bash
python manage.py collectstatic --no-input
```

### 2. Frontend (Vercel)

#### 2.1 Production API URL'ди орнотуу
`.env.production` файлын түзүңүз жана өзүңүздүн backend URL'ди жазыңыз:

```bash
VITE_API_URL=https://your-username.pythonanywhere.com/api
```

Мисалы:
```bash
VITE_API_URL=https://iliasbeknazarov.pythonanywhere.com/api
```

#### 2.2 Vercel'ге деплой
```bash
# 1. Build кылуу (опционалдуу, Vercel автоматтык түрдө build кылат)
npm run build

# 2. Vercel CLI аркылуу деплой
vercel --prod
```

же Vercel Dashboard аркылуу:
1. GitHub репозиторийди Vercel'ге байланыштырыңыз
2. Environment Variables бөлүмүндө `VITE_API_URL`ди орнотуңуз
3. Deploy басыңыз

#### 2.3 Vercel Environment Variables
Vercel Dashboard > Settings > Environment Variables:
- Key: `VITE_API_URL`
- Value: `https://your-username.pythonanywhere.com/api`

### 3. Тестирование

После деплоя текшерүү:

1. **Frontend**: `https://your-app.vercel.app` ачыңыз
2. **Login**: Логин жана пароль менен кириңиз
3. **API Connection**: Browser DevTools > Network табын ачып, API запростор келип жатканын текшериңиз
4. **CORS**: Эгер CORS катасы чыкса, backend settings.py файлында Vercel доменди кошуңуз

### 4. Кеңештер

#### Browser Cache
Эгер өзгөртүүлөр көрүнбөсө:
1. Browser cache'ти тазалаңыз (Ctrl+Shift+Delete)
2. Hard refresh жасаңыз (Ctrl+Shift+R же Cmd+Shift+R)
3. Incognito/Private mode'до ачып көрүңүз

#### API Endpoint тестирование
Backend'дин иштеп жатканын текшерүү:
```bash
# Browser'де же Postman'де
https://your-username.pythonanywhere.com/api/v1/schedules/

# Authorization Header
Bearer your-access-token
```

#### Debug Mode
Локалдык тестирование үчүн:

Frontend:
```bash
cd frontend
npm run dev
```

Backend:
```bash
cd backend
python manage.py runserver
```

### 5. Көп кездешкен каталар

#### Ката 1: "Network Error" же "Failed to fetch"
**Чечим**: 
- Backend'дин иштеп жатканын текшериңиз
- CORS settings'ти текшериңиз
- VITE_API_URL туура жазылганын текшериңиз

#### Ката 2: "401 Unauthorized"
**Чечим**:
- Token'дин туура сакталганын текшериңиз (localStorage)
- Backend'де JWT settings'ти текшериңиз

#### Ката 3: Расписание көрсөтүлбөйт
**Чечим**:
- Console логдорун текшериңиз (F12 > Console)
- API'дан маалымат келип жатабы? (Network tab)
- scheduleData state'и толтурулганбы? (React DevTools)

## 📚 Колдонулган технологиялар

### Frontend
- React + Vite
- Axios
- React Router
- Context API

### Backend
- Django
- Django REST Framework
- JWT Authentication

## 🔗 Пайдалуу шилтемелер

- [Vercel Documentation](https://vercel.com/docs)
- [PythonAnywhere Documentation](https://help.pythonanywhere.com/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

## ✅ Ийгиликтүү деплой белгилери

1. ✅ Login бети ачылат
2. ✅ Login кылууга болот
3. ✅ Dashboard көрсөтүлөт
4. ✅ Расписание жүктөлөт жана көрсөтүлөт
5. ✅ Тил котормосу иштейт (Кыргызча, Орусча, Англисче)
6. ✅ Бардык ролдор (Admin, Teacher, Student, Parent) иштейт

## 📞 Колдоо

Эгер проблемалар болсо, төмөнкү нерселерди текшериңиз:
1. Browser console логдору (F12 > Console)
2. Network запростор (F12 > Network)
3. Backend логдору (PythonAnywhere error logs)
4. Environment variables туура орнотулганбы

---

**Түзөтүүлөр жасалды**: 17-Декабрь 2025
**Версия**: 2.0
