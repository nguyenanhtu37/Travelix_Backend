const express = require('express');
const router = express.Router();
const Hotel = require('../models/Hotel');

// GET all popular hotels
router.get('/', async (req, res) => {
    try {
        console.log('Fetching popular hotels:');
        const hotels = await Hotel.find({});
        // console.log('Fetched hotels: ', hotels); 
        // Debugging line
        res.json(hotels);
    } catch (err) {
        console.error('Error fetching popular hotels: ', err);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Endpoint to get total number of hotels
router.get('/count', async (req, res) => {
    try {
      const count = await Hotel.countDocuments();
      res.json({ count });
    } catch (err) {
      console.error('Error fetching hotel count:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

module.exports = router;
