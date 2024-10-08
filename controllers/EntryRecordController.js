const EntryRecord = require("../models/EntryRecord");
const UserShift = require("../models/UserShift");
const User = require("../models/User");
const Shift = require("../models/Shift");
const Vehicle = require("../models/Vehicle");
const RFIDCard = require("../models/RFIDCard");
const ResidentHistoryMoney = require("../models/ResidentHistoryMoney");
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client({ region: 'your-region' });
const mongoose = require('mongoose');

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
    const { licensePlate, pageNumber = 1, pageSize = 10 } = req.body;

    if (!licensePlate) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'Thiếu trường licensePlate trong body request.'
      });
    }

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

    const totalRecords = await EntryRecord.countDocuments({ licensePlate });

    if (totalRecords === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy bản ghi EntryRecord với licensePlate này.'
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
      })
      .skip(skip)  // Áp dụng phân trang
      .limit(parsedPageSize);  // Giới hạn số lượng bản ghi trả về

    const totalPages = Math.ceil(totalRecords / parsedPageSize);

    return res.status(200).json({
      status: 200,
      data: {
        entryRecords,
        currentPage: parsedPageNumber,
        pageSize: parsedPageSize,
        totalRecords,
        totalPages
      },
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

const GetEntryRecordsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, pageNumber = 1, pageSize = 10 } = req.body;

    // Kiểm tra trường hợp thiếu startDate hoặc endDate
    if (!startDate || !endDate) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'Thiếu trường startDate hoặc endDate trong body request.'
      });
    }

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    // Kiểm tra tính hợp lệ của các ngày
    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'startDate hoặc endDate không hợp lệ.'
      });
    }

    if (parsedStartDate > parsedEndDate) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'startDate phải sớm hơn endDate.'
      });
    }

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

    const totalRecords = await EntryRecord.countDocuments({
      entryTime: {
        $gte: parsedStartDate,
        $lte: parsedEndDate
      },
      isDelete: false
    });

    if (totalRecords === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không có bản ghi nào được tìm thấy trong khoảng thời gian này.'
      });
    }

    const records = await EntryRecord.find({
      entryTime: {
        $gte: parsedStartDate,
        $lte: parsedEndDate
      },
      isDelete: false
    })
      .populate({
        path: 'users_shiftId',
        populate: [
          { path: 'userId', model: 'User', select: 'username' },
          { path: 'shiftId', model: 'Shift', select: 'shiftName startTime endTime' }
        ]
      })
      .populate({
        path: 'rfidId',
        model: 'RFIDCard',
        select: 'uuid'
      })
      .sort({ entryTime: -1 })
      .skip(skip)
      .limit(parsedPageSize);

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
    console.error('Lỗi không xác định trong GetEntryRecordsByDateRange:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const GetEntryRecordsByVehicleType = async (req, res) => {
  try {
    const { vehicleType, pageNumber = 1, pageSize = 10 } = req.body;

    if (!vehicleType) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'Thiếu trường vehicleType trong body request.'
      });
    }

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

    const totalRecords = await EntryRecord.countDocuments({ vehicleType });

    if (totalRecords === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy bản ghi EntryRecord nào với loại xe này.'
      });
    }

    const records = await EntryRecord.find({ vehicleType })
      .populate({
        path: 'users_shiftId',
        populate: [
          { path: 'userId', model: 'User', select: 'username' },
          { path: 'shiftId', model: 'Shift', select: 'shiftName startTime endTime' }
        ]
      })
      .populate({
        path: 'rfidId',
        model: 'RFIDCard',
        select: 'uuid'
      })
      .skip(skip)
      .limit(parsedPageSize);

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
    console.error('Lỗi trong GetEntryRecordsByVehicleType:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const CountVehicleEntry = async (req, res) => {
  try {
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'Thiếu trường date trong body request.',
      });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'date không hợp lệ.',
      });
    }

    const startOfDay = new Date(parsedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(parsedDate.setHours(23, 59, 59, 999));

    const vehicleCounts = await EntryRecord.aggregate([
      {
        $match: {
          entryTime: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
          isDelete: false,
          isOut: true,
        },
      },
      {
        $group: {
          _id: "$vehicleType",
          amount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          vehicleType: "$_id",
          amount: 1,
        },
      },
    ]);

    return res.status(200).json({
      status: 200,
      data: vehicleCounts,
      error: null,
    });
  } catch (error) {
    console.error('Lỗi trong CountVehicleEntry:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.',
    });
  }
};

const CreateEntryRecord = async (req, res) => {
  try {
    const {picture_front, picture_back, licensePlate, vehicleType, users_shiftId, rfidId } = req.body;

    const entryTime = new Date();
    let isResident = req.body.isResident; 

    // Kiểm tra licensePlate trong cơ sở dữ liệu
    const vehicle = await Vehicle.findOne({ licensePlate });

    if (!vehicle) {
      isResident = false;
    } else {
      // Lấy vehicleId từ bảng Vehicle
      const vehicleId = vehicle._id;

      // Tìm bản ghi ResidentHistoryMoney theo vehicleId và lấy bản ghi có endDate gần nhất
      const residentHistory = await ResidentHistoryMoney.findOne({ vehicleId, isDelete: false })
        .sort({ endDate: -1 }) // Sắp xếp theo ngày kết thúc giảm dần (mới nhất trước)
        .limit(1); // Lấy bản ghi mới nhất

      if (residentHistory) {
        const endDate = new Date(residentHistory.endDate);
        const currentDate = new Date();

        // Kiểm tra nếu ngày kết thúc đã qua
        if (endDate < currentDate) {
          return res.status(400).json({
            status: 400,
            data: null,
            error: 'Hết hạn đăng ký tháng, không thể đăng nhập xe cư dân.'
          });
        }

        // Nếu ngày kết thúc hợp lệ, giữ isResident là true
        isResident = true;
      } else {
        // Nếu không có bản ghi ResidentHistoryMoney hợp lệ, không phải cư dân
        isResident = false;
      }
    }

    // Kiểm tra tính hợp lệ của licensePlate
    if (!licensePlate || typeof licensePlate !== 'string') {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'licensePlate không hợp lệ.'
      });
    }

    // Kiểm tra tính hợp lệ của vehicleType
    const validVehicleTypes = ['car', 'motor'];
    if (!validVehicleTypes.includes(vehicleType)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'vehicleType phải là "car" hoặc "motor".'
      });
    }

    // Kiểm tra users_shiftId hợp lệ và tồn tại
    if (!mongoose.Types.ObjectId.isValid(users_shiftId)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'users_shiftId không hợp lệ.'
      });
    }
    const shiftExists = await UserShift.findById(users_shiftId);
    if (!shiftExists) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'users_shiftId không tồn tại trong cơ sở dữ liệu.'
      });
    }

    // Kiểm tra rfidId hợp lệ và tồn tại
    if (!mongoose.Types.ObjectId.isValid(rfidId)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'rfidId không hợp lệ.'
      });
    }
    const rfidExists = await RFIDCard.findById(rfidId);
    if (!rfidExists) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'rfidId không tồn tại trong cơ sở dữ liệu.'
      });
    }

    // Tạo bản ghi EntryRecord mới
    const newEntryRecord = new EntryRecord({
      entryTime,
      picture_front,
      picture_back,
      licensePlate,
      isResident,
      vehicleType,
      users_shiftId,
      rfidId,
      isOut: false // Mặc định khi vào bãi xe là chưa ra
    });

    // Lưu bản ghi vào cơ sở dữ liệu
    await newEntryRecord.save();

    return res.status(201).json({
      status: 201,
      data: newEntryRecord,
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong CreateEntryRecord:', error);
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
  GetEntryRecordByLicensePlate,
  GetEntryRecordsByDateRange,
  GetEntryRecordsByVehicleType,
  CountVehicleEntry,
  CreateEntryRecord
};
  