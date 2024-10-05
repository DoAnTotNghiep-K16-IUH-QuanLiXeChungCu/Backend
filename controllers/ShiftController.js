const Shift = require('../models/Shift');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client({ region: 'your-region' });
const mongoose = require('mongoose');

const GetAllShifts = async (req, res) => {
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

    // Lấy tất cả các ca làm việc
    const totalRecords = await Shift.countDocuments();
    const shifts = await Shift.find().skip(skip).limit(parsedPageSize);

    if (totalRecords === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không có ca làm việc nào được tìm thấy.'
      });
    }

    const totalPages = Math.ceil(totalRecords / parsedPageSize);

    return res.status(200).json({
      status: 200,
      data: {
        shifts,
        currentPage: parsedPageNumber,
        pageSize: parsedPageSize,
        totalRecords,
        totalPages
      },
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong GetAllShifts:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const UpdateShift = async (req, res) => {
  try {
    const { id, shiftName, startTime, endTime } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'ID không hợp lệ.'
      });
    }

    const shift = await Shift.findById(id);

    if (!shift) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy ca làm việc với ID này.'
      });
    }

    // Cập nhật các trường cần thiết
    shift.shiftName = shiftName || shift.shiftName;
    shift.startTime = startTime || shift.startTime;
    shift.endTime = endTime || shift.endTime;

    // Lưu lại bản ghi đã cập nhật
    await shift.save();

    return res.status(200).json({
      status: 200,
      data: shift,
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong UpdateShift:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const GetShiftById = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'ID không hợp lệ.'
      });
    }

    const shift = await Shift.findById(id);

    if (!shift) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy ca làm việc với ID này.'
      });
    }

    return res.status(200).json({
      status: 200,
      data: shift,
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong GetShiftById:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

module.exports = {
    GetAllShifts,
    UpdateShift,
    GetShiftById
};
  