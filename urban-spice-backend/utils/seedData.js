/**
 * Seed script — populates the database with an initial admin account and
 * sample content so the site has something to show immediately.
 *
 * Usage:
 *   npm run seed            # insert sample data
 *   npm run seed:destroy    # wipe all collections
 */
require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const Menu = require('../models/Menu');
const Gallery = require('../models/Gallery');
const Testimonial = require('../models/Testimonial');
const Reservation = require('../models/Reservation');
const Contact = require('../models/Contact');

const menuItems = [
  { name: 'Charred Citrus & Pomegranate Salad', description: 'Blood orange, fennel, mint, sumac dressing, toasted pistachio.', category: 'starters', price: 14, badge: 'veg' },
  { name: 'Peri-Peri Prawn Skewers', description: 'Char-grilled prawns, house peri-peri glaze, lime crema.', category: 'starters', price: 17, badge: 'spicy' },
  { name: 'Berbere-Crusted Ribeye', description: '28-day aged ribeye, Ethiopian berbere crust, smoked bone jus.', category: 'mains', price: 42, badge: 'chef' },
  { name: 'Coconut Laksa Noodles', description: 'Rice noodles, prawn, coconut-chili broth, crispy shallots.', category: 'mains', price: 28, badge: 'spicy' },
  { name: 'Harissa Lamb Flatbread', description: 'Wood-fired dough, harissa lamb, whipped feta, mint oil.', category: 'mains', price: 24, badge: 'none' },
  { name: 'Cardamom Crème Brûlée', description: 'Green cardamom custard, torched sugar, pistachio praline.', category: 'desserts', price: 12, badge: 'chef' },
  { name: 'Ancho Chili Chocolate Tart', description: '70% dark chocolate, ancho chili ganache, sea salt crust.', category: 'desserts', price: 13, badge: 'spicy' },
  { name: 'Smoked Chili Margarita', description: 'Reposado tequila, charred lime, chili-salt rim, mezcal float.', category: 'drinks', price: 16, badge: 'none' },
  { name: 'Masala Chai Old Fashioned', description: 'Bourbon, house chai syrup, orange bitters, star anise.', category: 'drinks', price: 15, badge: 'veg' },
];

const galleryImages = [
  { title: 'Main Dining Room', image: '/uploads/gallery/placeholder-dining-room.jpg' },
  { title: 'The Bar', image: '/uploads/gallery/placeholder-bar.jpg' },
  { title: 'Open Kitchen', image: '/uploads/gallery/placeholder-kitchen.jpg' },
  { title: 'Private Nook', image: '/uploads/gallery/placeholder-nook.jpg' },
];

const testimonials = [
  { customerName: 'Amara Whitfield', profession: 'Food Critic, Metro Weekly', review: "The berbere ribeye alone is worth the reservation wait. Every course felt considered.", rating: 5, approved: true },
  { customerName: 'Daniel Ruiz', profession: 'Regular Guest', review: 'We booked for an anniversary and stayed three hours because no one wanted the night to end.', rating: 5, approved: true },
  { customerName: 'Priya Nandakumar', profession: 'Verified Diner', review: "Best laksa I've had outside of Southeast Asia — the heat is honest, never just for show.", rating: 4, approved: true },
];

const seed = async () => {
  await connectDB();

  const destroy = process.argv.includes('--destroy');

  if (destroy) {
    await Promise.all([
      User.deleteMany(),
      Menu.deleteMany(),
      Gallery.deleteMany(),
      Testimonial.deleteMany(),
      Reservation.deleteMany(),
      Contact.deleteMany(),
    ]);
    console.log('All collections cleared.');
    process.exit(0);
  }

  // Admin user (idempotent — skip if it already exists)
  const existingAdmin = await User.findOne({ email: process.env.ADMIN_EMAIL });
  if (!existingAdmin) {
    await User.create({
      name: process.env.ADMIN_NAME || 'Urban Spice Admin',
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      role: 'superadmin',
    });
    console.log(`Admin created: ${process.env.ADMIN_EMAIL}`);
  } else {
    console.log('Admin already exists, skipping.');
  }

  await Menu.deleteMany();
  await Menu.insertMany(menuItems);
  console.log(`Seeded ${menuItems.length} menu items.`);

  await Gallery.deleteMany();
  await Gallery.insertMany(galleryImages);
  console.log(`Seeded ${galleryImages.length} gallery images (replace placeholder files in uploads/gallery/).`);

  await Testimonial.deleteMany();
  await Testimonial.insertMany(testimonials);
  console.log(`Seeded ${testimonials.length} testimonials.`);

  console.log('Seed complete.');
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
