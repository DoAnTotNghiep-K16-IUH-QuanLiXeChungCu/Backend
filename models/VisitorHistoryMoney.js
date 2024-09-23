const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const visitorHistoryMoneySchema = new Schema({
  exit_recordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExitRecord',
    required: true
  },
  licensePlate: {
    type: String,
    required: true
  },
  dateTime: {
    type: Date,
    required: true
  },
  hourly: {
    type: Number,
    required: true
  },
  vehicleType: {
    type: String,
    required: true
  },
  parkingFee: {
    type: Number,
    required: true
  },
  isDelete: {
    type: Boolean,
    default: false
  }
}, {
  collection: 'visitor_history_moneys'
});

const VisitorHistoryMoney = mongoose.model('VisitorHistoryMoney', visitorHistoryMoneySchema);
module.exports = VisitorHistoryMoney;
