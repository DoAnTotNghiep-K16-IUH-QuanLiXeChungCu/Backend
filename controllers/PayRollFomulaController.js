const PayRollFomula = require("../models/PayRollFomula");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const s3Client = new S3Client({ region: "your-region" });
const mongoose = require("mongoose");
const User = require("../models/User");
const GetPayRollFomulaByID = async (req, res) => {
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
    const payRoll = await PayRollFomula.findById(id);
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

const GetAllPayRollFomula = async (req, res) => {
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

    const totalPayRollFomulas = await PayRollFomula.countDocuments();
    const payRollFomulas = await PayRollFomula.find()
      .skip(skip)
      .limit(parsedPageSize);

    if (totalPayRollFomulas === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không có PayRoll nào được tìm thấy.",
      });
    }

    const totalPages = Math.ceil(totalPayRollFomulas / parsedPageSize);

    return res.status(200).json({
      status: 200,
      data: {
        payRollFomulas,
        currentPage: parsedPageNumber,
        pageSize: parsedPageSize,
        totalPayRollFomulas,
        totalPages,
      },
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong GetAlltotalPayRollFomula:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

const UpdatePayRollFomula = async (req, res) => {
  try {
    const { id, basicRatePerHour, overtimeRate, deductions, allowance, note } =
      req.body;

    // Kiểm tra id hợp lệ
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "ID không hợp lệ.",
      });
    }

    // Tìm PayRoll cần cập nhật
    const payRollFomula = await PayRollFomula.findById(id);

    if (!payRollFomula) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy PayRoll với ID này.",
      });
    }
    // Cập nhật các trường cần thiết
    if (basicRatePerHour) payRoll.basicRatePerHour = basicRatePerHour;
    if (overtimeRate) payRoll.overtimeRate = overtimeRate;
    if (deductions) payRoll.deductions = deductions;
    if (allowance) payRoll.allowance = allowance;
    if (note) payRoll.note = note;

    // Lưu lại bản ghi đã cập nhật
    await payRollFomula.save();
    return res.status(200).json({
      status: 200,
      data: payRollFomula,
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

const CreatePayRollFomula = async (req, res) => {
  try {
    const { basicRatePerHour, overtimeRate, deductions, allowance } = req.body;
    if (
      basicRatePerHour === undefined ||
      overtimeRate === undefined ||
      deductions === undefined ||
      allowance === undefined
    ) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "Thiếu thông tin bắt buộc.",
      });
    }

    // Tạo PayRoll mới
    const payRollFomula = new PayRollFomula({
      basicRatePerHour,
      overtimeRate,
      deductions,
      allowance,
    });

    // Lưu vào MongoDB
    await payRollFomula.save();
    return res.status(201).json({
      status: 201,
      data: payRollFomula,
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

const DeletePayRollFomula = async (req, res) => {
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
    const deletedPayRollFomula = await PayRollFomula.findByIdAndDelete(id);

    if (!deletedPayRollFomula) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy PayRoll với ID này.",
      });
    }

    return res.status(200).json({
      status: 200,
      data: {
        message: "PayRoll đã được xóa thành công.",
        deletedPayRollFomula,
      },
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
  GetAllPayRollFomula,
  GetPayRollFomulaByID,
  UpdatePayRollFomula,
  CreatePayRollFomula,
  DeletePayRollFomula,
};
