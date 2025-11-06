// src/utils/notify.js
export const sendEmailNotification = async ({ to, subject, text, html }) => {
  // For development return resolved promise; integrate nodemailer/sendgrid here.
  console.log(`sendEmailNotification -> to: ${to}, subject: ${subject}`);
  // Example nodemailer usage omitted (replace with your mail provider).
  return Promise.resolve();
};

export default sendEmailNotification;
