// models/OrderFlight.js

const mongoose = require("mongoose");

const orderFlightSchema = new mongoose.Schema({
  flightDetails: {
    flightId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flight' },
    from: { type: String, required: true },
    to: { type: String, required: true },
    departureDate: { type: Date, required: true },
    numAdults: { type: Number, required: true },
    numChildren: { type: Number, required: true },
    seatClass: { type: String, required: true }
  },
  contactInfo: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true }
  },
  passengerInfo: [{
    name: { type: String, required: true },
    age: { type: Number, required: true },
    type: { type: String, required: true }
  }],
  totalPrice: { type: Number, required: true },
  status: { type: String, default: "create" },
  createdAt: { type: Date, default: Date.now }
});

const OrderFlight = mongoose.model("OrderFlight", orderFlightSchema);

module.exports = OrderFlight;
