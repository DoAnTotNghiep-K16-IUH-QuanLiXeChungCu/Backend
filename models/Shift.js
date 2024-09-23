const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const shiftSchema = new Schema({
  shiftName: {
    type: String,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  }
}, {
  collection: 'shift'
});

const Shift = mongoose.model('Shift', shiftSchema);
module.exports = Shift;
