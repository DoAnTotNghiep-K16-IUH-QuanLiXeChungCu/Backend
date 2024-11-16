const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const entryRecordSchema = new Schema(
  {
    entryTime: {
      type: Date,
      required: true,
    },
    picture_front: {
      type: String,
      default: "",
    },
    picture_back: {
      type: String,
      default: "",
    },
    licensePlate: {
      type: String,
      required: true,
    },
    isResident: {
      type: Boolean,
      required: true,
    },
    vehicleType: {
      type: String,
      enum: ["car", "motor", "bike", "eBike"],
      required: true,
    },
    isOut: {
      type: Boolean,
      required: true,
    },
    usersID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rfidId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RFIDCard",
      required: true,
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  {
    collection: "entry_records",
  }
);

const EntryRecord = mongoose.model("EntryRecord", entryRecordSchema);
module.exports = EntryRecord;
