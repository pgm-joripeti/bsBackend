import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendResetEmail(to, confirmationUrl) {
  return await resend.emails.send({
    from: 'hi@brainsmash.be',
    to,
    subject: 'Reset jouw wachtwoord',
    html: `
      <h2>Reset Wachtwoord</h2>
      <p>Klik op deze link om je wachtwoord te resetten:</p>
      <p><a href="${confirmationUrl}">Reset Wachtwoord</a></p>
    `,
  });
}
