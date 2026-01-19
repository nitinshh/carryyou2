// Use compat libraries for service worker in Firebase v12+
importScripts("https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBmidnBD5hndg8aVKX5BF5178t6p3XrQRg",
  authDomain: "divine-flute.firebaseapp.com",
  projectId: "divine-flute",
  storageBucket: "divine-flute.firebasestorage.app",
  messagingSenderId: "188431071564",
  appId: "1:188431071564:web:cee022addb3885f87d37e9",
  measurementId: "G-P950W8L911"
});

const messaging = firebase.messaging();

// ✅ Handle background push
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload?.data?.title || "99meet";
  const notificationOptions = {
    body: payload?.data?.message,
    icon: "https://easywaiterservices.com/push_icon.jpg",
    data: {
      type: payload?.data?.type || "notification"
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// ✅ Handle click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const type = event.notification?.data?.type;
  let redirectionUrl = "/notification";

  switch (type) {
    case "booking_request":
      redirectionUrl = "/";
      break;
    case "booking_started":
    case "new_booking":
    case "booking_active":
      redirectionUrl = "/bookingHistory";
      break;
    case "booking_session_completed":
      redirectionUrl = "/bookingHistory/pastbooking";
      break;
    default:
      redirectionUrl = "/notification";
  }

  event.waitUntil(clients.openWindow(redirectionUrl));
});
