const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  items: [
    {
      inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
      name:String,
      selectedSubInventories: [String],
      startDate: Date,
      endDate: Date
    }
  ],
responseStatus: [{
  clubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
  status: {
    type: String,
    enum: ['Pending', 'Proposal Sent', 'Accepted', 'Rejected'],
    default: 'Pending'
  },
  message: { type: String, default: '' },
  proposalFile: { type: String, default: '' }
}]
}, { timestamps: true });

module.exports = mongoose.model('Quote', quoteSchema);
