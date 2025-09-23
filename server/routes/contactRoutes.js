const express = require('express');
const Contact = require('../models/Contact');
const router = express.Router();

// Send contact message
router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    const contactMessage = new Contact({
      name,
      email,
      message
    });

    await contactMessage.save();

    // Here you would typically send an email notification
    console.log('New contact message:', { name, email, message });

    res.status(201).json({
      message: 'Contact message sent successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all contact messages (admin only - protected)
router.get('/', async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;