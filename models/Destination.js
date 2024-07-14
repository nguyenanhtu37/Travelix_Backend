const mongoose = require('mongoose');

const detailSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  address: { type: String, required: true },
  coordinates: { type: String, required: true },
  opening_hours: { type: String, required: true },
  ticket_price: { type: String, required: true }
});

const destinationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  details: [detailSchema]
});

const Destination = mongoose.model('Destination', destinationSchema, 'destinations');

module.exports = Destination;
