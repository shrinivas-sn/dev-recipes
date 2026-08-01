// Client-side opt-in flow: request permission -> register the messaging
// service worker on its OWN scope -> wait for it to activate -> get an FCM
// token -> save it to Firestore so a server-side job can push to it later.
//
// Requires: `firebase` package, and an initialized Firebase `app` + Firestore
// `db` exported from your own firebase init file. Adjust the two imports below.

import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { app, db } from './firebase'; // <-- your firebase init module

export type EnableAlertsResult =
  | { status: 'enabled' }
  | { status: 'denied' }
  | { status: 'unsupported'; reason: string }
  | { status: 'error'; message: string };

const FCM_TOKENS_COLLECTION = 'fcm_tokens';

// Give the messaging worker its own scope so it never collides with a PWA's
// own offline-cache service worker (see README gotcha #1).
const MESSAGING_SW_SCOPE = '/firebase-cloud-messaging-push-scope';

export async function isNotificationSupported(): Promise<boolean> {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return false;
  return isSupported();
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

// register() resolves as soon as the registration exists, not once the
// worker is active — PushManager.subscribe (used inside getToken) requires
// an active worker (see README gotcha #2).
function waitForActive(registration: ServiceWorkerRegistration): Promise<ServiceWorkerRegistration> {
  if (registration.active) return Promise.resolve(registration);
  const worker = registration.installing || registration.waiting;
  if (!worker) return Promise.resolve(registration);
  return new Promise((resolve) => {
    worker.addEventListener('statechange', () => {
      if (worker.state === 'activated') resolve(registration);
    });
  });
}

// Always safe to call again even if permission is already 'granted' — do NOT
// gate your "enable" button on that (see README gotcha #3). Re-running this
// is how you pick up service worker or scope changes on existing users.
export async function enableAlerts(): Promise<EnableAlertsResult> {
  const supported = await isNotificationSupported();
  if (!supported) {
    return { status: 'unsupported', reason: 'This browser does not support push notifications.' };
  }

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;
  if (!vapidKey) {
    return { status: 'error', message: 'Notifications are not configured yet (missing VAPID key).' };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { status: 'denied' };
  }

  try {
    const existing = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      existing
        .filter((r) => r.active?.scriptURL.endsWith('/firebase-messaging-sw.js') && r.scope !== new URL(MESSAGING_SW_SCOPE, location.origin).href)
        .map((r) => r.unregister())
    );

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: MESSAGING_SW_SCOPE,
    });
    await waitForActive(registration);

    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });

    if (!token) {
      return { status: 'error', message: 'Could not get a notification token. Try again.' };
    }

    await setDoc(doc(db, FCM_TOKENS_COLLECTION, token), {
      token,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { status: 'enabled' };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : 'Unknown error enabling alerts.' };
  }
}
