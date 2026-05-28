const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'devhubpro_secret_key_2024',
    { expiresIn: '1d' }
  );
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || 'devhubpro_refresh_secret_2024',
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
};

// REGISTER
exports.register = async (req, res) => {
  try {
    const { username, name, email, password, role } = req.body;
    const normalizedUsername = String(username || '').trim().toLowerCase();
    const normalizedName = String(name || '').trim();
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedUsername || !normalizedName || !normalizedEmail || !password) {
      return res.status(400).json({
        message: 'Username, name, email, and password are required',
      });
    }

    const usernamePattern = /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){2,38}$/;
    if (!usernamePattern.test(normalizedUsername)) {
      return res.status(400).json({
        message: 'Invalid username format',
      });
    }

    // Validate role
    const validRoles = ['developer', 'reviewer', 'project_manager', 'admin'];
    const userRole = validRoles.includes(role) ? role : 'developer';

    // Check duplicates
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
    });
    if (existingUser) {
      if (existingUser.email === normalizedEmail) {
        return res.status(409).json({ message: 'Email already registered' });
      }
      return res.status(409).json({ message: 'Username already taken' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      username: normalizedUsername,
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      role: userRole,
      emailVerificationToken: crypto.randomBytes(24).toString('hex'),
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    user.loginHistory.push({
      ip: req.ip,
      userAgent: req.get('user-agent') || '',
      success: true,
    });
    await user.save();

    res.status(201).json({
      message: 'Registration successful',
      token: accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: 'Your account has been suspended' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Save refresh token & update lastActive
    user.refreshToken = refreshToken;
    user.lastActive = new Date();
    user.loginHistory.push({
      ip: req.ip,
      userAgent: req.get('user-agent') || '',
      success: true,
    });
    await user.save();

    res.json({
      message: 'Login successful',
      token: accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// REFRESH TOKEN
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'devhubpro_refresh_secret_2024'
    );

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Generate new tokens
    const tokens = generateTokens(user._id);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json({
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

// GET CURRENT USER
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -refreshToken')
      .populate('pinnedRepos');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// LOGOUT
exports.logout = async (req, res) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    }
    res.json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CHANGE PASSWORD
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        message: 'Old password and new password are required',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Old password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// REQUEST PASSWORD RESET
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: String(email || '').toLowerCase() });
    if (!user) {
      return res.json({ message: 'If that email exists, a reset link has been generated' });
    }

    user.passwordResetToken = crypto.randomBytes(24).toString('hex');
    user.passwordResetExpires = new Date(Date.now() + 1000 * 60 * 30);
    await user.save();

    res.json({
      message: 'Password reset requested',
      resetToken: process.env.NODE_ENV === 'production' ? undefined : user.passwordResetToken,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.refreshToken = null;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// VERIFY EMAIL
exports.verifyEmail = async (req, res) => {
  try {
    const user = await User.findOne({ emailVerificationToken: req.body.token });
    if (!user) return res.status(400).json({ message: 'Invalid verification token' });

    user.emailVerified = true;
    user.emailVerificationToken = null;
    await user.save();

    res.json({ message: 'Email verified' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ENABLE OR DISABLE 2FA PLACEHOLDER
exports.configureTwoFactor = async (req, res) => {
  try {
    const enabled = !!req.body.enabled;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.twoFactor.enabled = enabled;
    if (enabled && !user.twoFactor.secret) {
      user.twoFactor.secret = crypto.randomBytes(20).toString('hex');
      user.twoFactor.recoveryCodes = Array.from({ length: 8 }, () => crypto.randomBytes(5).toString('hex'));
    }
    if (!enabled) {
      user.twoFactor.secret = null;
      user.twoFactor.recoveryCodes = [];
    }
    await user.save();

    res.json({
      enabled: user.twoFactor.enabled,
      recoveryCodes: enabled ? user.twoFactor.recoveryCodes : [],
      secret: process.env.NODE_ENV === 'production' ? undefined : user.twoFactor.secret,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
