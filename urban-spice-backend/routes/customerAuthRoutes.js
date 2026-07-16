const express = require('express');
const { register, login, getMe, logout } = require('../controllers/customerAuthController');
const { protectCustomer } = require('../middleware/customerAuth');
const validate = require('../middleware/validate');
const { customerRegisterValidator, customerLoginValidator } = require('../utils/validators');

const router = express.Router();

router.post('/register', customerRegisterValidator, validate, register);
router.post('/login', customerLoginValidator, validate, login);
router.post('/logout', protectCustomer, logout);
router.get('/me', protectCustomer, getMe);

module.exports = router;
