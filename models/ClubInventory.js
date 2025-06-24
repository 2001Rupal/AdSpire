const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  clubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
  name: String,
  spot: String,
  media: [String],
  view360Link: String,
  availability: String,
  reach: String,
  description: String,
  dimensions: String,
  exclusions: String, // Exclusion details (e.g., industries not allowed)
  guidelines: String,
  totalReach: String, // From Brand Flow
  executionDetails: String, 
  mapLink: String,
  subInventories: [
    {
      name: String,
      
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Inventory', inventorySchema);
