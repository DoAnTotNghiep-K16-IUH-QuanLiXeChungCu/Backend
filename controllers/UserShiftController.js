const UserShift = require('../models/UserShift');
const User = require('../models/User');
const Shift = require('../models/Shift');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client({ region: 'your-region' });
const mongoose = require('mongoose');

const GetAllUserShifts = async (req, res) => {
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
  
      // Lấy tất cả các UserShift
      const totalRecords = await UserShift.countDocuments();

      const userShifts = await UserShift.find()
      .sort({ dateTime: -1 })
      .skip(skip)
      .limit(parsedPageSize)
      .populate('userId', 'username age') // Thay 'username','age' bằng 'username age'
      .populate('shiftId', 'shiftName');  // Cấu trúc này đúng

      if (totalRecords === 0) {
        return res.status(404).json({
          status: 404,
          data: null,
          error: 'Không có UserShift nào được tìm thấy.'
        });
      }
  
      const totalPages = Math.ceil(totalRecords / parsedPageSize);
  
      return res.status(200).json({
        status: 200,
        data: {
          userShifts,
          currentPage: parsedPageNumber,
          pageSize: parsedPageSize,
          totalRecords,
          totalPages
        },
        error: null
      });
    } catch (error) {
      console.error('Lỗi trong GetAllUserShifts:', error);
      return res.status(500).json({
        status: 500,
        data: null,
        error: 'Lỗi máy chủ không xác định.'
      });
    }
};

const CreateUserShift = async (req, res) => {
  try {
    const { userId, shiftId, dateTime } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!userId || !shiftId || !dateTime) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'Các trường userId, shiftId, và dateTime đều bắt buộc.'
      });
    }

    // Kiểm tra xem userId có tồn tại không
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'userId không tồn tại trong cơ sở dữ liệu.'
      });
    }

    // Kiểm tra xem shiftId có tồn tại không
    const shiftExists = await Shift.findById(shiftId);
    if (!shiftExists) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'shiftId không tồn tại trong cơ sở dữ liệu.'
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
        error: 'dateTime phải là một ngày trong tương lai.'
      });
    }

    // Kiểm tra xem UserShift đã tồn tại hay chưa (cặp userId, shiftId, dateTime)
    const existingUserShift = await UserShift.findOne({ userId, shiftId, dateTime: parsedDateTime });
    if (existingUserShift) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'UserShift đã tồn tại cho userId, shiftId, và dateTime này.'
      });
    }

    // Tạo UserShift mới
    const newUserShift = new UserShift({
      userId,
      shiftId,
      dateTime: parsedDateTime
    });

    // Lưu vào cơ sở dữ liệu
    await newUserShift.save();

    const populatedUserShift = await UserShift.findById(newUserShift._id)
    .populate({
      path: 'userId',
      select: 'username age' // Chỉ lấy các trường cần thiết từ User
    })
    .populate({
      path: 'shiftId',
      select: 'shiftName' // Chỉ lấy các trường cần thiết từ Shift
    });

    return res.status(201).json({
      status: 201,
      data: populatedUserShift,
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong CreateUserShift:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const UpdateUserShift = async (req, res) => {
  try {
    const { id, userId, shiftId, dateTime } = req.body;

    // Kiểm tra ID có hợp lệ không
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'ID không hợp lệ.'
      });
    }

    // Tìm UserShift với ID đã cho
    const userShift = await UserShift.findById(id);
    if (!userShift) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy UserShift với ID này.'
      });
    }

    // Nếu có userId mới, kiểm tra sự tồn tại của userId
    if (userId) {
      const userExists = await User.findById(userId);
      if (!userExists) {
        return res.status(400).json({
          status: 400,
          data: null,
          error: 'userId không tồn tại trong cơ sở dữ liệu.'
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
          error: 'shiftId không tồn tại trong cơ sở dữ liệu.'
        });
      }
    }

    // Kiểm tra nếu có dateTime và nó phải là ngày trong tương lai
    if (dateTime) {
      const currentDateTime = new Date();
      const parsedDateTime = new Date(dateTime);
      if (parsedDateTime <= currentDateTime) {
        return res.status(400).json({
          status: 400,
          data: null,
          error: 'dateTime phải là một ngày trong tương lai.'
        });
      }

      // Kiểm tra xem UserShift đã tồn tại hay chưa cho cặp userId, shiftId, dateTime (ngoại trừ bản ghi hiện tại)
      const existingUserShift = await UserShift.findOne({
        userId: userId || userShift.userId,
        shiftId: shiftId || userShift.shiftId,
        dateTime: parsedDateTime,
        _id: { $ne: id } // Loại bỏ bản ghi hiện tại khỏi kết quả tìm kiếm
      });

      if (existingUserShift) {
        return res.status(400).json({
          status: 400,
          data: null,
          error: 'UserShift đã tồn tại cho userId, shiftId, và dateTime này.'
        });
      }
    }

    // Cập nhật các trường cần thiết
    userShift.userId = userId || userShift.userId;
    userShift.shiftId = shiftId || userShift.shiftId;
    userShift.dateTime = dateTime || userShift.dateTime;

    // Lưu lại bản ghi đã cập nhật
    await userShift.save();

    const populatedUserShift = await UserShift.findById(userShift._id)
    .populate({
      path: 'userId',
      select: 'username age fullname' // Lấy các trường cần thiết từ User
    })
    .populate({
      path: 'shiftId',
      select: 'shiftName' // Lấy các trường cần thiết từ Shift
    });


    return res.status(200).json({
      status: 200,
      data: populatedUserShift,
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong UpdateUserShift:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const DeleteUserShift = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'ID không hợp lệ.'
      });
    }

    const userShift = await UserShift.findById(id);

    if (!userShift) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không tìm thấy UserShift với ID này.'
      });
    }

    // Xóa UserShift
    await UserShift.deleteOne({ _id: id });

    return res.status(200).json({
      status: 200,
      data: 'UserShift đã được xóa thành công.',
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong DeleteUserShift:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const GetUserShiftsByUserIdAndDateRange = async (req, res) => {
  try {
    const { userId, startDate, endDate, pageNumber = 1, pageSize = 10 } = req.body;

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

    // Tạo query động
    const query = {};

    // Nếu có userId, thêm vào query
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      query.userId = userId;
    }

    // Nếu có startDate hoặc endDate, thêm phạm vi thời gian vào query
    if (startDate) {
      query.dateTime = { $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)) }; // Bắt đầu từ ngày startDate
    }

    if (endDate) {
      query.dateTime = query.dateTime || {}; // Đảm bảo query.dateTime không bị ghi đè
      query.dateTime.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999)); // Đến cuối ngày endDate
    }

    // Đếm tổng số bản ghi phù hợp
    const totalRecords = await UserShift.countDocuments(query);
    if (totalRecords === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không có UserShift nào phù hợp với điều kiện lọc.'
      });
    }

    // Lấy danh sách UserShift dựa trên query và phân trang
    const userShifts = await UserShift.find(query)
      .skip(skip)
      .limit(parsedPageSize)
      .populate('userId', 'name') // Lấy thông tin user
      .populate('shiftId', 'shiftName startTime endTime'); // Lấy thông tin shift

    const totalPages = Math.ceil(totalRecords / parsedPageSize);

    return res.status(200).json({
      status: 200,
      data: {
        userShifts,
        currentPage: parsedPageNumber,
        pageSize: parsedPageSize,
        totalRecords,
        totalPages
      },
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong GetUserShiftsByUserIdAndDateRange:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

const FilterUserShift = async (req, res) => {
  try {
    const { date, shiftId, pageNumber = 1, pageSize = 10 } = req.body;

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

    // Tạo điều kiện lọc động
    const matchCondition = {};

    // Lọc theo date nếu có
    if (date) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          status: 400,
          data: null,
          error: 'Ngày không hợp lệ.'
        });
      }
      matchCondition.dateTime = {
        $gte: new Date(new Date(parsedDate).setHours(0, 0, 0, 0)),  // Đặt bắt đầu ngày
        $lte: new Date(new Date(parsedDate).setHours(23, 59, 59, 999))  // Đặt cuối ngày
      };
    }

    // Lọc theo shiftId nếu có
    if (shiftId && mongoose.Types.ObjectId.isValid(shiftId)) {
      const shiftExists = await Shift.findById(shiftId);
      if (!shiftExists) {
        return res.status(400).json({
          status: 400,
          data: null,
          error: 'shiftId không tồn tại trong cơ sở dữ liệu.'
        });
      }
      matchCondition.shiftId = shiftId;
    }

    // Đếm tổng số bản ghi phù hợp
    const totalRecords = await UserShift.countDocuments(matchCondition);
    if (totalRecords === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: 'Không có UserShift nào phù hợp với điều kiện lọc.'
      });
    }

    // Lấy danh sách UserShift dựa trên điều kiện lọc và phân trang
    const userShifts = await UserShift.find(matchCondition)
      .skip(skip)
      .limit(parsedPageSize)
      .populate('userId', 'username age fullname')  // Đổi từ 'username' thành 'fullName'
      .populate('shiftId', 'shiftName');  // Lấy thông tin shift

    const totalPages = Math.ceil(totalRecords / parsedPageSize);

    return res.status(200).json({
      status: 200,
      data: {
        userShifts,
        currentPage: parsedPageNumber,
        pageSize: parsedPageSize,
        totalRecords,
        totalPages
      },
      error: null
    });
  } catch (error) {
    console.error('Lỗi trong filterUserShift:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

module.exports = {
    GetAllUserShifts,
    CreateUserShift,
    UpdateUserShift,
    DeleteUserShift,
    GetUserShiftsByUserIdAndDateRange,
    FilterUserShift
};
  