const nodemailer = require('nodemailer');

require('dotenv').config(); // ensure this is at the top

const transporter = nodemailer.createTransport({
  service: 'gmail', // or 'hotmail', 'yahoo', etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});


const sendInviteEmail = async (to, name, role, inviteId)=> {
    const acceptLink = `http://localhost:3001/invite/accept/${inviteId}`;
  const mailOptions = {
    from: '"Adspire Team" adspirehometeam@gmail.com',
    to,
    subject: 'You have been invited to Adspire',
    html: `
      <div style="font-family: 'Poppins', sans-serif; padding: 20px; background-color: #1a1212; color: #fff;">
      <h3>Hello ${name},</h3>
<p>
          Click the button below to accept your invite:
        </p>
        <a href="http://localhost:3001/invite/accept/${inviteId}"
           style="display: inline-block; padding: 12px 24px; margin-top: 10px; background: #b0766b; color: #fff;
                  text-decoration: none; border-radius: 6px; font-weight: bold;">
          Accept Invite
        </a>
        
        <p>If you did not expect this invitation, please ignore this email.</p>

      <p style="margin-top: 20px;">If you have any questions, just reply to this email.</p>
        <p style="margin-top: 30px;">— Adspire Team</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};


const sendQuoteToBrand = async (to, brandName, campaignName, items) => {
  const itemHtml = items.map(item => `
    <li>
      <strong>${item.name}</strong><br/>
      Sub-inventories: ${item.selectedSubInventories.join(', ')}<br/>
      Dates: ${item.startDate} to ${item.endDate}
    </li>
  `).join('');

  const mailOptions = {
    from: '"Adspire Team" <adspirehometeam@gmail.com>',
    to,
    subject: `Quote Submitted for Campaign: ${campaignName}`,
    html: `
      <div style="font-family: 'Poppins', sans-serif; padding: 20px; background-color: #1a1212; color: #fff;">
        <h3>Hello ${brandName},</h3>
        <p>Your quote has been successfully submitted for the campaign <strong>${campaignName}</strong>.</p>
        <ul>${itemHtml}</ul>
        <p>Thank you for using Adspire!</p>
        <p>— Adspire Team</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};


const sendQuoteToClub = async (to, clubName, brandName, campaignName, items) => {
  const itemHtml = items.map(item => `
    <li>
      <strong>${item.name}</strong><br/>
      Sub-inventories: ${item.selectedSubInventories.join(', ')}<br/>
      Dates: ${item.startDate} to ${item.endDate}
    </li>
  `).join('');

  const mailOptions = {
    from: '"Adspire Team" <adspirehometeam@gmail.com>',
    to,
    subject: `New Booking Request from ${brandName}`,
    html: `
      <div style="font-family: 'Poppins', sans-serif; padding: 20px; background-color: #1a1212; color: #fff;">
        <h3>Hello ${clubName},</h3>
        <p>${brandName} has booked your inventory for their campaign <strong>${campaignName}</strong>.</p>
        <ul>${itemHtml}</ul>
        <p>Thank you for collaborating on Adspire!</p>
        <p>— Adspire Team</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};



module.exports = {
  sendInviteEmail,
  sendQuoteToBrand,
  sendQuoteToClub
};