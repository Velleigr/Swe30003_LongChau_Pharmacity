const express = require("express");
const { sendEmail } = require("../controllers/mail.controller");
const mailRouter = express.Router();

mailRouter.get("/", (req, res) => {
    return res.status(200).json("Success Get");
});


mailRouter.get("/subscribe", (req, res) => {
    return res.status(200).json("Success Get Subscribe");
});


mailRouter.post("/subscribe", sendEmail); // call the sendEmail in the controller

module.exports = mailRouter; //export default