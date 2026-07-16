const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

// @desc    Health check — used by Render/Railway and uptime monitors
// @route   GET /health
// @access  Public
router.get('/', (req, res) => {
  const dbState = mongoose.connection.readyState; // 1 = connected
  res.status(200).json({
    success: true,
    message: 'Urban Spice API is running',
    data: {
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database: dbState === 1 ? 'connected' : 'disconnected',
    },
  });
});

module.exports = router;
