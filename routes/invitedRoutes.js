const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();
const Campaign = require('../models/Campaign');
const InvitedUser = require('../models/InvitedUser');
const {sendInviteEmail} = require('../utils/mailer'); 


function isLoggedIn(req, res, next) {
    console.log(req.user);
    if (req.session.userId || req.session.isAuthenticated) return next();
    res.redirect('/login');
  }

router.get('/invite', isLoggedIn, async (req, res) => {
  const campaigns = await Campaign.find({ brandId: req.session.user._id });
  res.render('invitedUser', { title: 'Invite User', campaigns });
});
  router.post('/invite', isLoggedIn, async (req, res) => {
    const { name, email, contactNumber, role, designation, assignedCampaign } = req.body;
  
    try {
      const newInvite = new InvitedUser({
        brandId: req.session.user._id,
        name,
        email,
        contactNumber,
        role,
        designation,
        assignedCampaign: assignedCampaign || null,
        invitedBy: req.session.user._id
      });
  
      await newInvite.save();
      await sendInviteEmail(email, name, role, newInvite._id);
      req.flash('success', 'User invited successfully.');
      res.redirect('/invite');
    } catch (err) {
      console.error(err);
      req.flash('error', 'Failed to invite user.');
      res.redirect('/invite');
    }
  });
  
  router.get('/invite/accept/:id', async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      req.flash('error', 'Invalid invite link format.');
      return res.redirect('/');
    }
    try {
      const invite = await InvitedUser.findById(id);
  
      if (!invite) {
        req.flash('error', 'Invalid invite link.');
        return res.redirect('/');
      }
  
      if (invite.status === 'Accepted') {
        req.flash('info', 'Invite already accepted.');
        return res.redirect('/');
      }
  
      invite.status = 'Accepted';
      invite.acceptedAt = new Date();
      await invite.save();
  
      req.flash('success', 'Invite accepted successfully. You can now log in.');
      res.render('inviteAccepted',{ title: 'Invite Accepted | AdSpire' }); 
    } catch (err) {
      console.error(err);
      req.flash('error', 'Something went wrong.');
      res.redirect('/');
    }
  });


  module.exports=router;