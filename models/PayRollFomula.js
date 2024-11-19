const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const payRollFomulaSchema = new Schema(
  {
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
    }
  },
  {
    collection: "pay_roll_fomulas",
  }
);

const PayRollFomula = mongoose.model("PayRollFomula", payRollFomulaSchema);
module.exports = PayRollFomula;
