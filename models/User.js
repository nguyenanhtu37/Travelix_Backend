const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
<<<<<<< HEAD
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
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date
=======
    name: String,
    username: String,
    password: String,
    confirmpassword: String,
    phone: String,
    isAdmin: Boolean,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
>>>>>>> dd81de276db3937c01e16ca995391d5f0d445a3e
});

const User = mongoose.model('User', userSchema, 'users');

module.exports = User;
