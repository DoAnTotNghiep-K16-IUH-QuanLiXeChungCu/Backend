const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const parkingTransactionSchema = new Schema(
  {
    vehicleType: {
      type: String,
      enum: ["car", "motor"],
      required: true,
    },
    licensePlate: {
      type: String,
      required: true,
    },
    entryTime: {
      type: Date,
      required: true,
    },
    exitTime: {
      type: Date,
      required: true,
    },
    totalFee: {
      type: Number,
      required: true,
    },
  },
  {
    collection: "parking_transactions",
  }
);

const ParkingTransaction = mongoose.model(
  "ParkingTransaction",
  parkingTransactionSchema
);
module.exports = ParkingTransaction;
