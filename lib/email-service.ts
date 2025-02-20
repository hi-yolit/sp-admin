// lib/email-service.ts
import sgMail from '@sendgrid/mail';

class EmailService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);
  }

  private log(message: string, error?: unknown) {
    if (error instanceof Error) {
      console.error(`[EmailService] ${message}`, error.message);
    } else {
      console.error(`[EmailService] ${message}`, error);
    }
  }
  

  async sendCustomEmail(to: string, subject: string, htmlContent: string): Promise<void> {
    this.log(`Sending custom email to ${to}`);
    const msg = {
      to,
      from: '"SalesPath" <hi@salespath.co.za>',
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          ${htmlContent}
          <p style="margin-top: 20px; color: #666; font-size: 14px;">
            Best regards,<br>The SalesPath Team
          </p>
        </div>
      `,
    };

    try {
      await sgMail.send(msg);
      this.log(`Custom email sent successfully to ${to}`);
    } catch (error) {
      this.log(`Error sending custom email to ${to}`, error);
      throw new Error('Failed to send custom email');
    }
  }
}

export const emailService = new EmailService();