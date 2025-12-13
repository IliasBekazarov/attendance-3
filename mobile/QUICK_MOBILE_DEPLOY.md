# 🚀 Mobile App - Тез жол (Quick Start)

## Android APK түзүү (5 мүнөт)

### 1. EAS CLI орнотуу:
```bash
npm install -g eas-cli
```

### 2. Expo аккаунт (бекер):
```bash
eas login
# Эгер аккаунт жок болсо: eas register
```

### 3. Project конфигурациясы:
```bash
cd /Users/k_beknazarovicloud.com/Desktop/attandance_su/mobile
eas init
```

### 4. Android APK build (бекер, cloud'до):
```bash
eas build --platform android --profile preview
```

⏱️ **10-15 мүнөт күтүңүз...**

Build аяктаганда:
- ✅ Download ссылка берилет
- ✅ APK файлын жүктөгүлө
- ✅ Google Drive/Dropbox'ка салып, башкаларга таркатыгыла

---

## APK телефонго орнотуу:

### Android телефонуңузда:
1. APK файлын жүктөгүлө
2. **Settings** → **Security** → **Install unknown apps**
3. Chrome (же башка браузер) үчүн permission бергиле
4. APK файлын ачып **Install** басыгыла
5. **Open** басып колдонгула! 🎉

---

## iOS (Expo Go аркылуу - бекер):

### Эгер iOS build керек эмес болсо:

```bash
cd mobile
npm start
```

iOS телефонуңузда:
1. **Expo Go** app'ти орнотуңуз (App Store'дон)
2. QR code'ду scan кылыңыз
3. App ачылат! 🎉

---

## Альтернатива: Web аркылуу тестирлөө

```bash
cd mobile
npm run web
```

Браузерде `http://localhost:8081` ачылат.

---

## 📦 APK таркатуу варианттары:

1. **Google Drive** - Файлды жүктөп, ссылканы бергиле
2. **Dropbox** - Публичный ссылка
3. **Telegram/WhatsApp** - Файлды жөнөтүгүлө
4. **GitHub Releases** - Professional тарзда
5. **Firebase App Distribution** - Автоматтык update'тер менен

---

## ⚡ Бир команда менен:

```bash
cd mobile && eas build -p android --profile preview
```

Ошончо! 🎉

Толук нускама: `MOBILE_DEPLOYMENT.md`
