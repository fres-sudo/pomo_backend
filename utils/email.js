import {createTransport} from "nodemailer";
import pug from "pug"
import { htmlToText } from "html-to-text";

import {Recipient, EmailParams, MailerSend} from "mailersend";


export class Email {

  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.username
    this.url = url;
    this.from = `Francesco Calicchio <${process.env.EMAIL_FROM}>`
  }

  newTransport(){
    return createTransport({
      host: process.env.BREVO_HOST,
      port: process.env.BREVO_PORT,
      auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASS,
      }
    });
  }  

  async send(template, subject){
    //Render HTML based on pug template
    const html = pug.renderFile(`/Users/fres/dev/projects/pomo_backend/views/email/passwordReset.pug` , 
    {
      firstName: this.firstName,
      url: this.url,
      subject
    });
    
    //Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: "CIAOO"
    };

    //Create transport and send email
    await this.newTransport().sendMail(mailOptions);

  }

  async sendWelcome(){
   await this.send('welcome', 'Welcome to the Pomo family!');
  }

  async sendPasswordReset() {
    try {
      await this.send('passwordReset', 'Your password reset token (valid for only 10 minutes)');
      console.log("Password reset email sent successfully.");
    } catch (error) {
      console.error("Error sending password reset email:", error);
      throw new Error('Error sending password reset email');
    }
  }
  

};

export const sendAPI  = async () => {

  console.log("ENTERED SEND");
  const mailersend = new MailerSend({
    api_key: "5aabcbe6ab8df56054c26d8fefd3dcc9bdc6ba9d4dcc2680994a95d782cc20e8"
  });

  console.log({mailersend});

  const recipients = [
    new Recipient("francescocalicchio@hotmail.com", "Francesco Calicchio")
  ];

  console.log({recipients});

  const emailParams = new EmailParams()
        .setFrom("francescocalicchio@hotmail.com")
        .setFromName("Your Name")
        .setRecipients(recipients)
        .setSubject("Subject")
        .setHtml("This is the HTML content")
        .setText("This is the text content");

  mailersend.send(emailParams);
}

