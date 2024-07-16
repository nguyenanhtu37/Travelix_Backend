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

// Endpoint to get total number of destination
router.get('/count', async (req, res) => {
    try {
        const count = await Destination.countDocuments();
        res.json({ count });
    } catch (err) {
        console.error('Error fetching destination count:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST route to create a new destination
router.post('/create', async (req, res) => {
    try {
        const { name, description } = req.body;
        const newDestination = new Destination({
            name,
            description,
            details: [] // Mảng rỗng ban đầu
        });
        const savedDestination = await newDestination.save();
        res.status(201).json(savedDestination);
    } catch (err) {
        console.error('Error creating destination:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const deletedDestination = await Destination.findByIdAndDelete(id);
      if (!deletedDestination) {
        return res.status(404).json({ error: 'Destination not found' });
      }
      res.json({ message: 'Destination deleted successfully' });
    } catch (error) {
      console.error('Error deleting destination:', error);
      res.status(500).json({ error: 'Error deleting destination' });
    }
  });

  // GET route to get details of a specific destination
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const destination = await Destination.findById(id);
        if (!destination) {
            return res.status(404).json({ error: 'Destination not found' });
        }
        res.json(destination);
    } catch (err) {
        console.error('Error fetching destination details:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT route to update a destination
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const updatedDestination = await Destination.findByIdAndUpdate(
            id,
            { name, description },
            { new: true } // Trả về document đã cập nhật mới
        );
        if (!updatedDestination) {
            return res.status(404).json({ error: 'Destination not found' });
        }
        res.json(updatedDestination);
    } catch (err) {
        console.error('Error updating destination:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
