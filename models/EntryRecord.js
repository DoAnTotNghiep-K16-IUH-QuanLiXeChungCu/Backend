const entryRecordSchema = new Schema({
    entryTime: {
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
    isOut: {
      type: Boolean,
      required: true
    },
    users_shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserShift',
      required: true
    },
    isDelete: {
      type: Boolean,
      default: false
    }
  }, {
    collection: 'entry_records'
  });
  
  const EntryRecord = mongoose.model('EntryRecord', entryRecordSchema);
  module.exports = EntryRecord;
  