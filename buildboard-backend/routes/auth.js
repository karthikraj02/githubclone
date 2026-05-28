const router = require('express').Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, asyncHandler(authController.register));
router.post('/login', authLimiter, asyncHandler(authController.login));
router.post('/refresh', asyncHandler(authController.refreshToken));
router.post('/forgot-password', authLimiter, asyncHandler(authController.requestPasswordReset));
router.post('/reset-password', authLimiter, asyncHandler(authController.resetPassword));
router.post('/verify-email', asyncHandler(authController.verifyEmail));
router.get('/me', auth, asyncHandler(authController.getCurrentUser));
router.post('/logout', auth, asyncHandler(authController.logout));
router.put('/change-password', auth, asyncHandler(authController.changePassword));
router.put('/2fa', auth, asyncHandler(authController.configureTwoFactor));

module.exports = router;
