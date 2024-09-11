const customerSchema = new Schema({
    apartmentsId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Apartment',
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
  });
  
  const Customer = mongoose.model('Customer', customerSchema);
  module.exports = Customer;
  