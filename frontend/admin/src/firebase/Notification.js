import { messaging, getToken, onMessage } from "./firebase";

const VAPIDKEY = "BAzYiZKIPNdhCtM2LLvIn8UGPvKv2yJPDPf6O3NIVqyCMJKW5ynWMTJVTJP2nW93SqinRf9rDz0iUAh0PLbD_zc";

/**
 * Request FCM token with explicit service worker registration.
 */
export const requestForToken = async () => {
  try {
    // Ensure correct service worker path based on subfolder deployment (e.g., /website/)
    const registration = await navigator.serviceWorker.getRegistration('/admin/firebase-messaging-sw.js');

    if (!registration) {
      console.error("❌ Service Worker not found at /admin/firebase-messaging-sw.js");
      return null;
    }

    const currentToken = await getToken(messaging, {
      vapidKey: VAPIDKEY,
      serviceWorkerRegistration: registration, // ✅ Pass correct registration
    });

    if (currentToken) {
      console.log("✅ Current token for client:", currentToken);
      return currentToken;
    } else {
      console.log("⚠️ No registration token available. Request permission to generate one.");
      return null;
    }
  } catch (err) {
    console.error("❌ An error occurred while retrieving token:", err);
    return null;
  }
};

/**
 * Request notification permission from the user.
 */
export const requestNotificationPermission = async () => {
  if ("Notification" in window && Notification.permission !== "granted") {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.warn("⚠️ Notification permission denied");
      }
    } catch (error) {
      console.error("❌ Error requesting notification permission:", error);
    }
  }
};

/**
 * Listener for foreground messages.
 */
export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log("📩 Message received:", payload);
      const { title, message } = payload.data || {};
      if ("Notification" in window && Notification.permission === "granted") {
        const notification = new Notification(title || "99meet", {
          body: message || "You have a new notification",
          icon: 'https://easywaiterservices.com/push_icon.jpg',
        });
        notification.onclick = () => {
          resolve({ ...payload, click: true }); // Pass click info
        };
      }
    });
  });
