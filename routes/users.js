const express = require('express');
const { validateUser, isAuthenticated, clearReturnTo } = require('../utilities');
const { renderRegisterForm, registerUser, renderLoginForm, loginUser, logoutUser } = require('../controllers/users');
const passport = require('passport');
const router = express.Router();

router
	.route('/login')
	.get(renderLoginForm)
	.post(passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), loginUser);

/**
 * clear req.session.returnTo incase user navigates away without logging in
 * - the login route must be seperated from this otherwise it will not redirect back to returnTo
 */
router.use(clearReturnTo);

router.route('/register/new').get(renderRegisterForm).put(validateUser, registerUser);

router.get('/logout', isAuthenticated, logoutUser);

module.exports = router;
