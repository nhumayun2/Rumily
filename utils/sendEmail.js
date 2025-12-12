import nodemailer from 'nodemailer';

const sendEmail = async ({ to, subject, html }) => {
  // Create a transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail', // or your preferred email service
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // This must be an 'App Password', not login password
    },
  });

  return transporter.sendMail({
    from: `"Family Connect" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

export default sendEmail;