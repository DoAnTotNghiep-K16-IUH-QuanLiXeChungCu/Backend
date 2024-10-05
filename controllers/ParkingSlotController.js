const ParkingSlot = require('../models/ParkingSlot');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client({ region: 'your-region' });
const mongoose = require('mongoose');

const GetAllParkingSlots = async (req, res) => {
  try {
    const { pageNumber = 1, pageSize = 10 } = req.body;

    // Kiểm tra tính hợp lệ của pageNumber và pageSize
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

    // Lấy tổng số bãi đỗ
    const totalRecords = await ParkingSlot.countDocuments();

    if (totalRecords === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không có bãi đỗ xe nào được tìm thấy.'
      });
    }

    // Lấy danh sách bãi đỗ
    const parkingSlots = await ParkingSlot.find()
      .skip(skip)
      .limit(parsedPageSize);

    if (parkingSlots.length === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy bãi đỗ nào cho trang này.'
      });
    }

    const totalPages = Math.ceil(totalRecords / parsedPageSize);

    return res.status(200).json({
      status: 200,
      data: {
        parkingSlots,
        currentPage: parsedPageNumber,
        pageSize: parsedPageSize,
        totalRecords,
        totalPages
      },
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong GetAllParkingSlots:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const GetParkingSlotById = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'id không hợp lệ.'
      });
    }

    const parkingSlot = await ParkingSlot.findById(id);

    if (!parkingSlot) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy bãi đỗ xe với id này.'
      });
    }

    return res.status(200).json({
      status: 200,
      data: parkingSlot,
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong GetParkingSlotById:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const CreateParkingSlot = async (req, res) => {
  try {
    const { slotCode, slotType, availableSlots, totalQuantity } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!slotCode || !slotType || availableSlots === undefined || totalQuantity === undefined) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'Tất cả các trường slotCode, slotType, availableSlots, và totalQuantity đều bắt buộc.'
      });
    }

    // Tạo bãi đỗ xe mới
    const newParkingSlot = new ParkingSlot({
      slotCode,
      slotType,
      availableSlots,
      totalQuantity
    });

    // Lưu vào cơ sở dữ liệu
    await newParkingSlot.save();

    return res.status(201).json({
      status: 201,
      data: newParkingSlot,
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong CreateParkingSlot:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const GetAvailableParkingSlotsByType = async (req, res) => {
  try {
    const { slotType } = req.body;

    // Kiểm tra xem slotType có phải là một trong các giá trị hợp lệ của enum hay không
    if (!slotType || !['car', 'motor'].includes(slotType)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'slotType phải là một trong hai giá trị "car" hoặc "motor".'
      });
    }

    // Tìm các bãi đỗ còn trống cho loại phương tiện được yêu cầu
    const availableSlots = await ParkingSlot.find({ slotType, availableSlots: { $gt: 0 } });

    if (availableSlots.length === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: `Không tìm thấy bãi đỗ nào còn trống cho loại ${slotType}.`
      });
    }

    return res.status(200).json({
      status: 200,
      data: availableSlots,
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong GetAvailableParkingSlotsByType:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const GetAvailableParkingSlotsByTypeAndCode = async (req, res) => {
  try {
    const { slotType, slotCode } = req.body;

    // Kiểm tra xem slotType có phải là một trong các giá trị hợp lệ của enum hay không
    if (!slotType || !['car', 'motor'].includes(slotType)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'slotType phải là một trong hai giá trị "car" hoặc "motor".'
      });
    }

    // Kiểm tra tính hợp lệ của slotCode
    if (!slotCode || typeof slotCode !== 'string') {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'slotCode không hợp lệ, phải là một chuỗi hợp lệ.'
      });
    }

    // Tìm các bãi đỗ còn trống theo loại phương tiện và mã bãi đỗ xe
    const availableSlots = await ParkingSlot.find({
      slotType,
      slotCode,
      availableSlots: { $gt: 0 }
    });

    if (availableSlots.length === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: `Không tìm thấy bãi đỗ nào còn trống cho loại ${slotType} và mã bãi đỗ ${slotCode}.`
      });
    }

    return res.status(200).json({
      status: 200,
      data: availableSlots,
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong GetAvailableParkingSlotsByTypeAndCode:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

module.exports = {
  GetAllParkingSlots,
  GetParkingSlotById,
  CreateParkingSlot,
  GetAvailableParkingSlotsByType,
  GetAvailableParkingSlotsByTypeAndCode
};
