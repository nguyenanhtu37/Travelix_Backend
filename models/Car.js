const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
    registrationNumber: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    rentalPricePerDay: { type: Number, required: true },
    quantityAvailable: { type: Number, default: true },
    seatingCapacity: { type: Number, required: true },
    imageUrl: { type: String },
});

carSchema.methods.rentCar = function() {
    if (this.quantityAvailable > 0) {
      this.quantityAvailable -= 1;
      return this.save();
    } else {
      throw new Error('Car not available');
    }
  };

const Car = mongoose.model('Car', carSchema, 'car');

module.exports = Car;