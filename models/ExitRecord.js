const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const exitRecordSchema = new Schema({
  entry_recordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EntryRecord',
    required: true
  },
  exitTime: {
    type: Date,
    required: true
  },
  picture_front: {
    type: String,
    default: ''
  },
  picture_back: {
    type: String,
    default: ''
  },
  licensePlate: {
    type: String,
    required: true
  },
  isResident: {
    type: Boolean,
    required: true
  },
  vehicleType: {
    type: String,
    required: true
  },
  isDelete: {
    type: Boolean,
    default: false
  }
}, {
  collection: 'exit_records'
});

const ExitRecord = mongoose.model('ExitRecord', exitRecordSchema);
module.exports = ExitRecord;
