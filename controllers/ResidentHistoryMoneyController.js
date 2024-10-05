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

      return res.status(201).json({
          status: 201,
          data: newResidentHistoryMoney,
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

      // Kiểm tra các trường bắt buộc
      if (!id || !vehicleId || !parking_slotId || !monthlyFee || !startDate || !endDate) {
          return res.status(400).json({
              status: 400,
              data: null,
              error: 'Các trường bắt buộc không được để trống.'
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

      // Tìm bản ghi cần cập nhật
      const existingRecord = await ResidentHistoryMoney.findById(id);
      if (!existingRecord) {
          return res.status(404).json({
              status: 404,
              data: null,
              error: 'Không tìm thấy bản ghi với id cung cấp.'
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

      // Nếu parking_slotId mới khác với parking_slotId cũ, điều chỉnh availableSlots
      if (!existingRecord.parking_slotId.equals(parking_slotId)) {
          const oldParkingSlot = await ParkingSlot.findOne({ _id: existingRecord.parking_slotId });
          if (oldParkingSlot) {
              oldParkingSlot.availableSlots += 1; // Trả lại 1 chỗ
              await oldParkingSlot.save();
          }

          parkingSlot.availableSlots -= 1; // Giảm 1 chỗ cho parking slot mới
          await parkingSlot.save();
      }

      // Kiểm tra monthlyFee
      if (typeof monthlyFee !== 'number' || monthlyFee <= 0) {
          return res.status(400).json({
              status: 400,
              data: null,
              error: 'monthlyFee phải là một số lớn hơn 0.'
          });
      }

      const parsedStartDate = new Date(startDate);
      const parsedEndDate = new Date(endDate);

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

      // Cập nhật thông tin mới
      existingRecord.vehicleId = vehicleId;
      existingRecord.parking_slotId = parking_slotId;
      existingRecord.monthlyFee = monthlyFee;
      existingRecord.startDate = parsedStartDate;
      existingRecord.endDate = parsedEndDate;

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

// Thống kê ResidentHistoryMoney theo tháng
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

// Thống kê ResidentHistoryMoney theo năm
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

module.exports = {
    GetAllResidentHistoryMoneys,
    CreateResidentHistoryMoney,
    UpdateResidentHistoryMoney,
    DeleteResidentHistoryMoney,
    GetResidentHistoryMoneyById,
    GetMonthlyStatistics,
    GetYearlyStatistics
};