const Customer = require('../models/Customer');
const ResidentHistoryMoney = require('../models/ResidentHistoryMoney');
const Vehicle = require('../models/Vehicle');
const ParkingSlot = require('../models/ParkingSlot');
const mongoose = require('mongoose');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client({ region: 'your-region' });

const GetAllResidentHistoryMoneys = async (req, res) => {
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
  
      const totalRecords = await ResidentHistoryMoney.countDocuments({ isDelete: false });
  
      if (totalRecords === 0) {
        return res.status(404).json({
          status: 404,
          data: null,
          error: 'Không có bản ghi nào được tìm thấy.'
        });
      }
  
      const residentHistoryMoneys = await ResidentHistoryMoney.find({ isDelete: false })
        .populate({
          path: 'vehicleId',
          model: 'Vehicle',
          select: 'licensePlate type brand' // Lấy trường name từ Vehicle
        })
        .populate({
          path: 'parking_slotId',
          model: 'ParkingSlot',
          select: 'slotCode slotType' // Lấy trường location từ ParkingSlot
        })
        .sort({ startDate: 1 }) // Sắp xếp theo ngày bắt đầu
        .skip(skip)
        .limit(parsedPageSize);
  
      if (residentHistoryMoneys.length === 0) {
        return res.status(404).json({
          status: 404,
          data: null,
          error: 'Không tìm thấy bản ghi nào cho trang này.'
        });
      }

      const currentDate = new Date();

      // Thêm isExpired
      const residentHistoryMoneysWithExpiry = residentHistoryMoneys.map(record => ({
          ...record._doc, // Spread các thuộc tính hiện có
          isExpired: new Date(record.endDate) < currentDate // So sánh endDate với ngày hiện tại
      }));

      const totalPages = Math.ceil(totalRecords / parsedPageSize);

      return res.status(200).json({
          status: 200,
          data: {
              residentHistoryMoneys: residentHistoryMoneysWithExpiry,
              currentPage: parsedPageNumber,
              pageSize: parsedPageSize,
              totalRecords,
              totalPages
          },
          error: null
      });
  } catch (error) {
      console.error('Lỗi không xác định trong GetAllResidentHistoryMoneys:', error);
      return res.status(500).json({
          status: 500,
          data: null,
          error: 'Lỗi máy chủ không xác định.'
      });
  }
};
  
const CreateResidentHistoryMoney = async (req, res) => {
  try {
      const { vehicleId, parking_slotId, monthlyFee, startDate, endDate } = req.body;

      if (!vehicleId || !parking_slotId || !monthlyFee || !startDate || !endDate) {
          return res.status(400).json({
              status: 400,
              data: null,
              error: 'Các trường bắt buộc không được để trống.'
          });
      }

      if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
          return res.status(400).json({
              status: 400,
              data: null,
              error: 'vehicleId không hợp lệ.'
          });
      }

      const vehicleExists = await Vehicle.findOne({ _id: vehicleId, isDelete: false });
      if (!vehicleExists) {
          return res.status(404).json({
              status: 404,
              data: null,
              error: 'Không tìm thấy vehicleId trong hệ thống.'
          });
      }

      if (!mongoose.Types.ObjectId.isValid(parking_slotId)) {
          return res.status(400).json({
              status: 400,
              data: null,
              error: 'parking_slotId không hợp lệ.'
          });
      }

      const parkingSlot = await ParkingSlot.findOne({ _id: parking_slotId });
      if (!parkingSlot) {
          return res.status(404).json({
              status: 404,
              data: null,
              error: 'Không tìm thấy parking_slotId trong hệ thống.'
          });
      }

      if (parkingSlot.availableSlots <= 0) {
          return res.status(400).json({
              status: 400,
              data: null,
              error: 'Không còn chỗ trống trong bãi đỗ xe này.'
          });
      }

      parkingSlot.availableSlots -= 1;
      await parkingSlot.save();

      if (typeof monthlyFee !== 'number' || monthlyFee <= 0) {
          return res.status(400).json({
              status: 400,
              data: null,
              error: 'monthlyFee phải là một số lớn hơn 0.'
          });
      }

      const parsedStartDate = new Date(startDate);
      const parsedEndDate = new Date(endDate);

      if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
          return res.status(400).json({
              status: 400,
              data: null,
              error: 'startDate hoặc endDate không hợp lệ.'
          });
      }

      if (parsedStartDate >= parsedEndDate) {
          return res.status(400).json({
              status: 400,
              data: null,
              error: 'startDate phải sớm hơn endDate.'
          });
      }

      const newResidentHistoryMoney = new ResidentHistoryMoney({
          vehicleId,
          parking_slotId,
          monthlyFee,
          startDate: parsedStartDate,
          endDate: parsedEndDate
      });

      await newResidentHistoryMoney.save();
      
         // Sử dụng populate tương tự như bạn yêu cầu
         const populatedResidentHistoryMoney = await ResidentHistoryMoney.findById(newResidentHistoryMoney._id)
         .populate({
           path: 'vehicleId',
           model: 'Vehicle',
           select: 'licensePlate type brand'
         })
         .populate({
           path: 'parking_slotId',
           model: 'ParkingSlot',
           select: 'slotCode slotType availableSlots  totalQuantity'
         });
 
       return res.status(201).json({
           status: 201,
           data: populatedResidentHistoryMoney,
           error: null
       });
   } catch (error) {
       console.error('Lỗi không xác định trong CreateResidentHistoryMoney:', error);
       return res.status(500).json({
           status: 500,
           data: null,
           error: 'Lỗi máy chủ không xác định.'
       });
   }
 };

const UpdateResidentHistoryMoney = async (req, res) => {
  try {
      const { id, vehicleId, parking_slotId, monthlyFee, startDate, endDate } = req.body;

      // Kiểm tra id bắt buộc
      if (!id) {
          return res.status(400).json({
              status: 400,
              data: null,
              error: 'id không được để trống.'
          });
      }

      // Kiểm tra id có hợp lệ là ObjectId hay không
      if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
              status: 400,
              data: null,
              error: 'id không hợp lệ.'
          });
      }

      // Tìm bản ghi cần cập nhật
      const existingRecord = await ResidentHistoryMoney.findById(id);
      if (!existingRecord) {
          return res.status(404).json({
              status: 404,
              data: null,
              error: 'Không tìm thấy bản ghi với id cung cấp.'
          });
      }

      // Kiểm tra nếu vehicleId được cung cấp
      if (vehicleId) {
          if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
              return res.status(400).json({
                  status: 400,
                  data: null,
                  error: 'vehicleId không hợp lệ.'
              });
          }

          const vehicleExists = await Vehicle.findOne({ _id: vehicleId, isDelete: false });
          if (!vehicleExists) {
              return res.status(404).json({
                  status: 404,
                  data: null,
                  error: 'Không tìm thấy vehicleId trong hệ thống.'
              });
          }

          existingRecord.vehicleId = vehicleId;
      }

      // Kiểm tra nếu parking_slotId được cung cấp
      if (parking_slotId) {
          if (!mongoose.Types.ObjectId.isValid(parking_slotId)) {
              return res.status(400).json({
                  status: 400,
                  data: null,
                  error: 'parking_slotId không hợp lệ.'
              });
          }

          const parkingSlot = await ParkingSlot.findOne({ _id: parking_slotId });
          if (!parkingSlot) {
              return res.status(404).json({
                  status: 404,
                  data: null,
                  error: 'Không tìm thấy parking_slotId trong hệ thống.'
              });
          }

          // Kiểm tra availableSlots
          if (parkingSlot.availableSlots <= 0) {
              return res.status(400).json({
                  status: 400,
                  data: null,
                  error: 'Không còn chỗ trống trong bãi đỗ xe này.'
              });
          }

          // Điều chỉnh availableSlots nếu có thay đổi
          if (!existingRecord.parking_slotId.equals(parking_slotId)) {
              const oldParkingSlot = await ParkingSlot.findOne({ _id: existingRecord.parking_slotId });
              if (oldParkingSlot) {
                  oldParkingSlot.availableSlots += 1; // Trả lại 1 chỗ
                  await oldParkingSlot.save();
              }

              parkingSlot.availableSlots -= 1; // Giảm 1 chỗ cho parking slot mới
              await parkingSlot.save();
          }

          existingRecord.parking_slotId = parking_slotId;
      }

      // Kiểm tra nếu monthlyFee được cung cấp
      if (monthlyFee) {
          if (typeof monthlyFee !== 'number' || monthlyFee <= 0) {
              return res.status(400).json({
                  status: 400,
                  data: null,
                  error: 'monthlyFee phải là một số lớn hơn 0.'
              });
          }

          existingRecord.monthlyFee = monthlyFee;
      }

      // Kiểm tra nếu startDate và endDate được cung cấp
      if (startDate || endDate) {
          const parsedStartDate = startDate ? new Date(startDate) : existingRecord.startDate;
          const parsedEndDate = endDate ? new Date(endDate) : existingRecord.endDate;

          // Kiểm tra tính hợp lệ của ngày
          if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
              return res.status(400).json({
                  status: 400,
                  data: null,
                  error: 'startDate hoặc endDate không hợp lệ.'
              });
          }

          // Kiểm tra startDate phải sớm hơn endDate
          if (parsedStartDate >= parsedEndDate) {
              return res.status(400).json({
                  status: 400,
                  data: null,
                  error: 'startDate phải sớm hơn endDate.'
              });
          }

          existingRecord.startDate = parsedStartDate;
          existingRecord.endDate = parsedEndDate;
      }

      // Lưu thông tin mới
      await existingRecord.save();

      return res.status(200).json({
          status: 200,
          data: existingRecord,
          error: null
      });
  } catch (error) {
      console.error('Lỗi không xác định trong UpdateResidentHistoryMoney:', error);
      return res.status(500).json({
          status: 500,
          data: null,
          error: 'Lỗi máy chủ không xác định.'
      });
  }
};

const DeleteResidentHistoryMoney = async (req, res) => {
  try {
      const { id } = req.body;

      // Kiểm tra trường id bắt buộc
      if (!id) {
          return res.status(400).json({
              status: 400,
              data: null,
              error: 'id không được để trống.'
          });
      }

      // Kiểm tra id có hợp lệ là ObjectId hay không
      if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
              status: 400,
              data: null,
              error: 'id không hợp lệ.'
          });
      }

      // Tìm bản ghi cần xóa
      const existingRecord = await ResidentHistoryMoney.findById(id);
      if (!existingRecord) {
          return res.status(404).json({
              status: 404,
              data: null,
              error: 'Không tìm thấy bản ghi với id cung cấp.'
          });
      }

      // Tìm bãi đỗ xe tương ứng để tăng lại số lượng chỗ trống
      const parkingSlot = await ParkingSlot.findById(existingRecord.parking_slotId);
      if (parkingSlot) {
          parkingSlot.availableSlots += 1; // Trả lại 1 chỗ
          await parkingSlot.save();
      }

      // Xóa bản ghi
      await ResidentHistoryMoney.findByIdAndDelete(id);

      return res.status(200).json({
          status: 200,
          data: null,
          error: null,
          message: 'Bản ghi đã được xóa thành công.'
      });
  } catch (error) {
      console.error('Lỗi không xác định trong DeleteResidentHistoryMoney:', error);
      return res.status(500).json({
          status: 500,
          data: null,
          error: 'Lỗi máy chủ không xác định.'
      });
  }
};

const GetResidentHistoryMoneyById = async (req, res) => {
  try {
    const { id } = req.body;

    // Kiểm tra id có hợp lệ là ObjectId hay không
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'id không hợp lệ.'
      });
    }

    // Tìm bản ghi ResidentHistoryMoney theo id
    const residentHistoryMoney = await ResidentHistoryMoney.findById(id)
      .populate({
        path: 'vehicleId',
        model: 'Vehicle',
        select: 'licensePlate type brand'
      })
      .populate({
        path: 'parking_slotId',
        model: 'ParkingSlot',
        select: 'slotCode slotType'
      });

    if (!residentHistoryMoney) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy bản ghi ResidentHistoryMoney với id này.'
      });
    }

    return res.status(200).json({
      status: 200,
      data: residentHistoryMoney,
      error: null
    });
  } catch (error) {
    console.error('Lỗi không xác định trong GetResidentHistoryMoneyById:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const GetMonthlyStatistics = async (req, res) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'Cần cung cấp month và year.'
      });
    }

    const startDate = new Date(year, month - 1, 1); // Ngày đầu tiên của tháng
    const endDate = new Date(year, month, 0); // Ngày cuối cùng của tháng

    const totalMonthlyIncome = await ResidentHistoryMoney.aggregate([
      {
        $match: {
          startDate: { $gte: startDate, $lte: endDate },
          isDelete: false
        }
      },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: '$monthlyFee' }
        }
      }
    ]);

    return res.status(200).json({
      status: 200,
      data: totalMonthlyIncome[0] ? totalMonthlyIncome[0].totalIncome : 0,
      error: null
    });
  } catch (error) {
    console.error('Lỗi không xác định trong GetMonthlyStatistics:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const GetYearlyStatistics = async (req, res) => {
  try {
    const { year } = req.body;

    if (!year) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'Cần cung cấp year.'
      });
    }

    const startDate = new Date(year, 0, 1); // Ngày đầu tiên của năm
    const endDate = new Date(year, 11, 31); // Ngày cuối cùng của năm

    const totalYearlyIncome = await ResidentHistoryMoney.aggregate([
      {
        $match: {
          startDate: { $gte: startDate, $lte: endDate },
          isDelete: false
        }
      },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: '$monthlyFee' }
        }
      }
    ]);

    return res.status(200).json({
      status: 200,
      data: totalYearlyIncome[0] ? totalYearlyIncome[0].totalIncome : 0,
      error: null
    });
  } catch (error) {
    console.error('Lỗi không xác định trong GetYearlyStatistics:', error);
    return res.status(500).json({
      status: 500,
      data: null,error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const FilterResidentHistoryMoneys = async (req, res) => {
  try {
    const { isExpired, type, slotCode, month, year, pageNumber = 1, pageSize = 10 } = req.body;

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
    const currentDate = new Date();

    // Tạo điều kiện lọc ban đầu
    let matchCondition = { isDelete: false };

    // Tạo pipeline cho aggregation
    const pipeline = [
      { $match: matchCondition },
      {
        $lookup: {
          from: 'vehicles', // Tên collection của xe
          localField: 'vehicleId',
          foreignField: '_id',
          as: 'vehicle'
        }
      },
      { $unwind: '$vehicle' },
      {
        $lookup: {
          from: 'parking_slots', // Tên collection của slot đỗ xe
          localField: 'parking_slotId',
          foreignField: '_id',
          as: 'parkingSlot'
        }
      },
      { $unwind: '$parkingSlot' },
      {
        $lookup: {
          from: 'customers', // Lấy thông tin từ collection customers
          localField: 'vehicle.customerId', // Liên kết thông qua customerId trong vehicle
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: '$customer' }, // Đảm bảo chỉ lấy một đối tượng customer
      {
        $lookup: {
          from: 'apartments', // Lấy thông tin từ collection apartments
          localField: 'customer.apartmentsId', // Liên kết thông qua apartmentsId trong customer
          foreignField: '_id',
          as: 'apartment'
        }
      },
      { $unwind: { path: '$apartment', preserveNullAndEmptyArrays: true } }, // Nếu không có apartment, giữ giá trị null
      // Gộp thông tin apartment vào customer
      {
        $addFields: {
          'customer.apartment': '$apartment' // Thêm thông tin apartment vào đối tượng customer
        }
      },
      // Bỏ trường apartment không cần thiết sau khi đã lồng vào customer
      { $project: { apartment: 0 } },
      // Gộp thông tin customer vào vehicle
      {
        $addFields: {
          'vehicle.customer': '$customer' // Thêm thông tin customer vào đối tượng vehicle
        }
      },
      // Bỏ trường customer không cần thiết sau khi đã lồng vào vehicle
      { $project: { customer: 0 } }
    ];

    // Lọc theo loại xe (type) nếu có
    if (type) {
      pipeline.push({
        $match: { 'vehicle.type': type }
      });
    }

    // Lọc theo khu đỗ xe (slotCode) nếu có
    if (slotCode) {
      pipeline.push({
        $match: { 'parkingSlot.slotCode': slotCode }
      });
    }

    // Lọc theo tình trạng hết hạn (isExpired)
    if (typeof isExpired === 'boolean') {
      pipeline.push({
        $match: isExpired
          ? { endDate: { $lt: currentDate } } // Hết hạn
          : { endDate: { $gte: currentDate } } // Còn hạn
      });
    }

    // Lọc theo tháng và năm nếu có month và year
    if (month && year) {
      const startDate = new Date(year, month - 1, 1); // Ngày đầu tháng
      const endDate = new Date(year, month, 0); // Ngày cuối tháng
      pipeline.push({
        $match: { startDate: { $gte: startDate, $lte: endDate } }
      });
    } else if (year) {
      const startDate = new Date(year, 0, 1); // Ngày đầu năm
      const endDate = new Date(year, 11, 31); // Ngày cuối năm
      pipeline.push({
        $match: { startDate: { $gte: startDate, $lte: endDate } }
      });
    }

    // Thêm tính toán isExpired vào từng bản ghi
    pipeline.push({
      $addFields: {
        isExpired: { $lt: ['$endDate', currentDate] }
      }
    });

    // Sử dụng $facet để thực hiện cả phân trang và đếm tổng bản ghi trong một truy vấn
    pipeline.push({
      $facet: {
        paginatedResults: [{ $skip: skip }, { $limit: parsedPageSize }],
        totalCount: [{ $count: 'total' }]
      }
    });

    // Thực hiện aggregation
    const results = await ResidentHistoryMoney.aggregate(pipeline);

    const residentHistoryMoneys = results[0].paginatedResults;
    const totalRecords = results[0].totalCount[0]?.total || 0;

    if (totalRecords === 0) {
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
        residentHistoryMoneys,
        currentPage: parsedPageNumber,
        pageSize: parsedPageSize,
        totalRecords,
        totalPages
      },
      error: null
    });
  } catch (error) {
    console.error('Lỗi không xác định trong FilterResidentHistoryMoneys:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

module.exports = {
    GetAllResidentHistoryMoneys,
    CreateResidentHistoryMoney,
    UpdateResidentHistoryMoney,
    DeleteResidentHistoryMoney,
    GetResidentHistoryMoneyById,
    GetMonthlyStatistics,
    GetYearlyStatistics,
    FilterResidentHistoryMoneys
};