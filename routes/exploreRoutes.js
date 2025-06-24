const express = require('express');
const router = express.Router();
const mongoose= require('mongoose');
const Club = require('../models/Club');
const Inventory = require('../models/ClubInventory');
const Campaign = require('../models/Campaign');
const SpecialEvent = require('../models/SpecialEvent'); // ⬅️ Add this
const SpecialEventInterest = require('../models/SpecialEventInterest');

// Route (e.g., routes/explore.js)
router.get('/explore', async (req, res) => {
  const campaignId = req.query.campaignId || req.session.selectedCampaignId || null;

  console.log("campign ID ",campaignId);

  let campaign = null;
  let totalSelectedCount=0;

  if (campaignId && mongoose.Types.ObjectId.isValid(campaignId)) {
    try {
      campaign = await Campaign.findById(campaignId).lean();

  if (campaign && campaign.selectedInventories?.length) {
  totalSelectedCount = campaign.selectedInventories.length;
}


    } catch (err) {
      console.error('Error fetching campaign:', err);
    }
  }
  const { segment, industry, availability, location, sortBy } = req.query;
    const filters = {};
  
    // Add filters
    if (segment) filters.segment = segment;
    if (industry) filters.industry = industry;
    if (availability) filters.availability = availability;
    if (location) filters.location = new RegExp(location, 'i');
    const sortOptions = {};

    if (sortBy === 'latest') {
      sortOptions.createdAt = -1;
    } else if (sortBy === 'popularity') {
      sortOptions.popularity = -1;
    }
  
    try {
      const clubsRaw = await Club.find(filters).sort(sortOptions).lean();

     // ✅ Count inventories for each club
    const clubs = await Promise.all(clubsRaw.map(async (club) => {
      const inventoryCount = await Inventory.countDocuments({ clubId: club._id });
      return {
        ...club,
        imageUrl: club.media?.[0] || null,
        inventoryCount,
      };
    }));        
      
      const featuredRaw  = await Club.find().sort({ popularity: -1 }).limit(5).lean();
const featuredClubs = featuredRaw.map(club => {
  const firstMedia = club.media?.[0] || null;
  const isVideo = firstMedia?.endsWith('.mp4') || firstMedia?.includes('video');

  return {
    ...club,
    imageUrl: !isVideo ? firstMedia : null,
    videoUrl: isVideo ? firstMedia : null
  };
});

        console.log(featuredClubs);
const industries = await Club.distinct('industry', { industry: { $ne: null } });
const availabilities = await Club.distinct('availability', { availability: { $ne: null } });

        res.render('brand/explore', { title: 'Explore | AdSpire',
          user: req.session.user,
          clubs,
          filters: { segment, industry, availability, location },
          featuredClubs: featuredClubs || [],
          campaign,
          totalSelectedCount,
          industries,
          availabilities,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
  });
  
  router.get('/explore/:id', async (req, res) => {
  const campaignId = req.query.campaignId || req.session.selectedCampaignId || null;

  
  let campaign=null;
  let totalSelectedCount=0;

  // const campaign = await Campaign.findById(campaignId).lean();
  if (campaignId && mongoose.Types.ObjectId.isValid(campaignId)) {
    try {
      campaign = await Campaign.findById(campaignId).lean();
    if (campaign && campaign.selectedInventories?.length) {
  totalSelectedCount = campaign.selectedInventories.length;
}
    } catch (err) {
      console.error('Error fetching campaign:', err);
    }
  }

    try {
      const club = await Club.findById(req.params.id).lean();
      if (!club) {
        req.flash('error', 'Club not found');
        return res.redirect('/explore');
      }
      const inventories = await Inventory.find({ clubId: club._id }).lean();
      const specialEvents = await SpecialEvent.find({ clubId: club._id }).sort({ date: -1 }).lean();

      res.render('club/clubDetails', {
        title: 'Club Details',
        club,
        inventories,
        campaignId,
        campaign,
        totalSelectedCount,
        specialEvents ,
      });
    } catch (err) {
      console.error(err);
      req.flash('error', 'Something went wrong.');
      res.redirect('/explore');
    }
  
  });
  // GET special event detail page
router.get('/special-events/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await SpecialEvent.findById(eventId);

    if (!event) {
      return res.status(404).send('Special Event not found');
    }

    res.render('specialEventDetail', {title:"Club's Special Event", event });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});


router.post('/brand/special-events/:id/interested', async (req, res) => {
  try {
    const eventId = req.params.id;
    const brandId = req.session.userId; // Make sure session middleware is working
    const { message } = req.body;

    if (!brandId) return res.status(401).send('Unauthorized: User not logged in');

    const interest =await SpecialEventInterest.create({
      eventId,
      brandId,
      message: message?.trim() || '',
    });

    console.log("data asved",interest);


    // Redirect to event page with success flag
    res.redirect(`/special-events/${eventId}?interested=success`);
  } catch (error) {
    console.error('Error submitting interest:', error);
    res.status(500).send('Server Error');
  }
});


  module.exports = router;