const ExitRecord = require("../models/ExitRecord");
const EntryRecord = require("../models/EntryRecord");
const ParkingRate = require("../models/ParkingRate");
const VisitorHistoryMoney = require("../models/VisitorHistoryMoney");
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client({ region: 'your-region' });
const mongoose = require('mongoose');

const GetAllExitRecords = async (req, res) => {
  try {
    const userToken = req.user; // Lấy từ token jwt

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

    const totalRecords = await ExitRecord.countDocuments({ isDelete: false });

    if (totalRecords === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không có bản ghi nào được tìm thấy.'
      });
    }

    const records = await ExitRecord.find({ isDelete: false })
      .populate({
        path: 'entry_recordId', // Liên kết với bảng EntryRecord
        model: 'EntryRecord', // Lấy dữ liệu từ bảng EntryRecord
        select: 'entryTime licensePlate vehicleType' // Chỉ lấy các trường cần thiết từ EntryRecord
      })
      .sort({ exitTime: -1 }) // Sắp xếp theo thời gian exitTime giảm dần
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
    console.error(`Lỗi không xác định trong GetAllExitRecords từ ExitRecord:`, error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const GetExitRecordById = async (req, res) => {
  try {
    const { id } = req.body;

    // Kiểm tra trường hợp không có id
    if (!id) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'Thiếu trường id trong body request.'
      });
    }

    const exitRecord = await ExitRecord.findById(id)
      .populate({
        path: 'entry_recordId',
        model: 'EntryRecord',
        select: 'entryTime licensePlate vehicleType'
      });

    if (!exitRecord) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy bản ghi ExitRecord với id này.'
      });
    }

    return res.status(200).json({
      status: 200,
      data: exitRecord,
      error: null
    });
  } catch (error) {
    console.error(`Lỗi trong getExitRecordById từ ExitRecord:`, error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const GetExitRecordByEntryRecordId = async (req, res) => {
  try {
    const { entry_recordId } = req.body;

    // Kiểm tra trường hợp không có entry_recordId
    if (!entry_recordId) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'Thiếu trường entry_recordId trong body request.'
      });
    }

    const exitRecord = await ExitRecord.findOne({ entry_recordId })
      .populate({
        path: 'entry_recordId',
        model: 'EntryRecord',
        select: 'entryTime licensePlate vehicleType'
      });

    if (!exitRecord) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy bản ghi ExitRecord với entry_recordId này.'
      });
    }

    return res.status(200).json({
      status: 200,
      data: exitRecord,
      error: null
    });
  } catch (error) {
    console.error(`Lỗi trong getExitRecordByEntryRecordId từ ExitRecord:`, error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const GetExitRecordByLicensePlate = async (req, res) => {
  try {
    const { licensePlate, pageNumber = 1, pageSize = 10 } = req.body;

    // Kiểm tra trường hợp không có licensePlate
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

    const totalRecords = await ExitRecord.countDocuments({ licensePlate });
    
    if (totalRecords === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy bản ghi ExitRecord với licensePlate này.'
      });
    }

    const exitRecords = await ExitRecord.find({ licensePlate })
      .populate({
        path: 'entry_recordId',
        model: 'EntryRecord',
        select: 'entryTime licensePlate vehicleType'
      })
      .skip(skip)
      .limit(parsedPageSize);

    const totalPages = Math.ceil(totalRecords / parsedPageSize);

    return res.status(200).json({
      status: 200,
      data: {
        exitRecords,
        currentPage: parsedPageNumber,
        pageSize: parsedPageSize,
        totalRecords,
        totalPages
      },
      error: null
    });
  } catch (error) {
    console.error(`Lỗi trong GetExitRecordByLicensePlate từ ExitRecord:`, error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const GetExitRecordsByDateRange = async (req, res) => {
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

      // Chuyển đổi ngày bắt đầu và ngày kết thúc
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

      // Phân trang
      const parsedPageNumber = parseInt(pageNumber, 10);
      const parsedPageSize = parseInt(pageSize, 10);
      const skip = (parsedPageNumber - 1) * parsedPageSize;

      const totalRecords = await ExitRecord.countDocuments({
        exitTime: {
          $gte: parsedStartDate, 
          $lte: parsedEndDate 
        },
        isDelete: false
      });

      if (totalRecords === 0) {
          return res.status(404).json({
              status: 404,
              data: null,
              error: 'Không tìm thấy bản ghi ExitRecord nào trong khoảng thời gian này.'
          });
      }

      const records = await ExitRecord.find({
          exitTime: {
              $gte: parsedStartDate,
              $lte: parsedEndDate
          },
          isDelete: false
      })
      .populate({
          path: 'entry_recordId',
          model: 'EntryRecord',
          select: 'entryTime licensePlate vehicleType'
      })
      .sort({ exitTime: -1 })
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
      console.error(`Lỗi không xác định trong GetExitRecordsByDateRange từ ExitRecord:`, error);
      return res.status(500).json({
          status: 500,
          data: null,
          error: 'Lỗi máy chủ không xác định.'
      });
  }
};

const GetExitRecordsByVehicleType = async (req, res) => {
  try {
    const { vehicleType, pageNumber = 1, pageSize = 10 } = req.body;

    // Kiểm tra trường hợp không có vehicleType
    if (!vehicleType) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'Thiếu trường vehicleType trong body request.'
      });
    }

    const parsedPageNumber = parseInt(pageNumber, 10);
    const parsedPageSize = parseInt(pageSize, 10);
    const skip = (parsedPageNumber - 1) * parsedPageSize;

    const totalRecords = await ExitRecord.countDocuments({ vehicleType });
    
    if (totalRecords === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy bản ghi ExitRecord với loại xe này.'
      });
    }

    const exitRecords = await ExitRecord.find({ vehicleType })
      .populate({
        path: 'entry_recordId',
        model: 'EntryRecord',
        select: 'entryTime licensePlate vehicleType'
      })
      .skip(skip)
      .limit(parsedPageSize);

    const totalPages = Math.ceil(totalRecords / parsedPageSize);

    return res.status(200).json({
      status: 200,
      data: {
        exitRecords,
        currentPage: parsedPageNumber,
        pageSize: parsedPageSize,
        totalRecords,
        totalPages
      },
      error: null
    });
  } catch (error) {
    console.error(`Lỗi trong GetExitRecordsByVehicleType từ ExitRecord:`, error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const CountVehicleExitRecord = async (req, res) => {
  try {
    const { date } = req.body;

    // Kiểm tra trường hợp không có date
    if (!date) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'Thiếu trường date trong body request.',
      });
    }

    // Chuyển đổi date thành đối tượng Date
    const parsedDate = new Date(date);

    // Kiểm tra tính hợp lệ của date
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'date không hợp lệ.',
      });
    }

    // Lấy ngày bắt đầu và kết thúc của ngày đã cho
    const startOfDay = new Date(parsedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(parsedDate.setHours(23, 59, 59, 999));

    // Lấy danh sách các entryRecordId cho các xe đã ra (isOut: true)
    const entryRecordIds = await EntryRecord.find({ isOut: true }).distinct('_id');

    // Sử dụng aggregation để nhóm và đếm số lượng xe theo vehicleType
    const vehicleCounts = await ExitRecord.aggregate([
      {
        $match: {
          exitTime: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
          isDelete: false, // Chỉ đếm những bản ghi chưa bị xóa
          entry_recordId: {
            $in: entryRecordIds,
          },
        },
      },
      {
        $group: {
          _id: "$vehicleType", // Nhóm theo vehicleType
          amount: { $sum: 1 }, // Đếm số lượng cho mỗi loại xe
        },
      },
      {
        $project: {
          _id: 0, // Ẩn _id
          vehicleType: "$_id", // Gán vehicleType từ _id
          amount: 1, // Hiển thị số lượng xe
        },
      },
    ]);

    return res.status(200).json({
      status: 200,
      data: vehicleCounts,
      error: null,
    });
  } catch (error) {
    console.error('Lỗi trong CountVehicleExitRecord:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.',
    });
  }
};

const calculateParkingFee = async (vehicleType, hoursParked) => {
  // Lấy danh sách giá cho loại xe cụ thể
  const parkingRates = await ParkingRate.find({ vehicleType }).sort({ hourly: 1 });

  // Lấy mức giá cao nhất trong ngày (thường là 24 giờ)
  const maxRate = parkingRates[parkingRates.length - 1];

  // Nếu thời gian đỗ <= 24h, tính giá cao nhất trong ngày đó
  if (hoursParked <= 24) {
    // Tìm giá tương ứng với số giờ đỗ
    for (let rate of parkingRates) {
      if (hoursParked <= rate.hourly) {
        return rate.price;
      }
    }
    // Trường hợp nếu vượt quá giờ lớn nhất (24h)
    return maxRate.price;
  }

  // Nếu thời gian đỗ xe > 24h
  let totalFee = maxRate.price; // Tính phí cho ngày đầu tiên
  let remainingHours = hoursParked - 24; // Giờ còn lại sau ngày đầu tiên

  // Tính phí cho từng ngày sau đó, mỗi ngày là một giá trị của maxRate
  const fullDays = Math.floor(remainingHours / 24); // Số ngày đầy đủ
  totalFee += fullDays * maxRate.price; // Cộng thêm phí cho từng ngày

  // Xử lý số giờ lẻ còn lại
  remainingHours = remainingHours % 24;
  if (remainingHours > 0) {
    // Tìm giá cho số giờ lẻ còn lại
    for (let rate of parkingRates) {
      if (remainingHours <= rate.hourly) {
        totalFee += rate.price;
        break;
      }
    }
  }
  return totalFee;
};

const CreateExitRecord = async (req, res) => {
  try {
    const { 
      entry_recordId, 
      picture_front, 
      picture_back, 
      licensePlate, 
      isResident, 
      vehicleType 
    } = req.body;

    // exitTime sẽ là thời gian hiện tại
    const exitTime = new Date();

    // Kiểm tra hợp lệ cho entry_recordId
    if (!entry_recordId || !mongoose.Types.ObjectId.isValid(entry_recordId)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'entry_recordId không hợp lệ.'
      });
    }

    // Kiểm tra xem entry_recordId có tồn tại trong EntryRecord và isOut là false
    const entryRecord = await EntryRecord.findOne({ 
      _id: entry_recordId, 
      isOut: false 
    });

    if (!entryRecord) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'Bản ghi entry không tồn tại hoặc đã ra ngoài.'
      });
    }

    // So sánh licensePlate, isResident, và vehicleType với EntryRecord
    if (licensePlate !== entryRecord.licensePlate) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'licensePlate không khớp với bản ghi EntryRecord.'
      });
    }

    if (isResident !== entryRecord.isResident) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'isResident không khớp với bản ghi EntryRecord.'
      });
    }

    if (vehicleType !== entryRecord.vehicleType) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'vehicleType không khớp với bản ghi EntryRecord.'
      });
    }

    // Kiểm tra hợp lệ cho picture_front và picture_back (nếu có yêu cầu)
    if (picture_front && typeof picture_front !== 'string') {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'picture_front phải là một chuỗi.'
      });
    }

    if (picture_back && typeof picture_back !== 'string') {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'picture_back phải là một chuỗi.'
      });
    }

   // Tính thời gian đỗ xe
   const duration = Math.abs(new Date(exitTime) - new Date(entryRecord.entryTime));
   const hoursParked = Math.ceil(duration / (1000 * 60 * 60)); // Làm tròn lên theo giờ

   let parkingFee = 0;

   // Nếu không phải cư dân, tính phí đỗ xe
   if (!isResident) {
     parkingFee = await calculateParkingFee(vehicleType, hoursParked);
   }

   // Tạo bản ghi ExitRecord mới
   const newExitRecord = new ExitRecord({
     entry_recordId,
     exitTime,
     picture_front,
     picture_back,
     licensePlate,
     isResident,
     vehicleType
   });

   // Lưu bản ghi vào cơ sở dữ liệu
   await newExitRecord.save();

   // Cập nhật isOut của EntryRecord thành true
   entryRecord.isOut = true;
   await entryRecord.save();

   // Nếu không phải cư dân, lưu phí đỗ xe vào VisitorHistoryMoney
   if (!isResident) {
     const newVisitorHistoryMoney = new VisitorHistoryMoney({
       exit_recordId: newExitRecord._id,
       licensePlate,
       dateTime: exitTime,
       hourly: hoursParked,
       vehicleType,
       parkingFee
     });

     await newVisitorHistoryMoney.save();

     // Trả về phản hồi với thông tin về thời gian đỗ xe và phí đỗ xe
     return res.status(201).json({
       status: 201,
       data: {
         newExitRecord,
         parkingDetails: {
           hoursParked,
           parkingFee
         }
       },
       error: null
     });
   }

   // Trả về phản hồi thành công cho cư dân (không tính phí đỗ xe)
   return res.status(201).json({
     status: 201,
     data: newExitRecord,
     error: null
   });
 } catch (error) {
   console.error('Lỗi trong CreateExitRecord từ ExitRecord:', error);
   return res.status(500).json({
     status: 500,
     data: null,
     error: 'Lỗi máy chủ không xác định.'
   });
 }
};

module.exports = {
  GetAllExitRecords,
  GetExitRecordById,
  GetExitRecordByEntryRecordId,
  GetExitRecordByLicensePlate,
  GetExitRecordsByDateRange,
  GetExitRecordsByVehicleType,
  CountVehicleExitRecord,
  CreateExitRecord
};
