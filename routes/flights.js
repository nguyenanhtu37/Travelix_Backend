const express = require('express');
const router = express.Router();
const Flight = require('../models/Flight');

// GET all popular hotels
router.get('/', async (req, res) => {
    try {
        const flights = await Flight.find({ isActive: true });
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
        const flight = await Flight.findById(req.params.flightId);
        if (flight) {
            flight.isActive = false; // Đánh dấu isActive là false thay vì xóa
            await flight.save();
            res.json({ message: 'Flight marked as inactive' });
        } else {
            res.status(404).json({ message: 'Flight not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
module.exports = router;