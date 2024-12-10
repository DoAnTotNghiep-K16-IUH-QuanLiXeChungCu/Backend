const { Router } = require("express");
const otpController = require("../controllers/OtpController");
const router = Router();

router.post("/send-otp",  otpController.SendOtp);

module.exports = router;
