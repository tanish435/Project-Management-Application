import { ApiResponse } from '@/utils/ApiResponse';
import {VerificationEmail} from '../../email/VerificationEmail';
import { resend } from '@/lib/resend';

export async function sendVerificationEmail(username: string, email: string, verifyCode: string): Promise<Response> {
  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Verification Code',
      react: VerificationEmail({ username, otp: verifyCode }),
    });

    const response = new ApiResponse(200, null, "Email sent successfully")
    return new Response(JSON.stringify(response), {
        status: response.statusCode
    });

  } catch (error) {
    console.log('Error sending email: ', error);
    
    const erroMsg = new ApiResponse(500, null, "Failed to send email")
    return new Response(JSON.stringify(erroMsg), {
        status: erroMsg.statusCode
    });
  }
}
