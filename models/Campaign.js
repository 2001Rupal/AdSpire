const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  brandId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Both'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  ageRange: { type: String, required: true },
  incomeGroup: { type: String, required: true },
  productName: { type: String, required: true },
  productDetails: { type: String },
  goal: { type: String, required: true },
  engagementType: { type: String, required: true },
  targetAudience: { type: String, required: true },
  targetLocation: { type: String, required: true },
  selectedInventories: [
    {
      inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
      selectedSubInventories: [String], // list of selected sub-inventory names,
      startDate: { type: Date},  // ← Add this
    endDate: { type: Date} ,
    }
  ],
  createdAt: { type: Date, default: Date.now }
});



module.exports = mongoose.model('Campaign', campaignSchema);
