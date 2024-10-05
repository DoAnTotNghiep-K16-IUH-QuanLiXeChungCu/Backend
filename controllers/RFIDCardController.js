const RFIDCard = require('../models/RFIDCard');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client({ region: 'your-region' });
const mongoose = require('mongoose');

const GetAllRFIDCards = async (req, res) => {
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
  
      // Lấy tất cả thẻ RFID
      const totalRecords = await RFIDCard.countDocuments();
      const rfidCards = await RFIDCard.find().skip(skip).limit(parsedPageSize);
  
      if (totalRecords === 0) {
        return res.status(404).json({
          status: 404,
          data: null,
          error: 'Không có thẻ RFID nào được tìm thấy.'
        });
      }
  
      const totalPages = Math.ceil(totalRecords / parsedPageSize);
  
      return res.status(200).json({
        status: 200,
        data: {
          rfidCards,
          currentPage: parsedPageNumber,
          pageSize: parsedPageSize,
          totalRecords,
          totalPages
        },
        error: null
      });
    } catch (error) {
      console.error('Lỗi trong GetAllRFIDCards:', error);
      return res.status(500).json({
        status: 500,
        data: null,
        error: 'Lỗi máy chủ không xác định.'
      });
    }
};  

const GetRFIDCardById = async (req, res) => {
    try {
      const { id } = req.body;
  
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          status: 400,
          data: null,
          error: 'ID không hợp lệ.'
        });
      }
  
      const rfidCard = await RFIDCard.findById(id);
  
      if (!rfidCard) {
        return res.status(404).json({
          status: 404,
          data: null,
          error: 'Không tìm thấy thẻ RFID với ID này.'
        });
      }
  
      return res.status(200).json({
        status: 200,
        data: rfidCard,
        error: null
      });
    } catch (error) {
      console.error('Lỗi trong GetRFIDCardById:', error);
      return res.status(500).json({
        status: 500,
        data: null,
        error: 'Lỗi máy chủ không xác định.'
      });
    }
};

const CreateRFIDCard = async (req, res) => {
  try {
    const { uuid } = req.body;

    if (!uuid) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'uuid là trường bắt buộc.'
      });
    }

    // Tạo thẻ RFID mới
    const newRFIDCard = new RFIDCard({
      uuid
    });

    // Lưu vào cơ sở dữ liệu
    await newRFIDCard.save();

    return res.status(201).json({
      status: 201,
      data: newRFIDCard,
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong CreateRFIDCard:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const UpdateRFIDCard = async (req, res) => {
  try {
    const { id, uuid } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'ID không hợp lệ.'
      });
    }

    const rfidCard = await RFIDCard.findById(id);

    if (!rfidCard) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy thẻ RFID với ID này.'
      });
    }

    // Cập nhật uuid nếu có
    if (uuid) {
      rfidCard.uuid = uuid;
    }

    // Lưu lại bản ghi đã cập nhật
    await rfidCard.save();

    return res.status(200).json({
      status: 200,
      data: rfidCard,
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong UpdateRFIDCard:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const DeleteRFIDCard = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'ID không hợp lệ.'
      });
    }

    const rfidCard = await RFIDCard.findById(id);

    if (!rfidCard) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy thẻ RFID với ID này.'
      });
    }

    // Xóa thẻ RFID
    await RFIDCard.deleteOne({ _id: id });

    return res.status(200).json({
      status: 200,
      data: 'Thẻ RFID đã được xóa thành công.',
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong DeleteRFIDCard:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const GetRFIDCardByUUID = async (req, res) => {
  try {
    const { uuid } = req.body;

    if (!uuid) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'Thiếu uuid trong body request.'
      });
    }

    // Tìm thẻ RFID theo uuid
    const rfidCard = await RFIDCard.findOne({ uuid });

    if (!rfidCard) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy thẻ RFID với UUID này.'
      });
    }

    return res.status(200).json({
      status: 200,
      data: rfidCard,
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong FindRFIDCardByUUID:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

module.exports = {
    GetAllRFIDCards,
    GetRFIDCardById,
    CreateRFIDCard,
    UpdateRFIDCard,
    DeleteRFIDCard,
    GetRFIDCardByUUID
};
