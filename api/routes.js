// routes.js
const express = require('express');
const { Order, updateOrderStatus, createOrderEmailNotifications } = require('./order');
const { calculateTotalAmount, createStripePaymentIntent, createPayPalTransaction } = require('./payment');
const { handleContactFormSubmission } = require('./contact');

const router = express.Router();

// Endpoint to get all orders
router.get('/api/orders', async (req, res) => {
    try {
        const orders = await Order.find();
        res.json(orders);
    } catch (error) {
        res.status(500).send('Error retrieving orders');
    }
});

// Endpoint to update order status
router.post('/api/update-order-status', async (req, res) => {
    const { orderId, status } = req.body;

    try {
        await updateOrderStatus(orderId, status);
        res.status(200).send('Order status updated');
    } catch (error) {
        res.status(500).send('Error updating order status');
    }
});

// Stripe Payment Intent Route
router.post('/create-payment-intent', async (req, res) => {
    try {
        const { paymentMethodId, email, orderDetails, deliveryType, paymentMethod, trackingNumber } = req.body;
        const amount = calculateTotalAmount(orderDetails);

        if (paymentMethod === 'cod') {
            await createOrderEmailNotifications(email, orderDetails, deliveryType, paymentMethod, 'Cash On Delivery', trackingNumber);
            return res.redirect('/orderconfirmation.html');
        }

        const paymentIntent = await createStripePaymentIntent(paymentMethodId, amount);
        res.send({ clientSecret: paymentIntent.client_secret });

    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// PayPal Transaction Creation Route
router.post('/create-paypal-transaction', async (req, res) => {
    try {
        const { orderDetails, trackingNumber } = req.body;
        const amount = calculateTotalAmount(orderDetails);
        const approvalUrl = await createPayPalTransaction(amount);
        res.json({ approvalUrl });

    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// Handle Contact Form Submission
router.post('/send-email', async (req, res) => {
    const { name, email, subject, message } = req.body;

    try {
        await handleContactFormSubmission({ name, email, subject, message });
        res.status(200).send('Email sent successfully!');
    } catch (error) {
        res.status(500).send('Something went wrong. Please try again later.');
    }
});

// Export the router
module.exports = router;
