const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const settingSchema = new Schema(
  {
    version: {
      type: String,
      required: true,
    },
    entryLane: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lane",
      required: true,
    },
    exitLane: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lane",
      required: true,
    },
    secondaryEntryLane: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lane",
      required: true,
    },
    secondaryExitLane: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lane",
      required: true,
    },
  },
  {
    collection: "setting",
  }
);

const Setting = mongoose.model("Setting", settingSchema);
module.exports = Setting;
