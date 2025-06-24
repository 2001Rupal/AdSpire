

const ensureAuthenticated = (req, res, next)=> {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect('/login');
}
function isClubOwnerLoggedIn(req, res, next) {
  if (req.session && req.session.user && req.session.role === 'clubOwner') {
    next();
  } else {
    res.redirect('/login');
  }
}

module.exports={ensureAuthenticated,isClubOwnerLoggedIn};