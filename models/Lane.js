const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const laneSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    port: {
      type: String,
      required: true,
    },
    camera1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Camera",
      required: true,
    },
    camera2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Camera",
      required: true,
    },
  },
  {
    collection: "lane",
  }
);

const Lane = mongoose.model("Lane", laneSchema);
module.exports = Lane;
