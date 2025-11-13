# Mobile Push Notifications Setup Guide

Complete guide for setting up Firebase Cloud Messaging (FCM) in the React Native mobile app.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Firebase Project Setup](#firebase-project-setup)
3. [Install Dependencies](#install-dependencies)
4. [Android Configuration](#android-configuration)
5. [iOS Configuration](#ios-configuration)
6. [App Integration](#app-integration)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Node.js 18+ installed
- React Native development environment setup
- Firebase account
- Android Studio (for Android)
- Xcode (for iOS, Mac only)

---

## Firebase Project Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `parkdog-app` (or your preferred name)
4. Disable Google Analytics (optional)
5. Click "Create project"

### 2. Add Android App

1. In Firebase console, click "Add app" → Android icon
2. Enter package name: `com.parkdog` (must match `android/app/build.gradle`)
3. Download `google-services.json`
4. Save it to `mobile/android/app/google-services.json`
5. Click "Next" → "Next" → "Continue to console"

### 3. Add iOS App

1. In Firebase console, click "Add app" → iOS icon
2. Enter bundle ID: `com.parkdog` (must match Xcode project)
3. Download `GoogleService-Info.plist`
4. Save it to `mobile/ios/GoogleService-Info.plist`
5. Click "Next" → "Next" → "Continue to console"

### 4. Enable Cloud Messaging

1. In Firebase console, go to "Project settings" → "Cloud Messaging"
2. For Android: Note the "Server key" (used for backend)
3. For iOS: Upload APNs authentication key or certificate

---

## Install Dependencies

```bash
cd mobile

# Install React Native Firebase packages
npm install @react-native-firebase/app @react-native-firebase/messaging

# Install Notifee for advanced notifications
npm install @notifee/react-native

# For iOS, install pods
cd ios && pod install && cd ..
```

---

## Android Configuration

### 1. Add `google-services.json`

Place the downloaded `google-services.json` in:
```
mobile/android/app/google-services.json
```

### 2. Update `android/build.gradle`

Add Google Services classpath:

```gradle
buildscript {
    dependencies {
        // ... existing dependencies
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

### 3. Update `android/app/build.gradle`

Add Google Services plugin:

```gradle
apply plugin: 'com.android.application'
apply plugin: 'com.google.gms.google-services'  // Add this line

android {
    // ... existing config
}
```

### 4. Update `AndroidManifest.xml`

Add notification permissions and metadata:

```xml
<manifest>
    <!-- Add permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <application>
        <!-- ... existing config -->

        <!-- Firebase Cloud Messaging -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_icon"
            android:resource="@drawable/ic_notification" />
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_color"
            android:resource="@color/notification_color" />
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_channel_id"
            android:value="messages" />
    </application>
</manifest>
```

### 5. Create Notification Icon

Create a notification icon at:
```
mobile/android/app/src/main/res/drawable/ic_notification.png
```

Add notification color in `android/app/src/main/res/values/colors.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="notification_color">#4CAF50</color>
</resources>
```

---

## iOS Configuration

### 1. Add `GoogleService-Info.plist`

1. Open Xcode project: `mobile/ios/ParkDog.xcworkspace`
2. Drag `GoogleService-Info.plist` into the project
3. Check "Copy items if needed"
4. Select target: ParkDog

### 2. Update `ios/Podfile`

Add Firebase pods:

```ruby
platform :ios, '13.0'

target 'ParkDog' do
  # ... existing pods

  # Firebase
  pod 'Firebase/Messaging'
  pod 'Firebase/Core'
end
```

Run `pod install`:

```bash
cd ios && pod install && cd ..
```

### 3. Update `AppDelegate.m` (or `AppDelegate.mm`)

Add Firebase initialization:

```objc
#import <Firebase.h>  // Add this import
#import <UserNotifications/UserNotifications.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // Initialize Firebase
  [FIRApp configure];

  // Request notification permissions
  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  center.delegate = self;

  // ... rest of existing code
  return YES;
}

// Handle notification when app is in foreground
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
       willPresentNotification:(UNNotification *)notification
         withCompletionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler
{
  completionHandler(UNNotificationPresentationOptionAlert | UNNotificationPresentationOptionBadge | UNNotificationPresentationOptionSound);
}

@end
```

### 4. Enable Push Notifications Capability

1. Open Xcode project
2. Select target → "Signing & Capabilities"
3. Click "+ Capability" → "Push Notifications"
4. Click "+ Capability" → "Background Modes"
5. Check "Remote notifications"

### 5. Upload APNs Key to Firebase

1. Create APNs key in [Apple Developer Portal](https://developer.apple.com/account/resources/authkeys/list)
2. Download the `.p8` file
3. In Firebase console → Project settings → Cloud Messaging → iOS app configuration
4. Upload the APNs key with Key ID and Team ID

---

## App Integration

### 1. Update `App.js`

Initialize push notifications after login:

```javascript
import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import pushNotificationService from './src/services/PushNotificationService';
import chatIntegration from './src/services/chatIntegration';
import { useSelector } from 'react-redux';

function App() {
  const navigationRef = useRef(null);
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    // Set navigation reference for deep linking
    if (navigationRef.current) {
      pushNotificationService.setNavigationRef(navigationRef.current);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Initialize chat system
      chatIntegration.initialize().catch(console.error);

      // Initialize push notifications
      pushNotificationService.initialize(user.id).catch(console.error);
    }

    return () => {
      if (isAuthenticated) {
        // Cleanup on logout
        chatIntegration.cleanup();
        pushNotificationService.cleanup();
      }
    };
  }, [isAuthenticated, user]);

  return (
    <NavigationContainer ref={navigationRef}>
      {/* Your navigation stack */}
    </NavigationContainer>
  );
}

export default App;
```

### 2. Update Logout Handler

Unregister token on logout:

```javascript
import pushNotificationService from '../services/PushNotificationService';

const handleLogout = async () => {
  try {
    // Cleanup push notifications
    await pushNotificationService.cleanup();

    // ... rest of logout logic
  } catch (error) {
    console.error('Logout error:', error);
  }
};
```

---

## Testing

### 1. Test Notification Permissions

Check if permissions are granted:

```javascript
import pushNotificationService from './src/services/PushNotificationService';

// In a settings screen or debug menu
const checkPermissions = async () => {
  const hasPermission = await pushNotificationService.requestPermission();
  console.log('Has permission:', hasPermission);
};
```

### 2. Test Token Registration

Check if token is registered with backend:

```javascript
const testToken = async () => {
  const token = pushNotificationService.getCurrentToken();
  console.log('Current FCM token:', token);

  if (token) {
    await pushNotificationService.testNotification();
  }
};
```

### 3. Test Push Notification

Use Firebase Console to send a test notification:

1. Go to Firebase Console → Cloud Messaging
2. Click "Send your first message"
3. Enter notification title and text
4. Click "Send test message"
5. Enter your FCM token
6. Click "Test"

### 4. Test Deep Linking

Send a notification with custom data:

```json
{
  "notification": {
    "title": "New Message",
    "body": "You have a new message from John"
  },
  "data": {
    "type": "message",
    "conversation_id": "123",
    "sender_id": "456"
  }
}
```

Tap the notification and verify it navigates to the correct screen.

---

## Troubleshooting

### Android Issues

**1. "Default FirebaseApp is not initialized"**

Solution: Ensure `google-services.json` is in `android/app/` and `com.google.gms.google-services` plugin is applied.

**2. Notifications not showing in foreground**

Solution: Use Notifee to display foreground notifications (already implemented in `PushNotificationService.js`).

**3. "SENDER_ID_MISMATCH"**

Solution: Verify `google-services.json` matches the Firebase project and app package name.

### iOS Issues

**1. "Firebase configuration could not be loaded"**

Solution: Ensure `GoogleService-Info.plist` is added to Xcode target and copied to app bundle.

**2. Notifications not received on device**

Solution:
- Check APNs key is uploaded to Firebase Console
- Verify Push Notifications capability is enabled in Xcode
- Test on real device (not simulator)

**3. "User Notifications framework not found"**

Solution: Run `pod install` and rebuild app.

### Backend Issues

**1. "Invalid FCM token"**

Solution: Check backend has correct Firebase Admin SDK credentials (`firebase-credentials.json`).

**2. Notifications not sent to offline users**

Solution: Verify RQ workers are running (`python worker.py`).

---

## Environment Variables

Add Firebase configuration to backend `.env`:

```env
# Firebase Cloud Messaging
FIREBASE_CREDENTIALS_PATH=firebase-credentials.json
```

Download Firebase Admin SDK credentials:
1. Firebase Console → Project settings → Service accounts
2. Click "Generate new private key"
3. Save as `backend/firebase-credentials.json`

---

## Next Steps

1. **Test end-to-end flow**: Send message → receive notification → tap notification → navigate to chat
2. **Monitor Firebase Console**: Check notification analytics and delivery reports
3. **Implement notification badges**: Update app icon badge count
4. **Add notification settings**: Allow users to customize notification preferences
5. **Test on both platforms**: iOS and Android

---

## Resources

- [React Native Firebase Docs](https://rnfirebase.io/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Notifee Documentation](https://notifee.app/react-native/docs/overview)
- [APNs Setup Guide](https://firebase.google.com/docs/cloud-messaging/ios/client)
