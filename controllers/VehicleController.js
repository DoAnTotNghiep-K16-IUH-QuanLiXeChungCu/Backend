const Vehicle = require('../models/Vehicle');
const Customer = require('../models/Customer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client({ region: 'your-region' });

const GetAllVehicles = async (req, res) => {
  try {
    const { pageNumber = 1, pageSize = 10 } = req.body;

    // Kiểm tra pageNumber và pageSize
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

    const totalRecords = await Vehicle.countDocuments({ isDelete: false });

    if (totalRecords === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không có phương tiện nào được tìm thấy.'
      });
    }

    const vehicles = await Vehicle.find({ isDelete: false })
      .populate({
        path: 'customerId', // Liên kết với bảng Customer
        model: 'Customer',  // Lấy dữ liệu từ bảng Customer
        select: 'fullName phoneNumber' // Chỉ lấy các trường cần thiết từ bảng Customer
      })
      .sort({ licensePlate: 1 }) // Sắp xếp theo biển số xe
      .skip(skip)
      .limit(parsedPageSize);

    if (vehicles.length === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy phương tiện nào cho trang này.'
      });
    }

    const totalPages = Math.ceil(totalRecords / parsedPageSize);

    return res.status(200).json({
      status: 200,
      data: {
        vehicles,
        currentPage: parsedPageNumber,
        pageSize: parsedPageSize,
        totalRecords,
        totalPages
      },
      error: null
    });
  } catch (error) {
    console.error('Lỗi không xác định trong GetAllVehicles:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const GetVehicleById = async (req, res) => {
    try {
      const { id } = req.body;
  
      if (!id) {
        return res.status(400).json({
          status: 400,
          data: null,
          error: 'Thiếu id trong body request.'
        });
      }
  
      const vehicle = await Vehicle.findById(id)
        .populate({
          path: 'customerId', // Liên kết với bảng Customer
          model: 'Customer',  // Lấy dữ liệu từ bảng Customer
          select: 'fullName phoneNumber' // Chỉ lấy các trường cần thiết từ bảng Customer
        });
  
      if (!vehicle) {
        return res.status(404).json({
          status: 404,
          data: null,
          error: 'Không tìm thấy phương tiện với id này.'
        });
      }
  
      return res.status(200).json({
        status: 200,
        data: vehicle,
        error: null
      });
    } catch (error) {
      console.error('Lỗi trong FindVehicleById:', error);
      return res.status(500).json({
        status: 500,
        data: null,
        error: 'Lỗi máy chủ không xác định.'
      });
    }
};

const GetVehicleByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'Thiếu customerId trong body request.'
      });
    }

    const vehicles = await Vehicle.find({ customerId, isDelete: false })
      .populate({
        path: 'customerId', // Liên kết với bảng Customer
        model: 'Customer',  // Lấy dữ liệu từ bảng Customer
        select: 'fullName phoneNumber' // Chỉ lấy các trường cần thiết từ bảng Customer
      });

    if (vehicles.length === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy phương tiện nào với customerId này.'
      });
    }

    return res.status(200).json({
      status: 200,
      data: vehicles,
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong FindVehicleByCustomerId:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

module.exports = {
  GetAllVehicles,
  GetVehicleById,
  GetVehicleByCustomerId
};
