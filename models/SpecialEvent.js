const mongoose = require('mongoose');

const specialEventSchema = new mongoose.Schema({
  clubId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: true
  },
  title: String,
  description: String,
  date: Date,
  time: String,
  location: String,
  media: [String],
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SpecialEvent', specialEventSchema);
