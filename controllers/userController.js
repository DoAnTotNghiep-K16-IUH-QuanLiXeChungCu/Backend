const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const s3Client = new S3Client({ region: "your-region" });
const mongoose = require("mongoose");
const RFIDCard = require("../models/RFIDCard");

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
      path: req.originalUrl,
    });
  };

  try {
    // Kiểm tra định dạng username
    if (!usernameRegex.test(username)) {
      return sendResponse(
        "400",
        "",
        "Tên đăng nhập không được chứa dấu và chỉ bao gồm chữ cái và số"
      );
    }

    // Kiểm tra định dạng password
    if (!passwordRegex.test(password)) {
      return sendResponse("400", "", "Mật khẩu không được chứa khoảng trắng");
    }

    // Tìm người dùng theo username
    const user = await User.findOne({ username, isDelete: false }).populate({
      path: "rfidCard",
      select: "_id uuid ",
    });
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
        role: user.role,
      },
      process.env.JWT_ACCESS_KEY, // Mã bí mật JWT từ biến môi trường
      { expiresIn: "24h" } // Hạn sử dụng của JWT là 1 giờ
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
  const {
    username,
    password,
    birthDay,
    address,
    fullname,
    phoneNumber,
    email,
    rfidCard,
  } = req.body;

  // Kiểm tra xem tất cả các trường cần thiết có trong request body không
  if (!username || !password || !phoneNumber || !email) {
    return res.status(400).json({
      status: 400,
      data: null,
      error: "Các trường username, password, phoneNumber và email là bắt buộc.",
    });
  }

  // Regex để kiểm tra các định dạng
  const usernameRegex = /^[a-zA-Z0-9]+$/; // Username không dấu và không ký tự đặc biệt
  const passwordRegex = /^\S+$/; // Password không chứa khoảng trắng
  const phoneNumberRegex = /^\d{10,11}$/; // Số điện thoại có 10 hoặc 11 số
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Kiểm tra định dạng email cơ bản

  // Hàm chung để trả về phản hồi
  const sendResponse = (status, data, error) => {
    return res.status(parseInt(status)).json({
      status: status,
      data: data,
      error: error,
      path: req.originalUrl,
    });
  };

  try {
    // Kiểm tra định dạng username
    if (username && !usernameRegex.test(username)) {
      return sendResponse(
        "400",
        "",
        "Tên đăng nhập không được chứa dấu và chỉ bao gồm chữ cái và số"
      );
    }

    // Kiểm tra định dạng password
    if (password && !passwordRegex.test(password)) {
      return sendResponse("400", "", "Mật khẩu không được chứa khoảng trắng");
    }

    // Kiểm tra định dạng số điện thoại
    if (phoneNumber && !phoneNumberRegex.test(phoneNumber)) {
      return sendResponse("400", "", "Số điện thoại phải có 10 hoặc 11 chữ số");
    }

    // Kiểm tra định dạng email
    if (email && !emailRegex.test(email)) {
      return sendResponse("400", "", "Email không hợp lệ");
    }

    // Kiểm tra xem username đã tồn tại hay chưa
    const existingUser = await User.findOne({ username, isDelete: false });
    if (existingUser) {
      return sendResponse("400", "", "Tên đăng nhập đã tồn tại");
    }

    // Kiểm tra xem email đã được sử dụng chưa
    const existingEmail = await User.findOne({ email, isDelete: false });
    if (existingEmail) {
      return sendResponse("400", "", "Email đã được sử dụng");
    }

    // Nếu có rfidCard, kiểm tra tính hợp lệ của nó (giả sử là ObjectId hợp lệ)
    if (rfidCard && !mongoose.Types.ObjectId.isValid(rfidCard)) {
      return sendResponse("400", "", "rfidCard không hợp lệ");
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tạo người dùng mới
    const newUser = new User({
      username: username,
      password: hashedPassword, // Mật khẩu đã được mã hóa
      birthDay: birthDay,
      fullname: fullname,
      address: address,
      phoneNumber: phoneNumber,
      email: email,
      rfidCard: rfidCard, // gắn rfidCard vào User
    });

    // Lưu người dùng mới vào cơ sở dữ liệu
    const savedUser = await newUser.save();

    // Populate thông tin rfidCard
    await savedUser.populate("rfidCard"); // Sử dụng .populate() để lấy thông tin chi tiết của rfidCard

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
        error: "pageNumber không hợp lệ, phải là một số nguyên dương.",
      });
    }

    if (isNaN(parsedPageSize) || parsedPageSize <= 0) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "pageSize không hợp lệ, phải là một số nguyên dương.",
      });
    }

    const skip = (parsedPageNumber - 1) * parsedPageSize;

    // Tổng số người dùng
    const totalUsers = await User.countDocuments();

    if (totalUsers === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không có người dùng nào được tìm thấy.",
      });
    }

    // Lấy danh sách người dùng với phân trang
    const users = await User.find({})
      .select("-password")
      .populate({
        path: "rfidCard",
        select: "_id uuid ",
      })
      .skip(skip)
      .limit(parsedPageSize);

    if (users.length === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy người dùng cho trang này.",
      });
    }

    const totalPages = Math.ceil(totalUsers / parsedPageSize);

    return res.status(200).json({
      status: 200,
      data: {
        users, // Danh sách người dùng
        currentPage: parsedPageNumber, // Trang hiện tại
        pageSize: parsedPageSize, // Số lượng bản ghi mỗi trang
        totalUsers, // Tổng số người dùng
        totalPages, // Tổng số trang
      },
      error: null,
    });
  } catch (error) {
    console.error(`Lỗi trong GetAllUsers:`, error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};
const GetAllUsersNonDelete = async (req, res) => {
  try {
    const { pageNumber = 1, pageSize = 10 } = req.body;

    // Kiểm tra pageNumber và pageSize
    const parsedPageNumber = parseInt(pageNumber, 10);
    const parsedPageSize = parseInt(pageSize, 10);

    if (isNaN(parsedPageNumber) || parsedPageNumber <= 0) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "pageNumber không hợp lệ, phải là một số nguyên dương.",
      });
    }

    if (isNaN(parsedPageSize) || parsedPageSize <= 0) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "pageSize không hợp lệ, phải là một số nguyên dương.",
      });
    }

    const skip = (parsedPageNumber - 1) * parsedPageSize;

    // Tổng số người dùng
    const totalUsers = await User.countDocuments();

    if (totalUsers === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không có người dùng nào được tìm thấy.",
      });
    }

    // Lấy danh sách người dùng với phân trang
    const users = await User.find({ isDelete: false })
      .select("-password")
      .populate({
        path: "rfidCard",
        select: "_id uuid ",
      }) // Bỏ trường password khi trả về
      .skip(skip)
      .limit(parsedPageSize);

    if (users.length === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy người dùng cho trang này.",
      });
    }

    const totalPages = Math.ceil(totalUsers / parsedPageSize);

    return res.status(200).json({
      status: 200,
      data: {
        users, // Danh sách người dùng
        currentPage: parsedPageNumber, // Trang hiện tại
        pageSize: parsedPageSize, // Số lượng bản ghi mỗi trang
        totalUsers, // Tổng số người dùng
        totalPages, // Tổng số trang
      },
      error: null,
    });
  } catch (error) {
    console.error(`Lỗi trong GetAllUsers:`, error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};
const UpdateUser = async (req, res) => {
  try {
    const {
      id,
      username,
      fullname,
      birthDay,
      address,
      phoneNumber,
      role,
      password,
      email,
      isDelete,
      rfidCard,
    } = req.body;

    // Kiểm tra tính hợp lệ của id
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "ID không hợp lệ.",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy người dùng với ID này.",
      });
    }

    if (rfidCard) {
      if (!mongoose.Types.ObjectId.isValid(rfidCard)) {
        return res.status(400).json({
          status: 400,
          data: null,
          error: "rfidCard không hợp lệ.",
        });
      }

      const rfidCardOb = await RFIDCard.findById(rfidCard);
      if (!rfidCardOb) {
        return res.status(404).json({
          status: 404,
          data: null,
          error: "Không tìm thấy thẻ với ID này.",
        });
      }

      user.rfidCard = rfidCard;
    }

    // Kiểm tra định dạng của các trường khác
    const usernameRegex = /^[a-zA-Z0-9]+$/;
    const passwordRegex = /^\S+$/; // Không chứa khoảng trắng
    const phoneNumberRegex = /^\d{10,11}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (username && !usernameRegex.test(username)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "Tên đăng nhập không hợp lệ.",
      });
    }

    if (password && !passwordRegex.test(password)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "Mật khẩu không được chứa khoảng trắng.",
      });
    }

    if (phoneNumber && !phoneNumberRegex.test(phoneNumber)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "Số điện thoại phải có 10 hoặc 11 chữ số.",
      });
    }

    if (email && !emailRegex.test(email)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "Email không hợp lệ.",
      });
    }

    if (email) {
      const existingEmailUser = await User.findOne({ email });
      if (existingEmailUser && existingEmailUser.id !== id) {
        return res.status(400).json({
          status: 400,
          data: null,
          error: "Email đã được sử dụng bởi người dùng khác.",
        });
      }
    }

    if (role) {
      const validRoles = ["Admin", "User", "Manager"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          status: 400,
          data: null,
          error: 'Giá trị role phải là "Admin", "User", hoặc "Manager".',
        });
      }
    }

    // Cập nhật thông tin
    user.username = username || user.username;
    user.fullname = fullname || user.fullname;
    user.birthDay = birthDay || user.birthDay;
    user.address = address || user.address;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.role = role || user.role;
    user.email = email || user.email;
    user.isDelete = isDelete !== undefined ? isDelete : user.isDelete;

    // Mã hóa và cập nhật mật khẩu nếu có
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    // Lưu người dùng sau khi cập nhật
    await user.save();

    // Trả về thông tin người dùng đã cập nhật mà không có password
    const userWithoutPassword = await User.findById(id)
      .select("-password")
      .populate({
        path: "rfidCard",
        select: "_id uuid",
      });

    return res.status(200).json({
      status: 200,
      data: userWithoutPassword,
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong UpdateUser:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

const DeleteUsers = async (req, res) => {
  try {
    const { id } = req.body;

    console.log("id ", id);

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "ID không hợp lệ.",
      });
    }
    // Xoá người dùng trong cơ sở dữ liệu
    const deleteResult = await User.findByIdAndDelete(id);

    // Kiểm tra số lượng bản ghi đã xoá
    if (!deleteResult) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy người dùng nào với ID đã cung cấp.",
      });
    }

    // Trả về kết quả thành công
    return res.status(200).json({
      status: 200,
      data: { message: "Tài khoản đã được đánh dấu là xóa.", deleteResult },
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong deleteUsers:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

const GetUserByRFIDCard = async (req, res) => {
  try {
    const { uuid } = req.body;

    // Kiểm tra xem uuid có được cung cấp hay không
    if (!uuid) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "UUID không được cung cấp.",
      });
    }

    // Tìm RFIDCard theo uuid
    const RFIDCardOb = await RFIDCard.findOne({ uuid });

    // Kiểm tra nếu không tìm thấy RFIDCard
    if (!RFIDCardOb) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy Thẻ nào có ID đã cung cấp.",
      });
    }
    const rfidCardIdString = RFIDCardOb._id.toString();

    // Tìm người dùng dựa trên rfidCard đã tìm được
    const userFinded = await User.findOne({
      rfidCard: rfidCardIdString,
    }).populate({
      path: "rfidCard",
      select: "_id uuid",
    });

    // Kiểm tra nếu không tìm thấy người dùng nào
    if (!userFinded) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy User nào có thẻ với uuid đã cung cấp.",
      });
    }

    // Trả về người dùng tìm được
    return res.status(200).json({
      status: 200,
      data: userFinded,
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong GetUserByRFIDCard:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};
const checkPassword = async (req, res) => {
  try {
    const { userName, password } = req.body;

    // Kiểm tra input có hợp lệ không
    if (!userName || !password) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "Thiếu tên đăng nhập hoặc mật khẩu.",
      });
    }

    // Tìm người dùng theo userName
    const user = await User.findOne({ username: userName });

    if (!user) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy người dùng với tên đăng nhập này.",
      });
    }

    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: 401,
        data: null,
        error: "Mật khẩu không chính xác.",
      });
    }

    return res.status(200).json({
      status: 200,
      data: "Mật khẩu chính xác.",
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong checkPassword:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

module.exports = {
  login,
  signup,
  GetAllUsers,
  GetAllUsersNonDelete,
  UpdateUser,
  DeleteUsers,
  GetUserByRFIDCard,
  checkPassword, // Thêm hàm deleteUsers vào module export
};
