// send-email.js
const nodemailer = require('nodemailer');

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

module.exports = sendEmail;
