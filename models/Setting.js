const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const settingSchema = new Schema(
  {
    entryPort: {
      type: String,
      required: true,
    },
    entryBau: {
      type: Number,
      required: true,
    },
    exitPort: {
      type: String,
      required: true,
    },
    exitBau: {
      type: Number,
      required: true,
    },
    camera1: {
      type: String,
      required: true,
    },
    camera2: {
      type: String,
      required: true,
    },
    camera3: {
      type: String,
      required: true,
    },
    camera4: {
      type: String,
      required: true,
    },
  },
  {
    collection: "setting",
  }
);

const Setting = mongoose.model("Setting", settingSchema);
module.exports = Setting;
