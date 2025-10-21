const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to set up Firebase project)
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { orderId, customerId, photoData, driverName, customerFCMToken } = JSON.parse(event.body);

    // Create notification payload
    const message = {
      token: customerFCMToken, // Customer's FCM token
      notification: {
        title: '🚚 Delivery Complete!',
        body: `Your order #${orderId} has been delivered by ${driverName}`,
        imageUrl: photoData // Photo as notification image
      },
      data: {
        orderId: orderId,
        type: 'delivery_complete',
        photoUrl: photoData,
        driverName: driverName
      },
      android: {
        notification: {
          icon: 'ic_notification',
          color: '#00BCD4',
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            'mutable-content': 1
          }
        }
      }
    };

    // Send push notification
    const response = await admin.messaging().send(message);
    
    console.log('Push notification sent successfully:', response);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        messageId: response,
        message: 'Push notification sent to customer!'
      })
    };

  } catch (error) {
    console.error('Error sending push notification:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to send push notification'
      })
    };
  }
};
