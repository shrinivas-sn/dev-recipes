// Handles FCM push messages while the app is closed or backgrounded.
// This file can't read your bundler's env vars (it's served as a static
// file, not processed by Vite/Webpack) — the Firebase client config below
// must be hardcoded. These values are the standard public web config
// (not secret) — same ones you already pass to initializeApp() elsewhere.
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: '<FIREBASE_API_KEY>',
  authDomain: '<FIREBASE_AUTH_DOMAIN>',
  projectId: '<FIREBASE_PROJECT_ID>',
  storageBucket: '<FIREBASE_STORAGE_BUCKET>',
  messagingSenderId: '<FIREBASE_MESSAGING_SENDER_ID>',
  appId: '<FIREBASE_APP_ID>',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Notification';
  const options = {
    body: payload.notification?.body || '',
    icon: '/favicon.svg', // swap for your app's icon
    data: payload.data || {},
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
