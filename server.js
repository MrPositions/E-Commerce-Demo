// Import required libraries
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paypal = require('@paypal/checkout-server-sdk');
const Order = require('./db'); // Import the Order model from db.js
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.json()); // This line already exists in your previous snippets

// Email transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Centralized Email Sending Function
async function sendEmail({ from, to, subject, html }) {
    const mailOptions = { from, to, subject, html };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent from ${from} to ${to}`);
    } catch (error) {
        console.error('Error sending email:', error.message);
        throw error; // Rethrow error for further handling
    }
}

// Handle Contact Form Submission
async function handleContactFormSubmission({ name, email, subject, message }) {
    const mailOptions = {
        from: email,
        to: process.env.EMAIL_USER, // Your email address
        subject: `New message from ${name}: ${subject}`,
        html: `
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
        `
    };

    // Send email to yourself
    await sendEmail(mailOptions);

    // Optionally, you could send an auto-reply here
    const autoReplyOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Thank you for your message',
        html: '<p>Thank you for contacting us. Your message has been received and will be reviewed promptly.</p>'
    };

    await sendEmail(autoReplyOptions);
}

// Endpoint to handle contact form submission
app.post('/api/send-email', async (req, res) => {
    const { name, email, subject, message } = req.body;

    try {
        await handleContactFormSubmission({ name, email, subject, message });
        res.status(200).send('Email sent successfully.');
    } catch (error) {
        console.error('Error handling form submission:', error);
        res.status(500).send('Failed to send email.');
    }
});

// Endpoint to get all orders
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await Order.find();
        res.json(orders);
    } catch (error) {
        res.status(500).send('Error retrieving orders');
    }
});

// Endpoint to update order status
app.post('/api/update-order-status', async (req, res) => {
    const { orderId, status } = req.body;

    try {
        const order = await Order.findOne({ orderId: orderId });
        if (!order) {
            return res.status(404).send('Order not found');
        }

        // Update the order's status
        order.status = status;
        await order.save();

        res.status(200).send('Order status updated');
    } catch (error) {
        res.status(500).send('Error updating order status');
    }
});

// Stripe Payment Intent Route
app.post('/create-payment-intent', async (req, res) => {
    try {
        const { paymentMethodId, email, orderDetails, deliveryType, paymentMethod, trackingNumber } = req.body;
        const amount = calculateTotalAmount(orderDetails);

        if (paymentMethod === 'cod') {
            await handleCOD(email, orderDetails, deliveryType, paymentMethod, trackingNumber);
            return res.redirect('/orderconfirmation.html');
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'usd',
            payment_method: paymentMethodId,
            confirmation_method: 'manual',
        });

        const confirmedPaymentIntent = await stripe.paymentIntents.confirm(paymentIntent.id);

        if (confirmedPaymentIntent.status === 'succeeded') {
            await handlePaymentSuccess(email, orderDetails, deliveryType, paymentMethod, trackingNumber);
        }

        res.send({ clientSecret: confirmedPaymentIntent.client_secret });

    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// PayPal Transaction Creation Route
app.post('/create-paypal-transaction', async (req, res) => {
    try {
        const { orderDetails, trackingNumber } = req.body;
        const amount = calculateTotalAmount(orderDetails);

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
        res.json({ approvalUrl: order.result.links[1].href });

    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// Confirm PayPal Payment Route
app.get('/confirm-payment', async (req, res) => {
    const { token } = req.query;

    try {
        const capture = await client.execute(new paypal.orders.OrdersCaptureRequest(token));
        if (capture.result.status === "COMPLETED") {
            await handlePaymentSuccess(req.body.email, req.body.orderDetails, req.body.deliveryType, 'PayPal', req.body.trackingNumber);
            res.redirect('/orderconfirmation.html');
        }

    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// Handle Cash On Delivery
async function handleCOD(email, orderDetails, deliveryType, paymentMethod, trackingNumber) {
    const ownerSubject = 'New Order - Cash On Delivery';
    const customerSubject = 'Your Order - Cash To Be Paid On Delivery';

    const ownerHtml = generateOrderHtml(orderDetails, deliveryType, paymentMethod, 'Cash On Delivery', trackingNumber);
    const customerHtml = generateOrderHtml(orderDetails, null, null, 'Cash To Be Paid On Delivery', trackingNumber);

    await sendEmail({ from: process.env.EMAIL_USER, to: process.env.OWNER_EMAIL, subject: ownerSubject, html: ownerHtml });
    await sendEmail({ from: process.env.EMAIL_USER, to: email, subject: customerSubject, html: customerHtml });
}

// Handle Successful Payments
async function handlePaymentSuccess(email, orderDetails, deliveryType, paymentMethod, trackingNumber) {
    const ownerSubject = 'New Order - PAID FOR';
    const customerSubject = 'Your Order - PAID FOR';

    const ownerHtml = generateOrderHtml(orderDetails, deliveryType, paymentMethod, 'PAID FOR ✔️', trackingNumber);
    const customerHtml = generateOrderHtml(orderDetails, null, null, 'PAID FOR', trackingNumber);

    await sendEmail({ from: process.env.EMAIL_USER, to: process.env.OWNER_EMAIL, subject: ownerSubject, html: ownerHtml });
    await sendEmail({ from: process.env.EMAIL_USER, to: email, subject: customerSubject, html: customerHtml });
}

// Function to generate order HTML content
function generateOrderHtml(orderDetails, deliveryType, paymentMethod, status, trackingNumber) {
    return `
        <h1>Order Details</h1>
        <p><strong>Billing Info:</strong></p>
        <p>${orderDetails.billingInfo}</p>
        <p><strong>Order Summary:</strong></p>
        <p>${orderDetails.summary}</p>
        ${deliveryType ? `<p><strong>Preferred Delivery Type:</strong> ${deliveryType}</p>` : ''}
        ${paymentMethod ? `<p><strong>Preferred Payment Method:</strong> ${paymentMethod}</p>` : ''}
        <p><strong>Status:</strong> ${status}</p>
        <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
    `;
}

// Function to calculate total order amount
function calculateTotalAmount(orderDetails) {
    let total = 0;
    orderDetails.forEach(item => {
        total += item.price * item.quantity; // Calculate total amount
    });
    return total * 100; // Convert to cents for Stripe
}

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
