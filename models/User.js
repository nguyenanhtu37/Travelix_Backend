const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    username: String,
    password: String,
    confirmpassword: String,
    phone: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
});

const User = mongoose.model('User', userSchema, 'users');

module.exports = User;