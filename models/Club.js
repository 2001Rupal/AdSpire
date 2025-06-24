const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema({
  name: String,
  email: String,
  contactNumber: String,
  membershipFeeRange: String,
  location: String,
  website: String,
  description: String,
  view360Link: String,
  media: [String], // URLs to images/videos
  sponsors: [String],
  totalMembers: Number,
  ageRange: String,
  popularity: { type: Number, default: 0 }, 
  reach: String, // added
  availability: String, // added
  segment: String, // for explore filters
  industry: String, // for explore filters
    mapLink: String, // Google Maps embed link
segmentTags: {
  type: [String],
  default: []
},
    inventories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ClubInventory' }],

  createdAt: { type: Date, default: Date.now },
  otp: Number,
  otpExpiresAt: Date

});

module.exports = mongoose.model('Club', clubSchema);
