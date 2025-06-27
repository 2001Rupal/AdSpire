const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const ExcelJS = require('exceljs');

const path = require('path');
const engine = require('ejs-mate');
const flash = require('connect-flash');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mainRoutes = require('./routes/mainRoutes');
const dashboardRoutes = require('./routes/dashboard');
const campaignRoutes = require('./routes/campaignRoutes');
const invitedRoutes = require('./routes/invitedRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');
const exploreRoutes = require('./routes/exploreRoutes');
const clubRoutes = require('./routes/clubRoutes');
const contactRoutes = require('./routes/contactRoutes');


const app = express();
const fs = require('fs');
const uploadDir = 'public/uploads/clubs';

const excelDir = path.join(__dirname, 'excel');
if (!fs.existsSync(excelDir)) {
  fs.mkdirSync(excelDir, { recursive: true });
}

const brandRoutes= require('./routes/brand');


require('dotenv').config();

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}



// Database Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected Successfully'))
.catch(err => console.warn('⚠️ MongoDB connection failed:', err.message));


const isLocalhost = process.env.NODE_ENV !== 'production';

if (!isLocalhost) {
  app.set('trust proxy', 1); 
}


app.use(session({
  secret: process.env.SESSION_SECRET || 'adspire_fallback',
  resave: false,
  saveUninitialized: false,
  rolling: true, 
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    ttl: 10 * 24 * 60 * 60  // 10 days in seconds
  }),
  cookie: {
    maxAge: 10 * 24 * 60 * 60 * 1000, // 10 days in milliseconds
    secure: !isLocalhost ? true : false,
  httpOnly: true,
    sameSite: !isLocalhost ? 'none' : 'lax',
 
  }
}));


app.use(flash());





// Middleware to pass flash messages to all EJS views
app.use((req, res, next) => {
    res.locals.successMsg = req.flash('success');
    res.locals.errorMsg = req.flash('error');
    res.locals.user = req.session.user || null;
    res.locals.currentRoute = req.path;
    next();
  });

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});



app.use('/uploads', express.static('public/uploads'));


// Routes
app.use('/', mainRoutes);
app.use('/', dashboardRoutes);
app.use('/campaigns', campaignRoutes);
app.use('/', invitedRoutes);
app.use('/', enquiryRoutes);
app.use('/', exploreRoutes);
app.use('/', clubRoutes);
app.use('/',brandRoutes);
app.use('/', contactRoutes);





// Server Start
const PORT = process.env.PORT || 3001;

app.use((req, res, next) => {
  res.locals.successMsg = req.flash('success');
  res.locals.errorMsg = req.flash('error');
  next();
});

app.use((req, res, next) => {
  res.status(404).render('error', {
    title: "404 - Not Found",
    status: 404,
    message: 'Page not found'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).render('error', {
    title: "Error",
    status: err.status || 500,
    message: err.message || 'Something went wrong!'
  });
});


app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
