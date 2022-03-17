const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const catchAsync = require('./utils/catchAsync');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const { isLoggedIn, isAuthor, isCommentAuthor } = require('./middleware');
const Blog = require('./models/blog');
const Comment = require('./models/comment');
const User = require('./models/user');
const passport = require('passport');
const LocalStrategy = require('passport-local');

const blogRoutes = require('./routes/blogs');
const commentRoutes = require('./routes/comments');
const userRoutes = require('./routes/users');


mongoose.connect('mongodb://localhost:27017/blog-post', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
   console.log("Database connected");
});

const app = express();

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')))

const sessionConfig = {
   secret: 'thisshouldbeabettersecret!',
   resave: false,
   saveUninitialized: true,
   cookie: {
      httpOnly: true,
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
      maxAge: 1000 * 60 * 60 * 24 * 7
   }
}
app.use(session(sessionConfig))
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
   res.locals.currentUser = req.user;
   res.locals.success = req.flash('success');
   res.locals.error = req.flash('error');
   next();
})

app.use('/blogs', blogRoutes);
app.use('/blogs/:id/comments', commentRoutes);
app.use('/', userRoutes);


app.get('/', (req, res) => {
   res.render('home')
});







app.all('*', (req, res, next) => {
  next(new ExpressError('Page Not Found', 404))
})

 app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if(!err.message) err.message = 'Oh No, Something Went Wrong!'
  res.status(statusCode).render('error', { err })
 })


app.listen(4000, () => {
   console.log('Serving on port 4000')
})