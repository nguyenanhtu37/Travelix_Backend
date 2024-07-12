const express = require('express');
const router = express.Router();
const Destination = require('../models/Destination');

// GET all destinations
router.get('/', async (req, res) => {
    try {
        console.log('Fetching popular destinations:');
        const destinations = await Destination.find({});
        // console.log('Fetched destinations: ', destinations); 
        // Debugging line
        res.json(destinations);
    } catch (err) {
        console.error('Error fetching popular destinations: ', err);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
