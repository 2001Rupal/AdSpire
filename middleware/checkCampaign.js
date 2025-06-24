// middlewares/checkCampaign.js
function ensureCampaignSelected(req, res, next) {
  if (!req.session.selectedCampaignId) {
    return res.render('select-campaign-warning', {
      title: 'Select Campaign',
      message: 'Please select a campaign before exploring clubs.'
    });
  }
  next();
}

module.exports = ensureCampaignSelected;
