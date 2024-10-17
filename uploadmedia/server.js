require('dotenv').config();
const Minio = require('minio');
const multer = require('multer');
const path = require('path');

// Khởi tạo MinIO client với thông tin từ .env
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,  
  port: parseInt(process.env.MINIO_PORT),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY  
});

// Kiểm tra hoặc tạo bucket nếu chưa tồn tại
const bucketName = process.env.MINIO_BUCKET_NAME;
const folderName = process.env.MINIO_FOLDER_NAME;

minioClient.bucketExists(bucketName, (err) => {
  if (err) {
    console.log('Bucket does not exist, trying to create...');
    minioClient.makeBucket(bucketName, 'us-east-1', function(err) {
      if (err) {
        console.log('Error creating bucket.', err);
      } else {
        console.log('Bucket created successfully in "us-east-1".');
      }
    });
  } else {
    console.log('Connected to MinIO');
  }
});

// Cấu hình multer để upload file
const upload = multer({ dest: 'uploads/' });

// Controller xử lý việc upload file
const UploadFile = async (req, res) => {
  try {
    const file = req.file; // File được gửi từ client qua multipart/form-data
    if (!file) {
      return res.status(400).json({
        status: 400,
        data: null,
        error: 'Không tìm thấy file để upload.'
      });
    }
    console.log('Received file:', file);
    const metaData = {
      'Content-Type': file.mimetype
    };

    const filePath = path.join(__dirname, '../', file.path);

    // Đặt tên file trong MinIO bao gồm cả đường dẫn thư mục
    const minioFilePath = `${folderName}/${file.originalname}`;  // Thêm tên thư mục vào trước tên file

    // Upload file lên MinIO
    minioClient.fPutObject(bucketName, minioFilePath, filePath, metaData, (err, etag) => {
      if (err) {
        console.error('Upload to MinIO failed:', err);
        return res.status(500).json({
          status: 500,
          data: null,
          error: 'Upload failed. Error: ' + err.message
        });
      }

      // Trả về URL của file đã upload
      const url = `${process.env.MINIO_SERVER_URL}/${bucketName}/${minioFilePath}`;
      console.log('Upload successful. File URL:', url); // Thông báo upload thành công
      return res.status(200).json({
        status: 200,
        data: { url },
        error: null
      });
    });
  } catch (error) {
    console.error('Lỗi trong UploadFile:', error);
    return res.status(500).json({
      status: 500,
      data: null,
      error: 'Lỗi máy chủ không xác định.'
    });
  }
};

module.exports = {
  UploadFile,
  upload
};

//D:\MinIO\minio.exe server D:\Data --console-address ":9001"