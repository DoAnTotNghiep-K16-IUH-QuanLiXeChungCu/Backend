const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const parkingSlotSchema = new Schema({
  slotCode: {
    type: String,
    required: true
  },
  slotType: {
    type: String,
    enum: ['car', 'motor'],
    required: true
  },
  availableSlots: {
    type: Number,
    required: true
  },
  totalQuantity: {
    type: Number,
    required: true
  }
}, {
  collection: 'parking_slots'
});

const ParkingSlot = mongoose.model('ParkingSlot', parkingSlotSchema);
module.exports = ParkingSlot;
