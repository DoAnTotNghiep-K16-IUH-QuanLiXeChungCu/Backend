const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const payRollFomulaSchema = new Schema(
  {
    role: {
      type: String,
      required: true,
      enum: ["Admin", "User", "Manager"],
      default: "User",
    },
    basicRatePerHour: {
      type: Number,
      required: true,
    },
    overtimeRate: {
      type: Number,
      required: true,
    },
    deductions: {
      type: Number,
      required: true,
    },
    allowance: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["in_using", "not_using"],
      default: "not_using",
    },
  },
  {
    collection: "pay_roll_fomulas",
  }
);

const PayRollFomula = mongoose.model("PayRollFomula", payRollFomulaSchema);
module.exports = PayRollFomula;
