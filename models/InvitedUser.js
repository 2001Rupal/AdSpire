const mongoose = require('mongoose');

const invitedUserSchema = new mongoose.Schema({
  brandId: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  contactNumber: { type: String },
  role: { type: String, enum: ['Admin', 'Viewer', 'Editor', 'Manager'], required: true },
  designation: { type: String },
  assignedCampaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', default: null },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['Pending', 'Accepted'], default: 'Pending' },
  acceptedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('InvitedUser', invitedUserSchema);
