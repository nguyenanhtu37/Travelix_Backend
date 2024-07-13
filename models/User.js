const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
<<<<<<< HEAD
    name: String,
    username: String,
    password: String,
    confirmpassword: String,
    phone: String,
    isAdmin: Boolean,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
});
=======
    name: {
      type: String,
      required: true
    },
    username: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['user', 'admin'], 
      default: 'user'
    }
  });
>>>>>>> 851b8e38f0687da86760a39933301c8ea0ccf556

const User = mongoose.model('User', userSchema, 'users');

module.exports = User;