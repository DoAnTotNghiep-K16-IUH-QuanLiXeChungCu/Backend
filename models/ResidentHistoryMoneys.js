const residentHistoryMoneySchema = new Schema({
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    parking_slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parking_slot',
      required: true,
    },
    monthlyFee: {
      type: Number,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
  });
  
  const ResidentHistoryMoney = mongoose.model('Resident_history_money', residentHistoryMoneySchema);
  module.exports = ResidentHistoryMoney;
  