const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const timeKeepingLogSchema = new Schema(
  {
    rfidId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RFIDCard",
      required: true,
    },
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    scanTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["in", "out"],
      required: true,
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  {
    collection: "time_keeping_logs",
  }
);

const TimeKeepingLog = mongoose.model("TimeKeepingLog", timeKeepingLogSchema);
module.exports = TimeKeepingLog;
