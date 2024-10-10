const Vehicle = require('../models/Vehicle');
const Customer = require('../models/Customer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client({ region: 'your-region' });
const mongoose = require('mongoose');

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

const GetVehicleByLicensePlate = async (req, res) => {
  try {
    const { licensePlate } = req.body;

    if (!licensePlate) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'Thiếu licensePlate trong body request.'
      });
    }

    const vehicle = await Vehicle.findOne({ licensePlate, isDelete: false })
      .populate({
        path: 'customerId',
        model: 'Customer',
        select: 'fullName phoneNumber'
      });

    if (!vehicle) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy phương tiện nào với biển số này.'
      });
    }

    return res.status(200).json({
      status: 200,
      data: vehicle,
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong GetVehicleByLicensePlate:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const GetVehiclesByType = async (req, res) => {
  try {
    const { type } = req.body;

    if (!type) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'Thiếu type trong body request.'
      });
    }

    const vehicles = await Vehicle.find({ type, isDelete: false })
      .populate({
        path: 'customerId',
        model: 'Customer',
        select: 'fullName phoneNumber'
      });

    if (vehicles.length === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy phương tiện nào với loại này.'
      });
    }

    return res.status(200).json({
      status: 200,
      data: vehicles,
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong GetVehiclesByType:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const GetVehiclesByBrand = async (req, res) => {
  try {
    const { brand } = req.body;

    if (!brand) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'Thiếu brand trong body request.'
      });
    }

    const vehicles = await Vehicle.find({ brand: { $regex: new RegExp(brand, 'i') }, isDelete: false })
      .populate({
        path: 'customerId',
        model: 'Customer',
        select: 'fullName phoneNumber'
      });

    if (vehicles.length === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy phương tiện nào với nhãn hiệu này.'
      });
    }

    return res.status(200).json({
      status: 200,
      data: vehicles,
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong GetVehiclesByBrand:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const CreateVehicle = async (req, res) => {
  try {
    const { customerId, licensePlate, type, color, brand } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'customerId không hợp lệ.'
      });
    }

    // Kiểm tra nếu customerId tồn tại trong bảng Customer
    const customerExists = await Customer.findById(customerId);
    if (!customerExists) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'customerId không tồn tại.'
      });
    }

    if (!licensePlate || !type || !color || !brand) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'Các trường licensePlate, type, color, và brand đều bắt buộc.'
      });
    }

    const validTypes = ['car', 'motor'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'Giá trị type phải là "car" hoặc "motor".'
      });
    }

    // Kiểm tra xem licensePlate đã tồn tại chưa
    const vehicleExists = await Vehicle.findOne({ licensePlate });
    if (vehicleExists) {
      return res.status(409).json({ // 409 Conflict status code để báo lỗi trùng lặp
        status: 409,
        data: null,
        error: 'Phương tiện với biển số này đã tồn tại.'
      });
    }

    // Tạo phương tiện mới
    const newVehicle = new Vehicle({
      customerId,
      licensePlate,
      type,
      color,
      brand
    });

    // Lưu vào cơ sở dữ liệu
    await newVehicle.save();

    return res.status(201).json({
      status: 201,
      data: newVehicle,
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong CreateVehicle:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const UpdateVehicle = async (req, res) => {
  try {
    const { id, customerId, licensePlate, type, color, brand } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'id không hợp lệ.'
      });
    }

    const vehicle = await Vehicle.findById(id);

    if (!vehicle || vehicle.isDelete) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy phương tiện với id này.'
      });
    }

    // Nếu customerId có trong request, kiểm tra xem nó có hợp lệ và tồn tại hay không
    if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
      const customerExists = await Customer.findById(customerId);
      if (!customerExists) {
        return res.status(400).json({
          status: 400,
          data: null,
          error: 'customerId không tồn tại.'
        });
      }
    }

    if (type) {
      const validTypes = ['car', 'motor'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          status: 400,
          data: null,
          error: 'Giá trị type phải là "car" hoặc "motor".'
        });
      }
    }

    // Cập nhật các trường cần thiết
    vehicle.customerId = customerId || vehicle.customerId;
    vehicle.licensePlate = licensePlate || vehicle.licensePlate;
    vehicle.type = type || vehicle.type;
    vehicle.color = color || vehicle.color;
    vehicle.brand = brand || vehicle.brand;

    // Lưu lại bản ghi đã cập nhật
    await vehicle.save();

    return res.status(200).json({
      status: 200,
      data: vehicle,
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong UpdateVehicle:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const DeleteVehicle = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'id không hợp lệ.'
      });
    }

    const vehicle = await Vehicle.findById(id);

    if (!vehicle || vehicle.isDelete) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy phương tiện với id này.'
      });
    }

    // Đặt isDelete = true để đánh dấu phương tiện đã bị xóa
    vehicle.isDelete = true;

    // Lưu lại bản ghi đã cập nhật
    await vehicle.save();

    return res.status(200).json({
      status: 200,
      data: vehicle,
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong DeleteVehicle:', error);
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
  GetVehicleByCustomerId,
  GetVehicleByLicensePlate,
  GetVehiclesByType,
  GetVehiclesByBrand,
  CreateVehicle,
  UpdateVehicle,
  DeleteVehicle
};
