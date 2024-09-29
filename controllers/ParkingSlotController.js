const ParkingSlot = require('../models/ParkingSlot');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client({ region: 'your-region' });

const GetAllParkingSlots = async (req, res) => {
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

    // Lấy tổng số bãi đỗ
    const totalRecords = await ParkingSlot.countDocuments();

    if (totalRecords === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không có bãi đỗ xe nào được tìm thấy.'
      });
    }

    // Lấy danh sách bãi đỗ
    const parkingSlots = await ParkingSlot.find()
      .skip(skip)
      .limit(parsedPageSize);

    if (parkingSlots.length === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy bãi đỗ nào cho trang này.'
      });
    }

    const totalPages = Math.ceil(totalRecords / parsedPageSize);

    return res.status(200).json({
      status: 200,
      data: {
        parkingSlots,
        currentPage: parsedPageNumber,
        pageSize: parsedPageSize,
        totalRecords,
        totalPages
      },
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong GetAllParkingSlots:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

module.exports = {
  GetAllParkingSlots
};
