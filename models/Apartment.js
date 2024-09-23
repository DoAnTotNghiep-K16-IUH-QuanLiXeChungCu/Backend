const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const apartmentSchema = new Schema({
  name: {
    type: String,
    required: true
  }
}, {
  collection: 'apartments'
});

const Apartment = mongoose.model('Apartment', apartmentSchema);
module.exports = Apartment;
