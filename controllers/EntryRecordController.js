const EntryRecord = require("../models/EntryRecord");
const UserShift = require("../models/UserShift");
const User = require("../models/User");
const Shift = require("../models/Shift");
const RFIDCard = require("../models/RFIDCard");
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client({ region: 'your-region' });

const GetAllEntryRecords = async (req, res) => {
  try {

    const userToken = req.user;

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
    .populate({
      path: 'rfidId', // Liên kết với bảng RFIDCard thông qua rfidId
      model: 'RFIDCard', // Lấy dữ liệu từ bảng RFIDCard
      select: 'uuid' // Chỉ lấy UUID từ bảng RFIDCard
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

    const totalPages = Math.ceil(totalRecords / parsedPageSize);

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

const GetEntryRecordById = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'Thiếu trường id trong body request.'
      });
    }

    const entryRecord = await EntryRecord.findById(id)
      .populate({
        path: 'users_shiftId',
        populate: [
          {
            path: 'userId',
            model: 'User',
            select: 'username'
          },
          {
            path: 'shiftId',
            model: 'Shift',
            select: 'shiftName startTime endTime'
          }
        ]
      })
      .populate({
        path: 'rfidId',
        model: 'RFIDCard',
        select: 'uuid'
      });

    if (!entryRecord) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy bản ghi EntryRecord với id này.'
      });
    }

    return res.status(200).json({
      status: 200,
      data: entryRecord,
      error: null
    });
  } catch (error) {
    console.error(`Lỗi trong GetEntryRecordById từ EntryRecord:`, error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const GetEntryRecordByLicensePlate = async (req, res) => {
  try {
    const { licensePlate } = req.body;

    if (!licensePlate) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'Thiếu trường licensePlate trong body request.'
      });
    }

    const entryRecords = await EntryRecord.find({ licensePlate })
      .populate({
        path: 'users_shiftId',
        populate: [
          {
            path: 'userId',
            model: 'User',
            select: 'username'
          },
          {
            path: 'shiftId',
            model: 'Shift',
            select: 'shiftName startTime endTime'
          }
        ]
      })
      .populate({
        path: 'rfidId',
        model: 'RFIDCard',
        select: 'uuid'
      });

    if (entryRecords.length === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy bản ghi EntryRecord với licensePlate này.'
      });
    }

    return res.status(200).json({
      status: 200,
      data: entryRecords,
      error: null
    });
  } catch (error) {
    console.error(`Lỗi trong GetEntryRecordByLicensePlate từ EntryRecord:`, error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

module.exports = {
  GetAllEntryRecords,
  GetEntryRecordById,
  GetEntryRecordByLicensePlate
};
  