const PayRoll = require("../models/PayRoll");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const s3Client = new S3Client({ region: "your-region" });
const mongoose = require("mongoose");
const User = require("../models/User");
const GetPayRollByID = async (req, res) => {
  try {
    const { id } = req.body;

    // Kiểm tra id hợp lệ
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "ID không hợp lệ.",
      });
    }

    // Tìm PayRoll và populate các thông tin liên quan
    const payRoll = await PayRoll.findById(id).populate({
      path: "userID",
      select: "fullname age address phoneNumber email",
    });

    if (!payRoll) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy PayRoll với ID này.",
      });
    }

    return res.status(200).json({
      status: 200,
      data: payRoll,
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong GetPayRollByID:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

const GetAllPayRolls = async (req, res) => {
  try {
    const { pageNumber = 1, pageSize = 10 } = req.body;

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

    const totalPayRolls = await PayRoll.countDocuments();
    const payRolls = await PayRoll.find()
      .populate({
        path: "userID",
        select: "fullname age address phoneNumber email",
      })
      .skip(skip)
      .limit(parsedPageSize);

    if (totalPayRolls === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không có PayRoll nào được tìm thấy.",
      });
    }

    const totalPages = Math.ceil(totalPayRolls / parsedPageSize);

    return res.status(200).json({
      status: 200,
      data: {
        payRolls,
        currentPage: parsedPageNumber,
        pageSize: parsedPageSize,
        totalPayRolls,
        totalPages,
      },
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong GetAllPayRolls:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

const UpdatePayRoll = async (req, res) => {
  try {
    const {
      id,
      userID,
      payPeriod,
      totalRegularHours,
      totalOvertimeHours,
      basicSalary,
      overtimeSalary,
      deductions,
      allowance,
      totalSalary,
      note,
    } = req.body;

    // Kiểm tra id hợp lệ
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "ID không hợp lệ.",
      });
    }

    // Tìm PayRoll cần cập nhật
    const payRoll = await PayRoll.findById(id);

    if (!payRoll) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy PayRoll với ID này.",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(userID)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "users_shiftId không hợp lệ.",
      });
    }
    const user = await User.findById(userID).select(
      "fullname age address phoneNumber"
    );
    // console.log("user", user);

    if (!user) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "user không tồn tại trong cơ sở dữ liệu.",
      });
    }

    // Cập nhật các trường cần thiết
    if (userID) payRoll.userID = userID;
    if (payPeriod) payRoll.payPeriod = payPeriod;
    if (totalRegularHours) payRoll.totalRegularHours = totalRegularHours;
    if (totalOvertimeHours) payRoll.totalOvertimeHours = totalOvertimeHours;
    if (basicSalary) payRoll.basicSalary = basicSalary;
    if (overtimeSalary) payRoll.overtimeSalary = overtimeSalary;
    if (deductions) payRoll.deductions = deductions;
    if (allowance) payRoll.allowance = allowance;
    if (totalSalary) payRoll.totalSalary = totalSalary;
    if (note) payRoll.note = note;

    // Lưu lại bản ghi đã cập nhật
    await payRoll.save();
    const newPayRoll = await UserShift.findById(payRoll._id).populate({
      path: "userID",
      select: "fullname age address phoneNumber email",
    });
    return res.status(200).json({
      status: 200,
      data: newPayRoll,
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong UpdatePayRoll:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

const CreatePayRoll = async (req, res) => {
  try {
    const { userID } = req.body;

    // Kiểm tra tính hợp lệ của userID
    if (!mongoose.Types.ObjectId.isValid(userID)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "userID không hợp lệ.",
      });
    }

    // Kiểm tra xem user có tồn tại không
    const user = await User.findById(userID).select(
      "fullname age address phoneNumber"
    );

    if (!user) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "User không tồn tại trong cơ sở dữ liệu.",
      });
    }

    // Giá trị mặc định cho các trường còn lại
    const payPeriod = new Date(); // Ngày hiện tại
    const totalRegularHours = 0;
    const totalOvertimeHours = 0;
    const basicSalary = 0;
    const overtimeSalary = 0;
    const deductions = 0;
    const allowance = 0;
    const totalSalary = 0;
    const note = "";

    // Tạo PayRoll mới
    const payRoll = new PayRoll({
      userID, // Đảm bảo đúng tên trường trong schema
      payPeriod,
      totalRegularHours,
      totalOvertimeHours,
      basicSalary,
      overtimeSalary,
      deductions,
      allowance,
      totalSalary,
      note,
    });

    // Lưu vào MongoDB
    await payRoll.save();

    // Lấy thông tin PayRoll mới tạo với user chi tiết
    const newPayRoll = await PayRoll.findById(payRoll._id).populate({
      path: "userID",
      select: "fullname age address phoneNumber email",
    });

    return res.status(201).json({
      status: 201,
      data: newPayRoll,
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong CreatePayRoll:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

const DeletePayRoll = async (req, res) => {
  try {
    const { id } = req.body;

    // Kiểm tra id hợp lệ
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "ID không hợp lệ.",
      });
    }

    // Xóa PayRoll theo ID
    const deletedPayRoll = await PayRoll.findByIdAndDelete(id);

    if (!deletedPayRoll) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy PayRoll với ID này.",
      });
    }

    return res.status(200).json({
      status: 200,
      data: { message: "PayRoll đã được xóa thành công.", deletedPayRoll },
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong DeletePayRoll:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

const CheckPayRollByEmployeeAndPayPeriod = async (req, res) => {
  try {
    const { userID } = req.body;

    // Kiểm tra userID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(userID)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "userID không hợp lệ.",
      });
    }

    // Lấy tháng và năm hiện tại
    const now = new Date();
    const currentMonth = now.getMonth(); // Tháng hiện tại (0-11)
    const currentYear = now.getFullYear();

    // Tính ngày đầu tháng và cuối tháng
    const startDate = new Date(currentYear, currentMonth, 1); // Ngày đầu tháng
    const endDate = new Date(currentYear, currentMonth + 1, 0); // Ngày cuối tháng

    // Tìm PayRoll theo userID, tháng và năm hiện tại
    const payRoll = await PayRoll.findOne({
      userID,
      payPeriod: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    if (!payRoll) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy PayRoll cho nhân viên trong tháng này.",
      });
    }

    return res.status(200).json({
      status: 200,
      data: payRoll,
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong CheckPayRollByEmployeeAndPayPeriod:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

module.exports = {
  GetAllPayRolls,
  GetPayRollByID,
  UpdatePayRoll,
  CreatePayRoll,
  DeletePayRoll,
  CheckPayRollByEmployeeAndPayPeriod
};
