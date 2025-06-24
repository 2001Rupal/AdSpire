const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    brandName: { type: String, required: true },
    userType: { type: String, required: true }, 
    designation:{type:String,required:true},
    industry:{type:String,required:true},
    city:{type:String,required:true},
    state:{type:String,required:true},
    website: { type: String, required: false },
    userName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    contactNumber: { type: String, required: true },
    address:{type:String,required:true},
    pincode:{type:String,required:true},
    otp: {Number},
    otpExpiresAt: {Date}

});

const User = mongoose.model('User', userSchema);

module.exports = User;
