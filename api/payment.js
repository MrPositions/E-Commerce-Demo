// payment.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paypal = require('@paypal/checkout-server-sdk');

// Function to calculate the total amount
function calculateTotalAmount(orderDetails) {
    let total = 0;
    orderDetails.items.forEach(item => {
        total += item.price * item.quantity;
    });
    const taxRate = 0.08; // Example tax rate of 8%
    const shippingFee = 5.00; // Example flat shipping fee
    total += total * taxRate + shippingFee;
    return total;
}

// Stripe Payment Intent
async function createStripePaymentIntent(paymentMethodId, amount) {
    const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
    });
    return paymentIntent;
}

// PayPal Transaction Creation
async function createPayPalTransaction(amount) {
    let request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{ amount: { currency_code: 'USD', value: amount.toFixed(2) } }],
        application_context: {
            return_url: 'https://your-site.com/confirm-payment',
            cancel_url: 'https://your-site.com/cancel-payment'
        }
    });
    const order = await client.execute(request);
    return order.result.links[1].href;
}

module.exports = { calculateTotalAmount, createStripePaymentIntent, createPayPalTransaction };
