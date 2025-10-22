// Cash App Payment Handler - Handles fees after $1,000/month
// =========================================================

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { orderId, driverId, amount, description } = JSON.parse(event.body);
    
    if (!orderId || !driverId || !amount) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Order ID, driver ID, and amount are required' })
      };
    }

    console.log(`Processing Cash App payment: $${amount} to driver ${driverId} for order ${orderId}`);

    // Initialize Supabase client
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get driver's Cash App details
    const { data: paymentMethod, error: methodError } = await supabase
      .from('driver_payment_methods')
      .select('*')
      .eq('user_id', driverId)
      .eq('payment_method', 'cashapp')
      .single();

    if (methodError || !paymentMethod) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'No Cash App payment method found for driver' })
      };
    }

    const cashAppData = paymentMethod.payment_data.data;

    // Check driver's monthly Cash App usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthlyPayments, error: paymentsError } = await supabase
      .from('driver_payments')
      .select('amount')
      .eq('driver_id', driverId)
      .eq('payment_method', 'cashapp')
      .gte('created_at', startOfMonth.toISOString());

    if (paymentsError) {
      console.error('Error fetching monthly payments:', paymentsError);
    }

    // Calculate total monthly Cash App payments
    const monthlyTotal = monthlyPayments?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0;
    const newTotal = monthlyTotal + amount;

    console.log(`Driver's monthly Cash App total: $${monthlyTotal}, new payment: $${amount}, new total: $${newTotal}`);

    // Determine if Cash App fees apply
    let cashAppFee = 0;
    let driverReceives = amount;

    if (newTotal > 1000) {
      // Cash App charges 1.5% for amounts over $1,000/month
      const overLimitAmount = Math.min(amount, newTotal - 1000);
      cashAppFee = overLimitAmount * 0.015; // 1.5% fee
      driverReceives = amount - cashAppFee;
      
      console.log(`Cash App fee applies: $${cashAppFee.toFixed(2)} (1.5% of $${overLimitAmount})`);
    }

    // Process Cash App payment
    const paymentResult = await processCashAppPayment(cashAppData, driverReceives, orderId, description);

    // Log payment in database
    await supabase
      .from('driver_payments')
      .insert({
        driver_id: driverId,
        order_id: orderId,
        amount: amount, // Original amount
        payment_method: 'cashapp',
        payment_id: paymentResult.paymentId,
        status: paymentResult.status,
        cashapp_fee: cashAppFee,
        driver_receives: driverReceives,
        created_at: new Date().toISOString()
      });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        paymentId: paymentResult.paymentId,
        method: 'cashapp',
        originalAmount: amount,
        cashAppFee: cashAppFee,
        driverReceives: driverReceives,
        status: paymentResult.status,
        monthlyTotal: newTotal,
        overLimit: newTotal > 1000
      })
    };

  } catch (error) {
    console.error('Error processing Cash App payment:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to process Cash App payment',
        details: error.message 
      })
    };
  }
};

// Process Cash App payment (simplified - in production, use Cash App API)
async function processCashAppPayment(cashAppData, amount, orderId, description) {
  console.log(`Cash App payment: $${amount} to ${cashAppData.cashapp_username}`);
  
  // In production, integrate with Cash App API
  // const cashAppResponse = await cashAppAPI.sendPayment({
  //   username: cashAppData.cashapp_username,
  //   amount: amount,
  //   note: description
  // });

  return {
    paymentId: `cashapp_${Date.now()}`,
    status: 'completed'
  };
}
