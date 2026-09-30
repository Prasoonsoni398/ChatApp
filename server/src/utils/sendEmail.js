import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  if (!process.env.GMAIL_USERNAME || !process.env.GMAIL_PASSCODE) {
    console.warn("⚠️ [Email Dispatch] GMAIL_USERNAME or GMAIL_PASSCODE missing in environment. Email skipped.");
    return null;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USERNAME,
        pass: process.env.GMAIL_PASSCODE,
      },
      connectionTimeout: 4000, // 4s timeout to establish TCP connection
      greetingTimeout: 4000,   // 4s timeout for greeting
      socketTimeout: 5000,     // 5s timeout on active socket
    });

    const mailOptions = {
      from: `"ChatApp Support" <${process.env.GMAIL_USERNAME}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.warn("⚠️ Error sending email (non-fatal):", error.message);
    return null;
  }
};

export default sendEmail;

