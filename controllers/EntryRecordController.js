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

    // Cập nhật để trả về đường dẫn ảnh đầy đủ
    const updatedRecords = records.map(record => ({
      ...record.toObject(),
      picture_front: record.picture_front ? `${process.env.MINIO_SERVER_URL}${record.picture_front}` : '',
      picture_back: record.picture_back ? `${process.env.MINIO_SERVER_URL}${record.picture_back}` : ''
    }));

    const totalPages = Math.ceil(totalRecords / parsedPageSize);

    return res.status(200).json({
      status: 200,
      data: {
        records: updatedRecords,
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

    entryRecord.picture_front = entryRecord.picture_front ? `${process.env.MINIO_SERVER_URL}${entryRecord.picture_front}` : '';
    entryRecord.picture_back = entryRecord.picture_back ? `${process.env.MINIO_SERVER_URL}${entryRecord.picture_back}` : '';

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

    const updatedRecords = entryRecords.map(record => ({
      ...record.toObject(),
      picture_front: record.picture_front ? `${process.env.MINIO_SERVER_URL}${record.picture_front}` : '',
      picture_back: record.picture_back ? `${process.env.MINIO_SERVER_URL}${record.picture_back}` : ''
    }));

    return res.status(200).json({
      status: 200,
      data: {
        entryRecords: updatedRecords,
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

      const updatedRecords = records.map(record => ({
        ...record.toObject(),
        picture_front: record.picture_front ? `${process.env.MINIO_SERVER_URL}${record.picture_front}` : '',
        picture_back: record.picture_back ? `${process.env.MINIO_SERVER_URL}${record.picture_back}` : ''
      }));
  
      const totalPages = Math.ceil(totalRecords / parsedPageSize);
  
      return res.status(200).json({
        status: 200,
        data: {
          records: updatedRecords,
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

      const updatedRecords = records.map(record => ({
        ...record.toObject(),
        picture_front: record.picture_front ? `${process.env.MINIO_SERVER_URL}${record.picture_front}` : '',
        picture_back: record.picture_back ? `${process.env.MINIO_SERVER_URL}${record.picture_back}` : ''
      }));
  
      const totalPages = Math.ceil(totalRecords / parsedPageSize);
  
      return res.status(200).json({
        status: 200,
        data: {
          records: updatedRecords,
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
    const { picture_front, picture_back, licensePlate, vehicleType, users_shiftId, rfidId } = req.body;

    const entryTime = new Date();
    let isResident = req.body.isResident;

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
    const userShift = await UserShift.findById(users_shiftId).populate('userId').populate('shiftId');
    if (!userShift) {
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
    const rfidCard = await RFIDCard.findById(rfidId).select('uuid createdAt');
    if (!rfidCard) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'rfidId không tồn tại trong cơ sở dữ liệu.'
      });
    }

    // Kiểm tra licensePlate trong cơ sở dữ liệu
    const vehicle = await Vehicle.findOne({ licensePlate });
    let customer = {};

    if (!vehicle) {
      isResident = false;
    } else {
      const vehicleId = vehicle._id;

      // Tìm bản ghi ResidentHistoryMoney theo vehicleId và lấy bản ghi có endDate gần nhất
      const residentHistory = await ResidentHistoryMoney.findOne({ vehicleId, isDelete: false })
        .sort({ endDate: -1 })
        .limit(1);

      if (residentHistory) {
        const endDate = new Date(residentHistory.endDate);
        const currentDate = new Date();

        if (endDate < currentDate) {
          return res.status(400).json({
            status: 400,
            data: null,
            error: 'Hết hạn đăng ký tháng, không thể đăng nhập xe cư dân.'
          });
        }
        isResident = true;
      } else {
        isResident = false;
      }

      customer = await Customer.findById(vehicle.customerId).select('fullName phoneNumber address isResident');
    }

    // Lấy phần đường dẫn tương đối từ URL
    const extractRelativePath = (url) => {
      const serverUrl = process.env.MINIO_SERVER_URL;
      return url.replace(serverUrl, '');
    };

    const relativePictureFront = extractRelativePath(picture_front);
    const relativePictureBack = extractRelativePath(picture_back);

    // Tạo bản ghi EntryRecord mới
    const newEntryRecord = new EntryRecord({
      entryTime,
      picture_front: relativePictureFront,
      picture_back: relativePictureBack,
      licensePlate,
      isResident,
      vehicleType,
      users_shiftId,
      rfidId,
      isOut: false
    });

    await newEntryRecord.save();

    // Định dạng phản hồi theo cấu trúc yêu cầu
    return res.status(201).json({
      status: 201,
      entryRecord: {
        id: newEntryRecord._id,
        entryTime: newEntryRecord.entryTime,
        picture_front: `${process.env.MINIO_SERVER_URL}${relativePictureFront}`,
        picture_back: `${process.env.MINIO_SERVER_URL}${relativePictureBack}`,
        licensePlate: newEntryRecord.licensePlate,
        isResident: newEntryRecord.isResident,
        vehicleType: newEntryRecord.vehicleType,
        isOut: newEntryRecord.isOut,
        users_shift: {
          fullName: userShift?.userId?.fullname || '',
          phoneNumber: userShift?.userId?.phoneNumber || '',
          shiftName: userShift?.shiftId?.shiftName || '',
          startTime: userShift?.shiftId?.startTime || '',
          endTime: userShift?.shiftId?.endTime || ''
        },
        rfid: {
          uuid: rfidCard?.uuid || [],
          createdAt: rfidCard?.createdAt || []
        },
        customer: {
          fullName: customer?.fullName || '',
          phoneNumber: customer?.phoneNumber || '',
          address: customer?.address || '',
          isResident: customer?.isResident || false
        }
      },
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

const CountVehicleNonExit = async (req, res) => {
  try {
    // Đếm số lượng xe chưa ra, với điều kiện isOut là false và chia theo loại xe
    const vehicleCounts = await EntryRecord.aggregate([
      {
        $match: {
          isOut: false, // Chỉ chọn những xe chưa ra
          isDelete: false // Không bao gồm bản ghi bị xóa
        }
      },
      {
        $group: {
          _id: "$vehicleType", // Nhóm theo loại phương tiện (car hoặc motor)
          count: { $sum: 1 } // Đếm số lượng phương tiện
        }
      },
      {
        $project: {
          _id: 0,
          vehicleType: "$_id", // Đổi tên _id thành vehicleType
          count: 1
        }
      }
    ]);

    if (vehicleCounts.length === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không có phương tiện nào chưa ra khỏi bãi xe.'
      });
    }

    return res.status(200).json({
      status: 200,
      data: vehicleCounts,
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong countVehicleNonExit:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const FilterEntryRecords = async (req, res) => {
  try {
    const { fromDay, toDay, useridofshift, isResident, isOut, pageNumber = 1, pageSize = 10 } = req.body;

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

    // Tạo điều kiện lọc
    let matchCondition = { isDelete: false };

    // Lọc theo khoảng thời gian (entryTime)
    if (fromDay && toDay) {
      const parsedFromDay = new Date(fromDay);
      const parsedToDay = new Date(toDay);

      if (isNaN(parsedFromDay.getTime()) || isNaN(parsedToDay.getTime())) {
        return res.status(400).json({
          status: 400,
          data: null,
          error: 'Ngày không hợp lệ.'
        });
      }

      // Đặt thời gian đầu ngày cho fromDay (00:00:00)
      parsedFromDay.setHours(0, 0, 0, 0);

      // Đặt thời gian cuối ngày cho toDay (23:59:59)
      parsedToDay.setHours(23, 59, 59, 999);

      matchCondition.entryTime = {
        $gte: parsedFromDay,
        $lte: parsedToDay
      };
    }

    // Lọc theo ca trực của useridofshift
    if (useridofshift) {
      const userShift = await UserShift.findOne({ userId: useridofshift }).select('_id');
      if (!userShift) {
        return res.status(404).json({
          status: 404,
          data: null,
          error: 'Không tìm thấy ca trực cho người dùng này.'
        });
      }
      matchCondition.users_shiftId = userShift._id;
    }

    // Lọc theo tình trạng cư dân (isResident)
    if (typeof isResident === 'boolean') {
      matchCondition.isResident = isResident;
    }

    // Lọc theo trạng thái ra ngoài (isOut)
    if (typeof isOut === 'boolean') {
      matchCondition.isOut = isOut;
    }

    // Pipeline để lấy dữ liệu từ EntryRecord
    const pipeline = [
      { $match: matchCondition },
      { $sort: { entryTime: -1 } }, 
      {
        $lookup: {
          from: 'vehicles',
          localField: 'licensePlate',
          foreignField: 'licensePlate',
          as: 'vehicle'
        }
      },
      { $unwind: { path: '$vehicle', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'customers',
          localField: 'vehicle.customerId',
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users_shift', // Liên kết với bảng users_shift
          localField: 'users_shiftId',
          foreignField: '_id',
          as: 'userShift'
        }
      },
      { $unwind: { path: '$userShift', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users', // Liên kết với bảng users
          localField: 'userShift.userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'shift', // Liên kết với bảng shift
          localField: 'userShift.shiftId',
          foreignField: '_id',
          as: 'shift'
        }
      },
      { $unwind: { path: '$shift', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          'userShift.fullName': '$user.fullname',
          'userShift.phoneNumber': '$user.phoneNumber',
          'userShift.shiftName': '$shift.shiftName',
          'userShift.startTime': '$shift.startTime',
          'userShift.endTime': '$shift.endTime'
        }
      },
      {
        $lookup: {
          from: 'rfid_cards', // Liên kết với bảng rfid_cards
          localField: 'rfidId',
          foreignField: '_id',
          as: 'rfidCard'
        }
      },
      {
        $lookup: {
          from: 'exit_records',
          localField: '_id',
          foreignField: 'entry_recordId',
          as: 'exitRecord'
        }
      },
      { $unwind: { path: '$exitRecord', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          exitRecord: {
            $cond: {
              if: { $eq: ['$exitRecord', null] }, // Kiểm tra nếu exitRecord là null
              then: {}, // Trả về đối tượng rỗng nếu không có exitRecord
              else: '$exitRecord' // Giữ nguyên giá trị của exitRecord nếu tồn tại
            }
          }
        }
      },
      {
        $project: {
          entryRecord: {
            id: '$_id',
            entryTime: '$entryTime',
            picture_front: {
              $cond: {
                if: { $not: ['$picture_front'] },
                then: '',
                else: { $concat: [process.env.MINIO_SERVER_URL, '$picture_front'] }
              }
            },
            picture_back: {
              $cond: {
                if: { $not: ['$picture_back'] },
                then: '',
                else: { $concat: [process.env.MINIO_SERVER_URL, '$picture_back'] }
              }
            },
            licensePlate: '$licensePlate',
            isResident: '$isResident',
            vehicleType: '$vehicleType',
            isOut: '$isOut',
            users_shift: {
              fullName: '$userShift.fullName',
              phoneNumber: '$userShift.phoneNumber',
              shiftName: '$userShift.shiftName',
              startTime: '$userShift.startTime',
              endTime: '$userShift.endTime'
            },
            rfid: {
              uuid: '$rfidCard.uuid',  // Thêm thông tin RFID từ bảng rfid_cards
              createdAt: '$rfidCard.createdAt'
            },
            customer: {
              fullName: '$customer.fullName',
              phoneNumber: '$customer.phoneNumber',
              address: '$customer.address',
              isResident: '$customer.isResident'
            }
          },
          exitRecord: { 
            $ifNull: ['$exitRecord', {}] // Nếu exitRecord là null hoặc không có, trả về đối tượng rỗng
          }
        }
      },
      { $skip: skip },
      { $limit: parsedPageSize }
    ];

    // Thực hiện truy vấn
    const results = await EntryRecord.aggregate(pipeline);

    // Đếm tổng số bản ghi
    const totalRecords = await EntryRecord.countDocuments(matchCondition);

    if (!results.length) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không có bản ghi nào được tìm thấy.'
      });
    }

    const totalPages = Math.ceil(totalRecords / parsedPageSize);

    return res.status(200).json({
      status: 200,
      data: {
        records: results,
        currentPage: parsedPageNumber,
        pageSize: parsedPageSize,
        totalRecords,
        totalPages
      },
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong FilterEntryRecords:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const GetEntryRecordByisOutAndUuidAndLicensePlate = async (req, res) => {
  try {
    const { isOut, uuid, licensePlate } = req.body;

    // Validate request fields
    if (typeof isOut !== 'boolean' || !uuid || !licensePlate) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'Thiếu trường isOut, uuid hoặc licensePlate trong body request.'
      });
    }

    // Find the RFID card by uuid
    const rfidCard = await RFIDCard.findOne({ uuid });
    if (!rfidCard) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy RFIDCard với uuid cung cấp.'
      });
    }

    // Use the rfidCard._id to find the EntryRecord
    const entryRecord = await EntryRecord.findOne({ isOut, rfidId: rfidCard._id, licensePlate })
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

    // Check if the entry record was found
    if (!entryRecord) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy bản ghi EntryRecord với các điều kiện cung cấp.'
      });
    }

    // Add URL prefixes to pictures if available
    entryRecord.picture_front = entryRecord.picture_front ? `${process.env.MINIO_SERVER_URL}${entryRecord.picture_front}` : '';
    entryRecord.picture_back = entryRecord.picture_back ? `${process.env.MINIO_SERVER_URL}${entryRecord.picture_back}` : '';

    // Send response with the populated entry record
    return res.status(200).json({
      status: 200,
      data: entryRecord,
      error: null
    });
  } catch (error) {
    console.error(`Lỗi trong GetEntryRecordByisOutAndUuidAndLicensePlate từ EntryRecord:`, error);
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
  CreateEntryRecord,
  CountVehicleNonExit,
  FilterEntryRecords,
  GetEntryRecordByisOutAndUuidAndLicensePlate
};
  