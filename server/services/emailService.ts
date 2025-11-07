
// SIMULATED EMAIL SERVICE
// In a real-world application, you would use a library like Nodemailer
// to send actual emails through a provider (e.g., SendGrid, Mailgun, Gmail).

interface EmailDetails {
  to: string;
  subject: string;
  body: string;
}

/**
 * Simulates sending an email by logging its content to the console.
 * @param details - The email details.
 */
function sendEmail(details: EmailDetails) {
  console.log('--- SIMULATING EMAIL ---');
  console.log(`To: ${details.to}`);
  console.log(`Subject: ${details.subject}`);
  console.log('Body:');
  console.log(details.body);
  console.log('------------------------');
}

/**
 * Sends a license activation notification.
 * @param userEmail - The recipient's email address.
 * @param expiryDate - The new expiry date of the license.
 */
export function sendLicenseActivationEmail(userEmail: string, expiryDate: string | null) {
  const formattedDate = expiryDate
    ? new Date(expiryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
    : 'Vitalícia';

  sendEmail({
    to: userEmail,
    subject: 'Sua licença FinTrack foi ativada!',
    body: `
      Olá,

      Sua licença para o aplicativo FinTrack foi ativada com sucesso.
      
      Sua licença é válida até: ${formattedDate}.

      Aproveite para organizar suas finanças!

      Atenciosamente,
      Equipe FinTrack
    `,
  });
}

/**
 * Sends a license deactivation notification.
 * @param userEmail - The recipient's email address.
 */
export function sendLicenseDeactivationEmail(userEmail: string) {
  sendEmail({
    to: userEmail,
    subject: 'Sua licença FinTrack foi desativada',
    body: `
      Olá,

      Sua licença para o aplicativo FinTrack foi desativada pelo administrador.
      
      Para reativar seu acesso, por favor, entre em contato com o suporte.

      Atenciosamente,
      Equipe FinTrack
    `,
  });
}

/**
 * Sends a license expiration warning.
 * @param userEmail - The recipient's email address.
 * @param expiryDate - The expiry date of the license.
 */
export function sendLicenseExpirationWarningEmail(userEmail: string, expiryDate: string) {
  const formattedDate = new Date(expiryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

  sendEmail({
    to: userEmail,
    subject: 'Aviso: Sua licença FinTrack está prestes a expirar',
    body: `
      Olá,

      Sua licença para o aplicativo FinTrack irá expirar em 7 dias, na data de ${formattedDate}.
      
      Para renovar seu acesso e não perder suas funcionalidades, entre em contato com o administrador.

      Atenciosamente,
      Equipe FinTrack
    `,
  });
}
