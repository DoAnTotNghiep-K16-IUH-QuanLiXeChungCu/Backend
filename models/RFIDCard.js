const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const rfidCardSchema = new Schema({
  uuid: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'rfid_cards'
});

const RFIDCard = mongoose.model('RFIDCard', rfidCardSchema);

module.exports = RFIDCard;
