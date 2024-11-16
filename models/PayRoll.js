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
    },
    totalOvertimeHours: {
      type: Number,
      required: true,
    },
    basicSalary: {
      type: Number,
      required: true,
    },
    overtimeSalary: {
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
    totalSalary: {
      type: Number,
      required: true,
    },
    note: {
      type: String,
      required: true,
    },
  },
  {
    collection: "pay_rolls",
  }
);

const PayRoll = mongoose.model("PayRoll", payRollSchema);
module.exports = PayRoll;
