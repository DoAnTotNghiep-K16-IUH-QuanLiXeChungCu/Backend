const residentHistoryMoneySchema = new Schema({
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  parking_slotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingSlot',
    required: true
  },
  monthlyFee: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isDelete: {
    type: Boolean,
    default: false
  }
}, {
  collection: 'resident_history_moneys'
});

const ResidentHistoryMoney = mongoose.model('ResidentHistoryMoney', residentHistoryMoneySchema);
module.exports = ResidentHistoryMoney;
