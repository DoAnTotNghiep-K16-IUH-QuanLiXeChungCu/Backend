const nodemailer = require('nodemailer');

const sendOtp = async (email) => {
  const otp = Math.floor(100000 + Math.random() * 900000); // Tạo OTP 6 chữ số
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Email của bạn
      pass: process.env.EMAIL_PASS  // Mật khẩu ứng dụng (app password)
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'OTP của bạn',
    text: `Mã OTP của bạn là: ${otp}`
  };

  await transporter.sendMail(mailOptions);

  return otp;
};

module.exports = { sendOtp };
