const TimeKeeping = require("../models/TimeKeeping");
const User = require("../models/User");
const Shift = require("../models/Shift");
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
    const { userId, shiftId, dateTime } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!userId || !shiftId || !dateTime) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "Các trường userId, shiftId, và dateTime đều bắt buộc.",
      });
    }

    // Kiểm tra xem userId có tồn tại không
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "userId không tồn tại trong cơ sở dữ liệu.",
      });
    }

    // Kiểm tra xem shiftId có tồn tại không
    const shiftExists = await Shift.findById(shiftId);
    if (!shiftExists) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "shiftId không tồn tại trong cơ sở dữ liệu.",
      });
    }

    // Kiểm tra nếu dateTime là một ngày trong tương lai
    const currentDateTime = new Date();
    const parsedDateTime = new Date(dateTime);
    console.log(currentDateTime);
    console.log(parsedDateTime);
    if (parsedDateTime <= currentDateTime) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "dateTime phải là một ngày trong tương lai.",
      });
    }

    // Kiểm tra xem TimeKeeping đã tồn tại hay chưa (cặp userId, shiftId, dateTime)
    const existingTimeKeeping = await TimeKeeping.findOne({
      userId,
      shiftId,
      dateTime: parsedDateTime,
    });
    if (existingTimeKeeping) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "TimeKeeping đã tồn tại cho userId, shiftId, và dateTime này.",
      });
    }

    // Tạo TimeKeeping mới
    const newTimeKeeping = new TimeKeeping({
      userId,
      shiftId,
      dateTime: parsedDateTime,
      checkIn: "",
      checkOut: "",
    });

    // Lưu vào cơ sở dữ liệu
    await newTimeKeeping.save();

    const populatedTimeKeeping = await TimeKeeping.findById(newTimeKeeping._id)
      .populate({
        path: "userId",
        select: "username fullname age", // Chỉ lấy các trường cần thiết từ User
      })
      .populate({
        path: "shiftId",
        select: "shiftName", // Chỉ lấy các trường cần thiết từ Shift
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
    const { id, userId, shiftId, dateTime, checkIn, checkOut } = req.body;
    // Kiểm tra ID có hợp lệ không
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "ID không hợp lệ.",
      });
    }

    // Tìm TimeKeeping với ID đã cho
    const timeKeeping = await TimeKeeping.findById(id);
    if (!timeKeeping) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy TimeKeeping với ID này.",
      });
    }

    // Nếu có userId mới, kiểm tra sự tồn tại của userId
    if (userId) {
      const userExists = await User.findById(userId);
      if (!userExists) {
        return res.status(400).json({
          status: 400,
          data: null,
          error: "userId không tồn tại trong cơ sở dữ liệu.",
        });
      }
    }

    // Nếu có shiftId mới, kiểm tra sự tồn tại của shiftId
    if (shiftId) {
      const shiftExists = await Shift.findById(shiftId);
      if (!shiftExists) {
        return res.status(400).json({
          status: 400,
          data: null,
          error: "shiftId không tồn tại trong cơ sở dữ liệu.",
        });
      }
    }
    if (new Date(checkIn) >= new Date(checkOut)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "Thời gian checkin phải trước thời gian checkout.",
      });
    }

    // Kiểm tra nếu có dateTime và nó phải là ngày trong tương lai
    if (dateTime) {
      const currentDateTime = new Date();
      const parsedDateTime = new Date(dateTime);
      if (parsedDateTime <= currentDateTime) {
        return res.status(400).json({
          status: 400,
          data: null,
          error: "dateTime phải là một ngày trong tương lai.",
        });
      }

      // Kiểm tra xem TimeKeeping đã tồn tại hay chưa cho cặp userId, shiftId, dateTime (ngoại trừ bản ghi hiện tại)
      const existingTimeKeeping = await TimeKeeping.findOne({
        userId: userId || TimeKeeping.userId,
        shiftId: shiftId || TimeKeeping.shiftId,
        dateTime: parsedDateTime,
        _id: { $ne: id }, // Loại bỏ bản ghi hiện tại khỏi kết quả tìm kiếm
      });

      if (existingTimeKeeping) {
        return res.status(400).json({
          status: 400,
          data: null,
          error: "TimeKeeping đã tồn tại cho userId, shiftId, và dateTime này.",
        });
      }
    }

    // Cập nhật các trường cần thiết
    timeKeeping.userId = userId || timeKeeping.userId;
    timeKeeping.shiftId = shiftId || timeKeeping.shiftId;
    timeKeeping.dateTime = dateTime || timeKeeping.dateTime;
    timeKeeping.checkIn = dateTime || timeKeeping.checkIn;
    timeKeeping.checkOut = dateTime || timeKeeping.checkOut;

    // Lưu lại bản ghi đã cập nhật
    await timeKeeping.save();

    const populatedTimeKeeping = await TimeKeeping.findById(timeKeeping._id)
      .populate({
        path: "userId",
        select: "username age fullname", // Lấy các trường cần thiết từ User
      })
      .populate({
        path: "shiftId",
        select: "shiftName", // Lấy các trường cần thiết từ Shift
      });

    return res.status(200).json({
      status: 200,
      data: populatedTimeKeeping,
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
