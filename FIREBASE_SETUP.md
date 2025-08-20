# Firebase Setup for Contractor Estimator

This guide will help you set up Firebase to store your contractor estimates data securely in the cloud instead of localStorage.

## 🚀 **Step 1: Create a Firebase Project**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "contractor-estimator")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## 🔑 **Step 2: Get Your Firebase Configuration**

1. In your Firebase project, click the gear icon ⚙️ next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (</>)
5. Register your app with a nickname (e.g., "contractor-estimator-web")
6. Copy the configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

## 🔥 **Step 3: Enable Firestore Database**

1. In your Firebase project, click "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (you can secure it later)
4. Select a location close to your users
5. Click "Enable"

## 📝 **Step 4: Update Your Configuration**

1. Open `src/config/firebase.js`
2. Replace the placeholder values with your actual Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-actual-project.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-actual-project.appspot.com",
  messagingSenderId: "your-actual-messaging-sender-id",
  appId: "your-actual-app-id"
};
```

## 🛡️ **Step 5: Set Up Security Rules (Optional but Recommended)**

1. In Firestore Database, click the "Rules" tab
2. Replace the default rules with these more secure ones:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /estimates/{estimateId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

## ✅ **Step 6: Test Your Setup**

1. Start your development server: `npm start`
2. Your app should now load data from Firebase instead of localStorage
3. Check the browser console for any Firebase-related errors
4. Verify that data is being saved to your Firestore database

## 🔧 **Features You Now Have**

- **Cloud Storage**: Your estimates are stored securely in Firebase
- **Real-time Sync**: Data syncs across devices automatically
- **Backup**: No more lost data if you clear browser storage
- **Scalability**: Firebase can handle thousands of estimates
- **Security**: Data is protected by Firebase's security infrastructure

## 🚨 **Important Notes**

- **Test Mode**: Firestore starts in test mode, allowing anyone to read/write. Set up proper security rules for production.
- **Costs**: Firebase has a generous free tier. You'll only pay if you exceed the limits.
- **Authentication**: Currently using a default user ID. Implement proper authentication later for multi-user support.

## 🆘 **Troubleshooting**

- **"Firebase: Error (auth/unauthorized-domain)"**: Add your domain to Firebase Console > Authentication > Settings > Authorized domains
- **"Firebase: Error (firestore/permission-denied)"**: Check your Firestore security rules
- **"Firebase: Error (app/no-app)"**: Verify your configuration in `src/config/firebase.js`

## 🔄 **Migration from localStorage**

Your existing localStorage data will automatically migrate to Firebase when you first load the app. The app includes fallback logic to localStorage if Firebase is unavailable.

---

**Need help?** Check the [Firebase Documentation](https://firebase.google.com/docs) or the [Firebase Community](https://firebase.google.com/community).
