
const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');

function isLoggedIn(req, res, next) {
    console.log(req.user);
    if (req.session.userId || req.session.isAuthenticated) return next();
    res.redirect('/login');
  }

router.get('/create', isLoggedIn, (req, res) => {
    res.render('create',{
      title: 'Create Campaign | AdSpire',
       user: req.session.user,
      
  }); 
  });


router.post('/create',isLoggedIn, async (req, res) => {
  try {
    const {
      name,
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
      name,
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
      brandId: req.session.user._id

    });

    await newCampaign.save();
      req.session.selectedCampaignId = newCampaign._id;

      req.flash('success', 'Campaign created successfully!');
    res.redirect(`/campaigns/create`);

  } catch (err) {
    console.error(err);
    console.error('Create Campaign Error:', err);
    req.flash('error', 'Something went wrong while creating the campaign.');
    res.redirect('/campaigns/create');
  }
});

router.get('/selectc', isLoggedIn, (req, res) => {
    res.redirect('/campaigns/select');
  });
router.get('/select', isLoggedIn, async (req, res) => {
  try {
    const campaigns = await Campaign.find({ brandId: req.session.user._id }).lean();
    res.render('selectCampaigns', {
      title: 'Select Campaign | AdSpire',
      user: req.session.user,
      campaigns,
      
    });
  } catch (err) {
    console.error('Fetch Campaigns Error:', err);
    req.flash('error', 'Unable to fetch campaigns at the moment.');
    res.redirect('/dashboard');
  }
});


router.get('/:id/details', isLoggedIn, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, brandId: req.session.user._id }).lean();



if (!campaign) {
      req.flash('error', 'Campaign not found.');
      return res.redirect('/campaigns/select');
    }

    res.render('campaignDetails', {
      title: 'Campaign Details | AdSpire',
      user: req.session.user,
      campaign,
      campaignId: req.params.id,
      

    
    });
  } catch (err) {
    console.error('Campaign Details Error:', err);
    req.flash('error', 'Unable to load campaign details.');
    res.redirect('/campaigns/select');
  }
});


router.get('/:id/edit', isLoggedIn, async (req, res) => {
  try {

   
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      brandId: req.session.user._id
    }).lean();

if (!campaign) {
      req.flash('error', 'Campaign not found.');
      return res.redirect('/campaigns/select');
    }

    res.render('editCampaign', {
      title: 'Edit Campaign | AdSpire',
      user: req.session.user,
      campaign,
      
    });
  } catch (err) {
    console.error('Edit Campaign Page Error:', err);
    req.flash('error', 'Error loading campaign for editing.');
    res.redirect('/campaigns/select');
  }
});


router.get('/:id/use', isLoggedIn, async (req, res) => {
  try{
    const campaign = await Campaign.findOne({ _id: req.params.id, brandId: req.session.user._id });
    if (!campaign) {
        req.flash('error', 'Campaign not found.');
        return res.redirect('/campaigns/select');
      }

    req.session.selectedCampaignId = campaign._id; 

  res.redirect('/explore'); 

  }catch(err)
  {
     console.error('Use Campaign Error:', err);
    req.flash('error', 'Failed to select campaign.');
    res.redirect('/campaigns/select');
  }
});


router.post('/:id/edit', isLoggedIn, async (req, res) => {
  try {
    const {
      name,
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

    const updated=await Campaign.findOneAndUpdate(
      { _id: req.params.id, brandId: req.session.user._id },
      {
        name,
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
      },
      { new: true }
    );

    if (!updated) {
      req.flash('error', 'Failed to update campaign.');
      return res.redirect(`/campaigns/${req.params.id}/edit`);
    }

    req.flash('success', 'Campaign updated successfully');

    res.redirect(`/campaigns/${req.params.id}/details`);

  } catch (err) {
    console.error('Update Campaign Error:', err);
    req.flash('error', 'Error updating campaign.');
    res.redirect(`/campaigns/${req.params.id}/edit`);
  }
});
router.post('/:id/delete', isLoggedIn, async (req, res) => {
  try {
    const deleted = await Campaign.findOneAndDelete({
      _id: req.params.id,
      brandId: req.session.user._id
    });

    if (!deleted) {
      req.flash('error', 'Campaign not found or you are not authorized to delete it.');
      return res.redirect('/campaigns/select');
    }

    req.flash('success', 'Campaign deleted successfully.');
    res.redirect('/campaigns/select');
  } catch (err) {
    console.error('Delete Campaign Error:', err);
    req.flash('error', 'Failed to delete campaign.');
    res.redirect('/campaigns/select');
  }
});


module.exports = router;
