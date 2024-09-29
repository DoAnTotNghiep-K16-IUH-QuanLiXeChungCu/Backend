const ExitRecord = require("../models/ExitRecord");
const EntryRecord = require("../models/EntryRecord");
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client({ region: 'your-region' });

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
    const { licensePlate } = req.body;

    // Kiểm tra trường hợp không có licensePlate
    if (!licensePlate) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'Thiếu trường licensePlate trong body request.'
      });
    }

    const exitRecords = await ExitRecord.find({ licensePlate })
      .populate({
        path: 'entry_recordId',
        model: 'EntryRecord',
        select: 'entryTime licensePlate vehicleType'
      });

    if (exitRecords.length === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy bản ghi ExitRecord với licensePlate này.'
      });
    }

    return res.status(200).json({
      status: 200,
      data: exitRecords,
      error: null
    });
  } catch (error) {
    console.error(`Lỗi trong getExitRecordByLicensePlate từ ExitRecord:`, error);
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
};
