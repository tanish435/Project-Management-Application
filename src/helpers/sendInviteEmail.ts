import { ApiResponse } from '@/utils/ApiResponse';
import { resend } from '@/lib/resend';
import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { InvitationEmail } from '../../email/InviteEmail';

interface SendInvitationEmailResponse {
  success: boolean;
  message: string;
}

export async function sendInvitationEmail(username: string, email: string, boardName: string): Promise<SendInvitationEmailResponse> {
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
  
      const emailHtml = await render(InvitationEmail({email, invitedBy: username, boardName: boardName}));
  
      const mailOptions = {
        from: `"Trello Clone" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Email Invitation Code",
        html: emailHtml,
      };
  
      await transporter.sendMail(mailOptions);
      
      return {
        success: true,
        message: "Invitation email sent successfully"
      };
    } catch (error) {
      console.error("Error sending invitation email:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to send invitation email"
      };
    }
}
