const express = require('express');
const { getStats, getRecentActivity } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/stats', getStats);
router.get('/recent-activity', getRecentActivity);

module.exports = router;
