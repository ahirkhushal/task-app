const nodemailer = require("nodemailer");

const config = {
  service: "gmail",
  auth: { user: process.env.OWNER_EMAIL, pass: process.env.EMAIL_PASS },
};

const returnEmail = (mail) => nodemailer.createTransport(config).sendMail(mail);

const sendWelcomEmail = (email, name) => {
  const mail = {
    to: email,
    from: process.env.OWNER_EMAIL,
    subject: "thanks for joining in",
    text: `welcome to the app ${name}. let me know how get along with the app.`,
  };

  return returnEmail(mail);
};

const sendGoodByeEmail = (email, name) => {
  const mail = {
    to: email,
    from: process.env.OWNER_EMAIL,
    subject: "Sorry to see you go!",
    text: `GoodBye ${name} , I hope to see you back sometime soon.`,
  };

  return returnEmail(mail);
};

module.exports = {
  sendWelcomEmail,
  sendGoodByeEmail,
};
