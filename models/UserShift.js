const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userShiftSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  shiftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift',
    required: true
  },
  dateTime: {
    type: Date,
    required: true
  }
}, {
  collection: 'users_shift'
});

const UserShift = mongoose.model('UserShift', userShiftSchema);
module.exports = UserShift;
