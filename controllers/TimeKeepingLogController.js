const TimeKeepingLog = require("../models/TimeKeepingLog");
const mongoose = require("mongoose");

const GetAllLogs = async (req, res) => {
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
    const filter = { isDelete: false };
    const totalLogs = await TimeKeepingLog.countDocuments();
    const logs = await TimeKeepingLog.find(filter)
      .populate({ path: "rfidId", select: "uuid" })
      .populate({
        path: "userID",
        select: "fullname email age phoneNumber address",
      })
      .skip(skip)
      .limit(parsedPageSize);

    const totalPages = Math.ceil(totalLogs / parsedPageSize);

    return res.status(200).json({
      status: 200,
      data: {
        logs,
        currentPage: parsedPageNumber,
        pageSize: parsedPageSize,
        totalLogs,
        totalPages,
      },
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong GetAllLogs:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

const GetLogByID = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "ID không hợp lệ.",
      });
    }

    const log = await TimeKeepingLog.findById(id)
      .populate({ path: "rfidId", select: "uuid" })
      .populate({
        path: "userID",
        select: "fullname email age phoneNumber address",
      });

    if (!log) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy bản ghi với ID này.",
      });
    }

    return res.status(200).json({
      status: 200,
      data: log,
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong GetLogByID:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

const CreateLog = async (req, res) => {
  try {
    const { rfidId, userID, status, scanTime } = req.body;

    if (!rfidId || !userID || !status) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "Thiếu thông tin bắt buộc.",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(rfidId) ||
      !mongoose.Types.ObjectId.isValid(userID)
    ) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "rfidId hoặc userID không hợp lệ.",
      });
    }
    const isDelete = false;
    const newLog = new TimeKeepingLog({
      rfidId,
      userID,
      scanTime: scanTime || new Date(), // Sử dụng thời gian hiện tại nếu không có scanTime từ client
      status,
      isDelete,
    });

    await newLog.save();

    const createdLog = await TimeKeepingLog.findById(newLog._id)
      .populate({ path: "rfidId", select: "uuid" })
      .populate({
        path: "userID",
        select: "fullname email age phoneNumber address",
      });

    return res.status(201).json({
      status: 201,
      data: createdLog,
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong CreateLog:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

const UpdateLog = async (req, res) => {
  try {
    const { id, rfidId, userID, scanTime, status, isDelete } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "ID không hợp lệ.",
      });
    }

    const log = await TimeKeepingLog.findById(id);

    if (!log) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy bản ghi với ID này.",
      });
    }

    if (rfidId && mongoose.Types.ObjectId.isValid(rfidId)) log.rfidId = rfidId;
    if (userID && mongoose.Types.ObjectId.isValid(userID)) log.userID = userID;
    if (scanTime) log.scanTime = scanTime;
    if (status) log.status = status;
    if (isDelete) log.isDelete = isDelete;

    await log.save();

    const updatedLog = await TimeKeepingLog.findById(id)
      .populate({ path: "rfidId", select: "uuid" })
      .populate({
        path: "userID",
        select: "fullname email age phoneNumber address",
      });

    return res.status(200).json({
      status: 200,
      data: updatedLog,
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong UpdateLog:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

const DeleteLog = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "ID không hợp lệ.",
      });
    }

    // Tìm và cập nhật trường isDelete thành true
    const updatedLog = await TimeKeepingLog.findByIdAndUpdate(
      id,
      { isDelete: true },
      { new: true } // Trả về bản ghi đã được cập nhật
    );

    if (!updatedLog) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy bản ghi với ID này.",
      });
    }

    return res.status(200).json({
      status: 200,
      data: { message: "Bản ghi đã được đánh dấu là xóa.", updatedLog },
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong DeleteLog:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

const getLogsFromDayToDay = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!startDate || !endDate) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "Cần cung cấp startDate và endDate.",
      });
    }

    const logs = await TimeKeepingLog.find({
      scanTime: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    })
      .populate({ path: "rfidId", select: "uuid" })
      .populate({
        path: "userID",
        select: "fullname email age phoneNumber address",
      });

    if (logs.length === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy log nào trong khoảng thời gian này.",
      });
    }

    return res.status(200).json({
      status: 200,
      data: logs,
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong getLogsFromDayToDay:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

const getLogsToDay = async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    );

    const logs = await TimeKeepingLog.find({
      scanTime: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      isDelete: false,
    })
      .populate({ path: "rfidId", select: "uuid" })
      .populate({
        path: "userID",
        select: "fullname email age phoneNumber address",
      });

    return res.status(200).json({
      status: 200,
      data: logs,
      error:
        logs.length === 0 ? "Không tìm thấy log nào trong ngày hôm nay." : null,
    });
  } catch (error) {
    console.error("Lỗi trong getLogsToDay:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

const getLogsPerMonth = async (req, res) => {
  try {
    const { year, month } = req.body;

    if (!year || !month) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "Cần cung cấp year và month.",
      });
    }

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const logs = await TimeKeepingLog.find({
      scanTime: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    })
      .populate({ path: "rfidId", select: "uuid" })
      .populate({
        path: "userID",
        select: "fullname email age phoneNumber address",
      });

    if (logs.length === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy log nào trong tháng này.",
      });
    }

    return res.status(200).json({
      status: 200,
      data: logs,
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong getLogsPerMonth:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

const getLogsPerYear = async (req, res) => {
  try {
    const { year } = req.body;

    if (!year) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "Cần cung cấp year.",
      });
    }

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    const logs = await TimeKeepingLog.find({
      scanTime: {
        $gte: startOfYear,
        $lte: endOfYear,
      },
    })
      .populate({ path: "rfidId", select: "uuid" })
      .populate({
        path: "userID",
        select: "fullname email age phoneNumber address",
      });

    if (logs.length === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy log nào trong năm này.",
      });
    }

    return res.status(200).json({
      status: 200,
      data: logs,
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong getLogsPerYear:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};
module.exports = {
  GetAllLogs,
  GetLogByID,
  CreateLog,
  UpdateLog,
  DeleteLog,
  getLogsFromDayToDay,
  getLogsToDay,
  getLogsPerMonth,
  getLogsPerYear,
};
