const ParkingTransaction = require("../models/ParkingTransaction");
const ParkingRate = require("../models/ParkingRate");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const s3Client = new S3Client({ region: "your-region" });
const mongoose = require("mongoose");
const getAllParkingTransaction = async (req, res) => {
  try {
    const { pageNumber = 1, pageSize = 10 } = req.body;

    const parsedPageNumber = parseInt(pageNumber, 10);
    const parsedPageSize = parseInt(pageSize, 10);

    if (isNaN(parsedPageNumber) || parsedPageNumber <= 0) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "pageNumber không hợp lệ, phải là một số nguyên dương.",
      });
    }

    if (isNaN(parsedPageSize) || parsedPageSize <= 0) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "pageSize không hợp lệ, phải là một số nguyên dương.",
      });
    }

    const skip = (parsedPageNumber - 1) * parsedPageSize;

    const totalTransactions = await ParkingTransaction.countDocuments();
    const transactions = await ParkingTransaction.find()
      .skip(skip)
      .limit(parsedPageSize);

    if (totalTransactions === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không có giao dịch nào được tìm thấy.",
      });
    }

    const totalPages = Math.ceil(totalTransactions / parsedPageSize);

    return res.status(200).json({
      status: 200,
      data: {
        transactions,
        currentPage: parsedPageNumber,
        pageSize: parsedPageSize,
        totalTransactions,
        totalPages,
      },
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong getAllParkingTransaction:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

const getParkingTransactionByID = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "ID không hợp lệ.",
      });
    }

    const transaction = await ParkingTransaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy giao dịch với ID này.",
      });
    }

    return res.status(200).json({
      status: 200,
      data: transaction,
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong getParkingTransactionByID:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

const createParkingTransaction = async (req, res) => {
  try {
    const { licensePlate, vehicleType, entryTime, exitTime } = req.body;

    if (!licensePlate || !vehicleType || !entryTime || !exitTime) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "Thiếu thông tin bắt buộc.",
      });
    }

    const entryDateTime = new Date(entryTime);
    const exitDateTime = new Date(exitTime);

    if (entryDateTime >= exitDateTime) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "Thời gian vào phải trước thời gian ra.",
      });
    }

    // Tìm mức giá cho loại phương tiện này
    const rate = await ParkingRate.findOne({ vehicleType, status: "in_using" });
    if (!rate) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy mức giá cho loại phương tiện này.",
      });
    }

    // Tính toán thời gian gửi xe
    const timeParking = exitDateTime - entryDateTime; // Thời gian lưu trữ tính bằng milliseconds
    const hours = timeParking / (1000 * 60 * 60);
    const days = timeParking / (1000 * 60 * 60 * 24);
    const weeks = timeParking / (1000 * 60 * 60 * 24 * 7);
    const months = timeParking / (1000 * 60 * 60 * 24 * 30);
    const years = timeParking / (1000 * 60 * 60 * 24 * 365);

    let totalFee = 0;

    // Tính toán phí gửi xe dựa trên thời gian gửi
    if (hours <= 24) {
      const entryHour = entryDateTime.getHours();
      const exitHour = exitDateTime.getHours();

      // Giả sử ban đêm từ 22:00 đến 6:00
      if (
        (entryHour >= 22 || entryHour < 6) &&
        (exitHour >= 22 || exitHour < 6)
      ) {
        totalFee = rate.overnight_rate;
      } else {
        const preciseHours = (exitDateTime - entryDateTime) / (1000 * 60 * 60); // Tổng số giờ
        totalFee = Math.ceil(preciseHours) * rate.hourly_rate;
      }
    } else if (days <= 7) {
      totalFee = Math.ceil(days) * rate.daily_rate;
    } else if (weeks <= 4) {
      totalFee = Math.ceil(weeks) * rate.weekly_rate;
    } else if (months <= 12) {
      totalFee = Math.ceil(months) * rate.monthly_rate;
    } else {
      totalFee = Math.ceil(years) * rate.yearly_rate;
    }

    // Tạo bản ghi giao dịch gửi xe mới
    const newTransaction = new ParkingTransaction({
      vehicleType,
      licensePlate,
      entryTime: entryDateTime,
      exitTime: exitDateTime,
      totalFee,
    });
    // Lưu bản ghi
    await newTransaction.save();

    return res.status(201).json({
      status: 201,
      data: newTransaction,
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong createParkingTransaction:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

const updateParkingTransaction = async (req, res) => {
  try {
    const { id, vehicleType, licensePlate, entryTime, exitTime, totalFee } =
      req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "ID không hợp lệ.",
      });
    }

    const transaction = await ParkingTransaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy giao dịch với ID này.",
      });
    }
    if (new Date(entryTime) >= new Date(exitTime)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "Thời gian vào phải trước thời gian ra.",
      });
    }

    if (vehicleType) transaction.vehicleType = vehicleType;
    if (licensePlate) transaction.licensePlate = licensePlate;
    if (entryTime) transaction.entryTime = entryTime;
    if (exitTime) transaction.exitTime = exitTime;
    if (totalFee != null) transaction.totalFee = totalFee;

    await transaction.save();

    return res.status(200).json({
      status: 200,
      data: transaction,
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong updateParkingTransaction:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

const deleteParkingTransaction = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "ID không hợp lệ.",
      });
    }

    const deletedTransaction = await ParkingTransaction.findByIdAndDelete(id);

    if (!deletedTransaction) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy giao dịch với ID này.",
      });
    }

    return res.status(200).json({
      status: 200,
      data: {
        message: "Giao dịch đã được xóa thành công.",
        deletedTransaction,
      },
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong deleteParkingTransaction:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

const getParkingTransactionFromDayToDay = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "Thiếu thông tin thời gian bắt đầu hoặc kết thúc.",
      });
    }

    // Chuyển đổi startDate và endDate thành đối tượng Date để so sánh
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "Thời gian bắt đầu hoặc kết thúc không hợp lệ.",
      });
    }

    if (start > end) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "Thời gian bắt đầu phải trước thời gian kết thúc.",
      });
    }

    // Tìm tất cả các giao dịch trong khoảng thời gian
    const transactions = await ParkingTransaction.find({
      entryTime: { $gte: start },
      exitTime: { $lte: end },
    });

    return res.status(200).json({
      status: 200,
      data: transactions,
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong getParkingTransactionFromDayToDay:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};
const getParkingTransactionToday = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const transactions = await ParkingTransaction.find({
      entryTime: { $gte: startOfDay },
      exitTime: { $lte: endOfDay },
    });

    return res.status(200).json({
      status: 200,
      data: transactions,
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong getParkingTransactionToday:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};
const getParkingTransactionPerMonth = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "Thiếu thông tin tháng hoặc năm.",
      });
    }

    const startOfMonth = new Date(year, month - 1, 1); // Tháng bắt đầu từ 0 trong JavaScript
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999); // Ngày cuối của tháng

    const transactions = await ParkingTransaction.find({
      entryTime: { $gte: startOfMonth },
      exitTime: { $lte: endOfMonth },
    });

    return res.status(200).json({
      status: 200,
      data: transactions,
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong getParkingTransactionPerMonth:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};
const getParkingTransactionPerYear = async (req, res) => {
  try {
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "Thiếu thông tin năm.",
      });
    }

    const startOfYear = new Date(year, 0, 1); // Ngày đầu năm
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999); // Ngày cuối năm

    const transactions = await ParkingTransaction.find({
      entryTime: { $gte: startOfYear },
      exitTime: { $lte: endOfYear },
    });

    return res.status(200).json({
      status: 200,
      data: transactions,
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong getParkingTransactionPerYear:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

const estimateParkingTransaction = async (req, res) => {
  try {
    const { licensePlate, vehicleType, entryTime, exitTime } = req.body;

    if (!licensePlate || !vehicleType || !entryTime || !exitTime) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "Thiếu thông tin bắt buộc.",
      });
    }

    const entryDateTime = new Date(entryTime);
    const exitDateTime = new Date(exitTime);

    if (entryDateTime >= exitDateTime) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "Thời gian vào phải trước thời gian ra.",
      });
    }

    // Tìm mức giá cho loại phương tiện này
    const rate = await ParkingRate.findOne({ vehicleType, status: "in_using" });
    if (!rate) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy mức giá cho loại phương tiện này.",
      });
    }

    // Tính toán thời gian gửi xe
    const timeParking = exitDateTime - entryDateTime; // Thời gian lưu trữ tính bằng milliseconds
    const hours = timeParking / (1000 * 60 * 60);
    const days = timeParking / (1000 * 60 * 60 * 24);
    const weeks = timeParking / (1000 * 60 * 60 * 24 * 7);
    const months = timeParking / (1000 * 60 * 60 * 24 * 30);
    const years = timeParking / (1000 * 60 * 60 * 24 * 365);

    let totalFee = 0;

    // Tính toán phí gửi xe dựa trên thời gian gửi
    if (hours <= 24) {
      const entryHour = entryDateTime.getHours();
      const exitHour = exitDateTime.getHours();

      // Giả sử ban đêm từ 22:00 đến 6:00
      if (
        (entryHour >= 22 || entryHour < 6) &&
        (exitHour >= 22 || exitHour < 6)
      ) {
        totalFee = rate.overnight_rate;
      } else {
        const preciseHours = (exitDateTime - entryDateTime) / (1000 * 60 * 60); // Tổng số giờ
        totalFee = Math.ceil(preciseHours) * rate.hourly_rate;
      }
    } else if (days <= 7) {
      totalFee = Math.ceil(days) * rate.daily_rate;
    } else if (weeks <= 4) {
      totalFee = Math.ceil(weeks) * rate.weekly_rate;
    } else if (months <= 12) {
      totalFee = Math.ceil(months) * rate.monthly_rate;
    } else {
      totalFee = Math.ceil(years) * rate.yearly_rate;
    }
    return res.status(201).json({
      status: 201,
      data: totalFee,
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong estimateParkingTransaction:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

const GetTotalFeesForCurrentAndPreviousMonth = async (req, res) => {
  try {
    // Lấy tháng và năm từ query parameters
    const { month, year } = req.body;

    // Kiểm tra xem tháng và năm có hợp lệ không
    if (!month || !year) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "Thiếu tháng hoặc năm. Vui lòng cung cấp đầy đủ tháng và năm."
      });
    }

    const parsedMonth = parseInt(month, 10);
    const parsedYear = parseInt(year, 10);

    // Kiểm tra tháng hợp lệ (1-12)
    if (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "Tháng không hợp lệ. Tháng phải trong khoảng từ 1 đến 12."
      });
    }

    // Kiểm tra năm hợp lệ (năm phải là số nguyên dương)
    if (isNaN(parsedYear) || parsedYear <= 0) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "Năm không hợp lệ. Vui lòng nhập năm hợp lệ."
      });
    }

    // Chuyển tháng từ 1-12 thành 0-11 để phù hợp với JS
    const currentMonth = parsedMonth - 1;
    const currentYear = parsedYear;

    // Tính ngày đầu và ngày cuối của tháng hiện tại
    const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
    const endOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    // Tính ngày đầu và ngày cuối của tháng trước
    const startOfPreviousMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfPreviousMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    // Lấy tổng tiền của xe ô tô và xe mô tô trong tháng hiện tại và tháng trước
    const totalFeesCurrentMonth = await ParkingTransaction.aggregate([
      {
        $match: {
          entryTime: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth }
        }
      },
      {
        $group: {
          _id: "$vehicleType", // Nhóm theo loại xe
          totalFee: { $sum: "$totalFee" } // Tính tổng phí
        }
      }
    ]);

    const totalFeesPreviousMonth = await ParkingTransaction.aggregate([
      {
        $match: {
          entryTime: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth }
        }
      },
      {
        $group: {
          _id: "$vehicleType", // Nhóm theo loại xe
          totalFee: { $sum: "$totalFee" } // Tính tổng phí
        }
      }
    ]);

    // Chuẩn hóa dữ liệu, đảm bảo cả hai loại xe đều có mặt
    const normalizeData = (data) => {
      const types = ["car", "motor"]; // Các loại xe cần đảm bảo
      const normalized = types.map((type) => {
        const found = data.find((item) => item._id === type);
        return { type, totalFee: found ? found.totalFee : 0 };
      });
      return normalized;
    };

    const normalizedCurrentMonth = normalizeData(totalFeesCurrentMonth);
    const normalizedPreviousMonth = normalizeData(totalFeesPreviousMonth);

    // Kết quả trả về
    return res.status(200).json({
      status: 200,
      data: {
        currentMonth: normalizedCurrentMonth,
        previousMonth: normalizedPreviousMonth
      },
      error: null
    });
  } catch (error) {
    console.error("Lỗi trong getTotalFeesForCurrentAndPreviousMonth:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định."
    });
  }
};

const GetTotalFeesForToday = async (req, res) => {
  try {
    // Lấy ngày hiện tại
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear(); // Năm hiện tại
    const currentMonth = currentDate.getMonth(); // Tháng hiện tại (0-11)
    const currentDay = currentDate.getDate(); // Ngày hiện tại (1-31)

    // Tạo khoảng thời gian cho ngày hôm nay: từ 00:00:00 đến 23:59:59
    const startOfToday = new Date(currentYear, currentMonth, currentDay, 0, 0, 0); // Bắt đầu từ 00:00:00
    const endOfToday = new Date(currentYear, currentMonth, currentDay, 23, 59, 59, 999); // Kết thúc lúc 23:59:59

    // Lấy tổng tiền của xe ô tô và xe mô tô trong ngày hôm nay
    const totalFeesToday = await ParkingTransaction.aggregate([
      {
        $match: {
          entryTime: { $gte: startOfToday, $lte: endOfToday } // Lọc theo ngày hôm nay
        }
      },
      {
        $group: {
          _id: "$vehicleType", // Nhóm theo loại xe
          totalFee: { $sum: "$totalFee" } // Tính tổng phí
        }
      }
    ]);

    // Chuẩn hóa dữ liệu, đảm bảo cả hai loại xe đều có mặt
    const normalizeData = (data) => {
      const types = ["car", "motor"]; // Các loại xe cần đảm bảo
      const normalized = types.map((type) => {
        const found = data.find((item) => item._id === type);
        return { type, totalFee: found ? found.totalFee : 0 };
      });
      return normalized;
    };

    const normalizedToday = normalizeData(totalFeesToday);

    // Kết quả trả về
    return res.status(200).json({
      status: 200,
      data: {
        today: normalizedToday
      },
      error: null
    });
  } catch (error) {
    console.error("Lỗi trong getTotalFeesForToday:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định."
    });
  }
};

module.exports = {
  getAllParkingTransaction,
  getParkingTransactionByID,
  createParkingTransaction,
  updateParkingTransaction,
  deleteParkingTransaction,
  getParkingTransactionFromDayToDay,
  getParkingTransactionToday,
  getParkingTransactionPerMonth,
  getParkingTransactionPerYear,
  estimateParkingTransaction,
  GetTotalFeesForCurrentAndPreviousMonth,
  GetTotalFeesForToday
};
