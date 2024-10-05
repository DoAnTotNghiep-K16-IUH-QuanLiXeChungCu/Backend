const VisitorHistoryMoney = require('../models/VisitorHistoryMoney');
const ExitRecord = require('../models/ExitRecord');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client({ region: 'your-region' });
const mongoose = require('mongoose');

const GetAllVisitorHistoryMoney = async (req, res) => {
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

    // Lấy tất cả các bản ghi
    const totalRecords = await VisitorHistoryMoney.countDocuments({ isDelete: false });
    const visitorHistoryMoneyRecords = await VisitorHistoryMoney.find({ isDelete: false })
      .skip(skip)
      .limit(parsedPageSize)
      .populate('exit_recordId', 'exitTime licensePlate vehicleType');

    if (totalRecords === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không có bản ghi lịch sử tiền cho khách vãng lai nào được tìm thấy.'
      });
    }

    const totalPages = Math.ceil(totalRecords / parsedPageSize);

    return res.status(200).json({
      status: 200,
      data: {
        visitorHistoryMoneyRecords,
        currentPage: parsedPageNumber,
        pageSize: parsedPageSize,
        totalRecords,
        totalPages
      },
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong GetAllVisitorHistoryMoney:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const CreateVisitorHistoryMoney = async (req, res) => {
  try {
    const { exit_recordId, licensePlate, hourly, vehicleType, parkingFee } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!exit_recordId || !licensePlate || !hourly || !vehicleType || !parkingFee) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'Các trường exit_recordId, licensePlate, hourly, vehicleType và parkingFee đều bắt buộc.'
      });
    }

    // Kiểm tra hợp lệ của exit_recordId
    if (!mongoose.Types.ObjectId.isValid(exit_recordId)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'exit_recordId không hợp lệ.'
      });
    }

    // Kiểm tra xem exit_recordId có tồn tại trong ExitRecord hay không
    const exitRecordExists = await ExitRecord.findById(exit_recordId);
    if (!exitRecordExists) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'Không tìm thấy exit_recordId trong hệ thống.'
      });
    }

    // Kiểm tra vehicleType có thuộc danh sách enum
    const validVehicleTypes = ['car', 'motor'];
    if (!validVehicleTypes.includes(vehicleType)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'vehicleType phải là "car" hoặc "motor".'
      });
    }

    // Lấy thời gian hiện tại
    const dateTime = new Date();

    // Tạo bản ghi mới
    const newVisitorHistoryMoney = new VisitorHistoryMoney({
      exit_recordId,
      licensePlate,
      dateTime, // Thời gian hiện tại
      hourly,
      vehicleType,
      parkingFee
    });

    // Lưu vào cơ sở dữ liệu
    await newVisitorHistoryMoney.save();

    return res.status(201).json({
      status: 201,
      data: newVisitorHistoryMoney,
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong CreateVisitorHistoryMoney:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const UpdateVisitorHistoryMoney = async (req, res) => {
  try {
    const { id, exit_recordId, licensePlate, dateTime, hourly, vehicleType, parkingFee } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'ID không hợp lệ.'
      });
    }

    const visitorHistoryMoney = await VisitorHistoryMoney.findById(id);

    if (!visitorHistoryMoney) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy bản ghi lịch sử tiền với ID này.'
      });
    }

    // Cập nhật các trường cần thiết
    visitorHistoryMoney.exit_recordId = exit_recordId || visitorHistoryMoney.exit_recordId;
    visitorHistoryMoney.licensePlate = licensePlate || visitorHistoryMoney.licensePlate;
    visitorHistoryMoney.dateTime = dateTime || visitorHistoryMoney.dateTime;
    visitorHistoryMoney.hourly = hourly || visitorHistoryMoney.hourly;
    visitorHistoryMoney.vehicleType = vehicleType || visitorHistoryMoney.vehicleType;
    visitorHistoryMoney.parkingFee = parkingFee || visitorHistoryMoney.parkingFee;

    // Lưu lại bản ghi đã cập nhật
    await visitorHistoryMoney.save();

    return res.status(200).json({
      status: 200,
      data: visitorHistoryMoney,
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong UpdateVisitorHistoryMoney:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const GetVisitorHistoryMoneyById = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'ID không hợp lệ.'
      });
    }

    const visitorHistoryMoney = await VisitorHistoryMoney.findById(id)
      .populate('exit_recordId', 'exitTime licensePlate vehicleType');

    if (!visitorHistoryMoney) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy bản ghi lịch sử tiền với ID này.'
      });
    }

    return res.status(200).json({
      status: 200,
      data: visitorHistoryMoney,
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong GetVisitorHistoryMoneyById:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const DeleteVisitorHistoryMoney = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'ID không hợp lệ.'
      });
    }

    const visitorHistoryMoney = await VisitorHistoryMoney.findById(id);

    if (!visitorHistoryMoney) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy bản ghi lịch sử tiền với ID này.'
      });
    }

    // Cập nhật isDelete thành true để xóa mềm
    visitorHistoryMoney.isDelete = true;

    // Lưu thay đổi
    await visitorHistoryMoney.save();

    return res.status(200).json({
      status: 200,
      data: 'Bản ghi lịch sử tiền đã được xóa mềm thành công.',
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong DeleteVisitorHistoryMoney:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const GetMoneyByMonth = async (req, res) => {
  try {
    const { month, year } = req.body;

    // Kiểm tra xem month và year có được cung cấp hay không
    if (!month || !year) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'Cần cung cấp cả month và year.'
      });
    }

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // Lấy tất cả các bản ghi trong tháng
    const records = await VisitorHistoryMoney.find({
      dateTime: { $gte: startOfMonth, $lte: endOfMonth },
      isDelete: false
    });

    // Tính tổng tiền parkingFee trong tháng
    const totalMoney = records.reduce((sum, record) => sum + record.parkingFee, 0);

    return res.status(200).json({
      status: 200,
      data: {
        records,
        totalMoney
      },
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong GetMoneyByMonth:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const GetMoneyByDay = async (req, res) => {
  try {
    const { day } = req.body;

    // Kiểm tra xem day có được cung cấp hay không
    if (!day || isNaN(new Date(day).getTime())) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'Ngày không hợp lệ.'
      });
    }

    const startOfDay = new Date(new Date(day).setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date(day).setHours(23, 59, 59, 999));

    // Lấy tất cả các bản ghi trong ngày
    const records = await VisitorHistoryMoney.find({
      dateTime: { $gte: startOfDay, $lte: endOfDay },
      isDelete: false
    });

    // Tính tổng tiền parkingFee trong ngày
    const totalMoney = records.reduce((sum, record) => sum + record.parkingFee, 0);

    return res.status(200).json({
      status: 200,
      data: {
        records,
        totalMoney
      },
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong GetMoneyByDay:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const GetMoneyFromDayToDay = async (req, res) => {
  try {
    const { fromDay, toDay } = req.body;

    // Kiểm tra xem fromDay và toDay có hợp lệ không
    if (!fromDay || !toDay || isNaN(new Date(fromDay).getTime()) || isNaN(new Date(toDay).getTime())) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'fromDay hoặc toDay không hợp lệ.'
      });
    }

    const startOfDay = new Date(new Date(fromDay).setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date(toDay).setHours(23, 59, 59, 999));

    // Lấy tất cả các bản ghi trong khoảng từ fromDay đến toDay
    const records = await VisitorHistoryMoney.find({
      dateTime: { $gte: startOfDay, $lte: endOfDay },
      isDelete: false
    });

    // Tính tổng tiền parkingFee trong khoảng thời gian này
    const totalMoney = records.reduce((sum, record) => sum + record.parkingFee, 0);

    return res.status(200).json({
      status: 200,
      data: {
        records,
        totalMoney
      },
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong GetMoneyFromDayToDay:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

module.exports = {
  GetAllVisitorHistoryMoney,
  CreateVisitorHistoryMoney,
  UpdateVisitorHistoryMoney,
  GetVisitorHistoryMoneyById,
  DeleteVisitorHistoryMoney,
  GetMoneyByMonth,
  GetMoneyByDay,
  GetMoneyFromDayToDay
};
