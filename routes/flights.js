const express = require('express');
const router = express.Router();
const Flight = require('../models/Flight');

// GET all popular hotels
router.get('/', async (req, res) => {
    try {
        const flights = await Flight.find(); // Xóa isActive: true
        res.json(flights);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
router.get('/:filghtId', async (req, res) => {
  try {
    const filght = await Flight.findById(req.params.filghtId);
    if (!filght ) return res.status(404).send('Flight not found');
    res.json(filght);
  } catch (err) {
    res.status(500).send(err);
  }
});
router.get('/choose/:filghtId', async (req, res) => {
  try {
    const filght = await Flight.findById(req.params.filghtId);
    if (!filght ) return res.status(404).send('Flight not found');
    res.json(filght);
  } catch (err) {
    res.status(500).send(err);
  }
});
router.post('/add', async (req, res) => {
  try {
    const flight = new Flight(req.body);
    await flight.save();
    res.status(201).send(flight);
  } catch (error) {
    res.status(400).send(error);
  }
});
router.put('/:filghtId', async (req, res) => {
  const { filghtId } = req.params;
  try {
    const filght = await Flight.findByIdAndUpdate(filghtId, req.body, { new: true });
    if (!filght) {
      return res.status(404).send('Flight not found');
    }
    res.status(200).json(filght);
  } catch (error) {
    res.status(400).send(error);
  }
});
router.delete('/:flightId', async (req, res) => {
    try {
        const flight = await Flight.findByIdAndDelete(req.params.flightId);
        if (flight) {
            res.json({ message: 'Flight deleted successfully' });
        } else {
            res.status(404).json({ message: 'Flight not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
router.get('/search', async (req, res) => {
  try {
    const { from, to } = req.query;
    console.log(`Query params - from: ${from}, to: ${to}`); // Log query parameters

    const filter = {};
    if (from) filter.from = decodeURIComponent(from);
    if (to) filter.to = decodeURIComponent(to);

    console.log(`Filter object: ${JSON.stringify(filter)}`); // Log filter object

    const flights = await Flight.find(filter);
    res.json(flights);
  } catch (err) {
    console.error('Error fetching flights:', err); // Log the error for debugging
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;