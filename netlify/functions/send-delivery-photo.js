const twilio = require('twilio');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { orderId, customerPhone, photoData, driverName } = JSON.parse(event.body);

    // Initialize Twilio client
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Convert base64 to data URL for MMS
    const mediaUrl = `data:image/jpeg;base64,${photoData}`;

    // Send MMS with delivery photo
    const message = await client.messages.create({
      body: `🚚 Delivery Complete!\n\nOrder #${orderId}\nDriver: ${driverName}\n\nYour package has been delivered successfully! 📦`,
      mediaUrl: [mediaUrl],
      from: process.env.TWILIO_PHONE_NUMBER, // Your Twilio phone number
      to: customerPhone
    });

    console.log('MMS sent successfully:', message.sid);

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
        messageId: message.sid,
        message: 'Photo sent to customer successfully!'
      })
    };

  } catch (error) {
    console.error('Error sending MMS:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to send photo to customer'
      })
    };
  }
};
