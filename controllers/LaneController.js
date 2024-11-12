const Lane = require("../models/Lane");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const s3Client = new S3Client({ region: "your-region" });
const mongoose = require("mongoose");

const GetLaneByID = async (req, res) => {
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

    // Tìm Lane và populate camera1 và camera2
    const lane = await Lane.findById(id)
      .populate({ path: "camera1", select: "name deviceID" })
      .populate({ path: "camera2", select: "name deviceID" });

    if (!lane) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy Lane với ID này.",
      });
    }

    return res.status(200).json({
      status: 200,
      data: lane,
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong GetLaneByID:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

const GetAllLanes = async (req, res) => {
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

    const totalLanes = await Lane.countDocuments();
    const lanes = await Lane.find()
      .populate({ path: "camera1", select: "name deviceID" })
      .populate({ path: "camera2", select: "name deviceID" })
      .skip(skip)
      .limit(parsedPageSize);

    if (totalLanes === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không có lane nào được tìm thấy.",
      });
    }

    const totalPages = Math.ceil(totalLanes / parsedPageSize);

    return res.status(200).json({
      status: 200,
      data: {
        lanes,
        currentPage: parsedPageNumber,
        pageSize: parsedPageSize,
        totalLanes,
        totalPages,
      },
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong GetAllLanes:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

const UpdateLane = async (req, res) => {
  try {
    const { id, name, camera1, camera2, port } = req.body;

    // Kiểm tra id hợp lệ
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "ID không hợp lệ.",
      });
    }

    const lane = await Lane.findById(id);

    if (!lane) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy Lane với ID này.",
      });
    }

    // Cập nhật các trường cần thiết
    if (name) lane.name = name;
    if (port) lane.port = port;

    if (camera1 && mongoose.Types.ObjectId.isValid(camera1))
      lane.camera1 = camera1;
    if (camera2 && mongoose.Types.ObjectId.isValid(camera2))
      lane.camera2 = camera2;
    // Lưu lại bản ghi đã cập nhật
    await lane.save();

    // Populate thông tin camera để trả về đầy đủ chi tiết
    const laneUpdate = await Lane.findById(id)
      .populate({ path: "camera1", select: "name deviceID" })
      .populate({ path: "camera2", select: "name deviceID" });

    return res.status(200).json({
      status: 200,
      data: laneUpdate,
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong UpdateLane:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

const CreateLane = async (req, res) => {
  try {
    const { name, camera1, camera2, port } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!name || !camera1 || !camera2) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "Thiếu thông tin bắt buộc (name, camera1, camera2).",
      });
    }

    // Kiểm tra camera1 và camera2 có hợp lệ không
    if (
      !mongoose.Types.ObjectId.isValid(camera1) ||
      !mongoose.Types.ObjectId.isValid(camera2)
    ) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "camera1 hoặc camera2 không hợp lệ.",
      });
    }

    // Tạo lane mới
    const newLane = new Lane({
      name,
      camera1,
      camera2,
      port,
    });

    // Lưu lane vào MongoDB
    await newLane.save();

    // Populate thông tin camera để trả về đầy đủ chi tiết
    const createNewLane = await Lane.findById(id)
      .populate({ path: "camera1", select: "name deviceID" })
      .populate({ path: "camera2", select: "name deviceID" });

    return res.status(201).json({
      status: 201,
      data: createNewLane,
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong CreateLane:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

const DeleteLane = async (req, res) => {
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

    // Xóa lane theo ID
    const deletedLane = await Lane.findByIdAndDelete(id);

    if (!deletedLane) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy Lane với ID này.",
      });
    }

    return res.status(200).json({
      status: 200,
      data: { message: "Lane đã được xóa thành công.", deletedLane },
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong DeleteLane:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

module.exports = {
  GetAllLanes,
  GetLaneByID,
  UpdateLane,
  CreateLane,
  DeleteLane,
};
