const express = require('express');
const { createContact, getContacts, markContactRead, deleteContact } = require('../controllers/contactController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { contactValidator, mongoIdValidator, paginationValidator } = require('../utils/validators');

// Public router — mounted at /api/contact
const publicRouter = express.Router();
publicRouter.post('/', contactValidator, validate, createContact);

// Admin router — mounted at /api/admin/contacts
const adminRouter = express.Router();
adminRouter.use(protect);
adminRouter.get('/', paginationValidator, validate, getContacts);
adminRouter.patch('/:id/read', mongoIdValidator, validate, markContactRead);
adminRouter.delete('/:id', mongoIdValidator, validate, deleteContact);

module.exports = { publicRouter, adminRouter };
