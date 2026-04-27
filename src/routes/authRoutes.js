const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../utils/errors');
const jwt = require('jsonwebtoken');

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const token = jwt.sign({ userId: 1, email }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });
  res.json({ message: 'Login successful', token });
}));

router.post('/logout', asyncHandler(async (req, res) => {
  res.json({ message: 'Logout successful' });
}));

module.exports = router;
