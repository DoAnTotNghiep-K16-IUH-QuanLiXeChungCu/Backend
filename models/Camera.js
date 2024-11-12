const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cameraSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    deviceID: {
      type: String,
      required: true,
    },
  },
  {
    collection: "camera",
  }
);

const Camera = mongoose.model("Camera", cameraSchema); // Đăng ký model
module.exports = Camera;
