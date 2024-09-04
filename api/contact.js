// contact.js
const sendEmail = require('./send-email');

async function handleContactFormSubmission({ name, email, subject, message }) {
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
    await sendEmail(mailOptions);
}

module.exports = { handleContactFormSubmission };
