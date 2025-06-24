const express = require('express');
const router = express.Router();
const Inventory = require('../models/ClubInventory');
const Club = require('../models/Club');
const Booking = require('../models/Booking');
const Campaign = require('../models/Campaign');
const mongoose= require('mongoose');
const Cart=require('../models/Cart');
const Quote = require('../models/Quote');
const { sendQuoteToBrand, sendQuoteToClub } = require('../utils/mailer');
const User=require('../models/User');
const ensureCampaignSelected = require('../middleware/checkCampaign');



// Middleware to protect brand routes
function isBrandLoggedIn(req, res, next) {
    if (req.session.user?.role === 'brand') return next();
    res.redirect('/login');
  }

router.get('/explore', isBrandLoggedIn, ensureCampaignSelected,async (req, res) => {
  try{
    const inventories = await Inventory.find().populate('clubId');
    res.render('brand/explore', { title: 'Explore Club Inventories - AdSpire', inventories,campaignId: req.session.selectedCampaignId || null});
  }catch(err)
  {
    console.error(err);
    res.status(500).render('error',{
      title:'Error',
      status: 500,
      message:'Failed to load inventories. Please try again later.'
    });
  }
  });


 router.get('/inventory/:id', isBrandLoggedIn, async (req, res) => {
  try {
    const inventoryId = req.params.id;
    const campaignId = req.query.campaignId || req.session.selectedCampaignId;
    if (campaignId) req.session.selectedCampaignId = campaignId;

    if (!mongoose.Types.ObjectId.isValid(inventoryId)) {
      return res.status(400).render('error', {
        title: 'Invalid Request',
        status: 400,
        message: 'Invalid inventory or campaign ID.'
      });
    }
    if (campaignId && !mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).render('error', {
        title: 'Invalid Request',
        status: 400,
        message: 'Invalid inventory or campaign ID.'
      });
    }

    const inventory = await Inventory.findById(inventoryId).populate('clubId');
    const campaign = campaignId ? await Campaign.findById(campaignId).lean() : null;

    if (!inventory) {
      return res.status(404).render('error', {
        title: 'Not Found',
        status: 404,
        message: 'Inventory not found.'
      });
    }

    const club = inventory.clubId;
    let selectedSubInventories = [];

    if (campaign && campaign.selectedInventories) {
      const match = campaign.selectedInventories.find(sel =>
        sel.inventoryId.toString() === inventoryId.toString()
      );

      if (match) {
        selectedSubInventories = match.selectedSubInventories;
      }
    }

    res.render('brand/inventoryDetails', {
      title: 'Inventory Details',
      inventory,
      campaignId,
      club,
      selectedSubInventories,
      campaign
    });
  } catch (err) {
    console.log(err);
    res.status(500).render('error', {
      title: 'Error',
      status: 500,
      message: 'Failed to load inventory details.'
    });
  }
});



router.post('/add-to-cart', async (req, res) => {
  const { campaignId,inventoryId, selectedSubInventories ,startDate,endDate } = req.body;


  if (!campaignId || !inventoryId || !Array.isArray(selectedSubInventories)) {
    // return res.status(400).json({ error: 'Invalid request payload' });
        return res.status(400).render('error', { title: 'Error', status: 400,message: 'Invalid request payload' });

  }


  if (!mongoose.Types.ObjectId.isValid(inventoryId)) {
      return res.status(400).render('error', { title: 'Invalid Request',status: 400, message: 'Invalid inventory or campaign ID.' });
  }
  if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).render('error', { title: 'Invalid Request',status: 400, message: 'Invalid inventory or campaign ID.' });
  }

  
  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).render('error',{ title:'Not Found',status: 404,message: 'Campaign not found' });
    }

        // Check if this inventory already exists in campaign
    const existingEntry = campaign.selectedInventories.find(entry =>
      entry.inventoryId.toString() === inventoryId
    );

    if (existingEntry) {
      // Merge new sub-inventories without duplicates
      const newSubs = selectedSubInventories.filter(
        sub => !existingEntry.selectedSubInventories.includes(sub)
      );
      existingEntry.selectedSubInventories.push(...newSubs);
      // Update start/endDate if provided
  if (startDate) existingEntry.startDate = startDate;
  if (endDate) existingEntry.endDate = endDate;
        console.log("Inventory Exits");



    } else {
      // Add new inventory entry
      campaign.selectedInventories.push({
        inventoryId,
        selectedSubInventories,
        startDate,
        endDate,
        
      });
      console.log("Inventory Added");
console.log("Campaign selectedInventories:", campaign.selectedInventories);


    }
    await campaign.save();

    res.json({ success: true, message: 'Inventories added to campaign cart',
      totalSelectedCount: campaign.selectedInventories.reduce(
    (acc, item) => acc + item.selectedSubInventories.length,
    0
  ),
    });
  } catch (err) {
    console.error(err);
  return res.status(500).json({ error: 'Internal server error while adding inventory to cart.' });
  }
});

router.get('/add-to-cart', isBrandLoggedIn, async (req, res) => {
  try {
    const userId = req.session.userId;
    const campaignId = req.query.campaignId || req.session.selectedCampaignId;

    if (!userId || !campaignId) return res.status(400).render('error',{title:'Not Found',message:'Missing campaign/user'});

    const campaign = await Campaign.findById(campaignId).populate({
      path: 'selectedInventories.inventoryId',
      populate: {
        path: 'clubId'
      }
    });

    if (!campaign) return res.status(400).render('error',{title:'Not Found',status: 400,message:'Campaign Not Found'});

    const cartItems = campaign.selectedInventories;

    // Grouping by club
    const grouped = {};
    cartItems.forEach(item => {

      const inventory = item.inventoryId;
  if (!inventory || !inventory.clubId) return;


      const club = item.inventoryId.clubId;
      const clubId = club._id.toString();

      if (!grouped[clubId]) {
        grouped[clubId] = {
          clubName: club.name || 'Unknown Club',
          clubAddress: club.address||'',
          items: []
        };
      }

      grouped[clubId].items.push({
        inventoryId: inventory._id,
        name: inventory.name,
    description: inventory.description,
    selectedSubInventories: item.selectedSubInventories,
    startDate: item.startDate || '',
    endDate: item.endDate || '',

      });
    });

    const cartItemsGroupedByClub = Object.values(grouped);
    console.log("grouped item", grouped);
    console.log("checking group items",grouped.items);

    res.render('cart', {
      title: "Cart View",
      cartItemsGroupedByClub,
      campaignId,
      
    });

  } catch (error) {
    console.error('Error loading cart:', error);
    res.status(500).render('error',{title:'Not Found',status: 500,message:'Error Loading Cart'});
  }
});


router.post('/cart/remove', async (req, res) => {
  try {
    const { campaignId, inventoryId } = req.body;
    if (!campaignId || !inventoryId) return res.status(400).render('error',{title:'Not Found',status: 400,message:'Mising Data'});

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return res.status(404).render('error',{title:'Not Found',status: 404,message:'Campaign Not Found'});

    campaign.selectedInventories = campaign.selectedInventories.filter(
      item => item.inventoryId.toString() !== inventoryId
    );

    await campaign.save();
    res.redirect('back');
  } catch (error) {
    console.error('Remove failed:', error);
    res.status(500).render('error', { title: 'Error', status: 500,message: 'Remove Failed .' });
  }
});



router.post('/get-quote', async (req, res) => {
  try {
    const userId = req.session.userId;
    const campaignId = req.session.selectedCampaignId;

    if (!userId || !campaignId) {
      return res.redirect('/login');
    }

    const items = req.body.items;

    if (!items || !Array.isArray(items)) {
      return res.status(400).render('error', { title: 'Error', status: 400,message: 'Invalid Form Submission.' });
    }
    console.log(items);

 const quoteItems = items
  .filter(item => {
    const invId = Array.isArray(item.inventoryId) ? item.inventoryId[0] : item.inventoryId;
    return invId && typeof invId === 'string' && invId.trim() !== '';
  })
  .map(item => {
    const invId = Array.isArray(item.inventoryId) ? item.inventoryId[0] : item.inventoryId;

    return {
      inventoryId: invId,
      name: Array.isArray(item.name) ? item.name[0] : item.name,
      selectedSubInventories: Array.isArray(item.selectedSubInventories)
        ? item.selectedSubInventories[0].split(',')
        : [],
      startDate: Array.isArray(item.startDate) ? item.startDate[0] : item.startDate,
      endDate: Array.isArray(item.endDate) ? item.endDate[0] : item.endDate
    };
  });
if (!quoteItems.length) {
  return res.status(400).render('error', { title: 'Error', status: 400,message: 'No valid inventory items provided.' });
}


    const newQuote = new Quote({
      userId,
      campaignId,
      items: quoteItems
    });

    await newQuote.save();

    console.log("Quote Items",quoteItems);

    const campaign = await Campaign.findById(campaignId);
    if (campaign) {
      quoteItems.forEach(quoteItem => {
        const matchingInventory = campaign.selectedInventories.find(
          inv => inv.inventoryId.toString() === quoteItem.inventoryId.toString()
        );
        if (matchingInventory) {
          matchingInventory.startDate = quoteItem.startDate;
          matchingInventory.endDate = quoteItem.endDate;
        }
      });
      await campaign.save();
      console.log("Campaign dates updated successfully.");
    }

     // Step 3: Get Brand Email
    const brandUser = await User.findById(userId);
    const brandEmail = brandUser?.email || '';
    const brandName = brandUser?.name || 'Brand';


    // Step 4: Get Club Owners' Emails
    const inventoryIds = quoteItems.map(item => item.inventoryId);
    const inventories = await Inventory.find({ _id: { $in: inventoryIds } }).populate('clubId');
    const clubEmails = inventories
      .map(inv => inv.clubId?.email)
      .filter(email => !!email);

    const { sendQuoteToBrand, sendQuoteToClub } = require('../utils/mailer');

// Step 5: Send HTML Quote Emails
const campaignName = campaign?.name || 'Unnamed Campaign';

// Send detailed quote email to brand
if (brandEmail) {
  await sendQuoteToBrand(brandEmail, brandName, campaignName, quoteItems);
}

// Group items by club for sending club-specific emails
const clubMap = new Map();

for (const item of quoteItems) {
  const inv = inventories.find(i => i._id.toString() === item.inventoryId);
  if (inv && inv.clubId && inv.clubId.email) {
    const clubId = inv.clubId._id.toString();

    if (!clubMap.has(clubId)) {
      clubMap.set(clubId, {
        email: inv.clubId.email,
        name: inv.clubId.name,
        items: []
      });
    }

    clubMap.get(clubId).items.push(item);
  }
}

// Send one email per club with grouped inventory items
for (const [_, club] of clubMap.entries()) {
  await sendQuoteToClub(club.email, club.name, brandName, campaignName, club.items);
}
  req.session.selectedCampaignId = null;

    res.redirect('/thankyou');
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: 'Error', status: 500,message: 'Something went wrong.' });
  }
});
router.get('/thankyou', isBrandLoggedIn, (req, res) => {
  res.render('thankyou', { title: 'Thank You - AdSpire' });
});


router.get('/profile', async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);

    res.render('brand/profile', { title:"Profile | AdSpire",
      user,
      successMsg: req.flash('success'),
      errorMsg: req.flash('error'),
     });
  } catch (err) {
    console.error(err);
    res.redirect('/dashboard');
  }
});
router.get('/profile/edit', async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);
    res.render('brand/editProfile', {title:"Edit Profile | AdSpire", user,
      successMsg: req.flash('success'),
    errorMsg: req.flash('error')
    });
  } catch (err) {
    console.error(err);
    res.redirect('/profile');
  }
});

router.post('/profile/edit', async (req, res) => {
  try {
    const userId = req.session.userId;
    const updatedData = {
      brandName: req.body.brandName,
      userName: req.body.userName,
      designation: req.body.designation,
      industry: req.body.industry,
      city: req.body.city,
      state: req.body.state,
      website: req.body.website,
      email: req.body.email,
      contactNumber: req.body.contactNumber,
      address: req.body.address,
      pincode: req.body.pincode
    };

    await User.findByIdAndUpdate(userId, updatedData);

    req.flash('success', 'Profile updated successfully!');
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to update profile. Please try again.');

    res.redirect('/profile/edit');
  }
});

module.exports = router;
