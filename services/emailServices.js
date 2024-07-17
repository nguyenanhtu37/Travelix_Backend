const nodemailer = require('nodemailer');

async function sendEmail(order) {
  const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'nguyenanhtu3703@gmail.com',
    pass: 'ietj qlee vvwb dtce',
  },
});

  const mailOptions = {
    from: 'nguyenanhtu3703@gmail.com',
    to: order.contactInfo.email,
    subject: 'Payment Confirmation',
    text: `Your payment for order ${order._id} has been received successfully.`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

module.exports = sendEmail;