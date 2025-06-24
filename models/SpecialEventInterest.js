const mongoose = require('mongoose');

const specialEventInterestSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'SpecialEvent' , required: true},
  brandId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' , required: true},
  message: String,
  status: {
  type: String,
  enum: ['Pending', 'Done','Reject'], // or ['Pending', 'Approved']
  default: 'Pending'
},

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('SpecialEventInterest', specialEventInterestSchema);
