const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const customerSchema = new Schema({
  apartmentsId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Apartment',
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: false, 
    default: ''
  },
  isResident: {
    type: Boolean,
    required: true,  
    default: true 
  },
  isDelete: {
    type: Boolean,
    default: false
  }
}, {
  collection: 'customers'
});

const Customer = mongoose.model('Customer', customerSchema);
module.exports = Customer;
