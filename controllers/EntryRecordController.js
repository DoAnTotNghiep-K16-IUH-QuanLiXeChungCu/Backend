const EntryRecord = require("../models/EntryRecord");
const User = require("../models/User");
const Vehicle = require("../models/Vehicle");
const RFIDCard = require("../models/RFIDCard");
const Customer = require("../models/Customer");

const ResidentHistoryMoney = require("../models/ResidentHistoryMoney");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const s3Client = new S3Client({ region: "your-region" });
const mongoose = require("mongoose");

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

    const totalRecords = await EntryRecord.countDocuments({ isDelete: false });

    if (totalRecords === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không có bản ghi nào được tìm thấy.",
      });
    }

    const records = await EntryRecord.find({ isDelete: false })
      .populate({
        path: "usersID",
        model: "User",
        select: "fullname age address phoneNumber", // Liên kết với bảng User
      })
      .populate({
        path: "rfidId", // Liên kết với bảng RFIDCard thông qua rfidId
        model: "RFIDCard", // Lấy dữ liệu từ bảng RFIDCard
        select: "uuid", // Chỉ lấy UUID từ bảng RFIDCard
      })
      .sort({ entryTime: -1 })
      .skip(skip)
      .limit(parsedPageSize);

    if (records.length === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy bản ghi nào cho trang này.",
      });
    }

    // Cập nhật để trả về đường dẫn ảnh đầy đủ
    const updatedRecords = records.map((record) => ({
      ...record.toObject(),
      picture_front: record.picture_front
        ? `${process.env.MINIO_SERVER_URL}${record.picture_front}`
        : "",
      picture_back: record.picture_back
        ? `${process.env.MINIO_SERVER_URL}${record.picture_back}`
        : "",
    }));

    const totalPages = Math.ceil(totalRecords / parsedPageSize);

    return res.status(200).json({
      status: 200,
      data: {
        records: updatedRecords,
        currentPage: parsedPageNumber,
        pageSize: parsedPageSize,
        totalRecords,
        totalPages,
      },
      error: null,
    });
  } catch (error) {
    console.error(
      `Lỗi không xác định trong GetAllRecords từ EntryRecord:`,
      error
    );
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
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
        error: "Thiếu trường id trong body request.",
      });
    }

    const entryRecord = await EntryRecord.findById(id)
      .populate({
        path: "usersID",
        model: "User",
        select: "fullname age address phoneNumber", // Liên kết với bảng User
      })
      .populate({
        path: "rfidId",
        model: "RFIDCard",
        select: "uuid",
      });

    if (!entryRecord) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy bản ghi EntryRecord với id này.",
      });
    }

    entryRecord.picture_front = entryRecord.picture_front
      ? `${process.env.MINIO_SERVER_URL}${entryRecord.picture_front}`
      : "";
    entryRecord.picture_back = entryRecord.picture_back
      ? `${process.env.MINIO_SERVER_URL}${entryRecord.picture_back}`
      : "";

    return res.status(200).json({
      status: 200,
      data: entryRecord,
      error: null,
    });
  } catch (error) {
    console.error(`Lỗi trong GetEntryRecordById từ EntryRecord:`, error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
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
        error: "Thiếu trường licensePlate trong body request.",
      });
    }

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

    const totalRecords = await EntryRecord.countDocuments({ licensePlate });

    if (totalRecords === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy bản ghi EntryRecord với licensePlate này.",
      });
    }

    const entryRecords = await EntryRecord.find({ licensePlate })
      .populate({
        path: "usersID",
        model: "User",
        select: "fullname age address phoneNumber", // Liên kết với bảng User
      })
      .populate({
        path: "rfidId",
        model: "RFIDCard",
        select: "uuid",
      })
      .skip(skip) // Áp dụng phân trang
      .limit(parsedPageSize); // Giới hạn số lượng bản ghi trả về

    const totalPages = Math.ceil(totalRecords / parsedPageSize);

    const updatedRecords = entryRecords.map((record) => ({
      ...record.toObject(),
      picture_front: record.picture_front
        ? `${process.env.MINIO_SERVER_URL}${record.picture_front}`
        : "",
      picture_back: record.picture_back
        ? `${process.env.MINIO_SERVER_URL}${record.picture_back}`
        : "",
    }));

    return res.status(200).json({
      status: 200,
      data: {
        entryRecords: updatedRecords,
        currentPage: parsedPageNumber,
        pageSize: parsedPageSize,
        totalRecords,
        totalPages,
      },
      error: null,
    });
  } catch (error) {
    console.error(
      `Lỗi trong GetEntryRecordByLicensePlate từ EntryRecord:`,
      error
    );
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
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
        error: "Thiếu trường startDate hoặc endDate trong body request.",
      });
    }

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    // Kiểm tra tính hợp lệ của các ngày
    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "startDate hoặc endDate không hợp lệ.",
      });
    }

    if (parsedStartDate > parsedEndDate) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "startDate phải sớm hơn endDate.",
      });
    }

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

    const totalRecords = await EntryRecord.countDocuments({
      entryTime: {
        $gte: parsedStartDate,
        $lte: parsedEndDate,
      },
      isDelete: false,
    });

    if (totalRecords === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không có bản ghi nào được tìm thấy trong khoảng thời gian này.",
      });
    }

    const records = await EntryRecord.find({
      entryTime: {
        $gte: parsedStartDate,
        $lte: parsedEndDate,
      },
      isDelete: false,
    })
      .populate({
        path: "usersID",
        model: "User",
        select: "fullname age address phoneNumber", // Liên kết với bảng User
      })
      .populate({
        path: "rfidId",
        model: "RFIDCard",
        select: "uuid",
      })
      .sort({ entryTime: -1 })
      .skip(skip)
      .limit(parsedPageSize);

    const updatedRecords = records.map((record) => ({
      ...record.toObject(),
      picture_front: record.picture_front
        ? `${process.env.MINIO_SERVER_URL}${record.picture_front}`
        : "",
      picture_back: record.picture_back
        ? `${process.env.MINIO_SERVER_URL}${record.picture_back}`
        : "",
    }));

    const totalPages = Math.ceil(totalRecords / parsedPageSize);

    return res.status(200).json({
      status: 200,
      data: {
        records: updatedRecords,
        currentPage: parsedPageNumber,
        pageSize: parsedPageSize,
        totalRecords,
        totalPages,
      },
      error: null,
    });
  } catch (error) {
    console.error(
      "Lỗi không xác định trong GetEntryRecordsByDateRange:",
      error
    );
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
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
        error: "Thiếu trường vehicleType trong body request.",
      });
    }

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

    const totalRecords = await EntryRecord.countDocuments({ vehicleType });

    if (totalRecords === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy bản ghi EntryRecord nào với loại xe này.",
      });
    }

    const records = await EntryRecord.find({ vehicleType })
      .populate({
        path: "usersID",
        model: "User",
        select: "fullname age address phoneNumber", // Liên kết với bảng User
      })
      .populate({
        path: "rfidId",
        model: "RFIDCard",
        select: "uuid",
      })
      .skip(skip)
      .limit(parsedPageSize);

    const updatedRecords = records.map((record) => ({
      ...record.toObject(),
      picture_front: record.picture_front
        ? `${process.env.MINIO_SERVER_URL}${record.picture_front}`
        : "",
      picture_back: record.picture_back
        ? `${process.env.MINIO_SERVER_URL}${record.picture_back}`
        : "",
    }));

    const totalPages = Math.ceil(totalRecords / parsedPageSize);

    return res.status(200).json({
      status: 200,
      data: {
        records: updatedRecords,
        currentPage: parsedPageNumber,
        pageSize: parsedPageSize,
        totalRecords,
        totalPages,
      },
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong GetEntryRecordsByVehicleType:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
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
        error: "Thiếu trường date trong body request.",
      });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "date không hợp lệ.",
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
          //isOut: false,
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
    console.error("Lỗi trong CountVehicleEntry:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};
const CountVehicleNonExit = async (req, res) => {
  try {
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "Thiếu trường date trong body request.",
      });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "date không hợp lệ.",
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
          isOut: false,
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
    console.error("Lỗi trong CountVehicleEntry:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};
const CreateEntryRecord = async (req, res) => {
  try {
    const {
      picture_front,
      picture_back,
      licensePlate,
      vehicleType,
      usersID,
      rfidId,
    } = req.body;

    const currenTime = new Date();
    const entryTime = new Date(
      currenTime.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
    ).toISOString();

    let isResident = req.body.isResident;

    // Kiểm tra tính hợp lệ của licensePlate
    if (!licensePlate || typeof licensePlate !== "string") {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "licensePlate không hợp lệ.",
      });
    }

    // Kiểm tra tính hợp lệ của vehicleType
    const validVehicleTypes = ["car", "motor", "bike", "eBike"];
    if (!validVehicleTypes.includes(vehicleType)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'vehicleType phải là "car" hoặc "motor".',
      });
    }

    // Kiểm tra users_shiftId hợp lệ và tồn tại
    if (!mongoose.Types.ObjectId.isValid(usersID)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "users_shiftId không hợp lệ.",
      });
    }
    const user = await User.findById(usersID).select(
      "fullname birthDay address phoneNumber"
    );
    // console.log("user", user);

    if (!user) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "user không tồn tại trong cơ sở dữ liệu.",
      });
    }

    // Kiểm tra rfidId hợp lệ và tồn tại
    if (!mongoose.Types.ObjectId.isValid(rfidId)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "rfidId không hợp lệ.",
      });
    }
    const rfidCard = await RFIDCard.findById(rfidId).select("uuid createdAt");
    if (!rfidCard) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "rfidId không tồn tại trong cơ sở dữ liệu.",
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
      const residentHistory = await ResidentHistoryMoney.findOne({
        vehicleId,
        isDelete: false,
      })
        .sort({ endDate: -1 })
        .limit(1);

      if (residentHistory) {
        const endDate = new Date(residentHistory.endDate);
        const currentDate = new Date();

        if (endDate < currentDate) {
          return res.status(400).json({
            status: 400,
            data: null,
            error: "Hết hạn đăng ký tháng, không thể đăng nhập xe cư dân.",
          });
        }
        isResident = true;
      } else {
        isResident = false;
      }

      customer = await Customer.findById(vehicle.customerId).select(
        "fullName phoneNumber address isResident"
      );
    }

    // Lấy phần đường dẫn tương đối từ URL
    const extractRelativePath = (url) => {
      const serverUrl = process.env.MINIO_SERVER_URL;
      return url.replace(serverUrl, "");
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
      usersID: usersID,
      rfidId,
      isOut: false,
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
        user: {
          fullName: user.fullname || "",
          phoneNumber: user.phoneNumber || "",
        },
        rfid: {
          uuid: rfidCard?.uuid || [],
          createdAt: rfidCard?.createdAt || [],
        },
        customer: {
          fullName: customer?.fullName || "",
          phoneNumber: customer?.phoneNumber || "",
          address: customer?.address || "",
          isResident: customer?.isResident || false,
        },
      },
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong CreateEntryRecord:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

const FilterEntryRecords = async (req, res) => {
  try {
    const {
      fromDay,
      toDay,
      isResident,
      isOut,
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
          error: "Ngày không hợp lệ.",
        });
      }

      // Đặt thời gian đầu ngày cho fromDay (00:00:00)
      parsedFromDay.setHours(0, 0, 0, 0);

      // Đặt thời gian cuối ngày cho toDay (23:59:59)
      parsedToDay.setHours(23, 59, 59, 999);

      matchCondition.entryTime = {
        $gte: parsedFromDay,
        $lte: parsedToDay,
      };
    }

    // Lọc theo tình trạng cư dân (isResident)
    if (typeof isResident === "boolean") {
      matchCondition.isResident = isResident;
    }

    // Lọc theo trạng thái ra ngoài (isOut)
    if (typeof isOut === "boolean") {
      matchCondition.isOut = isOut;
    }

    // Pipeline để lấy dữ liệu từ EntryRecord
    const pipeline = [
      { $match: matchCondition },
      { $sort: { entryTime: -1 } },
      {
        $lookup: {
          from: "vehicles",
          localField: "licensePlate",
          foreignField: "licensePlate",
          as: "vehicle",
        },
      },
      { $unwind: { path: "$vehicle", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "customers",
          localField: "vehicle.customerId",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "usersID",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "rfid_cards",
          localField: "rfidId",
          foreignField: "_id",
          as: "rfidCard",
        },
      },
      { $unwind: { path: "$rfidCard", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "exit_records",
          localField: "_id",
          foreignField: "entry_recordId",
          as: "exitRecord",
        },
      },
      {
        $lookup: {
          from: "parking_transactions", // Tên collection của ParkingTransaction
          localField: "exitRecord.parkingTransactionID",
          foreignField: "_id",
          as: "parkingTransaction",
        },
      },
      {
        $unwind: {
          path: "$parkingTransaction",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $unwind: { path: "$exitRecord", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          exitRecord: {
            $cond: {
              if: { $eq: ["$exitRecord", null] },
              then: {},
              else: {
                _id: "$exitRecord._id",
                entry_recordId: "$exitRecord.entry_recordId",
                exitTime: "$exitRecord.exitTime",
                picture_front: {
                  $cond: {
                    if: { $not: ["$exitRecord.picture_front"] },
                    then: "",
                    else: {
                      $concat: [
                        process.env.MINIO_SERVER_URL,
                        "$exitRecord.picture_front",
                      ],
                    },
                  },
                },
                picture_back: {
                  $cond: {
                    if: { $not: ["$exitRecord.picture_back"] },
                    then: "",
                    else: {
                      $concat: [
                        process.env.MINIO_SERVER_URL,
                        "$exitRecord.picture_back",
                      ],
                    },
                  },
                },
                licensePlate: "$exitRecord.licensePlate",
                isResident: "$exitRecord.isResident",
                vehicleType: "$exitRecord.vehicleType",
                isDelete: "$exitRecord.isDelete",
                totalFee: "$parkingTransaction.totalFee",
              },
            },
          },
        },
      },
      {
        $project: {
          entryRecord: {
            id: "$_id",
            entryTime: "$entryTime",
            picture_front: {
              $cond: {
                if: { $not: ["$picture_front"] },
                then: "",
                else: {
                  $concat: [process.env.MINIO_SERVER_URL, "$picture_front"],
                },
              },
            },
            picture_back: {
              $cond: {
                if: { $not: ["$picture_back"] },
                then: "",
                else: {
                  $concat: [process.env.MINIO_SERVER_URL, "$picture_back"],
                },
              },
            },
            licensePlate: "$licensePlate",
            isResident: "$isResident",
            vehicleType: "$vehicleType",
            isOut: "$isOut",
            user: {
              fullName: "$user.fullname",
              phoneNumber: "$user.phoneNumber",
            },
            rfid: {
              uuid: "$rfidCard.uuid",
              createdAt: "$rfidCard.createdAt",
            },
            customer: {
              fullName: "$customer.fullName",
              phoneNumber: "$customer.phoneNumber",
              address: "$customer.address",
              isResident: "$customer.isResident",
            },
          },
          exitRecord: {
            $ifNull: ["$exitRecord", {}],
          },
        },
      },
      { $skip: skip },
      { $limit: parsedPageSize },
    ];

    // Thực hiện truy vấn
    const results = await EntryRecord.aggregate(pipeline);

    // Đếm tổng số bản ghi
    const totalRecords = await EntryRecord.countDocuments(matchCondition);

    if (!results.length) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không có bản ghi nào được tìm thấy.",
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
        totalPages,
      },
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong FilterEntryRecords:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

const GetEntryRecordByisOutAndUuidAndLicensePlate = async (req, res) => {
  try {
    const { isOut, uuid, licensePlate } = req.body;

    // Validate request fields
    if (typeof isOut !== "boolean" || !uuid || !licensePlate) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "Thiếu trường isOut, uuid hoặc licensePlate trong body request.",
      });
    }

    // Find the RFID card by uuid
    const rfidCard = await RFIDCard.findOne({ uuid });
    if (!rfidCard) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy RFIDCard với uuid cung cấp.",
      });
    }

    // Use the rfidCard._id to find the EntryRecord
    const entryRecord = await EntryRecord.findOne({
      isOut,
      rfidId: rfidCard._id,
      licensePlate,
    })
      .populate({
        path: "usersID",
        model: "User",
        select: "fullname age address phoneNumber", // Liên kết với bảng User
      })
      .populate({
        path: "rfidId",
        model: "RFIDCard",
        select: "uuid",
      });

    // Check if the entry record was found
    if (!entryRecord) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy bản ghi EntryRecord với các điều kiện cung cấp.",
      });
    }

    // Add URL prefixes to pictures if available
    entryRecord.picture_front = entryRecord.picture_front
      ? `${process.env.MINIO_SERVER_URL}${entryRecord.picture_front}`
      : "";
    entryRecord.picture_back = entryRecord.picture_back
      ? `${process.env.MINIO_SERVER_URL}${entryRecord.picture_back}`
      : "";

    // Send response with the populated entry record
    return res.status(200).json({
      status: 200,
      data: entryRecord,
      error: null,
    });
  } catch (error) {
    console.error(
      `Lỗi trong GetEntryRecordByisOutAndUuidAndLicensePlate từ EntryRecord:`,
      error
    );
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};
const GetEntryRecordByisOutAndLicensePlate = async (req, res) => {
  try {
    const { isOut, licensePlate } = req.body;

    // Validate request fields
    if (typeof isOut !== "boolean" || !licensePlate) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "Thiếu trường isOut, uuid hoặc licensePlate trong body request.",
      });
    }
    // Use the rfidCard._id to find the EntryRecord
    const entryRecord = await EntryRecord.findOne({
      isOut,
      licensePlate,
    })
      .populate({
        path: "usersID",
        model: "User",
        select: "fullname age address phoneNumber", // Liên kết với bảng User
      })
      .populate({
        path: "rfidId",
        model: "RFIDCard",
        select: "uuid",
      });

    // Check if the entry record was found
    if (!entryRecord) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy bản ghi EntryRecord với các điều kiện cung cấp.",
      });
    }

    // Add URL prefixes to pictures if available
    entryRecord.picture_front = entryRecord.picture_front
      ? `${process.env.MINIO_SERVER_URL}${entryRecord.picture_front}`
      : "";
    entryRecord.picture_back = entryRecord.picture_back
      ? `${process.env.MINIO_SERVER_URL}${entryRecord.picture_back}`
      : "";

    // Send response with the populated entry record
    return res.status(200).json({
      status: 200,
      data: entryRecord,
      error: null,
    });
  } catch (error) {
    console.error(
      `Lỗi trong GetEntryRecordByisOutAndLicensePlate từ EntryRecord:`,
      error
    );
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

const GetNumBerVehicleInMonth = async (req, res) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({ error: "Tháng và năm là bắt buộc." });
    }

    // Tạo khoảng thời gian dựa trên tháng và năm
    const startDate = new Date(year, month - 1, 1); // Ngày đầu tiên của tháng
    const endDate = new Date(year, month, 0, 23, 59, 59); // Ngày cuối cùng của tháng

    // Truy vấn database và nhóm theo isResident và vehicleType (có thể là bất kỳ phương tiện nào)
    const stats = await EntryRecord.aggregate([
      {
        $match: {
          entryTime: { $gte: startDate, $lte: endDate },
          vehicleType: { $in: ["car", "motor"] }, // Lọc theo các loại phương tiện ô tô và xe máy
        },
      },
      {
        $group: {
          _id: {
            vehicleType: "$vehicleType", // Phân nhóm theo loại phương tiện
            isResident: "$isResident", // Phân nhóm theo cư dân hay không
            isOut: "$isOut", // Phân nhóm theo trạng thái vào hoặc ra
          },
          totalVehicles: { $sum: 1 }, // Tổng số xe trong mỗi nhóm
        },
      },
      {
        $project: {
          _id: 0,
          vehicleType: "$_id.vehicleType",
          isResident: "$_id.isResident",
          isOut: "$_id.isOut",
          totalVehicles: 1,
        },
      },
    ]);

    // Kết quả sẽ lưu tổng số xe vào và ra theo từng nhóm
    const result = {
      resident: {
        carIn: 0,
        motorIn: 0,
        carOut: 0,
        motorOut: 0,
        totalIn: 0,
        totalOut: 0,
      },
      nonResident: {
        carIn: 0,
        motorIn: 0,
        carOut: 0,
        motorOut: 0,
        totalIn: 0,
        totalOut: 0,
      },
      total: {
        carIn: 0,
        motorIn: 0,
        carOut: 0,
        motorOut: 0,
        totalIn: 0,
        totalOut: 0,
      },
    };

    // Duyệt qua kết quả trả về từ MongoDB để tính toán
    stats.forEach((item) => {
      const { vehicleType, isResident, isOut, totalVehicles } = item;

      // Tính toán cho từng loại phương tiện và trạng thái vào/ra
      if (isResident) {
        if (isOut) {
          if (vehicleType === "car") result.resident.carOut += totalVehicles;
          else if (vehicleType === "motor")
            result.resident.motorOut += totalVehicles;
        } else {
          if (vehicleType === "car") result.resident.carIn += totalVehicles;
          else if (vehicleType === "motor")
            result.resident.motorIn += totalVehicles;
        }
        result.resident.totalIn += isOut ? 0 : totalVehicles;
        result.resident.totalOut += isOut ? totalVehicles : 0;
      } else {
        if (isOut) {
          if (vehicleType === "car") result.nonResident.carOut += totalVehicles;
          else if (vehicleType === "motor")
            result.nonResident.motorOut += totalVehicles;
        } else {
          if (vehicleType === "car") result.nonResident.carIn += totalVehicles;
          else if (vehicleType === "motor")
            result.nonResident.motorIn += totalVehicles;
        }
        result.nonResident.totalIn += isOut ? 0 : totalVehicles;
        result.nonResident.totalOut += isOut ? totalVehicles : 0;
      }

      // Cập nhật tổng số xe vào và ra
      if (vehicleType === "car") {
        if (isOut) result.total.carOut += totalVehicles;
        else result.total.carIn += totalVehicles;
      } else if (vehicleType === "motor") {
        if (isOut) result.total.motorOut += totalVehicles;
        else result.total.motorIn += totalVehicles;
      }

      result.total.totalIn += isOut ? 0 : totalVehicles;
      result.total.totalOut += isOut ? totalVehicles : 0;
    });

    // Trả về kết quả mà không có "Chưa ra"
    return res.status(200).json({
      message: "Thống kê số lượng phương tiện theo loại và cư dân.",
      data: result,
    });
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu:", error);
    res.status(500).json({ error: "Lỗi máy chủ." });
  }
};

const GetVehicleStatsForToday = async (req, res) => {
  try {
    // Lấy ngày hiện tại
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear(); // Năm hiện tại
    const currentMonth = currentDate.getMonth(); // Tháng hiện tại (0-11)
    const currentDay = currentDate.getDate(); // Ngày hiện tại (1-31)

    // Tạo khoảng thời gian cho ngày hôm nay: từ 00:00:00 đến 23:59:59
    const startDate = new Date(currentYear, currentMonth, currentDay, 0, 0, 0); // Bắt đầu từ 00:00:00
    const endDate = new Date(currentYear, currentMonth, currentDay, 23, 59, 59); // Kết thúc lúc 23:59:59

    // Truy vấn database và nhóm theo isResident và vehicleType (có thể là bất kỳ phương tiện nào)
    const stats = await EntryRecord.aggregate([
      {
        $match: {
          entryTime: { $gte: startDate, $lte: endDate }, // Lọc theo khoảng thời gian trong ngày hôm nay
          vehicleType: { $in: ["car", "motor"] }, // Lọc theo các loại phương tiện ô tô và xe máy
        },
      },
      {
        $group: {
          _id: {
            vehicleType: "$vehicleType", // Phân nhóm theo loại phương tiện
            isResident: "$isResident", // Phân nhóm theo cư dân hay không
            isOut: "$isOut", // Phân nhóm theo trạng thái vào hoặc ra
          },
          totalVehicles: { $sum: 1 }, // Tổng số xe trong mỗi nhóm
        },
      },
      {
        $project: {
          _id: 0,
          vehicleType: "$_id.vehicleType",
          isResident: "$_id.isResident",
          isOut: "$_id.isOut",
          totalVehicles: 1,
        },
      },
    ]);

    // Kết quả sẽ lưu tổng số xe vào và ra theo từng nhóm
    const result = {
      resident: {
        carIn: 0,
        motorIn: 0,
        carOut: 0,
        motorOut: 0,
        totalIn: 0,
        totalOut: 0,
      },
      nonResident: {
        carIn: 0,
        motorIn: 0,
        carOut: 0,
        motorOut: 0,
        totalIn: 0,
        totalOut: 0,
      },
      total: {
        carIn: 0,
        motorIn: 0,
        carOut: 0,
        motorOut: 0,
        totalIn: 0,
        totalOut: 0,
      },
    };

    // Duyệt qua kết quả trả về từ MongoDB để tính toán
    stats.forEach((item) => {
      const { vehicleType, isResident, isOut, totalVehicles } = item;

      // Tính toán cho từng loại phương tiện và trạng thái vào/ra
      if (isResident) {
        if (isOut) {
          if (vehicleType === "car") result.resident.carOut += totalVehicles;
          else if (vehicleType === "motor")
            result.resident.motorOut += totalVehicles;
        } else {
          if (vehicleType === "car") result.resident.carIn += totalVehicles;
          else if (vehicleType === "motor")
            result.resident.motorIn += totalVehicles;
        }
        result.resident.totalIn += isOut ? 0 : totalVehicles;
        result.resident.totalOut += isOut ? totalVehicles : 0;
      } else {
        if (isOut) {
          if (vehicleType === "car") result.nonResident.carOut += totalVehicles;
          else if (vehicleType === "motor")
            result.nonResident.motorOut += totalVehicles;
        } else {
          if (vehicleType === "car") result.nonResident.carIn += totalVehicles;
          else if (vehicleType === "motor")
            result.nonResident.motorIn += totalVehicles;
        }
        result.nonResident.totalIn += isOut ? 0 : totalVehicles;
        result.nonResident.totalOut += isOut ? totalVehicles : 0;
      }

      // Cập nhật tổng số xe vào và ra
      if (vehicleType === "car") {
        if (isOut) result.total.carOut += totalVehicles;
        else result.total.carIn += totalVehicles;
      } else if (vehicleType === "motor") {
        if (isOut) result.total.motorOut += totalVehicles;
        else result.total.motorIn += totalVehicles;
      }

      result.total.totalIn += isOut ? 0 : totalVehicles;
      result.total.totalOut += isOut ? totalVehicles : 0;
    });

    // Trả về kết quả cho ngày hôm nay
    return res.status(200).json({
      message:
        "Thống kê số lượng phương tiện theo loại và cư dân cho ngày hôm nay.",
      data: result,
    });
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu:", error);
    res.status(500).json({ error: "Lỗi máy chủ." });
  }
};

module.exports = {
  GetAllEntryRecords,
  GetEntryRecordById,
  GetEntryRecordByLicensePlate,
  GetEntryRecordsByDateRange,
  GetEntryRecordsByVehicleType,
  CreateEntryRecord,
  CountVehicleEntry,
  CountVehicleNonExit,
  FilterEntryRecords,
  GetEntryRecordByisOutAndUuidAndLicensePlate,
  GetEntryRecordByisOutAndLicensePlate,
  GetNumBerVehicleInMonth,
  GetVehicleStatsForToday,
};
