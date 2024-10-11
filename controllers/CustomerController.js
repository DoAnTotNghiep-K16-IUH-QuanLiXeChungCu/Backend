const Customer = require('../models/Customer');
const Apartment = require('../models/Apartment');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client({ region: 'your-region' });
const mongoose = require('mongoose');

const GetAllCustomers = async (req, res) => {
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
  
      const totalRecords = await Customer.countDocuments({ isDelete: false });
  
      if (totalRecords === 0) {
        return res.status(404).json({
          status: 404,
          data: null,
          error: 'Không có khách hàng nào được tìm thấy.'
        });
      }
  
      const customers = await Customer.find({ isDelete: false })
        .populate({
          path: 'apartmentsId', // Liên kết với bảng Apartment
          model: 'Apartment',   // Lấy dữ liệu từ bảng Apartment
          select: 'name'        // Chỉ lấy trường name từ bảng Apartment
        })
        .sort({ fullName: 1 })
        .skip(skip)
        .limit(parsedPageSize);
  
      if (customers.length === 0) {
        return res.status(404).json({
          status: 404,
          data: null,
          error: 'Không tìm thấy khách hàng nào cho trang này.'
        });
      }
  
      const totalPages = Math.ceil(totalRecords / parsedPageSize);
  
      return res.status(200).json({
        status: 200,
        data: {
          customers,
          currentPage: parsedPageNumber,
          pageSize: parsedPageSize,
          totalRecords,
          totalPages
        },
        error: null
      });
    } catch (error) {
      console.error('Lỗi không xác định trong GetAllCustomers:', error);
      return res.status(500).json({
        status: 500,
        data: null,
        error: 'Lỗi máy chủ không xác định.'
      });
    }
};

const GetCustomerById = async (req, res) => {
    try {
      const { id } = req.body;
  
      if (!id) {
        return res.status(400).json({
          status: 400,
          data: null,
          error: 'Thiếu trường id trong body request.'
        });
      }
  
      const customer = await Customer.findById(id)
        .populate({
          path: 'apartmentsId',
          model: 'Apartment',
          select: 'name' // Lấy trường name từ Apartment
        });
  
      if (!customer || customer.isDelete) {
        return res.status(404).json({
          status: 404,
          data: null,
          error: 'Không tìm thấy khách hàng với id này.'
        });
      }
  
      return res.status(200).json({
        status: 200,
        data: customer,
        error: null
      });
    } catch (error) {
      console.error('Lỗi trong GetCustomerById:', error);
      return res.status(500).json({
        status: 500,
        data: null,
        error: 'Lỗi máy chủ không xác định.'
      });
    }
};

const CreateCustomer = async (req, res) => {
  try {
    const { apartmentsId, fullName, phoneNumber, address, isResident } = req.body;

    // Kiểm tra giá trị của isResident để xác định apartmentsId và address
    if (isResident && !apartmentsId) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'Cần apartmentsId nếu khách hàng là cư dân.'
      });
    }

    if (!isResident && !address) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'Cần address nếu khách hàng không phải là cư dân.'
      });
    }

    // Kiểm tra số điện thoại phải có từ 10 đến 11 số
    const phoneRegex = /^\d{10,11}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'Số điện thoại phải có từ 10 đến 11 chữ số.'
      });
    }

    // Nếu là cư dân, kiểm tra sự tồn tại của apartmentsId
    if (isResident) {
      const apartmentExists = await Apartment.findById(apartmentsId);
      if (!apartmentExists) {
        return res.status(400).json({
          status: 400,
          data: null,
          error: 'apartmentsId không tồn tại trong cơ sở dữ liệu.'
        });
      }
    }

    // Tạo bản ghi mới
    const newCustomer = new Customer({
      apartmentsId: isResident ? apartmentsId || null : null, 
      fullName,
      phoneNumber,
      address: isResident ? '' : address,  
      isResident
    });

    // Lưu vào cơ sở dữ liệu
    await newCustomer.save();

    return res.status(201).json({
      status: 201,
      data: newCustomer,
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong CreateCustomer:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const UpdateCustomer = async (req, res) => {
  try {
    const { id, apartmentsId, fullName, phoneNumber, address, isResident } = req.body;

    // Kiểm tra id hợp lệ
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'ID không hợp lệ.'
      });
    }

    const customer = await Customer.findById(id);

    if (!customer || customer.isDelete) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy khách hàng với ID này.'
      });
    }

    // Kiểm tra số điện thoại phải có từ 10 đến 11 số
    if (phoneNumber) {
      const phoneRegex = /^\d{10,11}$/;
      if (!phoneRegex.test(phoneNumber)) {
        return res.status(400).json({
          status: 400,
          data: null,
          error: 'Số điện thoại phải có từ 10 đến 11 chữ số.'
        });
      }
    }

    // Kiểm tra logic của isResident để xác định apartmentsId và address
    if (isResident) {
      if (!apartmentsId || !mongoose.Types.ObjectId.isValid(apartmentsId)) {
        return res.status(400).json({
          status: 400,
          data: null,
          error: 'apartmentsId không hợp lệ hoặc không được cung cấp cho cư dân.'
        });
      }
      customer.apartmentsId = apartmentsId;
      customer.address = '';  // Cư dân không cần địa chỉ
    } else {
      customer.apartmentsId = undefined;  // Gán undefined cho apartmentsId nếu không phải cư dân
      customer.address = address || '';  // Cập nhật địa chỉ nếu không phải cư dân
    }

    // Cập nhật các trường khác
    customer.fullName = fullName || customer.fullName;
    customer.phoneNumber = phoneNumber || customer.phoneNumber;
    customer.isResident = isResident;

    // Lưu lại bản ghi đã cập nhật
    await customer.save();

    return res.status(200).json({
      status: 200,
      data: customer,
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong UpdateCustomer:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const DeleteCustomer = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'id không hợp lệ.'
      });
    }

    const customer = await Customer.findById(id);

    if (!customer || customer.isDelete) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy khách hàng với id này.'
      });
    }

    // Đặt isDelete = true để ẩn khách hàng
    customer.isDelete = true;

    // Lưu lại bản ghi đã cập nhật
    await customer.save();

    return res.status(200).json({
      status: 200,
      data: customer,
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong DeleteCustomer:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

module.exports = {
  GetAllCustomers,
  GetCustomerById,
  CreateCustomer,
  UpdateCustomer,
  DeleteCustomer
};
  