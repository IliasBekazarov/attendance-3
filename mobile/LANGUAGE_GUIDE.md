# Language Mode Guide

## Overview
The mobile app now supports 3 languages:
- **English (en)**
- **Russian (ru)** - Русский
- **Kyrgyz (ky)** - Кыргызча

## Features

### 1. Language Context
Located in `src/context/LanguageContext.js`, this provides:
- Language state management
- Translation function (`t()`)
- Language switching functionality
- Persistent language storage using AsyncStorage

### 2. Available Translations
The following translation keys are available:

#### Common
- save, cancel, edit, delete, confirm
- loading, error, success, yes, no

#### Authentication
- login, logout, username, password
- currentPassword, newPassword, confirmPassword

#### Navigation
- dashboard, schedule, attendance, profile
- leaveRequests, notifications

#### Profile
- personalInfo, firstName, lastName, phoneNumber
- address, emergencyContact, changePassword, changeUsername

#### And many more...

## How to Use

### In React Components

```javascript
import { useLanguage } from '../context/LanguageContext';

const MyComponent = () => {
  const { t, language, changeLanguage } = useLanguage();
  
  return (
    <View>
      <Text>{t('welcome')}</Text>
      <Text>{t('username')}</Text>
    </View>
  );
};
```

### Changing Language

Users can change language from:
1. **Profile Screen** - Click on the language setting
2. A modal will appear with available languages
3. Select desired language
4. Language preference is saved automatically

### Adding New Translations

To add new translation keys:

1. Open `src/context/LanguageContext.js`
2. Add your key to all three language objects (en, ru, ky):

```javascript
const translations = {
  en: {
    myNewKey: 'My Translation',
    // ... other keys
  },
  ru: {
    myNewKey: 'Мой перевод',
    // ... other keys
  },
  ky: {
    myNewKey: 'Менин котормом',
    // ... other keys
  }
};
```

3. Use it in your component:
```javascript
<Text>{t('myNewKey')}</Text>
```

## Implementation Details

### Storage
- Language preference is stored in AsyncStorage with key `@app_language`
- Default language is Kyrgyz (ky)
- Language persists across app restarts

### Context Provider
The LanguageProvider wraps the entire app in `App.js`:

```javascript
<LanguageProvider>
  <NavigationContainer>
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  </NavigationContainer>
</LanguageProvider>
```

## Updated Screens

The following screens have been updated with translations:
- ✅ LoginScreen
- ✅ ProfileScreen (includes language selector)
- ✅ DashboardScreen
- ✅ ScheduleScreen
- ✅ AttendanceScreen
- ✅ LeaveRequestsScreen
- ✅ NotificationsScreen
- ✅ AppNavigator (Tab names)

## Best Practices

1. **Always use translation keys** - Never hardcode text in UI components
2. **Keep keys descriptive** - Use clear, semantic key names
3. **Maintain consistency** - Ensure all three languages have the same keys
4. **Test all languages** - Switch between languages to verify translations
5. **Use fallback** - If a key is missing, the key itself will be displayed

## Example Usage in Different Screens

### Login Screen
```javascript
Alert.alert(t('error'), t('enterUsername'));
<Text>{t('username')}</Text>
<Text>{t('password')}</Text>
```

### Profile Screen
```javascript
<Text>{t('personalInfo')}</Text>
<Text>{t('settings')}</Text>
<Text>{t('language')}</Text>
```

## Future Enhancements

- [ ] Add more languages (Turkish, Chinese, etc.)
- [ ] Dynamic translations from backend
- [ ] RTL language support
- [ ] Translation management UI for admins
- [ ] Export/Import translation files

## Troubleshooting

**Language not changing?**
- Check if AsyncStorage is working properly
- Verify the language code is correct ('en', 'ru', or 'ky')
- Check console for errors

**Missing translations?**
- Ensure the key exists in all three language objects
- Check for typos in key names
- The key itself will display if translation is missing

**AsyncStorage issues?**
- Clear app data and reinstall if persistent
- Check permissions for AsyncStorage

## Dependencies

- `@react-native-async-storage/async-storage` - v1.21.0 (already installed)
