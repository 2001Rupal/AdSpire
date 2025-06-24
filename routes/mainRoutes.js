const express = require('express');
const router = express.Router();
const User = require('../models/User');
const nodemailer = require('nodemailer');
const session = require('express-session');
const Club = require('../models/Club');
const Inventory = require('../models/ClubInventory');
const Booking = require('../models/Booking');

require('dotenv').config(); // ensure this is at the top


// Home Page
router.get('/', (req, res) => {
    res.render('home', { title: 'Home' });
});


// Registration page route
router.get('/register', (req, res) => {
    res.render('register',{ title: 'Register | AdSpire' });
});
// POST route for registration form submission
router.post('/register', async (req, res) => {
    const { 
        brandName, 
        contactNumber,
        userType,
        designation,
        industry,
        city,
        state,
        website, 
        userName, 
        email, 
        address,
        pincode
    } = req.body;
    // Create a new user or brand profile
    const newUser = new User({
        brandName, 
        contactNumber,
        userType,
        designation,
        industry,
        city,
        state,
        website, 
        userName, 
        email, 
        address,
        pincode
    });

    try {
        await newUser.save();

            req.flash('success', 'Profile creation request send successfully!');

        res.render('thank-you',{title:"Thank You | AdSpire"});  // Redirect to login page after successful registration
    } catch (err) {
        console.log(err);
        req.flash('error','Failed to create profile. Please try again.')
        res.redirect('/register');  // If an error occurs, redirect back to the registration page
    }
});

router.get('/login', (req, res) => {
    res.render('login',{ title: 'Login | AdSpire' }); // ya jahan login.ejs rakha hai
});


// OTP generate karne ka function
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000); // 6 digit OTP
}
// SMTP setup (example Gmail ke liye)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,    
        pass: process.env.EMAIL_PASS          
    }
});
// Request OTP
router.post('/request-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) {
    req.flash('error', 'Email is required.');
    return res.redirect('/login');
  }
    
    // Save email and OTP temporarily (session me)
    let userType = null;

try{
    let user = await User.findOne({ email });
    if (user) {
        userType = 'brand';
    } else {
        let clubUser = await Club.findOne({ email });
        if (clubUser) {
            userType = 'club';
        } else {
            // If neither found, you can auto-create a club user or show an error
            req.flash('error', 'No registered account found for this email.');
    return res.redirect('/login');
        }
    }
    const otp = generateOTP();
    const otpData = { otp, otpExpiresAt: Date.now() + 5 * 60 * 1000 };

    console.log(otp);

    if (userType === 'brand') {
        await User.updateOne({ email }, { $set: otpData });
    } else if (userType === 'club') {
            await Club.updateOne({ email }, { $set: otpData });
    }
    
    req.session.otp = otp;
    req.session.email = email;
    req.session.otpExpires = otpData.otpExpiresAt;
    req.session.userType = userType;

    // Send Email
    const mailOptions = {
        from: 'adspirehometeam@gmail.com',
        to: email,
        subject: 'wellcome from AdSpire, Your OTP for Login',
        text: `Your OTP for login is: ${otp}`
    };

    
        await transporter.sendMail(mailOptions);
        console.log('OTP sent to:', email);

        req.flash('success', 'OTP sent successfully!');
        res.redirect('/verify-otp'); 


}catch (err) {
    console.error('OTP Request Error:', err);
    req.flash('error', 'Something went wrong. Please try again.');
    res.redirect('/login');
  } 

});

router.get('/verify-otp', (req, res) => {
  res.render('verify-otp', {
    title: 'Verify OTP | AdSpire'
  });
});


router.post('/verify-otp',async (req, res) => {
    const { otp } = req.body;
    
    const userType = req.session.userType;
    const email = req.session.email;

if (!otp || !email || !userType) {
    req.flash('error', 'Session expired or incomplete input.');
    return res.redirect('/verify-otp');
  }
    console.log('Entered OTP:', otp);
    console.log('Session OTP:', req.session.otp);


    try{
        let user;
    if (userType === 'brand') {
        user = await User.findOne({ email });
    } else if (userType === 'club') {
        user = await Club.findOne({ email });
    }


if (!user) {
      req.flash('error', 'User not found.');
    return res.redirect('/verify-otp');
    }

    console.log('Submitted OTP:', otp);
        console.log('Stored OTP:', user.otp);
        console.log('OTP Expiry:', new Date(user.otpExpiresAt).toLocaleString());

    if (String(user.otp) !== String(otp)) {
      req.flash('error', 'Invalid OTP. Please try again.');
    return res.redirect('/verify-otp');
    }

if (Date.now() > user.otpExpiresAt) {
      req.flash('error', 'OTP expired. Please request a new one.');
    return res.redirect('/verify-otp');
    }

        req.session.userId = user._id;
        req.session.user = {
            _id: user._id,
            email: user.email,
            role: userType === 'club' ? 'clubOwner' : 'brand'
          };
        req.session.userType = userType;
        req.session.isAuthenticated = true;
        req.flash('success', 'OTP Verify successfully!');

        res.redirect('/dashboard');

    }catch(err){
        console.error('OTP Verification Error:', err);
    req.flash('error', 'Error in verifying OTP. Please try again.');
    res.redirect('/verify-otp');

    }
    
});
router.get('/resend-otp', async (req, res) => {
    const email = req.session.email;
    const userType = req.session.userType;
    if (!email || !userType) return res.redirect('/login'); 

    const newOtp = generateOTP();
          const otpExpiresAt = Date.now() + 5 * 60 * 1000;
    req.session.otp = newOtp;
    req.session.otpExpires =otpExpiresAt;


    try{
        if (userType === 'brand') {
            await User.updateOne({ email }, { otp: newOtp, otpExpiresAt });
        } else {
            await Club.updateOne({ email }, { otp: newOtp, otpExpiresAt });
        }

        const mailOptions = {
            from: 'rupalporwal2025@gmail.com',
            to: email,
            subject: 'Your New OTP for Login',
            text: `Your new OTP is: ${newOtp}`
        };

        await transporter.sendMail(mailOptions);
        req.flash('success', 'OTP resent successfully!');
        res.redirect('/verify-otp');

    }catch(err)
    {
        console.error('Resend OTP error:', err);
        req.flash('error', 'Error resending OTP. Try again later.');
        res.redirect('/verify-otp');

    }

});


// Account Confirmation Page
router.get('/account-confirmation', (req, res) => {
    res.render('account-confirmation', { title: 'Wait Approval | AdSpire' });
});
  

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
        }
        
        res.redirect('/login'); // After logout, go to login page
    });
});
function ensureAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
      return next();
    }
    res.redirect('/login');
  }
  
  router.get('/dashboard', ensureAuthenticated, async (req, res) => {
    const userType = req.session.userType;
    const user = req.session.user;
    
    if (userType === 'brand') {
        return res.render('dashboard', { title: 'Brand Dashboard | AdSpire', user: req.session.user });
    } else if (userType === 'club') {
        const club = await Club.findOne({ email: user.email });
        return res.render('club/dashboard', { title: 'Club Dashboard | AdSpire', club: req.session.user });
    } else {
        return res.send('Invalid user type.');
    }
});
router.get('/about', (req, res) => {
  res.render('about',{title:"About Us | AdSpire"}); // This will render views/about.ejs
});


 
 module.exports = router;
