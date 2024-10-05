const ParkingRate = require('../models/ParkingRate');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client({ region: 'your-region' });
const mongoose = require('mongoose');

const GetAllParkingRates = async (req, res) => {
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

    // Lấy tất cả các giá cho bãi đỗ
    const totalRecords = await ParkingRate.countDocuments();
    const parkingRates = await ParkingRate.find().skip(skip).limit(parsedPageSize);

    if (totalRecords === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không có giá nào được tìm thấy.'
      });
    }

    const totalPages = Math.ceil(totalRecords / parsedPageSize);

    return res.status(200).json({
      status: 200,
      data: {
        parkingRates,
        currentPage: parsedPageNumber,
        pageSize: parsedPageSize,
        totalRecords,
        totalPages
      },
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong GetAllParkingRates:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const CreateParkingRate = async (req, res) => {
  try {
    const { vehicleType, hourly, price } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!vehicleType || !['car', 'motor'].includes(vehicleType) || !hourly || !price) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'Các trường vehicleType, hourly và price đều bắt buộc và vehicleType phải là "car" hoặc "motor".'
      });
    }

    // Tạo giá đỗ xe mới
    const newParkingRate = new ParkingRate({
      vehicleType,
      hourly,
      price
    });

    // Lưu vào cơ sở dữ liệu
    await newParkingRate.save();

    return res.status(201).json({
      status: 201,
      data: newParkingRate,
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong CreateParkingRate:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const UpdateParkingRate = async (req, res) => {
  try {
    const { id, price } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'ID không hợp lệ.'
      });
    }

    const parkingRate = await ParkingRate.findById(id);

    if (!parkingRate) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy giá đỗ xe với ID này.'
      });
    }

    // Cập nhật các trường cần thiết
    parkingRate.vehicleType = vehicleType || parkingRate.vehicleType;
    parkingRate.hourly = hourly !== undefined ? hourly : parkingRate.hourly;
    parkingRate.price = price !== undefined ? price : parkingRate.price;

    // Lưu lại bản ghi đã cập nhật
    await parkingRate.save();

    return res.status(200).json({
      status: 200,
      data: parkingRate,
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong UpdateParkingRate:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const GetParkingRateById = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'ID không hợp lệ.'
      });
    }

    const parkingRate = await ParkingRate.findById(id);

    if (!parkingRate) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy giá đỗ xe với ID này.'
      });
    }

    return res.status(200).json({
      status: 200,
      data: parkingRate,
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong GetParkingRateById:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const DeleteParkingRate = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'ID không hợp lệ.'
      });
    }

    const parkingRate = await ParkingRate.findById(id);

    if (!parkingRate) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy giá đỗ xe với ID này.'
      });
    }

    // Xóa giá đỗ xe
    await ParkingRate.deleteOne({ _id: id });

    return res.status(200).json({
      status: 200,
      data: 'Đã xóa giá đỗ xe thành công.',
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong DeleteParkingRate:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

module.exports = {
    GetAllParkingRates,
    CreateParkingRate,
    UpdateParkingRate,
    GetParkingRateById,
    DeleteParkingRate
};
