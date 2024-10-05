const Apartment = require('../models/Apartment');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client({ region: 'your-region' });
const mongoose = require('mongoose');

const GetAllApartments = async (req, res) => {
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
  
      // Lấy tất cả các bản ghi
      const totalRecords = await Apartment.countDocuments();
      const apartments = await Apartment.find()
        .skip(skip)
        .limit(parsedPageSize);
  
      if (totalRecords === 0) {
        return res.status(404).json({
          status: 404,
          data: null,
          error: 'Không có căn hộ nào được tìm thấy.'
        });
      }
  
      const totalPages = Math.ceil(totalRecords / parsedPageSize);
  
      return res.status(200).json({
        status: 200,
        data: {
          apartments,
          currentPage: parsedPageNumber,
          pageSize: parsedPageSize,
          totalRecords,
          totalPages
        },
        error: null
      });
    } catch (error) {
      console.error('Lỗi trong GetAllApartments:', error);
      return res.status(500).json({
        status: 500,
        data: null,
        error: 'Lỗi máy chủ không xác định.'
      });
    }
  };
  
  const GetApartmentById = async (req, res) => {
    try {
      const { id } = req.body;
  
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          status: 400,
          data: null,
          error: 'ID không hợp lệ.'
        });
      }
  
      const apartment = await Apartment.findById(id);
  
      if (!apartment) {
        return res.status(404).json({
          status: 404,
          data: null,
          error: 'Không tìm thấy căn hộ với ID này.'
        });
      }
  
      return res.status(200).json({
        status: 200,
        data: apartment,
        error: null
      });
    } catch (error) {
      console.error('Lỗi trong GetApartmentById:', error);
      return res.status(500).json({
        status: 500,
        data: null,
        error: 'Lỗi máy chủ không xác định.'
      });
    }
};

  
  module.exports = {
    GetAllApartments,
    GetApartmentById
  };