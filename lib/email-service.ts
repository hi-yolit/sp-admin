// lib/email-service.ts
import sgMail from '@sendgrid/mail';

class EmailService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);
  }

  private log(message: string, error?: any) {
    if (error) {
      console.error(`[EmailService] ${message}`, error);
    } else {
      console.log(`[EmailService] ${message}`);
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

  async sendBulkEmails(
    recipients: Array<{ email: string; name?: string; businessNames?: string[] }>,
    subject: string,
    template: string
  ): Promise<void> {
    this.log(`Sending bulk emails to ${recipients.length} recipients`);

    const messages = recipients.map(recipient => ({
      to: recipient.email,
      from: '"SalesPath" <hi@salespath.co.za>',
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          ${template
            .replace(/{{name}}/g, recipient.name ?? 'there')
            .replace(/{{businessNames}}/g, recipient.businessNames?.join(', ') ?? 'your business')}
          <p style="margin-top: 20px; color: #666; font-size: 14px;">
            Best regards,<br>The SalesPath Team
          </p>
        </div>
      `,
    }));

    try {
      // Send in batches of 100 to avoid rate limits
      for (let i = 0; i < messages.length; i += 100) {
        const batch = messages.slice(i, i + 100);
        //await sgMail.sendMultiple(batch);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between batches
      }
      this.log('Bulk emails sent successfully');
    } catch (error) {
      this.log('Error sending bulk emails', error);
      throw new Error('Failed to send bulk emails');
    }
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    this.log(`Sending verification email to ${to}`);
    const verificationLink = `${process.env.NEXT_PUBLIC_DOMAIN}/verify-email?token=${token}`;

    const msg = {
      to,
      from: '"SalesPath" <hi@salespath.co.za>',
      subject: 'Verify Your Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <h1 style="color: #007bff;">Verify Your Email</h1>
          <p>Please click the button below to verify your email address:</p>
          <p style="text-align: center;">
            <a href="${verificationLink}"
               style="display: inline-block; padding: 12px 24px; background-color: #007bff; 
                      color: white; text-decoration: none; border-radius: 5px;">
              Verify Email
            </a>
          </p>
          <p style="margin-top: 20px; font-size: 14px; color: #666;">
            If you did not create an account, please ignore this email.
          </p>
        </div>
      `,
    };

    try {
      await sgMail.send(msg);
      this.log(`Verification email sent successfully to ${to}`);
    } catch (error) {
      this.log(`Error sending verification email to ${to}`, error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    this.log(`Sending password reset email to ${to}`);
    const resetLink = `${process.env.NEXT_PUBLIC_DOMAIN}/reset-password?token=${token}`;

    const msg = {
      to,
      from: '"SalesPath" <hi@salespath.co.za>',
      subject: 'Reset Your Password',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <h1 style="color: #007bff;">Reset Your Password</h1>
          <p>Click the button below to reset your password:</p>
          <p style="text-align: center;">
            <a href="${resetLink}"
               style="display: inline-block; padding: 12px 24px; background-color: #007bff; 
                      color: white; text-decoration: none; border-radius: 5px;">
              Reset Password
            </a>
          </p>
          <p style="margin-top: 20px; font-size: 14px; color: #666;">
            If you did not request a password reset, please ignore this email.
            This link will expire in 1 hour.
          </p>
        </div>
      `,
    };

    try {
      await sgMail.send(msg);
      this.log(`Password reset email sent successfully to ${to}`);
    } catch (error) {
      this.log(`Error sending password reset email to ${to}`, error);
      throw new Error('Failed to send password reset email');
    }
  }

  async sendSubscriptionStatusEmail(
    to: string, 
    businessName: string, 
    status: string,
    expiryDate?: Date
  ): Promise<void> {
    this.log(`Sending subscription status email to ${to}`);

    let statusMessage = '';
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        statusMessage = 'Your subscription is now active.';
        break;
      case 'EXPIRED':
        statusMessage = 'Your subscription has expired.';
        break;
      case 'CANCELLED':
        statusMessage = 'Your subscription has been cancelled.';
        break;
      case 'PAST_DUE':
        statusMessage = 'Your subscription payment is past due.';
        break;
      default:
        statusMessage = `Your subscription status is: ${status}`;
    }

    const msg = {
      to,
      from: '"SalesPath" <hi@salespath.co.za>',
      subject: `Subscription Update for ${businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <h1 style="color: #007bff;">Subscription Update</h1>
          <p>Hello,</p>
          <p>${statusMessage}</p>
          ${expiryDate ? `
            <p>Your subscription will expire on: ${expiryDate.toLocaleDateString()}</p>
          ` : ''}
          <p>If you have any questions or concerns, please don't hesitate to contact our support team.</p>
        </div>
      `,
    };

    try {
      await sgMail.send(msg);
      this.log(`Subscription status email sent successfully to ${to}`);
    } catch (error) {
      this.log(`Error sending subscription status email to ${to}`, error);
      throw new Error('Failed to send subscription status email');
    }
  }

  async sendOfferMonitoringUpdate(
    to: string,
    businessName: string,
    offerDetails: { 
      title: string; 
      currentPrice: number; 
      previousPrice: number;
      inBuyBox: boolean;
    }
  ): Promise<void> {
    this.log(`Sending offer monitoring update to ${to}`);

    const priceChange = offerDetails.currentPrice - offerDetails.previousPrice;
    const priceChangeText = priceChange > 0 
      ? `increased by R${Math.abs(priceChange).toFixed(2)}`
      : `decreased by R${Math.abs(priceChange).toFixed(2)}`;

    const msg = {
      to,
      from: '"SalesPath" <hi@salespath.co.za>',
      subject: `Offer Update for ${businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <h1 style="color: #007bff;">Offer Monitoring Update</h1>
          <p>Hello,</p>
          <p>We've detected changes to your monitored offer:</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Offer:</strong> ${offerDetails.title}</p>
            <p><strong>Price:</strong> Has ${priceChangeText}</p>
            <p><strong>Current Price:</strong> R${offerDetails.currentPrice.toFixed(2)}</p>
            <p><strong>Buy Box Status:</strong> ${offerDetails.inBuyBox ? 'In Buy Box' : 'Not in Buy Box'}</p>
          </div>
          <p>You can view more details and make adjustments in your SalesPath dashboard.</p>
        </div>
      `,
    };

    try {
      await sgMail.send(msg);
      this.log(`Offer monitoring update sent successfully to ${to}`);
    } catch (error) {
      this.log(`Error sending offer monitoring update to ${to}`, error);
      throw new Error('Failed to send offer monitoring update');
    }
  }
}

export const emailService = new EmailService();