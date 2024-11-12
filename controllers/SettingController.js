const Setting = require("../models/Setting");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const s3Client = new S3Client({ region: "your-region" });
const mongoose = require("mongoose");

const GetSettings = async (req, res) => {
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
    const totalSettings = await Setting.countDocuments();
    const settings = await Setting.find()
      .populate({
        path: "entryLane",
        select: "name camera1 camera2 port",
        populate: [
          { path: "camera1", model: "Camera", select: "name deviceID" },
          { path: "camera2", model: "Camera", select: "name deviceID" },
        ],
      })
      .populate({
        path: "exitLane",
        select: "name camera1 camera2 port",
        populate: [
          { path: "camera1", model: "Camera", select: "name deviceID" },
          { path: "camera2", model: "Camera", select: "name deviceID" },
        ],
      })
      .populate({
        path: "secondaryEntryLane",
        select: "name camera1 camera2 port",
        populate: [
          { path: "camera1", model: "Camera", select: "name deviceID" },
          { path: "camera2", model: "Camera", select: "name deviceID" },
        ],
      })
      .populate({
        path: "secondaryExitLane",
        select: "name camera1 camera2 port",
        populate: [
          { path: "camera1", model: "Camera", select: "name deviceID" },
          { path: "camera2", model: "Camera", select: "name deviceID" },
        ],
      })
      .skip(skip)
      .limit(parsedPageSize);

    if (totalSettings === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không có setting nào được tìm thấy.",
      });
    }

    const totalPages = Math.ceil(totalSettings / parsedPageSize);

    return res.status(200).json({
      status: 200,
      data: {
        settings,
        currentPage: parsedPageNumber,
        pageSize: parsedPageSize,
        totalSettings,
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

    const setting = await Setting.findById(id)
      .populate({
        path: "entryLane",
        select: "name camera1 camera2 port",
        populate: [
          { path: "camera1", model: "Camera", select: "name deviceID" },
          { path: "camera2", model: "Camera", select: "name deviceID" },
        ],
      })
      .populate({
        path: "exitLane",
        select: "name camera1 camera2 port",
        populate: [
          { path: "camera1", model: "Camera", select: "name deviceID" },
          { path: "camera2", model: "Camera", select: "name deviceID" },
        ],
      })
      .populate({
        path: "secondaryEntryLane",
        select: "name camera1 camera2 port",
        populate: [
          { path: "camera1", model: "Camera", select: "name deviceID" },
          { path: "camera2", model: "Camera", select: "name deviceID" },
        ],
      })
      .populate({
        path: "secondaryExitLane",
        select: "name camera1 camera2 port",
        populate: [
          { path: "camera1", model: "Camera", select: "name deviceID" },
          { path: "camera2", model: "Camera", select: "name deviceID" },
        ],
      });

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
    console.error("Lỗi trong GetSettingByID:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

const UpdateSetting = async (req, res) => {
  try {
    const { id, entryLane, exitLane, secondaryEntryLane, secondaryExitLane } =
      req.body;

    // Kiểm tra id hợp lệ
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "ID không hợp lệ.",
      });
    }

    // Tìm bản ghi Setting
    const setting = await Setting.findById(id);

    if (!setting) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy Setting với ID này.",
      });
    }

    // Cập nhật các trường cần thiết
    if (entryLane && mongoose.Types.ObjectId.isValid(entryLane)) {
      setting.entryLane = entryLane;
    }
    if (exitLane && mongoose.Types.ObjectId.isValid(exitLane)) {
      setting.exitLane = exitLane;
    }
    if (
      secondaryEntryLane &&
      mongoose.Types.ObjectId.isValid(secondaryEntryLane)
    ) {
      setting.secondaryEntryLane = secondaryEntryLane;
    }
    if (
      secondaryExitLane &&
      mongoose.Types.ObjectId.isValid(secondaryExitLane)
    ) {
      setting.secondaryExitLane = secondaryExitLane;
    }

    // Lưu lại bản ghi đã cập nhật
    await setting.save();

    // Populate thông tin lane và camera để trả về đầy đủ chi tiết
    const updateSetting = await setting.populate({
      path: "entryLane exitLane secondaryEntryLane secondaryExitLane",
      select: "name camera1 camera2 port",
      populate: [
        { path: "camera1", model: "Camera", select: "name deviceID" },
        { path: "camera2", model: "Camera", select: "name deviceID" },
      ],
    });

    return res.status(200).json({
      status: 200,
      data: updateSetting,
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
  GetSettings,
  GetSettingByID,
  UpdateSetting,
};
