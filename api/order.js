// order.js
const mongoose = require('mongoose');
const sendEmail = require('./send-email');

// Order Schema
const orderSchema = new mongoose.Schema({
    orderId: { type: String, required: true },
    trackingNumber: { type: String, required: true },
    status: { type: String, required: true },
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }
});

// Order Model
const Order = mongoose.model('Order', orderSchema);

// Functions related to orders
async function updateOrderStatus(orderId, status) {
    const order = await Order.findOne({ orderId: orderId });
    if (!order) throw new Error('Order not found');

    // Update the order's status
    order.status = status;
    await order.save();
}

async function createOrderEmailNotifications(email, orderDetails, deliveryType, paymentMethod, status, trackingNumber) {
    const ownerSubject = `New Order - ${status}`;
    const customerSubject = `Your Order - ${status}`;

    const ownerHtml = generateOrderHtml(orderDetails, deliveryType, paymentMethod, status, trackingNumber);
    const customerHtml = generateOrderHtml(orderDetails, null, null, status, trackingNumber);

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

module.exports = { Order, updateOrderStatus, createOrderEmailNotifications };
