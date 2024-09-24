const EntryRecord = require("../models/EntryRecord");
const UserShift = require("../models/UserShift");
const User = require("../models/User");
const Shift = require("../models/Shift");
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client({ region: 'your-region' });

const GetAllRecords = async (req, res) => {
  try {

    const userToken = req.user; // lấy từ token jwt

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

    const totalRecords = await EntryRecord.countDocuments({ isDelete: false });
    
    if (totalRecords === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không có bản ghi nào được tìm thấy.'
      });
    }

    const records = await EntryRecord.find({ isDelete: false })
    .populate({
      path: 'users_shiftId', // Liên kết với bảng UserShift
      populate: [
        {
          path: 'userId', // Liên kết với bảng User thông qua userId
          model: 'User', // Lấy dữ liệu từ bảng User
          select: 'username' // Chỉ lấy trường username từ bảng User
        },
        {
          path: 'shiftId', // Liên kết với bảng Shift thông qua shiftId
          model: 'Shift', // Lấy dữ liệu từ bảng Shift
          select: 'shiftName startTime endTime' // Chỉ lấy các trường cần thiết từ bảng Shift
        }
      ]
    })
    .sort({ entryTime: -1 }) 
    .skip(skip)
    .limit(parsedPageSize);

    if (records.length === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy bản ghi nào cho trang này.'
      });
    }

    // Tính tổng số trang
    const totalPages = Math.ceil(totalRecords / parsedPageSize);

    // Trả về dữ liệu thành công
    return res.status(200).json({
      status: 200,
      data: {
        records,   
        currentPage: parsedPageNumber,  
        pageSize: parsedPageSize,   
        totalRecords,   
        totalPages    
      },
      error: null
    });

  } catch (error) {
    console.error(`Lỗi không xác định trong GetAllRecords từ EntryRecord:`, error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

module.exports = {
  GetAllRecords
};

  