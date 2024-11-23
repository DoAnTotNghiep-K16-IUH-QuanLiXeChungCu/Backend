const TimeKeeping = require("../models/TimeKeeping");
const User = require("../models/User");
const Shift = require("../models/Shift");
const PayRoll = require("../models/PayRoll");
const PayRollFomula = require("../models/PayRollFomula");
const UserShift = require("../models/UserShift");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const s3Client = new S3Client({ region: "your-region" });
const mongoose = require("mongoose");

const GetAllTimeKeepings = async (req, res) => {
  try {
    const { pageNumber = 1, pageSize = 10 } = req.body;

    // Kiểm tra tính hợp lệ của pageNumber và pageSize
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

    // Lấy tất cả các TimeKeeping
    const totalRecords = await TimeKeeping.countDocuments();

    const timeKeeping = await TimeKeeping.find()
      .sort({ dateTime: -1 })
      .skip(skip)
      .limit(parsedPageSize)
      .populate("userId", "username age fullname") // Đổi từ 'username' thành 'fullName'
      // Thay 'username','age' bằng 'username age'
      .populate("shiftId", "shiftName"); // Cấu trúc này đúng

    if (totalRecords === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không có TimeKeeping nào được tìm thấy.",
      });
    }

    const totalPages = Math.ceil(totalRecords / parsedPageSize);

    return res.status(200).json({
      status: 200,
      data: {
        timeKeeping,
        currentPage: parsedPageNumber,
        pageSize: parsedPageSize,
        totalRecords,
        totalPages,
      },
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong GetAllTimeKeepings:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

const CreateTimeKeeping = async (req, res) => {
  try {
    const { userId, shiftId } = req.body;

    if (!userId || !shiftId) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "Các trường userId và shiftId đều bắt buộc.",
      });
    }

    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "userId không tồn tại trong cơ sở dữ liệu.",
      });
    }

    const shiftExists = await Shift.findById(shiftId);
    if (!shiftExists) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "shiftId không tồn tại trong cơ sở dữ liệu.",
      });
    }

    // Kiểm tra nếu đã tồn tại TimeKeeping với userId và checkOut: null
    const existingTimeKeeping = await TimeKeeping.findOne({
      userId,
      checkOut: null,
    });

    if (existingTimeKeeping) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "Đã tồn tại bản ghi TimeKeeping chưa checkOut cho userId này.",
      });
    }

    const currentDate = new Date();

    // Lấy ngày (không bao gồm giờ phút giây) từ currentDate
    const startOfDay = new Date(currentDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(currentDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Kiểm tra UserShift theo userId, shiftId và ngày
    const userShiftExists = await UserShift.findOne({
      userId,
      shiftId,
      dateTime: { $gte: startOfDay, $lte: endOfDay }, // Kiểm tra trong cùng ngày
    });

    if (!userShiftExists) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "Ca làm việc không khớp với ngày hiện tại.",
      });
    }

    const newTimeKeeping = new TimeKeeping({
      userId,
      shiftId,
      workDate: currentDate,
      checkIn: currentDate,
      checkOut: null,
    });

    await newTimeKeeping.save();

    const populatedTimeKeeping = await TimeKeeping.findById(newTimeKeeping._id)
      .populate({
        path: "userId",
        select: "username fullname age",
      })
      .populate({
        path: "shiftId",
        select: "shiftName",
      });

    return res.status(201).json({
      status: 201,
      data: populatedTimeKeeping,
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong CreateTimeKeeping:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

const UpdateTimeKeeping = async (req, res) => {
  try {
    const { shiftId, userId } = req.body;

    if (!shiftId || !userId) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "shiftId và userId là bắt buộc.",
      });
    }

    // Tìm TimeKeeping với shiftId và userId
    const timeKeeping = await TimeKeeping.findOne({
      shiftId,
      userId,
      checkOut: null,
    });

    if (!timeKeeping) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy TimeKeeping chưa có checkOut.",
      });
    }

    const currentTime = new Date();

    // Lấy thông tin shift
    const shift = await Shift.findById(shiftId);
    if (!shift) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy thông tin shift.",
      });
    }

    // Chuyển đổi startTime và endTime của shift sang đối tượng Date
    const [startHour, startMinute] = shift.startTime.split(":").map(Number);
    const [endHour, endMinute] = shift.endTime.split(":").map(Number);

    const shiftStart = new Date(currentTime);
    shiftStart.setHours(startHour, startMinute, 0, 0);

    const shiftEnd = new Date(currentTime);
    shiftEnd.setHours(endHour, endMinute, 0, 0);

    const checkIn = timeKeeping.checkIn;
    const checkOut = currentTime;

    let hoursWorked = Math.max((checkOut - checkIn) / (1000 * 60 * 60), 0); // Đảm bảo tổng số giờ làm không âm
    let totalRegularHours = 0;
    let totalOvertimeHours = 0;

    // Lấy giá trị deductions từ PayRollFomula
    const payRollFomula = await PayRollFomula.findOne({ status: "in_using" });
    if (!payRollFomula) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy công thức tính lương.",
      });
    }

    // Tìm hoặc tạo PayRoll theo userID và tháng/năm hiện tại
    const payPeriod = new Date(
      currentTime.getFullYear(),
      currentTime.getMonth()
    );
    let payRoll = await PayRoll.findOne({ userID: userId, payPeriod });

    if (!payRoll) {
      payRoll = new PayRoll({
        userID: userId,
        payPeriod,
        totalRegularHours: 0,
        totalOvertimeHours: 0,
        basicSalary: 0,
        overtimeSalary: 0,
        deductions: 0,
        allowance: 0,
        totalSalary: 0,
        note: "",
      });
    }

    // Kiểm tra đi trễ hoặc về sớm
    const isLate = checkIn > shiftStart;
    const isEarly = checkOut < shiftEnd;

    if (isLate || isEarly) {
      // Tăng deductions bằng giá trị từ PayRollFomula
      payRoll.deductions = Math.max(
        payRoll.deductions + payRollFomula.deductions,
        0
      ); // Đảm bảo không âm
      const noteDate = checkIn.toLocaleDateString();
      payRoll.note += `\nĐi làm trễ hoặc về sớm ngày ${noteDate}`;
    }

    // Cập nhật giờ làm thông thường
    const shiftDuration = Math.max(
      (shiftEnd - shiftStart) / (1000 * 60 * 60),
      0
    );
    totalRegularHours = Math.min(hoursWorked, shiftDuration);
    payRoll.totalRegularHours = Math.max(
      payRoll.totalRegularHours + totalRegularHours,
      0
    ); // Không âm

    // Cập nhật giờ làm thêm
    if (hoursWorked > shiftDuration) {
      totalOvertimeHours = Math.max(hoursWorked - shiftDuration, 0);
      payRoll.totalOvertimeHours = Math.max(
        payRoll.totalOvertimeHours + totalOvertimeHours,
        0
      ); // Không âm

      const noteDate = checkIn.toLocaleDateString();
      payRoll.note += `\nLàm thêm giờ ngày ${noteDate}`;
    }

    // Cập nhật lương cơ bản và lương làm thêm giờ
    payRoll.basicSalary = Math.max(
      payRoll.basicSalary + totalRegularHours * payRollFomula.basicRatePerHour,
      0
    ); // Không âm
    payRoll.overtimeSalary = Math.max(
      payRoll.overtimeSalary + totalOvertimeHours * payRollFomula.overtimeRate,
      0
    ); // Không âm

    // Cập nhật tổng lương
    payRoll.totalSalary = Math.max(
      payRoll.basicSalary +
        payRoll.allowance +
        payRoll.overtimeSalary +
        payRoll.allowance -
        payRoll.deductions,
      0
    ); // Không âm

    // Lưu PayRoll
    await payRoll.save();

    // Cập nhật TimeKeeping
    timeKeeping.checkOut = checkOut;
    timeKeeping.hoursWorked = hoursWorked;

    await timeKeeping.save();

    return res.status(200).json({
      status: 200,
      data: {
        timeKeeping,
        payRoll,
      },
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong UpdateTimeKeeping:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

const DeleteTimeKeeping = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "ID không hợp lệ.",
      });
    }

    const timeKeeping = await TimeKeeping.findById(id);

    if (!timeKeeping) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy TimeKeeping với ID này.",
      });
    }

    // Xóa TimeKeeping
    await timeKeeping.deleteOne({ _id: id });

    return res.status(200).json({
      status: 200,
      data: "TimeKeeping đã được xóa thành công.",
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong DeleteTimeKeeping:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

const GetTimeKeepingsByUserIdAndDateRange = async (req, res) => {
  try {
    const {
      userId,
      startDate,
      endDate,
      pageNumber = 1,
      pageSize = 10,
    } = req.body;

    // Kiểm tra pageNumber và pageSize
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

    // Tạo query động
    const query = {};

    // Nếu có userId, thêm vào query
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      query.userId = userId;
    }

    // Nếu có startDate hoặc endDate, thêm phạm vi thời gian vào query
    if (startDate) {
      query.dateTime = {
        $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
      }; // Bắt đầu từ ngày startDate
    }

    if (endDate) {
      query.dateTime = query.dateTime || {}; // Đảm bảo query.dateTime không bị ghi đè
      query.dateTime.$lte = new Date(
        new Date(endDate).setHours(23, 59, 59, 999)
      ); // Đến cuối ngày endDate
    }

    // Đếm tổng số bản ghi phù hợp
    const totalRecords = await TimeKeeping.countDocuments(query);
    if (totalRecords === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không có TimeKeeping nào phù hợp với điều kiện lọc.",
      });
    }

    // Lấy danh sách TimeKeeping dựa trên query và phân trang
    const timeKeeping = await TimeKeeping.find(query)
      .skip(skip)
      .limit(parsedPageSize)
      .populate("userId", "name") // Lấy thông tin user
      .populate("shiftId", "shiftName startTime endTime"); // Lấy thông tin shift

    const totalPages = Math.ceil(totalRecords / parsedPageSize);

    return res.status(200).json({
      status: 200,
      data: {
        timeKeeping,
        currentPage: parsedPageNumber,
        pageSize: parsedPageSize,
        totalRecords,
        totalPages,
      },
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong GetTimeKeepingsByUserIdAndDateRange:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

const FilterTimeKeeping = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      shiftId,
      pageNumber = 1,
      pageSize = 10,
    } = req.body;

    // Kiểm tra tính hợp lệ của pageNumber và pageSize
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

    // Tạo điều kiện lọc động
    const matchCondition = {};

    // Lọc theo khoảng thời gian (startDate và endDate) nếu có
    if (startDate && endDate) {
      const parsedStartDate = new Date(startDate);
      const parsedEndDate = new Date(endDate);

      if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({
          status: 400,
          data: null,
          error: "Ngày không hợp lệ.",
        });
      }

      matchCondition.dateTime = {
        $gte: new Date(parsedStartDate.setHours(0, 0, 0, 0)), // Đặt bắt đầu của ngày
        $lte: new Date(parsedEndDate.setHours(23, 59, 59, 999)), // Đặt cuối của ngày
      };
    }

    // Lọc theo shiftId nếu có
    if (shiftId && mongoose.Types.ObjectId.isValid(shiftId)) {
      const shiftExists = await Shift.findById(shiftId);
      if (!shiftExists) {
        return res.status(400).json({
          status: 400,
          data: null,
          error: "shiftId không tồn tại trong cơ sở dữ liệu.",
        });
      }
      matchCondition.shiftId = shiftId;
    }

    // Đếm tổng số bản ghi phù hợp
    const totalRecords = await TimeKeeping.countDocuments(matchCondition);
    if (totalRecords === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không có TimeKeeping nào phù hợp với điều kiện lọc.",
      });
    }

    // Lấy danh sách TimeKeeping dựa trên điều kiện lọc và phân trang
    const timeKeeping = await TimeKeeping.find(matchCondition)
      .skip(skip)
      .limit(parsedPageSize)
      .populate("userId", "username age fullname") // Đổi từ 'username' thành 'fullName'
      .populate("shiftId", "shiftName"); // Lấy thông tin shift

    const totalPages = Math.ceil(totalRecords / parsedPageSize);

    return res.status(200).json({
      status: 200,
      data: {
        timeKeeping,
        currentPage: parsedPageNumber,
        pageSize: parsedPageSize,
        totalRecords,
        totalPages,
      },
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong filterTimeKeeping:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

const GetTimeKeepingsByUserIdAndShiftIdAndDateTime = async (req, res) => {
  try {
    const { userId, shiftId, dateTime } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!userId || !shiftId || !dateTime) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "Thiếu trường userId, shiftId hoặc dateTime trong body request.",
      });
    }

    // Kiểm tra tính hợp lệ của userId và shiftId dưới dạng ObjectId
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(shiftId)
    ) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "userId hoặc shiftId không hợp lệ.",
      });
    }

    // Phân tích và kiểm tra tính hợp lệ của dateTime
    const parsedDate = new Date(dateTime);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "dateTime không hợp lệ.",
      });
    }

    // Định nghĩa khoảng thời gian trong ngày cho việc lọc theo dateTime
    const startOfDay = new Date(parsedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(parsedDate.setHours(23, 59, 59, 999));

    // Tìm một bản ghi TimeKeeping phù hợp
    const timeKeeping = await TimeKeeping.findOne({
      userId,
      shiftId,
      dateTime: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate("userId", "username fullname age address phoneNumber")
      .populate("shiftId", "shiftName startTime endTime");

    // Nếu không tìm thấy bản ghi nào phù hợp
    if (!timeKeeping) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy TimeKeeping nào phù hợp với điều kiện cung cấp.",
      });
    }

    // Trả về bản ghi user shift phù hợp
    return res.status(200).json({
      status: 200,
      data: timeKeeping,
      error: null,
    });
  } catch (error) {
    console.error(
      "Lỗi trong GetTimeKeepingsByUserIdAndShiftIdAndDateTime:",
      error
    );
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

module.exports = {
  GetAllTimeKeepings,
  CreateTimeKeeping,
  UpdateTimeKeeping,
  DeleteTimeKeeping,
  GetTimeKeepingsByUserIdAndDateRange,
  FilterTimeKeeping,
  GetTimeKeepingsByUserIdAndShiftIdAndDateTime,
};
