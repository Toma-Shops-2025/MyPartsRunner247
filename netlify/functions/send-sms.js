const twilio = require('twilio');

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
} = process.env;

let client;

function getClient() {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    throw new Error('Twilio environment variables are not configured.');
  }

  if (!client) {
    client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }

  return client;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: 'OK',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const { to, body } = payload;

    if (!to || !body) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Missing required fields: to, body' }),
      };
    }

    const formattedNumber = to.startsWith('+') ? to : `+1${to.replace(/[^0-9]/g, '')}`;

    const twilioClient = getClient();

    const message = await twilioClient.messages.create({
      to: formattedNumber,
      from: TWILIO_PHONE_NUMBER,
      body,
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ success: true, sid: message.sid }),
    };
  } catch (error) {
    console.error('send-sms error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: error.message || 'Failed to send SMS' }),
    };
  }
};

