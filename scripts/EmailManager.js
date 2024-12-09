const nm = require('nodemailer')
const fs = require("fs/promises")
const { JSDOM } = require("jsdom")
const Crypto = require("crypto")
const UserManager = require('./UserManager')

const userManager = new UserManager()


const transporter = nm.createTransport({
    port: 465,
    host: "mail.the-caretaker.org", 
    secure: true,
    auth: {
        user: "no-reply@expunged.eu",
        pass: "T5vMYxM2%ic7&m",
    },
    

});

transporter.verify((error, success) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Server is ready to take our messages");
    }
});

const sendMail = async (recipient, subject, htmlContent) => {
  const info = await transporter.sendMail({
      from: 'no-reply@expunged.eu',
      to: recipient,
      subject,
      html: htmlContent,
      envelope: {
          from: "No-Reply <no-reply@expunged.eu>",
          to: recipient,
      }
  });

  console.log(info.messageId)
}

/**
 * 
 * @param {User} user 
 */
module.exports.sendConfirmationEmail = async (user) => {
 
    const hashToken = Crypto.createHash("sha256").update(user.getValue("UUID")+user.getValue("Email")).digest("hex")
  
    const dom = new JSDOM(await fs.readFile(__dirname + '/../emails/confimation.html', "utf-8"))
    dom.window.document.getElementById("custom-name").innerHTML = `Hello, ${user.getValue("FirstName")}`
    dom.window.document.getElementById("confirmation-URL").setAttribute("href", "http://localhost:3000/verify?token="+hashToken+"&email="+user.getValue("Email"))
    dom.window.document.getElementById("unsubscribe-URL").setAttribute("href", "http://localhost:3000/unsubscribe?token="+hashToken+"&email="+user.getValue("Email"))
  
    await sendMail(user.getValue("Email"), "Newsletter Signup Confirmation", dom.window.document.documentElement.outerHTML)
  }
  
  /**
 * 
 * @param {User} user 
 */
  module.exports.sendForgotPasswordEmail = async (user) => {
  
    const hashToken = Crypto.createHash("sha256").update(user.getValue("UUID")+user.getValue("Email")).digest("hex")
    const tempCode = crypto.randomUUID()

    if (!(user.hasProperty('tempCode'))) {
      await user.addProperty('tempCode')
    }
    
    await user.setValue('tempCode', tempCode)
  
    const dom = new JSDOM(await fs.readFile(__dirname + '/../emails/forgot-password.html', "utf-8"))
    dom.window.document.getElementById("reset-URL").setAttribute("href", "http://localhost:3000/reset-password?token="+hashToken+"&email="+user.getValue("Email")+"&tempCode="+tempCode)
  
    await sendMail(user.getValue("Email"), "Reset Password", dom.window.document.documentElement.outerHTML)
  }
