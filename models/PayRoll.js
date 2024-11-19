const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const payRollSchema = new Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    payPeriod: {
      type: Date,
      required: true,
    },
    totalRegularHours: {
      type: Number,
      required: true,
      default: 0,
    },
    totalOvertimeHours: {
      type: Number,
      required: true,
      default: 0,
    },
    basicSalary: {
      type: Number,
      required: true,
      default: 0,
    },
    overtimeSalary: {
      type: Number,
      required: true,
      default: 0,
    },
    deductions: {
      type: Number,
      required: true,
      default: 0,
    },
    allowance: {
      type: Number,
      required: true,
      default: 0,
    },
    totalSalary: {
      type: Number,
      required: true,
      default: 0,
    },
    note: {
      type: String,
      default: "" ,
    },
  },
  {
    collection: "pay_rolls",
  }
);

const PayRoll = mongoose.model("PayRoll", payRollSchema);
module.exports = PayRoll;
