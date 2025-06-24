const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const { ensureAuthenticated } = require('../middleware/auth');



// Dashboard page
router.get('/dashboard', ensureAuthenticated, (req, res) => {
  res.render('dashboard', { title: 'Dashboard',user: req.session.user });
});

router.get('/create', ensureAuthenticated, (req, res) => {
  res.render('create', { title: 'Create Campaign', user: req.session.user });
});
router.post('/create', ensureAuthenticated, async (req, res) => {
  try {
    const {
      brandName,
      gender,
      startDate,
      endDate,
      ageRange,
      incomeGroup,
      productName,
      productDetails,
      targetAudience,
      targetLocation,
      goal,
      engagementType
    } = req.body;

    const newCampaign = new Campaign({
      brandName,
      gender,
      startDate,
      endDate,
      ageRange,
      incomeGroup,
      productName,
      productDetails,
      targetAudience,
      targetLocation,
      goal,
      engagementType,
      createdBy: req.session.user._id
    });

    await newCampaign.save();

    res.redirect('/dashboard'); // or a success page
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});


module.exports = router;
