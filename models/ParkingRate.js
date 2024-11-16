const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const parkingRateSchema = new Schema(
  {
    vehicleType: {
      type: String,
      enum: ["car", "motor"],
      required: true,
    },
    hourly_rate: {
      type: Number,
      required: true,
    },
    overnight_rate: {
      type: Number,
      required: true,
    },
    daily_rate: {
      type: Number,
      required: true,
    },
    weekly_rate: {
      type: Number,
      required: true,
    },
    monthly_rate: {
      type: Number,
      required: true,
    },
    yearly_rate: {
      type: Number,
      required: true,
    },
  },
  {
    collection: "parking_rates",
  }
);

const ParkingRate = mongoose.model("ParkingRate", parkingRateSchema);
module.exports = ParkingRate;
