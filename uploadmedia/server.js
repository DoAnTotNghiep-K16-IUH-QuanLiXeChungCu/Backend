require("dotenv").config();
const Minio = require("minio");
const multer = require("multer");
const path = require("path");

// Khởi tạo MinIO client với thông tin từ .env
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

// Kiểm tra hoặc tạo bucket nếu chưa tồn tại
const bucketName = process.env.MINIO_BUCKET_NAME;
const folderName = process.env.MINIO_FOLDER_NAME;

minioClient.bucketExists(bucketName, (err) => {
  if (err) {
    minioClient.makeBucket(bucketName, "us-east-1", function (err) {
      if (err) {
        console.log("Error creating bucket.", err);
      } else {
        console.log('Bucket created successfully in "us-east-1".');
      }
    });
  } else {
    console.log("Connected to MinIO");
  }
});

// Cấu hình multer để upload nhiều file
const upload = multer({ dest: "uploads/" }); // Đảm bảo khai báo đúng ở đây

// Tạo một chuỗi ngẫu nhiên
const generateTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
};

// Controller xử lý việc upload file
const UploadFile = async (req, res) => {
  try {
    const files = req.files; // Lấy tất cả các file
    if (!files || files.length === 0) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: "Không tìm thấy file để upload.",
      });
    }

    const uploadedUrls = []; // Lưu trữ URL của các file đã upload

    // Duyệt qua từng file và upload lên MinIO
    for (const file of files) {
      const metaData = {
        "Content-Type": file.mimetype,
      };
      const filePath = path.join(__dirname, "../", file.path);

      // Tạo chuỗi ngẫu nhiên
      const timestamp = generateTimestamp();
      const minioFilePath = `${folderName}/${timestamp}/${file.originalname}`;

      // Upload file lên MinIO
      await new Promise((resolve, reject) => {
        minioClient.fPutObject(
          bucketName,
          minioFilePath,
          filePath,
          metaData,
          (err, etag) => {
            if (err) {
              console.error("Upload to MinIO failed:", err);
              reject(err);
            } else {
              // Trả về URL của file đã upload
              const url = `${process.env.MINIO_SERVER_URL.replace(
                /\/$/,
                ""
              )}/${bucketName}/${minioFilePath}`;
              uploadedUrls.push(url); // Thêm URL vào mảng
              resolve();
            }
          }
        );
      });
    }

    return res.status(200).json({
      status: 200,
      data: { urls: uploadedUrls }, // Trả về danh sách URL của các file đã upload
      error: null,
    });
  } catch (error) {
    console.error("Lỗi trong UploadFile:", error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: "Lỗi máy chủ không xác định.",
    });
  }
};

module.exports = {
  UploadFile,
  upload,
};

// cài 
// PS> Invoke-WebRequest -Uri "https://dl.min.io/server/minio/release/windows-amd64/minio.exe" -OutFile "D:\MinIO\minio.exe"
// chạy
//D:\MinIO\minio.exe server D:\Data --console-address ":9001"