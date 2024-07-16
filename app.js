const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const logger = require('morgan');
const jsonwebtoken = require('jsonwebtoken');
const destinationsRouter = require('./routes/destinations');
const hotelsRouter = require('./routes/hotels');
const usersRouter = require('./routes/users');
const carRouter = require('./routes/carRouter');
const flightsRouter = require('./routes/flights')

const app = express();
const PORT = 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(logger('dev'));

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/Travelix', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log("Connected to MongoDB successfully!");
});

// Routes
app.use('/api/destinations', destinationsRouter);
app.use('/api/hotels', hotelsRouter);
app.use('/api/users', usersRouter);
app.use('/api/cars', carRouter);
app.use('/api/flights', flightsRouter);


// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
