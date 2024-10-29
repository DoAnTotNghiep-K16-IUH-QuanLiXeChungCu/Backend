const Setting = require("../models/Setting");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const s3Client = new S3Client({ region: "your-region" });
const mongoose = require("mongoose");

const GetSetting = async (req, res) => {
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

    // Lấy tất cả các bản ghi
    const totalRecords = await Setting.countDocuments();
    const settings = await Setting.find().skip(skip).limit(parsedPageSize);

    if (totalRecords === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không có setting  nào được tìm thấy.",
      });
    }

    const totalPages = Math.ceil(totalRecords / parsedPageSize);

    return res.status(200).json({
      status: 200,
      data: {
        settings,
        currentPage: parsedPageNumber,
        pageSize: parsedPageSize,
        totalRecords,
        totalPages,
      },
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong GetSetting:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};
const GetSettingByID = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "ID không hợp lệ.",
      });
    }

    const setting = await Setting.findById(id);

    if (!setting) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy setting với ID này.",
      });
    }

    return res.status(200).json({
      status: 200,
      data: setting,
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong getSettingByID:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

const UpdateSetting = async (req, res) => {
  try {
    const {
      id,
      entryPort,
      entryBau,
      exitPort,
      exitBau,
      camera1,
      camera2,
      camera3,
      camera4,
    } = req.body;

    // Kiểm tra id hợp lệ
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "ID không hợp lệ.",
      });
    }

    const setting = await Setting.findById(id);

    if (!setting) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy Setting với ID này.",
      });
    }

    // Cập nhật các trường cần thiết
    setting.entryPort = entryPort || setting.entryPort;
    setting.entryBau = entryBau || setting.entryBau;
    setting.exitPort = exitPort || setting.exitPort;
    setting.exitBau = exitBau || setting.exitBau;
    setting.camera1 = camera1 || setting.camera1;
    setting.camera2 = camera2 || setting.camera2;
    setting.camera3 = camera3 || setting.camera3;
    setting.camera4 = camera4 || setting.camera4;

    // Lưu lại bản ghi đã cập nhật
    await setting.save();

    return res.status(200).json({
      status: 200,
      data: setting,
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong UpdateSetting:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

module.exports = {
  GetSetting,
  GetSettingByID,
  UpdateSetting,
};
