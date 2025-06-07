// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
// Note: Service workers can't access process.env directly, so these values need to be replaced during build
// or you can manually update them for production
firebase.initializeApp({
  apiKey: "AIzaSyBLkK6LwseUvbA6oDTQTLd2Z4MpmH7NhgQ",
  authDomain: "jpccoal.firebaseapp.com",
  projectId: "jpccoal",
  storageBucket: "jpccoal.firebasestorage.app",
  messagingSenderId: "427360291711",
  appId: "1:427360291711:web:90ee121cbc8cc64b8de84a"
});

// Note: For production deployment, you'll need to replace the placeholder values above
// with your actual Firebase config values. Service workers cannot access environment variables
// directly, so this needs to be handled during your build process.

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png',
    badge: '/badge-icon.png',
    data: payload.data,
    vibrate: [200, 100, 200],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click received.', event);

  // Close the notification
  event.notification.close();
  
  // Handle different actions
  if (event.action === 'view') {
    console.log('User clicked "View Order" action');
  } else if (event.action === 'dismiss') {
    console.log('User clicked "Dismiss" action');
    return; // Don't navigate if user dismisses
  }

  // This looks to see if the current is already open and
  // focuses if it is
  event.waitUntil(
    clients.matchAll({
      type: "window"
    }).then((clientList) => {
      // Get notification data passed with the payload
      const orderData = event.notification.data;
      let url = '/admin/orders';
      
      // If there's order specific data, go to that order
      if (orderData && orderData.orderId) {
        url = `/admin/orders/${orderData.orderId}`;
      }

      for (const client of clientList) {
        if (client.url === url && 'focus' in client)
          return client.focus();
      }
      
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
