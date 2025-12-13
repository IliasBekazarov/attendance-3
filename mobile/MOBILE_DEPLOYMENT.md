# 📱 Mobile App Deployment Guide

## Бекер Android APK жана iOS IPA түзүү жана таркатуу

### 📋 Мазмуну
1. [EAS Build Setup](#eas-build-setup)
2. [Android APK Build](#android-apk-build)
3. [iOS Build](#ios-build)
4. [APK Distribution](#apk-distribution)

---

## 🔧 EAS Build Setup

### 1-Кадам: EAS CLI орнотуу

```bash
npm install -g eas-cli
```

### 2-Кадам: Expo аккаунт

```bash
# Expo аккаунт бар болсо:
eas login

# Жок болсо:
eas register
```

### 3-Кадам: EAS Project конфигурациясы

```bash
cd mobile
eas init
```

Eas init оюндун project ID берет. Автоматтык түрдө `app.json` жаңырат.

---

## 🤖 Android APK Build

### Вариант 1: Expo EAS Build (Cloud - Сунушталат)

#### 1. Build баштоо:
```bash
cd mobile
eas build --platform android --profile preview
```

Бул:
- ✅ Cloud'до build кылат (локалдык компьютерде күчтүү процессор керек эмес)
- ✅ 10-15 мүнөт ичинде APK даяр болот
- ✅ Download link берет

#### 2. APK жүктөө:
Build аяктаганда:
- Браузерде ссылка ачылат
- Же `https://expo.dev/accounts/[username]/projects/attendance-system-mobile/builds`

#### 3. APK телефонго орнотуу:
- Android телефонго APK файлын жүктөгүлө
- Settings → Security → "Install from unknown sources" кошугула
- APK файлын ачып Install басыгыла

### Вариант 2: Local Build (Локалдык)

```bash
cd mobile
eas build --platform android --profile preview --local
```

⚠️ Бул локалдык компьютерде build кылат. Java JDK жана Android SDK керек.

### Бекер APK Distribution варианттары:

1. **Google Drive**: APK'ны Google Drive'га жүктөп, ссылканы бергиле
2. **Dropbox**: Публичный ссылка аркылуу таркатыгыла
3. **GitHub Releases**: 
   ```bash
   # GitHub репозиторийиңизде Releases түзгүлө
   git tag v1.0.0
   git push origin v1.0.0
   # GitHub'да Release түзүп, APK файлын attach кылгыла
   ```
4. **Firebase App Distribution** (Бекер):
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase appdistribution:distribute app-release.apk
   ```

---

## 🍎 iOS Build

### ⚠️ iOS build үчүн керектелет:
- Apple Developer аккаунт ($99/жыл)
- Mac компьютер (же Cloud Mac service)

### Бекер альтернативалар:

#### 1. Expo Go аркылуу (Тестирлөө үчүн):
```bash
expo start
```
iOS телефонуңузда Expo Go app'ти орнотуп, QR code scan кылгыла.

#### 2. TestFlight (Apple Developer аккаунт менен):
```bash
eas build --platform ios --profile preview
```

#### 3. iOS Simulator (Mac'те тестирлөө):
```bash
eas build --platform ios --profile preview
```

---

## 📦 APK/IPA файлдарды таркатуу

### Android APK:

#### 1. **Direct Download** (Эң жөнөкөй):
```
1. APK файлын Google Drive/Dropbox'ка жүктөгүлө
2. Публичный ссылка түзгүлө
3. Колдонуучуларга ссылканы жөнөтүгүлө
4. Алар телефондорунда жүктөп, орнотушат
```

#### 2. **QR Code** (Ыңгайлуу):
```bash
# QR code генератор сайты:
# https://www.qr-code-generator.com/
# APK download ссылкаңызды QR code'ка айландырыгыла
# Колдонуучулар QR scan кылып жүктөйт
```

#### 3. **GitHub Releases**:
```bash
# 1. GitHub репозиторийиңизде:
git tag v1.0.0
git push origin v1.0.0

# 2. GitHub'да Releases tab'ка киргиле
# 3. "Create a new release" басыгыла
# 4. APK файлын attach кылгыла
# 5. Publish!
```

#### 4. **Firebase App Distribution** (Профессионал):
```bash
# 1. Firebase орнотуу:
npm install -g firebase-tools

# 2. Firebase'ке login:
firebase login

# 3. Project түзүү:
firebase init

# 4. APK таркатуу:
firebase appdistribution:distribute attendance-system.apk \
  --app YOUR_APP_ID \
  --groups testers

# 5. Колдонуучулар email аркылуу invite алышат
```

---

## 🚀 Толук Deployment Process

### Step-by-Step:

```bash
# 1. Mobile папкасына киргиле:
cd /Users/k_beknazarovicloud.com/Desktop/attandance_su/mobile

# 2. EAS login:
eas login

# 3. EAS project инициализациялоо:
eas init

# 4. Android APK build:
eas build --platform android --profile preview

# 5. Build аяктаганда (10-15 мүнөт):
# - Download link ачылат
# - APK файлын жүктөгүлө

# 6. APK'ны таркатыгыла (Google Drive же башка)

# 7. Колдонуучуларга нускама:
# - APK файлын жүктөгүлө
# - "Install from unknown sources" кошугула
# - APK'ны орнотугула
```

---

## 🔄 Update процесси

### Жаңы версия чыгаруу:

```bash
# 1. app.json'до версияны жаңыртыгыла:
# "version": "1.0.0" → "1.1.0"
# "versionCode": 1 → 2 (Android)

# 2. Кайра build:
eas build --platform android --profile preview

# 3. Жаңы APK'ны таркатыгыла
```

---

## 📱 App Icon жана Splash Screen

### Icon жана Splash Screen түзүү:

```bash
# 1. Icon (1024x1024 PNG):
# mobile/assets/icon.png

# 2. Splash Screen (1242x2436 PNG):
# mobile/assets/splash.png

# 3. Adaptive Icon (Android, 1024x1024 PNG):
# mobile/assets/adaptive-icon.png
```

**Icon жана Splash генератор:**
- https://www.appicon.co/
- https://makeappicon.com/

---

## ⚠️ Маанилүү эскертүүлөр

### Android:

✅ **Артыкчылыктар:**
- Бекер build
- APK аркылуу оңой таркатуу
- Google Play керек эмес (бирок сунушталат)

⚠️ **Эскертүүлөр:**
- "Unknown sources" кошуу керек
- Google Play Protect эскертүү чыгышы мүмкүн

### iOS:

⚠️ **Чектөөлөр:**
- Apple Developer аккаунт керек ($99/жыл)
- Mac керек (же cloud Mac)
- TestFlight же App Store аркылуу гана

✅ **Альтернатива:**
- Expo Go аркылуу тестирлөө (бекер)

---

## 🎯 Сунуштар

### Мыктысы:

1. **Android APK**: EAS Build (Cloud) - Бекер, оңой
2. **Distribution**: Firebase App Distribution - Профессионал
3. **iOS**: Expo Go (тестирлөө) же Apple Developer аккаунт (production)

### Минималдуу:

1. **Android APK**: EAS Build
2. **Distribution**: Google Drive ссылка
3. **iOS**: Expo Go

---

## 🆘 Troubleshooting

### "eas: command not found"
```bash
npm install -g eas-cli
```

### Build failed
```bash
# Logs текшергиле:
eas build:list
# Error деталдарын окугула
```

### APK орнотулбайт
```bash
# Settings → Security → Unknown sources кошугула
# Же Settings → Apps → Special access → Install unknown apps
```

---

## 📞 Колдоо

- Expo EAS: https://docs.expo.dev/build/introduction/
- Firebase: https://firebase.google.com/docs/app-distribution
- GitHub Releases: https://docs.github.com/en/repositories/releasing-projects-on-github

---

## 🎉 Даяр!

```bash
# Бир команда менен Android APK:
cd mobile && eas build --platform android --profile preview
```

15 мүнөттөн кийин APK даяр! 🚀
