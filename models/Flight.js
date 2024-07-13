const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  departureDate: { type: Date, required:true },
  returnDate: { type: Date, required:true },
  numEconomyPassengers: { type: Number, required:true },
  numBusinessPassengers: { type: Number, required:true },
  isActive: { type: Boolean, default: true }
});

const Flight = mongoose.model('Flight', flightSchema);

module.exports = Flight;