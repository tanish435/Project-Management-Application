import { ApiResponse } from '@/utils/ApiResponse';
import { resend } from '@/lib/resend';
import { InvitationEmail } from '../../email/InviteEmail';

export async function sendInvitationEmail(username: string, email: string, boardName: string): Promise<Response> {
  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Invitation to join project management platform',
      react: InvitationEmail({email, invitedBy: username, boardName: boardName}),
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
