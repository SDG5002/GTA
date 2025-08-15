import dotenv from "dotenv";
dotenv.config();
import nodemailer from "nodemailer";

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

export const emailVerMailer = async (verificationUrl, userEmail) => {
  const html_content = `
    <p>Hello,</p>
    <p>Thank you for signing up for <strong> GTA<strong/>.</p>
    <p>Please verify your email by visiting this link:</p>
    <p><a href="${verificationUrl}">${verificationUrl}</a></p>
  `;

  try {
    const mailOptions = {
      from: EMAIL_USER,
      to: userEmail,
      subject: "GTA EXAMS - Email Verification",
      html: html_content
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
  } catch (error) {
    console.error("Error sending email:", error.stack || error);
  }
};
