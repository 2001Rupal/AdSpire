// models/Booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  brandName: String,
  website: String,
  role: { type: String, enum: ['brand', 'agency'] },
  email: String,
  contactDetails: String,
  inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClubInventory' },
  clubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Club' },
  bookingDates: [Date],
  status: { type: String, enum: ['enquiry', 'proposal_sent', 'booked'], default: 'enquiry' },
  proposalMessage: String,

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
