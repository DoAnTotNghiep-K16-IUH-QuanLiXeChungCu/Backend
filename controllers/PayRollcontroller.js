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
    const {
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

    // Kiểm tra các trường bắt buộc
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

    if (
      !payPeriod ||
      !totalRegularHours ||
      !totalOvertimeHours ||
      !basicSalary ||
      !overtimeSalary ||
      !deductions ||
      !allowance ||
      !totalSalary
    ) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "Thiếu thông tin bắt buộc.",
      });
    }

    // Tạo PayRoll mới
    const payRoll = new PayRoll({
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
    });

    // Lưu vào MongoDB
    await payRoll.save();
    const newPayRoll = await UserShift.findById(payRoll._id).populate({
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

module.exports = {
  GetAllPayRolls,
  GetPayRollByID,
  UpdatePayRoll,
  CreatePayRoll,
  DeletePayRoll,
};
