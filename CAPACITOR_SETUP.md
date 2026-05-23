# WCA Hub — App Nativa con Capacitor

## Setup (una sola vez)

```bash
# Instalar Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios
npm install @capacitor/push-notifications @capacitor/splash-screen @capacitor/status-bar

# Inicializar (ya configurado en capacitor.config.json)
npx cap init "WCA Hub" "com.worldconnectacademy.hub" --web-dir dist

# Agregar plataformas
npx cap add android
npx cap add ios          # Solo en macOS con Xcode instalado
```

## Flujo de desarrollo

```bash
# Compilar y sincronizar
npm run cap:build        # = npm run build + npx cap copy

# Abrir en Android Studio
npm run cap:android

# Abrir en Xcode (solo macOS)
npm run cap:ios

# Sincronizar plugins nativos (después de npm install de plugins)
npm run cap:sync
```

## Push Notifications

Configurar en Firebase Console:
1. Crear proyecto Firebase → wcahub
2. Descargar google-services.json → android/app/
3. En Supabase Edge Function, usar Firebase Admin SDK para enviar push

## Variables de entorno nativas

En android/app/src/main/res/values/strings.xml:
```xml
<string name="app_name">WCA Hub</string>
```

## Publicar en Play Store

1. `npm run build` → genera dist/
2. `npx cap copy android`
3. En Android Studio: Build → Generate Signed Bundle/APK
4. Upload a Play Console

## Publicar en App Store (macOS requerido)

1. `npm run build`
2. `npx cap copy ios`
3. En Xcode: Product → Archive → Distribute App
