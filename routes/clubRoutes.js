const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const fsPromises = require('fs').promises;
const nodemailer = require('nodemailer');

const Club = require('../models/Club');
const Inventory = require('../models/ClubInventory');
const Quote = require('../models/Quote');
const Booking = require('../models/Booking');
const SpecialEvent = require('../models/SpecialEvent');
const SpecialEventInterest = require('../models/SpecialEventInterest');

const { isClubOwnerLoggedIn } = require('../middleware/auth');

function isClubOwner(req, res, next) {
  if (req.session.user?.role === 'clubOwner') return next();
  res.redirect('/login');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/clubs'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.fieldname + path.extname(file.originalname))
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|webp|pdf/;
  const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mime = allowedTypes.test(file.mimetype);
  cb(null, ext && mime);
};

const upload = multer({ storage, fileFilter });

router.get('/club/create-profile', (req, res) => {
  res.render('club/createProfile', { 
    title: 'Create Club Profile | AdSpire',

  
  });
});

router.post('/club/create-profile', upload.array('media', 10), async (req, res) => {
  try {
    const {
      name, email, contactNumber, membershipFeeRange, location, 
      description, view360Link, sponsors, totalMembers, ageRange,
      reach, availability, segment, industry, segmentTags
    } = req.body;
    let website = req.body.website?.trim() || '';

// Remove repeated occurrences
website = website.replace(/(https?:\/\/)+/g, 'https://');

// Remove trailing slashes or repetitions
website = website.replace(/(https?:\/\/[^\s\/]+)(.*)/, '$1');

// Ensure it starts with https://
if (!/^https?:\/\//i.test(website)) {
  website = 'https://' + website;
}

    const mediaFiles = req.files.map(file => '/uploads/clubs/' + file.filename);

    const club = new Club({
      name, email, contactNumber, membershipFeeRange, location, website,
      description, view360Link,
      sponsors: sponsors ? sponsors.split(',') : [],
      totalMembers, ageRange, reach, availability, segment, industry,
      media: mediaFiles,
      segmentTags: segmentTags ? segmentTags.split(',') : []
    });

    await club.save();
    req.flash('success', 'Profile Created successfully.');

    res.render("thank-you",{title:"Thank you | AdSpire"})
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to create Profile. Please try again.');

    res.redirect('/club/create-profile');
  }
});

router.get('/club/dashboard', isClubOwner, async (req, res) => {
  try {
    const club = await Club.findOne({ email: req.session.user.email });
    if (!club) return res.redirect('/club/create-profile');
    res.render('club/dashboard', { title: 'Club Dashboard - AdSpire', club });
  } catch (err) {
    console.error(err);
    res.redirect('/login');
  }
});

// clubroutes.js
router.get('/club/profile', isClubOwner, async (req, res) => {
  try {
    const club = await Club.findOne({ email: req.session.user.email });
    if (!club) return res.redirect('/club/create-profile');
    res.render('club/profile', { 
      title: 'Club Profile - AdSpire',
       club,
      
      });
  } catch (err) {
    console.error(err);
    res.redirect('/club/dashboard');
  }
});


// Show edit form
router.get('/club/edit-profile', isClubOwner, async (req, res) => {
  try {
    const club = await Club.findOne({ email: req.session.user.email });
    if (!club) return res.redirect('/club/create-profile');
    res.render('club/editProfile', { title: 'Edit Club Profile', club ,
       });
  } catch (err) {
    console.error(err);
    res.redirect('/club/dashboard');
  }
});

// Handle edit form submission
router.post('/club/edit-profile', isClubOwner, upload.array('media', 10), async (req, res) => {
  try {
    const club = await Club.findOne({ email: req.session.user.email });
    if (!club) return res.redirect('/club/create-profile');

    // Update fields
    const {
      name, email, contactNumber, membershipFeeRange, location, 
      description, view360Link, sponsors, totalMembers, ageRange,
      reach, availability, segment, industry, segmentTags, website
    } = req.body;

    club.name = name;
    club.email = email;
    club.contactNumber = contactNumber;
    club.membershipFeeRange = membershipFeeRange;
    club.location = location;
    club.description = description;
    club.view360Link = view360Link;
    club.sponsors = sponsors ? sponsors.split(',') : [];
    club.totalMembers = totalMembers;
    club.ageRange = ageRange;
    club.reach = reach;
    club.availability = availability;
    club.segment = segment;
    club.industry = industry;
    club.segmentTags = segmentTags ? segmentTags.split(',') : [];
    
    // Website sanitization (optional, same as create)
    let fixedWebsite = website?.trim() || '';
    fixedWebsite = fixedWebsite.replace(/(https?:\/\/)+/g, 'https://');
    fixedWebsite = fixedWebsite.replace(/(https?:\/\/[^\s\/]+)(.*)/, '$1');
    if (!/^https?:\/\//i.test(fixedWebsite)) {
      fixedWebsite = 'https://' + fixedWebsite;
    }
    club.website = fixedWebsite;

    // Handle media deletions
    const deleteMedia = req.body.deleteMedia; // could be undefined, string, or array
    if (deleteMedia) {
      // Normalize to array
      const mediaToDelete = Array.isArray(deleteMedia) ? deleteMedia : [deleteMedia];

      // Filter out deleted media from club.media
      club.media = club.media.filter(file => !mediaToDelete.includes(file));

      // Delete media files from disk
      for (const filePath of mediaToDelete) {
        const absolutePath = path.join(__dirname, '..', 'public', filePath);
        try {
          await fsPromises.unlink(absolutePath);
        } catch (err) {
          console.error('Failed to delete file:', absolutePath, err);
          // Not throwing error here to continue deleting others
        }
      }
    }
    // Handle new media uploads (append to existing)
    const newMedia = req.files.map(file => '/uploads/clubs/' + file.filename);
    club.media = club.media.concat(newMedia);

    await club.save();
    req.flash('success', 'Profile Updated successfully.');

    res.redirect('/club/profile');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to update Profile. Please try again.');

    res.redirect('/club/edit-profile');
  }
});


// ---------------- Inventory ---------------- //

router.get('/club/inventory/add', isClubOwner, (req, res) => {
  res.render('club/addInventory', { title: 'Add Inventory - AdSpire' });
});

router.post('/club/inventory/add', isClubOwner, upload.array('media', 10), async (req, res) => {
  try {
    const {
      name, spot, view360Link, availability, reach,
      description, dimensions, exclusionDetails, guidelines, subInventories
    } = req.body;

    const mediaFiles = req.files.map(file => `/uploads/clubs/${file.filename}`);
    const club = await Club.findOne({ email: req.session.user.email });
    if (!club) return res.redirect('/club/create-profile');

    let parsedSubs = [];

    if (subInventories && typeof subInventories === 'object') {
      parsedSubs = Object.values(subInventories).map((item, index) => ({
        name: item?.name?.trim() || `Spot ${index + 1}`
      }));
    }



    const inventory = new Inventory({
      clubId: club._id, name, spot, view360Link, availability,
      reach, description, dimensions, exclusionDetails, guidelines,
      media: mediaFiles, subInventories: parsedSubs
    });

    await inventory.save();
        req.flash('success', 'Inventory Added successfully.');

    res.redirect('/club/view-inventory');
  } catch (err) {
    console.error(err);
        req.flash('success', 'Problem in Adding Inventory.Please try again later.');

    res.redirect('/club/inventory/add');
  }
});

router.get('/club/view-inventory', isClubOwner, async (req, res) => {
  const inventories = await Inventory.find({ clubId: req.session.user._id });
  res.render('club/inventoryList', { 
    title: 'View Inventory | AdSpire',
    inventories,
    
     });
});

router.get('/club/edit-inventory/:id', isClubOwner, async (req, res) => {
  const inventory = await Inventory.findById(req.params.id);
  if (!inventory || inventory.clubId.toString() !== req.session.user._id) {
    return res.redirect('/club/view-inventory');
  }
  res.render('club/editInventory', { title: 'Edit Inventory | AdSpire', inventory,
    
  });
});

router.post('/club/edit-inventory/:id', isClubOwner, upload.array('media', 10), async (req, res) => {
  try {
  const inventory = await Inventory.findById(req.params.id);
  if (!inventory || inventory.clubId.toString() !== req.session.user._id) {
    return res.redirect('/club/view-inventory');
  }

  const deleteMediaArray = Array.isArray(req.body.deleteMedia)
    ? req.body.deleteMedia.map(str => str.trim())
    : req.body.deleteMedia ? [req.body.deleteMedia.trim()] : [];

  const updatedMedia = [];

  for (const file of inventory.media) {
    if (deleteMediaArray.includes(file)) {
      const fullPath = path.join(__dirname, '..', 'public', file);
      try {
        await fsPromises.unlink(fullPath);
      } catch (err) {
        console.warn(`⚠️ Could not delete file: ${file}`, err.message);
      }
    } else {
      updatedMedia.push(file);
    }
  }

  const newMediaFiles = req.files.map(file => `/uploads/clubs/${file.filename}`);
  inventory.media = [...updatedMedia, ...newMediaFiles];

  Object.assign(inventory, req.body);
  await inventory.save();


  req.flash('success', 'Inventory Updated successfully.');
res.redirect('/club/view-inventory');

}catch (err) {
    console.error('Error updating inventory:', err);
    req.flash('error', 'Failed to update inventory. Please try again.');
    res.redirect('/club/view-inventory');
  }
});

router.post('/club/delete-inventory/:id', isClubOwner, async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id);
    if (!inventory || inventory.clubId.toString() !== req.session.user._id) {
      return res.redirect('/club/view-inventory');
    }

    // Delete associated media files
    for (const file of inventory.media) {
      const fullPath = path.join(__dirname, '..', 'public', file);
      try {
        await fsPromises.unlink(fullPath);
      } catch (err) {
        console.warn(`⚠️ Could not delete file: ${file}`, err.message);
      }
    }

    // Delete the inventory from DB
    await Inventory.findByIdAndDelete(req.params.id);
        req.flash('success', 'Inventory Deleted successfully.');

    res.redirect('/club/view-inventory');
  } catch (err) {
    console.error('Error deleting inventory:', err);
    req.flash('error', 'Problem on Inventory Deletion. Please try again later.');

    res.redirect('/club/view-inventory');
  }
});

const uploadProposal = multer({ storage, fileFilter });


// ---------------- Quote Requests ---------------- //

router.get('/club/quotes', isClubOwner, async (req, res) => {
  try {
    const club = await Club.findOne({ email: req.session.user.email });
    if (!club) return res.redirect('/club/create-profile');

    const inventories = await Inventory.find({ clubId: club._id }).select('_id');
    const inventoryIds = inventories.map(inv => inv._id.toString());

    const quotes = await Quote.find({ 'items.inventoryId': { $in: inventoryIds } })
      .populate('userId campaignId')
      .lean();

    const relevantQuotes = quotes
  .map(quote => {
    const matchedItems = quote.items.filter(item =>
      inventoryIds.includes(item.inventoryId.toString())
    );

    // Get club's responseStatus if exists
    const clubResponse = quote.responseStatus.find(r => r.clubId.toString() === club._id.toString());

    if (!clubResponse) return null; // skip if club has no responseStatus left

    return {
      ...quote,
      matchedItems,
      clubId: club._id
    };
  })
  .filter(Boolean);

    res.render('club/viewQuotes', {
      title: 'Incoming Quote Requests',
      quotes: relevantQuotes,
      userId: club._id,
       
    });

  } catch (error) {
    console.error('Error loading quotes:', error);
    res.status(500).send('Error loading quote requests');
  }
});

router.post('/quotes/upload-proposal', isClubOwner, uploadProposal.single('proposalPdf'), async (req, res) => {
  

  try {
    const { quoteId, clubId } = req.body;

  if (!req.file || !quoteId || !clubId) {
    return res.status(400).send('Missing file or required fields');
  }
    const quote = await Quote.findById(quoteId).populate('userId');
    if (!quote) return res.status(404).send('Quote not found');

    const filePath = `/uploads/clubs/${req.file.filename}`;
    const response = quote.responseStatus.find(r => r.clubId.toString() === clubId);

    if (response) {
      response.proposalFile = filePath;
      response.status = 'Proposal Sent';
    } else {
      quote.responseStatus.push({ clubId, status: 'Proposal Sent', proposalFile: filePath });
    }

    await quote.save();

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"AdSpire" <${process.env.EMAIL_USER}>`,
      to: quote.userId.email,
      subject: 'Proposal Uploaded for Your Campaign',
      text: `Hello ${quote.userId.name},\n\nA club has uploaded a proposal for your campaign.`,
      attachments: [{ filename: req.file.originalname, path: path.join(__dirname, '../public', filePath) }]
    });

    req.flash('success', 'Proposal Uploaded successfully.');

    res.redirect('/club/quotes');
  } catch (err) {
    console.error('Proposal upload error:', err);
    req.flash('error', 'Error uploading or emailing proposal');
    res.status(500).send('Error uploading or emailing proposal');
  }
});

router.post('/quotes/respond', isClubOwner, async (req, res) => {
  const { quoteId, clubId, status, message } = req.body;

  if (!quoteId || !clubId || !status) {
    return res.status(400).send("Missing required fields");
  }

  try {
    const quote = await Quote.findById(quoteId);
    if (!quote) return res.status(404).send("Quote not found");

    const existing = quote.responseStatus.find(rs => rs.clubId.toString() === clubId);
    if (existing) {
      existing.status = status;
      existing.message = message || '';
    } else {
      quote.responseStatus.push({ clubId, status, message });
    }

    await quote.save();
    req.flash('success', 'Proposal Responded successfully.');

    res.redirect('/club/quotes');

  } catch (error) {
    console.error('Error responding to quote:', error);
    req.flash('error', 'Failed to update quote response');

    res.status(500).send("Failed to update quote response");
  }
});

router.post('/quotes/delete/:quoteId', isClubOwner, async (req, res) => {
  try {
    const { quoteId } = req.params;
    const clubId = req.session.user._id;

    const quote = await Quote.findById(quoteId);

    if (!quote) return res.status(404).send("Quote not found");

    // Optional: Filter out this club's response
    quote.responseStatus = quote.responseStatus.filter(
      r => r.clubId.toString() !== clubId.toString()
    );

    // Optional: If no responses left, delete whole quote
    if (quote.responseStatus.length === 0) {
      await Quote.findByIdAndDelete(quoteId);
    } else {
      await quote.save();
    }
    req.flash('success', 'Quote deleted successfully.');

    res.redirect('/club/quotes');
  } catch (err) {
    console.error('Error deleting quote:', err);
      req.flash('error', 'Failed to delete quote. Please try again.');
      res.redirect('/club/quotes');

  }
      

});


// ---------------- Special Events ---------------- //
router.get('/club/special-events/add', isClubOwner, (req, res) => {
  res.render('club/addSpecialEvent', { title: 'Add Special Event - AdSpire' });
});

router.post('/club/special-events/add', isClubOwner, upload.array('media', 10), async (req, res) => {
  try {
    const club = await Club.findOne({ email: req.session.user.email });
    if (!club) return res.redirect('/club/create-profile');

    const { title, description, date, time, location, tags } = req.body;
    const mediaFiles = req.files.map(file => `/uploads/clubs/${file.filename}`);

    const specialEvent = new SpecialEvent({
      clubId: club._id,
      title,
      description,
      date,
      time,
      location,
      media: mediaFiles,
      tags: tags ? tags.split(',') : []
    });

    await specialEvent.save();
     req.flash('success', 'Event Created successfully.');

    res.redirect('/club/special-events');
   
  } catch (err) {
    console.error('Error creating special event:', err);
    req.flash('error', 'failed to event. Please try again');
    res.redirect('/club/special-events/add');
  }
});



router.get('/club/special-events', isClubOwner, async (req, res) => {
  try {
    const club = await Club.findOne({ email: req.session.user.email });
    const events = await SpecialEvent.find({ clubId: club._id }).sort({ createdAt: -1 });

    res.render('club/specialEvents', {
      title: 'Special Events - AdSpire',
      events
    });
  } catch (err) {
    console.error('Error loading events:', err);
    res.status(500).send('Error loading special events');
  }
});


router.get('/club/special-events/edit/:id', isClubOwner, async (req, res) => {
  const event = await SpecialEvent.findById(req.params.id);
  if (!event || event.clubId.toString() !== req.session.user._id) {
    return res.redirect('/club/special-events');
  }
  res.render('club/editSpecialEvent', { title: 'Edit Event | AdSpire', event });
});

router.post('/club/special-events/edit/:id', isClubOwner, upload.array('media', 10), async (req, res) => {
  try{

  const event = await SpecialEvent.findById(req.params.id);
  if (!event || event.clubId.toString() !== req.session.user._id) {
    return res.redirect('/club/special-events');
  }

  const deleteMediaArray = Array.isArray(req.body.deleteMedia)
    ? req.body.deleteMedia.map(str => str.trim())
    : req.body.deleteMedia ? [req.body.deleteMedia.trim()] : [];

  const updatedMedia = [];

  for (const file of event.media) {
    if (deleteMediaArray.includes(file)) {
      const fullPath = path.join(__dirname, '..', 'public', file);
      try {
        await fsPromises.unlink(fullPath);
      } catch (err) {
        console.warn(`⚠️ Could not delete file: ${file}`, err.message);
      }
    } else {
      updatedMedia.push(file);
    }
  }

  const newMediaFiles = req.files.map(file => `/uploads/clubs/${file.filename}`);
  event.media = [...updatedMedia, ...newMediaFiles];

  Object.assign(event, req.body);
  event.tags = req.body.tags ? req.body.tags.split(',') : [];

  await event.save();
  req.flash('success', 'Event Updated successfully.');

  res.redirect('/club/special-events');
}
catch (err) {
    console.error('Error updating special event:', err);
    req.flash('error', 'Failed to update special event. Please try again.');
    res.redirect('/club/special-events');
  }
});
router.post('/club/special-events/delete/:id', isClubOwner, async (req, res) => {
  try {
    const event = await SpecialEvent.findById(req.params.id);
    if (!event || event.clubId.toString() !== req.session.user._id) {
      return res.redirect('/club/special-events');
    }

    for (const file of event.media) {
      const fullPath = path.join(__dirname, '..', 'public', file);
      try {
        await fsPromises.unlink(fullPath);
      } catch (err) {
        console.warn(`⚠️ Could not delete file: ${file}`, err.message);
      }
    }

    await SpecialEvent.findByIdAndDelete(req.params.id);
    req.flash('success', 'Event Deleted successfully.');
    res.redirect('/club/special-events');
  } catch (err) {
    console.error('Error deleting event:', err);
    req.flash('error', 'Failed to delete Event. Please try again.');
    res.redirect('/club/special-events');
  }
});
router.get('/club/special-events/:eventId/interests', isClubOwner, async (req, res) => {
  try {
    const eventId = req.params.eventId;

    // Find the event for the name
    const event = await SpecialEvent.findById(eventId);
    if (!event) return res.status(404).send('Event not found');

    // Find interest requests, populate user info
    const interestRequests = await SpecialEventInterest.find({ eventId: eventId })
      .populate('brandId', 'brandName email contactNumber') // Adjust field names based on your User model

    res.render('club/eventInterestRequests', {
      title:"Event Interest Request",
      eventName: event.title,
      interestRequests,
      eventId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

router.post('/club/special-events/:eventId/interests/:interestId/delete', isClubOwner, async (req, res) => {
  try {
    const { eventId, interestId } = req.params;

    await SpecialEventInterest.findByIdAndDelete(interestId);
    req.flash('success', ' Request Deleted successfully.');
    res.redirect(`/club/special-events/${eventId}/interests`);
  } catch (error) {
    console.error('Error deleting interest request:', error);
    req.flash('error', 'Failed to delete request. Please try again.');
    res.status(500).send('Server Error');
  }
});


router.post('/special-events/:eventId/interests/:requestId/mark-done', async (req, res) => {
  try {
    await InterestRequest.findByIdAndUpdate(req.params.requestId, {
      status: 'Done'
    });

    req.flash('success', 'Request Accepted successfully.');
    res.redirect(`/club/special-events/${req.params.eventId}/interests`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to accept request. Please try again');
    res.status(500).send("Error marking as done");
  }
});

module.exports = router;
