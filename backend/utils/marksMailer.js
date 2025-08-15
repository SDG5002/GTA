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

export const sendMarksEmail = async (
  examName,
  professorName,
  studentEmail,
  studentName,
  score,
  totalMarks,
  isReRelease = false
) => {
  console.log("Sending email...", EMAIL_USER, EMAIL_PASS);
  
  const html_content = isReRelease
        ? `
            <h2>Hello ${studentName},</h2>
            <p>This is to inform you that the results for your exam <strong>${examName}</strong>,
            conducted by <strong>Professor ${professorName}</strong>, have been 
            <span style="color: #dc2626;"><strong>revised</strong></span> due to changes in the exam content 
            (Dropped/Bonus questions/key corrections).</p>
            <br>
            <p style="color: #52f40cff;"><strong>New Score:</strong> ${score} / ${totalMarks}</p>
            <p>We apologize for any inconvenience and thank you for your understanding.</p>
          `
        : `
            <h2>Hello ${studentName},</h2>
            <p>Your exam results for <strong>${examName}</strong>, conducted by 
            <strong>Professor ${professorName}</strong>, are as follows:</p>
            <p style="color: #52f40cff;  ><strong >Score:</strong> ${score} / ${totalMarks}</p>
            <p>Thank you.</p>
          `;
  try {
    
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: studentEmail,
      subject: "Your Exam Results",
      html: html_content
    }; 

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
  } catch (error) {
      console.error("Error sending email:", error.stack || error);
  }
};
