const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const vehicleSchema = new Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  licensePlate: {
    type: String,
    required: true,
    unique: true 
  },
  type: {
    type: String,
    enum: ['car', 'motor'],
    required: true
  },
  color: {
    type: String,
    required: true
  },
  brand: {
    type: String,
    required: true
  },
  isDelete: {
    type: Boolean,
    default: false
  }
}, {
  collection: 'vehicles'
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
module.exports = Vehicle;
