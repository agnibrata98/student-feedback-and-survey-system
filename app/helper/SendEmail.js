const nodemailer = require ('nodemailer');

let transporter;

// Initialize transporter with Ethereal
async function createTransporter () {
  if (!transporter) {
    const testAccount = await nodemailer.createTestAccount ();

    transporter = nodemailer.createTransport ({
      // host: process.env.EMAIL_HOST,
      // port: process.env.EMAIL_PORT,
      service: "gmail",
      // secure: false, // true for 465, false for 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
}

// Main sendEmail function
async function sendEmail({to, subject, text, html}) {
  try {
    const transporter = await createTransporter ();

    const info = await transporter.sendMail ({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
      html,
    });

    console.log ('Message sent: %s', info.messageId);
    // console.log ('Preview URL: %s', nodemailer.getTestMessageUrl (info));

    return {success: true, messageId: info.messageId};
  } catch (error) {
    console.error ('Error sending email:', error);
    return {success: false, error: error.message};
  }
}

module.exports = sendEmail;
