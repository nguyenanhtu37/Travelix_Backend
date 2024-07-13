const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const {authenticateToken, checkUserRole} = require('../middleware/authenticateToken');

const otpMap = new Map();

const JWT_SECRET = crypto.randomBytes(32).toString('hex');

// Config Nodemailer
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'nguyenanhtu3703@gmail.com',
    pass: 'ietj qlee vvwb dtce',
  },
});

// Đăng ký và gửi OTP
router.post('/signup', async (req, res) => {
  const { name, username, password, confirmpassword, phone } = req.body;

  // Kiểm tra nếu người dùng đã tồn tại
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.status(400).send("User already exists");
  }

  // Tạo OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpMap.set(username, otp);

  // Gửi OTP qua email
  const mailOptions = {
    from: 'nguyenanhtu3703@gmail.com',
    to: username,
    subject: 'OTP for Travelix Registration',
    text: `Your OTP is ${otp}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).send("Error sending email");
    }
    console.log('Email sent:', info.response);
    res.status(200).send("OTP sent to email");
  });
});

// Xác thực OTP và lưu người dùng
router.post('/verify-otp', async (req, res) => {
  const { username, otp, name, password, confirmpassword, phone } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  if (otpMap.get(username) === otp) {
    // Tạo người dùng mới
    const user = new User({
      name,
      username,
      password: hashedPassword,
      confirmpassword: hashedPassword,
      phone,
    });

    try {
      await user.save();
      otpMap.delete(username); // Xóa OTP sau khi xác thực thành công
      res.status(200).send("User verified and saved successfully");
    } catch (error) {
      console.error('Error saving user:', error);
      res.status(500).send("Error saving user");
    }
  } else {
    res.status(400).send("Invalid OTP");
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  // Tìm người dùng theo username
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(400).send("Invalid username or password");
  }

  // Kiểm tra mật khẩu
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).send("Invalid username or password");
  }

  // Tạo token JWT
  const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

  res.status(200).send({ token });
});

router.get('/homepageuser', authenticateToken, checkUserRole('user'), (req, res) => {
  // Code xử lý cho route /homepageuser khi người dùng có role là 'user'
  res.send('Welcome to homepageuser');
});

router.get('/admin', authenticateToken, checkUserRole('admin'), (req, res) => {
  // Code xử lý cho route /admin khi người dùng có role là 'admin'
  res.send('Welcome to admin');
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ username: email });
    if (!user) {
      return res.status(400).send('User with given email does not exist');
    }

    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const mailOptions = {
      from: 'nguyenanhtu3703@gmail.com',
      to: user.username,
      subject: 'Password Reset',
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n` +
        `Please click on the following link, or paste this into your browser to complete the process within one hour of receiving it:\n\n` +
        `http://localhost:3001/reset-password/${token}\n\n` +
        `If you did not request this, please ignore this email and your password will remain unchanged.\n`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).send('Error sending email');
      }
      console.log('Email sent:', info.response);
      res.status(200).send('Password reset email sent');
    });
  } catch (error) {
    console.error('Error processing forgot password:', error);
    res.status(500).send('Error processing forgot password');
  }
});

router.get('/reset-password/:token', (req, res) => {
  const token = req.params.token;
  // Xử lý logic để render form reset password hoặc thực hiện hành động reset password
  res.send(`Reset password form for token: ${token}`);
});

// Endpoint để xử lý đặt lại mật khẩu
router.post('/reset-password/:token', async (req, res) => {
  const { password } = req.body;
  const token = req.params.token;

  console.log('Received token:', token);

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() } // Kiểm tra token chưa hết hạn
    });

    if (!user) {
      return res.status(400).send('Password reset token is invalid or has expired');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).send('Password reset successfully');
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).send('Error resetting password');
  }
});

router.get('/user-count', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    res.status(200).json({ count: userCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/getall', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).send(err);
  }
});

module.exports = router;
