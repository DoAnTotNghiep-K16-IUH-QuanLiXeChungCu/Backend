const Setting = require("../models/Setting");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const s3Client = new S3Client({ region: "your-region" });
const mongoose = require("mongoose");

const GetSetting = async (req, res) => {
  try {
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

    // Lấy tất cả các bản ghi
    const totalRecords = await Setting.countDocuments();
    const settings = await Setting.find().skip(skip).limit(parsedPageSize);

    if (totalRecords === 0) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không có setting  nào được tìm thấy.",
      });
    }

    const totalPages = Math.ceil(totalRecords / parsedPageSize);

    return res.status(200).json({
      status: 200,
      data: {
        settings,
        currentPage: parsedPageNumber,
        pageSize: parsedPageSize,
        totalRecords,
        totalPages,
      },
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong GetSetting:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};
const GetSettingByID = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "ID không hợp lệ.",
      });
    }

    const setting = await Setting.findById(id);

    if (!setting) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy setting với ID này.",
      });
    }

    return res.status(200).json({
      status: 200,
      data: setting,
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong getSettingByID:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

const UpdateSetting = async (req, res) => {
  try {
    const { id, apartmentsId, fullName, phoneNumber, address, isResident } =
      req.body;

    // Kiểm tra id hợp lệ
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "ID không hợp lệ.",
      });
    }

    const customer = await Customer.findById(id);

    if (!customer || customer.isDelete) {
      return res.status(404).json({
        status: 404,
        data: null,
        error: "Không tìm thấy khách hàng với ID này.",
      });
    }

    // Kiểm tra số điện thoại phải có từ 10 đến 11 số
    if (phoneNumber) {
      const phoneRegex = /^\d{10,11}$/;
      if (!phoneRegex.test(phoneNumber)) {
        return res.status(400).json({
          status: 400,
          data: null,
          error: "Số điện thoại phải có từ 10 đến 11 chữ số.",
        });
      }
    }

    // Kiểm tra logic của isResident để xác định apartmentsId và address
    if (isResident) {
      if (!apartmentsId || !mongoose.Types.ObjectId.isValid(apartmentsId)) {
        return res.status(400).json({
          status: 400,
          data: null,
          error:
            "apartmentsId không hợp lệ hoặc không được cung cấp cho cư dân.",
        });
      }
      customer.apartmentsId = apartmentsId;
      customer.address = ""; // Cư dân không cần địa chỉ
    } else {
      customer.apartmentsId = undefined; // Gán undefined cho apartmentsId nếu không phải cư dân
      customer.address = address || ""; // Cập nhật địa chỉ nếu không phải cư dân
    }

    // Cập nhật các trường khác
    customer.fullName = fullName || customer.fullName;
    customer.phoneNumber = phoneNumber || customer.phoneNumber;
    customer.isResident = isResident;

    // Lưu lại bản ghi đã cập nhật
    await customer.save();

    const updatedCustomer = await Customer.findById(customer._id).populate({
      path: "apartmentsId", // Populate apartmentsId
      model: "Apartment", // Model là Apartment
      select: "name", // Chỉ lấy trường name của Apartment
    });

    return res.status(200).json({
      status: 200,
      data: updatedCustomer,
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong UpdateCustomer:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

module.exports = {
  GetSetting,
  GetSettingByID,
  UpdateSetting,
};
