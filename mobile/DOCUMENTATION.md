# 📱 Mobile App - Толук Документация

## Жалпы маалымат

React Native жана Expo менен иштелген, Django REST API менен интеграцияланган мобилдик тиркеме.

## 📦 Орнотулган Packages

```json
{
  "expo": "~50.0.0",
  "react": "18.2.0",
  "react-native": "0.73.0",
  "@react-navigation/native": "^6.1.9",
  "@react-navigation/stack": "^6.3.20",
  "@react-navigation/bottom-tabs": "^6.5.11",
  "axios": "^1.6.2",
  "@react-native-async-storage/async-storage": "^1.21.0",
  "expo-linear-gradient": "~13.0.2",
  "react-native-screens": "~3.29.0",
  "react-native-safe-area-context": "4.8.2",
  "react-native-gesture-handler": "~2.14.0"
}
```

## 🏗 Архитектура

### Файл структурасы

```
mobile/
├── App.js                              # Түп компонент, NavigationContainer
├── app.json                            # Expo конфигурациясы, API URL
├── babel.config.js                     # Babel конфигурациясы
├── package.json                        # Dependencies жана scripts
├── .gitignore                          # Git ignore файлы
├── .env.example                        # Environment variables үлгүсү
├── README.md                           # Негизги документация
├── TROUBLESHOOTING.md                  # Көйгөйлөрдү чечүү гиди
└── src/
    ├── context/
    │   └── AuthContext.js              # Authentication state management
    ├── navigation/
    │   └── AppNavigator.js             # Navigation structure
    ├── screens/
    │   ├── LoginScreen.js              # Login экраны
    │   ├── DashboardScreen.js          # Dashboard/Башкы бет
    │   ├── ScheduleScreen.js           # Сабак расписаниеси
    │   ├── ProfileScreen.js            # Колдонуучу профили
    │   ├── AttendanceScreen.js         # Катышууну белгилөө (Teacher)
    │   ├── LeaveRequestsScreen.js      # Ооруга арыздар
    │   └── NotificationsScreen.js      # Билдирмелер
    └── services/
        └── api.js                       # Axios конфигурациясы, API service
```

## 🔐 Authentication Flow

### 1. AuthContext.js
- **Максаты:** Глобалдык authentication state башкаруу
- **State:**
  - `user`: Учурдагы колдонуучу маалыматы
  - `token`: JWT access token
  - `loading`: Жүктөлүү абалы
  - `isAuthenticated`: Аутентификация статусу

- **Методдор:**
  - `login(username, password)`: Кирүү
  - `logout()`: Чыгуу
  - `refreshToken()`: Token жаңылоо
  - `updateUser(userData)`: Колдонуучу маалыматын жаңылоо

- **Storage:**
  - AsyncStorage менен `userToken`, `refreshToken`, `userData` сакталат
  - Тиркеме ачылганда автоматтык түрдө restore болот

### 2. api.js
- **Axios instance:** Base URL жана interceptors менен
- **Request Interceptor:**
  - Бардык сурамдарга `Authorization: Bearer {token}` header кошот
  - AsyncStorage'ден token алат

- **Response Interceptor:**
  - 401 (Unauthorized) катасын кармайт
  - Refresh token менен жаңылайт
  - Эгер refresh token да эскирсе, logout кылат

### 3. Login процесси
```
1. User username жана password киргизет
2. LoginScreen POST /api/auth/login/ чакырат
3. Backend access жана refresh tokens кайтарат
4. Tokens AsyncStorage'де сакталат
5. User маалыматы AuthContext'ке жазылат
6. AppNavigator Main Screen'ге навигациялайт
```

## 📱 Экрандар детали

### 1. LoginScreen.js
**Функциялар:**
- Username жана password input
- Form validation
- Loading state
- Error handling
- LinearGradient фон (#667eea → #764ba2)
- Кыргызча интерфейс

**API Calls:**
- `POST /api/auth/login/`

### 2. DashboardScreen.js
**Функциялар:**
- Role-based statistics display
- Pull to refresh
- Gradient header
- User greeting

**Role-specific views:**
- **Admin/Manager:** Студенттер, мугалимдер, группалар, предметтер саны; Бүгүнкү катышуу статистикасы
- **Student:** Катышуу пайызы, келген/келбеген күндөр
- **Parent:** Балдардын тизмеси жана катышуу статистикасы
- **Teacher:** Бүгүнкү сабактар, студенттер саны

**API Calls:**
- `GET /api/v1/dashboard/stats/`

### 3. ScheduleScreen.js
**Функциялар:**
- Жумалык сабак расписаниеси
- Күндөр боюнча группаланган
- Катышуу статусу display (✅❌⏰⚪)
- Parent үчүн child selector (Picker)
- Pull to refresh
- Empty state handling

**Катышуу статусу түстөрү:**
- ✅ Келген (Present): `#28a745` (жашыл)
- ❌ Келбеген (Absent): `#dc3545` (кызыл)
- ⏰ Кечикти (Late): `#ffc107` (сары)
- ⚪ Белгиленбеген: `#6c757d` (сур)

**API Calls:**
- `GET /api/v1/dashboard/stats/` (parent үчүн балдар тизмеси)
- `GET /api/v1/schedules/` (query params: `child_id`, `group_id`)

### 4. ProfileScreen.js
**Функциялар:**
- User маалымат display (full_name, email, phone, address, username)
- Edit mode
- Form validation
- Save changes
- Logout button
- Avatar with initial letter
- Gradient header

**API Calls:**
- `PATCH /api/v1/profile/update/`

### 5. AttendanceScreen.js (Teacher only)
**Функциялар:**
- Бүгүнкү сабактар тизмеси
- Modal attendance marking interface
- Student list with status buttons
- Legend (Келген/Келбеген/Кечикти)
- Quick marking (tap to toggle)
- Save attendance
- Pull to refresh

**API Calls:**
- `GET /api/v1/schedules/teacher-today/`
- `GET /api/v1/groups/{id}/students/`
- `GET /api/v1/attendance/schedule/{id}/`
- `POST /api/v1/attendance/mark/{id}/`

### 6. LeaveRequestsScreen.js (Student/Parent)
**Функциялар:**
- Бардык ооруга арыздар тизмеси
- Status badges (Күтүлүүдө/Кабыл алынды/Четке кагылды)
- Admin комментарийлери display
- Жаңы арыз түзүү modal
- Date range жана reason input
- Form validation
- Pull to refresh

**API Calls:**
- `GET /api/v1/leave-requests/`
- `POST /api/v1/leave-requests/`

### 7. NotificationsScreen.js
**Функциялар:**
- Бардык билдирмелер тизмеси
- Unread badge жана count
- Tap to mark as read
- Mark all as read button
- Notification types with icons:
  - ✅ ATTENDANCE
  - 📝 LEAVE_REQUEST
  - 📅 SCHEDULE
  - 📢 ANNOUNCEMENT
  - 📊 GRADE
  - 📬 Default
- Pull to refresh

**API Calls:**
- `GET /api/v1/notifications/`
- `PATCH /api/v1/notifications/{id}/read/`
- `POST /api/v1/notifications/mark-all-read/`

## 🧭 Navigation Structure

### AppNavigator.js

```
NavigationContainer
└── Stack Navigator
    ├── Login Screen (if not authenticated)
    └── Main Screen (if authenticated)
        └── Bottom Tab Navigator
            ├── Dashboard Tab (🏠 Башкы бет) - Бардыгы үчүн
            ├── Schedule Tab (📅 Расписание) - Бардыгы үчүн
            ├── Attendance Tab (✓ Катышуу) - TEACHER гана
            ├── Leave Requests Tab (📝 Арыздар) - STUDENT, PARENT гана
            ├── Notifications Tab (🔔 Билдирмелер) - Бардыгы үчүн
            └── Profile Tab (👤 Профиль) - Бардыгы үчүн
```

**Role-based tab visibility:**
- TEACHER: Dashboard, Schedule, Attendance, Notifications, Profile
- STUDENT: Dashboard, Schedule, Leave Requests, Notifications, Profile
- PARENT: Dashboard, Schedule, Leave Requests, Notifications, Profile
- ADMIN/MANAGER: Dashboard, Schedule, Notifications, Profile

## 🎨 Styling Guidelines

### Түстөр
```javascript
const COLORS = {
  primary: '#667eea',
  primaryDark: '#764ba2',
  success: '#28a745',
  danger: '#dc3545',
  warning: '#ffc107',
  info: '#17a2b8',
  light: '#f5f5f5',
  dark: '#333',
  gray: '#666',
  lightGray: '#999',
  border: '#ddd',
  white: '#fff',
};
```

### Gradients
- Primary gradient: `['#667eea', '#764ba2']`
- Headers үчүн колдонулат

### Typography
- Header: `24-28px`, bold
- Body: `14-16px`, regular
- Small: `12px`, regular
- Labels: `12-14px`, color: gray

### Spacing
- Container padding: `15px`
- Card padding: `15px`
- Card margin: `15px`
- Item spacing: `10-15px`

### Border Radius
- Cards: `12px`
- Buttons: `8px`
- Badges: `12-20px`
- Inputs: `8px`

### Shadows
```javascript
{
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,  // Android
}
```

## 🔌 API Integration

### Base Configuration (api.js)
```javascript
const API_BASE_URL = Constants.expoConfig.extra.API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Request Flow
```
1. Component calls API method (e.g., api.get('/v1/schedules/'))
2. Request interceptor adds Authorization header
3. Request sent to backend
4. Response interceptor checks status
5. If 401, refresh token automatically
6. Data returned to component
7. Component updates state
```

### Error Handling
```javascript
try {
  const response = await api.get('/endpoint/');
  setData(response.data);
} catch (error) {
  if (error.response) {
    // Backend returned error response
    Alert.alert('Ката', error.response.data.detail || 'Каталык кетти');
  } else if (error.request) {
    // No response received
    Alert.alert('Ката', 'Серверге жетүү мүмкүн болбоду');
  } else {
    // Other errors
    Alert.alert('Ката', error.message);
  }
}
```

## 🔄 State Management

### Local State (useState)
- Component-level data
- Form inputs
- Loading states
- Modal visibility

### Global State (Context)
- Authentication (AuthContext)
- User data
- Token management

### Data Flow
```
1. Component mounts → useEffect runs
2. API call → Loading state true
3. Response received → Update state
4. Component re-renders → Display data
5. Loading state false
```

## 🧪 Testing Strategy

### Manual Testing Checklist

**Authentication:**
- [x] Login with valid credentials
- [x] Login with invalid credentials
- [x] Token refresh on 401
- [x] Logout
- [x] Auto-login on app restart

**Dashboard:**
- [x] Admin stats display
- [x] Student stats display
- [x] Parent children list
- [x] Teacher stats display
- [x] Pull to refresh

**Schedule:**
- [x] Load weekly schedule
- [x] Display attendance status
- [x] Parent child selector
- [x] Empty state
- [x] Pull to refresh

**Profile:**
- [x] Display user info
- [x] Edit mode
- [x] Save changes
- [x] Cancel editing
- [x] Logout

**Attendance (Teacher):**
- [x] Load today's classes
- [x] Open marking modal
- [x] Mark attendance (P/A/L)
- [x] Save attendance
- [x] Pull to refresh

**Leave Requests:**
- [x] Display requests
- [x] Create new request
- [x] Form validation
- [x] View admin comments
- [x] Pull to refresh

**Notifications:**
- [x] Display all notifications
- [x] Unread count
- [x] Mark as read
- [x] Mark all as read
- [x] Pull to refresh

## 🚀 Deployment

### Development
```bash
npm start
expo start
```

### Production Build

**Android APK:**
```bash
eas build -p android --profile production
```

**iOS:**
```bash
eas build -p ios --profile production
```

### App Store / Google Play
1. Create app icons and splash screens
2. Configure app.json with correct metadata
3. Build production versions
4. Submit to stores

## 📊 Performance Optimization

### Best Practices
1. **Lazy Loading:** Import screens dynamically
2. **Memoization:** Use `React.memo` for expensive components
3. **FlatList:** Use for long lists instead of ScrollView
4. **Image Optimization:** Compress and cache images
5. **Debouncing:** For search inputs
6. **Error Boundaries:** Catch React errors

### Code Splitting
```javascript
const DashboardScreen = lazy(() => import('./screens/DashboardScreen'));
```

### Caching
- AsyncStorage for persistent data
- API response caching (consider React Query)

## 🔒 Security

### Best Practices
1. **Token Storage:** AsyncStorage is secure on both iOS and Android
2. **HTTPS:** Use HTTPS in production
3. **Input Validation:** Validate all user inputs
4. **Error Messages:** Don't expose sensitive info
5. **Token Refresh:** Automatic refresh before expiry

### Never commit:
- `.env` files with real credentials
- API keys
- Tokens

## 📚 Dependencies Details

### Core
- **expo:** Development platform
- **react-native:** UI framework

### Navigation
- **@react-navigation/native:** Navigation framework
- **@react-navigation/stack:** Stack navigation
- **@react-navigation/bottom-tabs:** Bottom tabs

### Networking
- **axios:** HTTP client

### Storage
- **@react-native-async-storage/async-storage:** Persistent storage

### UI
- **expo-linear-gradient:** Gradient backgrounds
- **react-native-screens:** Native screen management
- **react-native-safe-area-context:** Safe area handling
- **react-native-gesture-handler:** Gesture support

## 📝 Келечектеги өнүгүү

### Planned Features
1. **Offline Mode:** Cache data for offline use
2. **Push Notifications:** Firebase Cloud Messaging
3. **Biometric Auth:** Fingerprint/Face ID
4. **Dark Mode:** Theme switching
5. **Multi-language:** English, Russian support
6. **Charts:** Attendance statistics charts
7. **Photo Upload:** Profile photo upload
8. **Calendar View:** Interactive calendar
9. **Search:** Global search functionality
10. **Filters:** Advanced filtering

### Technical Improvements
1. **TypeScript:** Type safety
2. **Redux/MobX:** Advanced state management
3. **React Query:** Better data fetching
4. **Unit Tests:** Jest + React Testing Library
5. **E2E Tests:** Detox
6. **CI/CD:** Automated testing and deployment
7. **Monitoring:** Sentry error tracking
8. **Analytics:** Firebase Analytics

---

**Версия:** 1.0.0  
**Акыркы жаңылоо:** 2024  
**Автор:** Attendance System Team
