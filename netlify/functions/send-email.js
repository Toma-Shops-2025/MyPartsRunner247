const sgMail = require('@sendgrid/mail');

const {
  SENDGRID_API_KEY,
  SENDGRID_FROM_EMAIL,
  SENDGRID_DEFAULT_FROM = 'noreply@mypartsrunner.com',
} = process.env;

function configureClient() {
  if (!SENDGRID_API_KEY) {
    throw new Error('SendGrid API key is not configured.');
  }

  sgMail.setApiKey(SENDGRID_API_KEY);
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
    const { to, subject, text, html } = payload;

    if (!to || !subject || (!text && !html)) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Missing required fields: to, subject, and text or html' }),
      };
    }

    configureClient();

    const fromEmail = SENDGRID_FROM_EMAIL || SENDGRID_DEFAULT_FROM;

    const msg = {
      to,
      from: fromEmail,
      subject,
      text: text || (html ? html.replace(/<[^>]+>/g, '') : ''),
      html: html || text,
    };

    const [response] = await sgMail.send(msg);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ success: true, messageId: response.headers['x-message-id'] }),
    };
  } catch (error) {
    console.error('send-email error:', error);

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: error.message || 'Failed to send email' }),
    };
  }
};

