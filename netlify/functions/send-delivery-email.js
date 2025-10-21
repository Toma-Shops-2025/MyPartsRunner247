const sgMail = require('@sendgrid/mail');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { orderId, customerEmail, photoData, driverName } = JSON.parse(event.body);

    // Set SendGrid API key (FREE tier available)
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: customerEmail,
      from: {
        email: 'noreply@mypartsrunner.com',
        name: 'MyPartsRunner Delivery'
      },
      subject: `🚚 Delivery Complete - Order #${orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #00BCD4;">🚚 Delivery Complete!</h2>
          
          <p>Hello!</p>
          
          <p>Your order <strong>#${orderId}</strong> has been successfully delivered by <strong>${driverName}</strong>.</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">📸 Delivery Photo Proof:</h3>
            <img src="${photoData}" alt="Delivery Photo" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          </div>
          
          <p><strong>Order Details:</strong></p>
          <ul>
            <li>Order Number: #${orderId}</li>
            <li>Driver: ${driverName}</li>
            <li>Delivery Time: ${new Date().toLocaleString()}</li>
          </ul>
          
          <p>Thank you for choosing MyPartsRunner!</p>
          
          <div style="background: #00BCD4; color: white; padding: 15px; border-radius: 8px; text-align: center; margin-top: 20px;">
            <p style="margin: 0; font-weight: bold;">📱 Need help? Contact us anytime!</p>
          </div>
        </div>
      `
    };

    await sgMail.send(msg);
    
    console.log('Delivery email sent successfully to:', customerEmail);

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
        message: 'Delivery email sent to customer!'
      })
    };

  } catch (error) {
    console.error('Error sending delivery email:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to send delivery email'
      })
    };
  }
};
