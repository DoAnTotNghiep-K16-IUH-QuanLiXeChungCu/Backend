const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const multer = require("multer");
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client({ region: 'your-region' });
const mongoose = require('mongoose');

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
      { expiresIn: "6h" } // Hạn sử dụng của JWT là 1 giờ
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

const GetAllUsers = async (req, res) => {
  try {
    const { pageNumber = 1, pageSize = 10 } = req.body;

    // Kiểm tra pageNumber và pageSize
    const parsedPageNumber = parseInt(pageNumber, 10);
    const parsedPageSize = parseInt(pageSize, 10);

    if (isNaN(parsedPageNumber) || parsedPageNumber <= 0) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'pageNumber không hợp lệ, phải là một số nguyên dương.'
      });
    }

    if (isNaN(parsedPageSize) || parsedPageSize <= 0) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'pageSize không hợp lệ, phải là một số nguyên dương.'
      });
    }

    const skip = (parsedPageNumber - 1) * parsedPageSize;

    // Tổng số người dùng
    const totalUsers = await User.countDocuments();

    if (totalUsers === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không có người dùng nào được tìm thấy.'
      });
    }

    // Lấy danh sách người dùng với phân trang
    const users = await User.find({})
      .select('-password') // Bỏ trường password khi trả về
      .skip(skip)
      .limit(parsedPageSize);

    if (users.length === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy người dùng cho trang này.'
      });
    }

    const totalPages = Math.ceil(totalUsers / parsedPageSize);

    return res.status(200).json({
      status: 200,
      data: {
        users,            // Danh sách người dùng
        currentPage: parsedPageNumber,  // Trang hiện tại
        pageSize: parsedPageSize,       // Số lượng bản ghi mỗi trang
        totalUsers,       // Tổng số người dùng
        totalPages        // Tổng số trang
      },
      error: null
    });

  } catch (error) {
    console.error(`Lỗi trong GetAllUsers:`, error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const UpdateUser = async (req, res) => {
  try {
    const { id, username, age, address, phoneNumber, role, password } = req.body;

    // Kiểm tra tính hợp lệ của id
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'id không hợp lệ.'
      });
    }

    // Tìm người dùng theo id
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy người dùng với id này.'
      });
    }

    // Regex validation giống với signup
    const usernameRegex = /^[a-zA-Z0-9]+$/;
    const passwordRegex = /^\S+$/; // Không chứa khoảng trắng
    const phoneNumberRegex = /^\d{10,11}$/; // Chỉ chứa 10-11 số

    // Kiểm tra định dạng username nếu có
    if (username && !usernameRegex.test(username)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'Tên đăng nhập không được chứa dấu và chỉ bao gồm chữ cái và số'
      });
    }

    // Kiểm tra định dạng password nếu có
    if (password && !passwordRegex.test(password)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'Mật khẩu không được chứa khoảng trắng'
      });
    }

    // Kiểm tra định dạng số điện thoại nếu có
    if (phoneNumber && !phoneNumberRegex.test(phoneNumber)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'Số điện thoại phải có 10 hoặc 11 chữ số'
      });
    }

    // Nếu role có trong request, kiểm tra xem nó có hợp lệ hay không
    if (role) {
      const validRoles = ['Admin', 'User'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          status: 400,
          data: null,
          error: 'Giá trị role phải là "Admin" hoặc "User".'
        });
      }
    }

    // Cập nhật các trường cần thiết
    user.username = username || user.username;
    user.age = age || user.age;
    user.address = address || user.address;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.role = role || user.role;

    // Nếu có mật khẩu mới trong request, mã hóa mật khẩu trước khi lưu
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      user.password = hashedPassword;
    }

    // Lưu lại bản ghi đã cập nhật
    await user.save();

    // Bỏ trường password trước khi trả về
    const { password: _, ...userWithoutPassword } = user._doc;

    return res.status(200).json({
      status: 200,
      data: userWithoutPassword, // Trả về thông tin người dùng mà không có password
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong UpdateUser:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

module.exports = {
  login,
  signup,
  GetAllUsers,
  UpdateUser
};
