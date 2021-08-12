const { catchAsync } = require('../utilities');
const User = require('../models/user');

module.exports.renderRegisterForm = (req, res) => {
   res.render('auth/new');
};

module.exports.registerUser = catchAsync(async (req, res) => {
   const { username, password, email } = req.body.user;
   // create a user instance
   const user = new User({ email, username });
   // creates the password hash and stores in DB - works like the User.pre('save') hook to update the password
   // inserts the user into the DB
   const registeredUser = await User.register(user, password);
   req.login(registeredUser, err => { if (err) next(err); }); //passport method is not async so use callback - required
   req.flash('message', {
      alert: 'success',
      msg: 'Welcome To YelpCamp'
   });
   res.redirect('/campgrounds');
});

module.exports.loginUser = (req, res) => {
   console.log('LOGIN USERS.js', req.body);
   const url = req.session.returnTo || '/campgrounds';
   delete req.session.returnTo;

   req.flash('message', {
      alert: 'success',
      msg: 'Welcome Back!'
   });

   console.log('REQ.USER', req.user);
   res.redirect(url);
};
module.exports.logoutUser = (req, res) => {
   req.logout();

   req.flash('message', {
      alert: 'info',
      msg: 'You have Been Logged Out'
   });

   req.session.destroy();

   res.redirect('/campgrounds');
};

module.exports.renderLoginForm = (req, res) => {
   res.render('auth/login');
};

