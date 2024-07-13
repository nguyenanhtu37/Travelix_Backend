const express = require('express');
const router = express.Router();
const Car = require('../models/Car');

// Validation function for registrationNumber
function validateRegistrationNumber(registrationNumber) {
  const regex = /^\d{2}A - \d{3}\.\d{2}$/;
  return regex.test(registrationNumber);
}

// GET all cars
router.get('/', async (req, res) => {
  try {
    const cars = await Car.find();
    res.status(200).json(cars);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving cars', error });
  }
});

// GET a specific car by registrationNumber
router.get('/:registrationNumber', async (req, res) => {
  try {
    const car = await Car.findOne({ registrationNumber: req.params.registrationNumber });
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    res.status(200).json(car);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving car', error });
  }
});

// POST a new car
router.post('/', async (req, res) => {
  const { registrationNumber, type, model, year, rentalPricePerDay, quantityAvailable, seatingCapacity, imageUrl } = req.body;

  if (!validateRegistrationNumber(registrationNumber)) {
    return res.status(400).json({ message: 'Invalid registration number format. Enter Again! (Follow this form: xxA - xxx.xx' });
  }

  const car = new Car({
    registrationNumber,
    type,
    model,
    year,
    rentalPricePerDay,
    quantityAvailable,
    seatingCapacity,
    imageUrl,
  });

  try {
    const newCar = await car.save();
    res.status(201).json(newCar);
  } catch (error) {
    res.status(500).json({ message: 'Error creating car', error });
  }
});

// PUT to update a car by registrationNumber
router.put('/:registrationNumber', async (req, res) => {
  const { type, model, year, rentalPricePerDay, quantityAvailable, seatingCapacity, imageUrl } = req.body;

  if (!validateRegistrationNumber(req.params.registrationNumber)) {
    return res.status(400).json({ message: 'Invalid registration number format' });
  }

  try {
    const car = await Car.findOne({ registrationNumber: req.params.registrationNumber });
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    car.type = type;
    car.model = model;
    car.year = year;
    car.rentalPricePerDay = rentalPricePerDay;
    car.quantityAvailable = quantityAvailable;
    car.seatingCapacity = seatingCapacity;
    car.imageUrl = imageUrl;

    const updatedCar = await car.save();
    res.status(200).json(updatedCar);
  } catch (error) {
    res.status(500).json({ message: 'Error updating car', error });
  }
});

// DELETE a car by registrationNumber
router.delete('/:registrationNumber', async (req, res) => {
  try {
    const car = await Car.findOneAndDelete({ registrationNumber: req.params.registrationNumber });
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    res.status(200).json({ message: 'Car deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting car', error });
  }
});

module.exports = router;
