import nodemailer from "nodemailer";

export default sendEmail = async (options) => {
  // Create a transporter

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  // Define email options

  const mailOptions = {
    from: "Francesco Calicchio <prova@prova.it>",
    to: options.email,
    subject: options.subject,
    text: options.maessage,
  };

  // Actually send the email

  await transporter.sendMail(mailOptions);
};
