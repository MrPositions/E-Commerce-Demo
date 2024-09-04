// Import required libraries
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paypal = require('@paypal/checkout-server-sdk');
const mongoose = require('mongoose'); // Import mongoose
const app = express();

// Import models
const Customer = require('./models/Customer');
const Order = require('./models/Order'); // Ensure this is defined correctly

app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Order Schema
const orderSchema = new mongoose.Schema({
    orderId: { type: String, required: true },
    trackingNumber: { type: String, required: true },
    status: { type: String, required: true },
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' } // Ensure customer_id is linked
});

// Order Model
const Order = mongoose.model('Order', orderSchema);

// Configure Nodemailer
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
    } catch (error) {
        console.error('Error sending email:', error.message);
    }
}

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
        <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
        <p style="color: ${status === 'PAID FOR ✔️' ? 'green' : 'black'}; font-weight: bold;">${status}</p>
    `;
}

// Function to calculate the total amount
function calculateTotalAmount(orderDetails) {
    let total = 0;
    orderDetails.items.forEach(item => {
        total += item.price * item.quantity;
    });
    // Add any additional fees such as taxes and shipping
    const taxRate = 0.08; // Example tax rate of 8%
    const shippingFee = 5.00; // Example flat shipping fee
    total += total * taxRate + shippingFee;
    return total;
}

// Handle Contact Form Submission
app.post('/send-email', (req, res) => {
    const { name, email, subject, message } = req.body;

    const mailOptions = {
        from: email,
        to: process.env.EMAIL_USER,
        subject: `Contact Form Submission: ${subject}`,
        html: `
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error.message);
            return res.status(500).send('Something went wrong. Please try again later.');
        }
        res.status(200).send('Email sent successfully!');
    });
});

// Import and integrate router for previous orders
const previousOrdersRouter = require('./routes/previousOrders'); // Ensure the path is correct
app.use(previousOrdersRouter); // Use the router

// Start the Express server
app.listen(3000, () => console.log('Server running on port 3000'));
