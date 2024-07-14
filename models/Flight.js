const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  departureDate: { type: Date, required:true },
<<<<<<< HEAD
  returnDate: { type: Date, required:true },
  numEconomyPassengers: { type: Number, required:true },
  numBusinessPassengers: { type: Number, required:true },
  isActive: {
    type: Boolean,
    default: true,
  },
=======
  numEconomyPassengers: { type: Number, default:180 },
  numBusinessPassengers: { type: Number, default:20 },
  priceAdultEconomy: { type: String, required: true },
  priceChildrenEconomy: { type: String, required: true },
  priceAdultBusiness: { type: String, required: true },
  priceChildrenBusiness: { type: String, required: true },
  branch: { type: String, required: true },
>>>>>>> dd81de276db3937c01e16ca995391d5f0d445a3e
});

const Flight = mongoose.model('Flight', flightSchema);

module.exports = Flight;