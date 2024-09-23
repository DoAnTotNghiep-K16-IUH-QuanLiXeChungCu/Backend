const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const multer = require("multer");
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client({ region: 'your-region' });

// Hàm đăng nhập
const login = async (req, res) => {
  const { username, password } = req.body;

  // Regex để kiểm tra username không dấu và password không có khoảng trắng
  const usernameRegex = /^[a-zA-Z0-9]+$/;
  const passwordRegex = /^\S+$/; // Không chứa khoảng trắng

  // Hàm chung để trả về phản hồi
  const sendResponse = (status, data, error) => {
    return res.status(parseInt(status)).json({
      status: status,
      data: data,
      error: error,
      path: req.originalUrl
    });
  };

  try {
    // Kiểm tra định dạng username
    if (!usernameRegex.test(username)) {
      return sendResponse("400", "", "Tên đăng nhập không được chứa dấu và chỉ bao gồm chữ cái và số");
    }

    // Kiểm tra định dạng password
    if (!passwordRegex.test(password)) {
      return sendResponse("400", "", "Mật khẩu không được chứa khoảng trắng");
    }

    // Tìm người dùng theo username
    const user = await User.findOne({ username });
    if (!user) {
      return sendResponse("401", "", "Tên đăng nhập không hợp lệ");
    }

    // Kiểm tra mật khẩu
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return sendResponse("401", "", "Mật khẩu không hợp lệ");
    }

    // Tạo mã JWT nếu thông tin đăng nhập hợp lệ
    const accessToken = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_ACCESS_KEY, // Mã bí mật JWT từ biến môi trường
      { expiresIn: "1h" } // Hạn sử dụng của JWT là 1 giờ
    );

    // Destructuring sau khi truy cập user._doc, bỏ thuộc tính password
    const { password: _, ...info } = user._doc; // Bỏ mật khẩu trước khi trả về
    return sendResponse("200", { ...info, accessToken }, null);
  } catch (error) {
    console.error(error);
    return sendResponse("500", "", "Lỗi máy chủ");
  }
};


const signup = async (req, res) => {
  const { username, password, age, address, phoneNumber } = req.body;

  // Regex để kiểm tra username không dấu và password không có khoảng trắng
  const usernameRegex = /^[a-zA-Z0-9]+$/;
  const passwordRegex = /^\S+$/; // Không chứa khoảng trắng
  const phoneNumberRegex = /^\d{10,11}$/; // Chỉ chứa 10-11 số

  // Hàm chung để trả về phản hồi
  const sendResponse = (status, data, error) => {
    return res.status(parseInt(status)).json({
      status: status,
      data: data,
      error: error,
      path: req.originalUrl
    });
  };

  try {
    // Kiểm tra định dạng username
    if (!usernameRegex.test(username)) {
      return sendResponse("400", "", "Tên đăng nhập không được chứa dấu và chỉ bao gồm chữ cái và số");
    }

    // Kiểm tra định dạng password
    if (!passwordRegex.test(password)) {
      return sendResponse("400", "", "Mật khẩu không được chứa khoảng trắng");
    }

    // Kiểm tra định dạng số điện thoại
    if (!phoneNumberRegex.test(phoneNumber)) {
      return sendResponse("400", "", "Số điện thoại phải có 10 hoặc 11 chữ số");
    }

    // Kiểm tra xem username đã tồn tại hay chưa
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return sendResponse("400", "", "Tên đăng nhập đã tồn tại");
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tạo người dùng mới
    const newUser = new User({
      username: username,
      password: hashedPassword, // Mật khẩu đã được mã hóa
      age: age,
      address: address,
      phoneNumber: phoneNumber,
    });

    // Lưu người dùng mới vào cơ sở dữ liệu
    const savedUser = await newUser.save();

    // Trả về thông tin người dùng (không bao gồm mật khẩu)
    const { password: _, ...info } = savedUser._doc;
    return sendResponse("200", info, null);
  } catch (error) {
    console.error(error);
    return sendResponse("500", "", "Lỗi máy chủ");
  }
};


module.exports = {
  login,
  signup
};
