const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const parkingRateSchema = new Schema({
  vehicleType: {
    type: String,
    required: true
  },
  hourly: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  }
}, {
  collection: 'parking_rates'
});

const ParkingRate = mongoose.model('ParkingRate', parkingRateSchema);
module.exports = ParkingRate;
