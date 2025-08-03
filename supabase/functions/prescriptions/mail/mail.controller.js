const transporter = require("../config/mailer");
require("dotenv").config();


const sendEmail = async (req, res) => {

    const { email } = req.body;
  
    if (!email) {
        console.log("debugging -----", email);
        return res.status(400).json({ message: "Email is required" });
    }

    const emailHtml = `
    <div>
        <h1 style="color: #000;">Welcome to Creeper! 🎉</h1>
        <p style="color: #333;">Thank you for subscribing! Stay tuned for the latest updates.📝</p>
        <p>If you have any questions, feel free to contact us.💌 </p>
        <p style="color: #888;">&copy; 2025 Creeper Trading Platform. All Rights Reserved.</p>
    </div>
    `;

    const path = require("path");

    //email details
    const mailOptions = {
        from: process.env.EMAIL_USER,  // Creeper email from .env
        to: email,  // The user's email
        subject: "Subscription Confirmation",
        html: emailHtml,
        attachments: [{
            filename: "Logo.png",
            // path: "../../../frontend/src/assets/Logo.png"
            path: path.resolve(__dirname, "../../../frontend/public/Logo.png") 
        }]
    };

    // send the email with nodemailer
    try {
        await transporter.sendMail(mailOptions);
        res
            .status(200)
            .json({ message: "Email sent successfully - Check your email 📮" });
    } catch (error) {
        console.error("Error sending email:", error);
        res
            .status(500)
            .json({ message: "Email sending failed 😫 - Try again later" });
    }
};

module.exports = {
    sendEmail,
};
