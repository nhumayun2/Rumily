import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Load the service account key file
// We use process.cwd() to ensure we find the file in the root directory
const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');

let firebaseInitialized = false;

if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  
  firebaseInitialized = true;
  console.log('Firebase Admin Initialized');
} else {
  console.warn('Warning: firebase-service-account.json not found. Push notifications will not work.');
}

// Helper function to send push notification
const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!firebaseInitialized || !fcmToken) return;

  const message = {
    token: fcmToken,
    notification: {
      title,
      body,
    },
    data: {
      ...data, // Extra data (e.g., click_action, screen_to_open)
      click_action: 'FLUTTER_NOTIFICATION_CLICK',
    },
  };

  try {
    await admin.messaging().send(message);
    console.log(`Push notification sent to ${fcmToken}`);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

export { admin, sendPushNotification };