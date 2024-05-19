import { createTransport } from 'nodemailer';
import pug from 'pug';
import AppError from '../utils/appError.js';

export class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.username;
    this.url = url;
    this.from = `Francesco Calicchio <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    return createTransport({
      host: process.env.BREVO_HOST,
      port: process.env.BREVO_PORT,
      auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASS,
      },
    });
  }

  async send(template, subject) {
    //Render HTML based on pug template
    const html = pug.renderFile(
      `/Users/fres/dev/projects/pomo_backend/views/email/passwordReset.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      }
    );

    //Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
    };

    //Create transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Pomo family!');
  }

  async sendPasswordReset() {
    try {
      await this.send(
        'passwordReset',
        'Your password reset token (valid for only 10 minutes)'
      );
    } catch (error) {
      throw new AppError('Error sending password reset email', 400);
    }
  }
}
