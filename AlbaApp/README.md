# Alba App - Cross-Platform Mobile App

A React Native app built with Expo that works on both iOS and Android, with full Xcode integration.

## 🚀 Features

- **Cross-platform**: Write once, run on iOS and Android
- **Xcode integration**: Can be opened and run directly in Xcode
- **TypeScript**: Full TypeScript support for better development experience
- **Modern UI**: Clean, responsive design with native feel
- **Navigation**: Simple screen-based navigation system

## 📱 What's Included

- **Home Screen**: Welcome page with navigation buttons
- **Counter Demo**: Interactive counter with increment/decrement/reset
- **About Screen**: Information about the app and its features

## 🛠️ Development Setup

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Xcode (for iOS development)
- Android Studio (for Android development, optional)

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd AlbaApp
   npm install
   ```

2. **Install Expo CLI globally (optional):**
   ```bash
   npm install -g @expo/cli
   ```

## 🎯 Running the App

### Option 1: Expo Go (Easiest for testing)

1. **Install Expo Go** on your phone from App Store/Google Play
2. **Start the development server:**
   ```bash
   npm start
   ```
3. **Scan the QR code** with Expo Go app

### Option 2: iOS Simulator (Xcode)

1. **Open in Xcode:**
   ```bash
   open ios/AlbaApp.xcworkspace
   ```
2. **Select a simulator** (iPhone 14, etc.)
3. **Click the Play button** ▶️ to build and run

### Option 3: Physical iOS Device

1. **Open in Xcode** (as above)
2. **Connect your iPhone** via USB
3. **Select your device** from the device list
4. **Click Play button** ▶️

### Option 4: Android

1. **Start Android emulator** or connect Android device
2. **Run:**
   ```bash
   npm run android
   ```

## 🔧 Development Workflow

### Making Changes

1. **Edit `App.tsx`** or create new components
2. **Save the file** - changes will hot reload automatically
3. **Test on device/simulator**

### Adding New Screens

1. **Create a new screen component** in `App.tsx`
2. **Add navigation logic** to the `renderScreen` function
3. **Add navigation buttons** to existing screens

### Adding Dependencies

```bash
# Expo-compatible packages
npx expo install package-name

# Regular npm packages
npm install package-name
```

## 📁 Project Structure

```
AlbaApp/
├── App.tsx              # Main app component
├── app.json            # Expo configuration
├── package.json        # Dependencies
├── tsconfig.json       # TypeScript configuration
├── ios/                # iOS native code (Xcode project)
│   ├── AlbaApp.xcworkspace  # Open this in Xcode
│   └── AlbaApp.xcodeproj    # Xcode project file
├── android/            # Android native code
└── assets/             # Images, fonts, etc.
```

## 🚀 Building for Production

### iOS App Store

1. **Open in Xcode**
2. **Select "Any iOS Device"** as target
3. **Product → Archive**
4. **Follow App Store submission process**

### Android Play Store

```bash
npx expo build:android
```

## 🔍 Troubleshooting

### Common Issues

1. **Metro bundler issues:**
   ```bash
   npx expo start --clear
   ```

2. **iOS build errors:**
   - Clean build folder in Xcode
   - Delete derived data
   - Reinstall pods: `cd ios && pod install`

3. **Android build errors:**
   - Clean project: `cd android && ./gradlew clean`
   - Rebuild: `npm run android`

### Getting Help

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Discord](https://discord.gg/expo)

## 📱 Next Steps

- Add more screens and navigation
- Integrate with backend APIs
- Add authentication
- Implement push notifications
- Add offline support
- Customize UI/UX design

## 🎉 Enjoy Building!

Your Alba App is now ready for development. You can:
- Run it on iOS simulator/device via Xcode
- Test on Android emulator/device
- Develop with hot reload for fast iteration
- Deploy to app stores when ready

Happy coding! 🚀
