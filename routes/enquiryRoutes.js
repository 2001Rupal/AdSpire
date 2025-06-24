const express = require('express');
const router = express.Router();
const Enquiry = require('../models/Enquiry');

router.get('/enquiry', (req, res) => {
  res.render('enquiry', { title: 'Talk to Adspire' });
});

router.post('/enquiry', async (req, res) => {
  const { name, email, contactNumber, description } = req.body;
  try {
    await Enquiry.create({ name, email, contactNumber, description });
    req.flash('success', 'Thanks for your enquiry! Our team will get back to you soon.');
    res.redirect('/enquiry');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Something went wrong. Please try again.');
    res.redirect('/enquiry');
  }
});

module.exports = router;
