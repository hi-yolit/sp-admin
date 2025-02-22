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
      from: '"Siyanda from SalesPath" <hi@salespath.co.za>',
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f4f4; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
            <div style="background-color: #3498db; color: white; padding: 20px; text-align: center;">
              <img src="https://admin.salespath.co.za/salespath.svg" alt="SalesPath Logo" style="max-height: 50px; margin-bottom: 10px;">
            </div>
            
            <div style="padding: 20px; color: #333; line-height: 1.6;">
              ${htmlContent}
              
              <div style="margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px; color: #666; font-size: 14px; text-align: center;">
                <p style="margin: 10px 0;">
                  Best regards,<br>
                  <strong>Siyanda from SalesPath</strong>
                </p>
                <p style="margin: 10px 0; font-size: 12px; color: #999;">
                  © ${new Date().getFullYear()} SalesPath. All rights reserved.
                </p>
              </div>
            </div>
          </div>
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