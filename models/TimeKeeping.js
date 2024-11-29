const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const timeKeepingSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      required: true,
    },
    workDate: {
      type: Date,
      required: true,
    },
    checkIn: {
      type: Date,
    },
    checkOut: {
      type: Date,
      default: null,
    },
    hoursWorked: {
      type: Number,
      default: 0,
    },
  },
  {
    collection: "time_keepings",
  }
);

const TimeKeeping = mongoose.model("TimeKeeping", timeKeepingSchema);
module.exports = TimeKeeping;
