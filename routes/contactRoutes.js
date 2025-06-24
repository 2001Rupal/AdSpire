const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const csvFilePath = path.join(__dirname, '../data/contact-submissions.csv');

// Ensure directory exists
if (!fs.existsSync(path.dirname(csvFilePath))) {
  fs.mkdirSync(path.dirname(csvFilePath), { recursive: true });
}

// Helper function to escape commas in values
function escapeCSV(value) {
  if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

router.post('/contact', (req, res) => {
  const { name, email, message } = req.body;
  const submittedAt = new Date().toLocaleString();

  try{
  const headers = 'Name,Email,Message,Submitted At\n';
  const newLine = [
    escapeCSV(name),
    escapeCSV(email),
    escapeCSV(message),
    escapeCSV(submittedAt)
  ].join(',') + '\n';

  if (!fs.existsSync(csvFilePath)) {
    // Create file and write headers + first row
    fs.writeFileSync(csvFilePath, headers + newLine);
  } else {
    // Append new row
    fs.appendFileSync(csvFilePath, newLine);
  }

  req.flash('success', 'Thankyou!. We will contact you soon');
  res.redirect('/about');
}catch (error) {
    console.error('Error saving message to CSV:', error);
    req.flash('error', 'Failed to send request. Please try again later.');
  }
});

module.exports = router;
