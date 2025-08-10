import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { VerificationEmail } from '../../email/VerificationEmail';

interface SendVerificationEmailResponse {
  success: boolean;
  message: string;
}

export const sendVerificationEmail = async (
  email: string,
  username: string,
  verifyCode: string
): Promise<SendVerificationEmailResponse> => {
  // Validate environment variables
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error("Missing email configuration");
    return {
      success: false,
      message: "Email configuration missing"
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const emailHtml = await render(VerificationEmail({ username, otp: verifyCode }));

    const mailOptions = {
      from: `"Trello Clone" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Email Verification Code",
      html: emailHtml,
    };

    await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      message: "Verification email sent successfully"
    };
  } catch (error) {
    console.error("Error sending verification email:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to send verification email"
    };
  }
}