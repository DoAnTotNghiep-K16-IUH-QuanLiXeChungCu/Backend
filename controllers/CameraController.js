const Camera = require("../models/Camera");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const s3Client = new S3Client({ region: "your-region" });
const mongoose = require("mongoose");
const GetAllCamera = async (req, res) => {
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

    const totalCameras = await Camera.countDocuments();
    const cameras = await Camera.find().skip(skip).limit(parsedPageSize);

    if (totalCameras === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không có camera nào được tìm thấy.",
      });
    }

    const totalPages = Math.ceil(totalCameras / parsedPageSize);

    return res.status(200).json({
      status: 200,
      data: {
        cameras,
        currentPage: parsedPageNumber,
        pageSize: parsedPageSize,
        totalCameras,
        totalPages,
      },
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong GetAllCamera:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};
const GetCameraByID = async (req, res) => {
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

    const camera = await Camera.findById(id);

    if (!camera) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy camera với ID này.",
      });
    }

    return res.status(200).json({
      status: 200,
      data: camera,
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong GetCameraByID:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};
const CreateCamera = async (req, res) => {
  try {
    const { name, deviceID } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!name || !deviceID) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "Thiếu thông tin bắt buộc (name, deviceID).",
      });
    }

    // Tạo camera mới
    const newCamera = new Camera({
      name,
      deviceID,
    });

    // Lưu camera vào MongoDB
    await newCamera.save();

    return res.status(201).json({
      status: 201,
      data: newCamera,
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong CreateCamera:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};
const UpdateCamera = async (req, res) => {
  try {
    const { id, name, deviceID } = req.body;

    // Kiểm tra id hợp lệ
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "ID không hợp lệ.",
      });
    }

    const camera = await Camera.findById(id);

    if (!camera) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy camera với ID này.",
      });
    }

    // Cập nhật các trường cần thiết
    if (name) camera.name = name;
    if (deviceID) camera.deviceID = deviceID;

    // Lưu lại bản ghi đã cập nhật
    await camera.save();

    return res.status(200).json({
      status: 200,
      data: camera,
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong UpdateCamera:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};
const DeleteCamera = async (req, res) => {
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

    // Xóa camera theo ID
    const deletedCamera = await Camera.findByIdAndDelete(id);

    if (!deletedCamera) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy camera với ID này.",
      });
    }

    return res.status(200).json({
      status: 200,
      data: { message: "Camera đã được xóa thành công.", deletedCamera },
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong DeleteCamera:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};
module.exports = {
  GetAllCamera,
  GetCameraByID,
  UpdateCamera,
  CreateCamera,
  DeleteCamera,
};
