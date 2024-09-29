const Customer = require('../models/Customer');
const Apartment = require('../models/Apartment');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client({ region: 'your-region' });

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

module.exports = {
  GetAllCustomers,
  GetCustomerById
};
  