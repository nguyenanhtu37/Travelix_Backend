const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const OrderFlight = require('../models/OrderFlight');
const Flight = require("../models/Flight");
const { generateVNPayUrl } = require('../utils/vnpay');
// POST /api/bookings
// Lưu thông tin đặt vé vào cơ sở dữ liệu

router.get('/vnpay_return', async (req, res) => {
  const { vnp_TxnRef, vnp_ResponseCode } = req.query;

  if (vnp_ResponseCode === '00') { // Successful payment
    try {
      // Update order status to 'Paid'
      const order = await OrderFlight.findByIdAndUpdate(vnp_TxnRef, { status: 'Paid' }, { new: true });

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Send confirmation email
      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'nguyenanhtu3703@gmail.com',
          pass: 'ietj qlee vvwb dtce', // Replace with your email password
        },
      });

      const mailOptions = {
        from: 'nguyenanhtu3703@gmail.com',
        to: order.contactInfo.email,
        subject: 'Payment Successful for Your Order',
        text: `
          Dear ${order.contactInfo.name},

          Your payment for the following order has been successful:
          Order ID: ${order._id}
          From: ${order.flightDetails.from}
          To: ${order.flightDetails.to}
          Departure Date: ${new Date(order.flightDetails.departureDate).toLocaleString()}
          Number of Adults: ${order.flightDetails.numAdults}
          Number of Children: ${order.flightDetails.numChildren}
          Seat Class: ${order.flightDetails.seatClass}
          Total Price: ${order.totalPrice} VND

          Thank you for choosing Travelix!

          Best regards,
          Travelix Team
        `,
      };

      await transporter.sendMail(mailOptions);

      // Redirect to the payment success page
      res.redirect(`/paymentflightsuccess?orderId=${order._id}`);
    } catch (error) {
      console.error('Error processing payment:', error);
      res.redirect(`/paymentflightfailure?orderId=${vnp_TxnRef}`);
    }
  } else {
    // Payment failed
    res.redirect(`/paymentflightfailure?orderId=${vnp_TxnRef}`);
  }
});

router.post('/create_payment_url', async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await OrderFlight.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const paymentUrl = generateVNPayUrl(order);
    res.json({ paymentUrl });
  } catch (error) {
    console.error('Error creating payment URL:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Route to manually trigger confirmation email (for testing purposes)
router.post('/sendPaymentSuccessEmail', async (req, res) => {
  const { email, orderDetails } = req.body;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'nguyenanhtu3703@gmail.com',
      pass: 'ietj qlee vvwb dtce'
    }
  });

  const emailContent = `
    Payment successful! Here are your order details:
    From: ${orderDetails.flightDetails.from}
    To: ${orderDetails.flightDetails.to}
    Departure Date: ${new Date(orderDetails.flightDetails.departureDate).toLocaleString()}
    Number of Adults: ${orderDetails.flightDetails.numAdults}
    Number of Children: ${orderDetails.flightDetails.numChildren}
    Seat Class: ${orderDetails.flightDetails.seatClass}
    Total Price: ${orderDetails.totalPrice} VND
    Contact Info:
    Name: ${orderDetails.contactInfo.name}
    Phone: ${orderDetails.contactInfo.phone}
    Email: ${orderDetails.contactInfo.email}
    Passenger Info:
    ${orderDetails.passengerInfo.map(passenger => `
      Name: ${passenger.name}
      Age: ${passenger.age}
      Type: ${passenger.type}
    `).join('\n')}
  `;

  const mailOptions = {
    from: 'nguyenanhtu3703@gmail.com',
    to: email,
    subject: 'Payment Flight Success',
    text: emailContent
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send('Email sent successfully');
  } catch (error) {
    res.status(500).send('Error sending email');
  }
});

router.post('/bookings', async (req, res) => {
  try {
    const { flightDetails, totalPrice, contactInfo, passengerInfo } = req.body.orderData;

    const newOrder = new OrderFlight({
      flightDetails,
      totalPrice,
      contactInfo,
      passengerInfo,
    });

    await newOrder.save();

    res.status(201).json({ message: 'Booking successful', order: newOrder });
  } catch (error) {
    console.error('Error booking flight:', error);
    res.status(500).json({ message: 'Booking failed', error: error.message });
  }
});


// Cập nhật trạng thái đơn hàng và giảm số lượng ghế
router.put("/:id/status", async (req, res) => {
  try {
    const order = await OrderFlight.findById(req.params.id);
    if (!order) {
      return res.status(404).send("Order not found");
    }

    console.log("Order before update:", order);

    // Cập nhật trạng thái đơn hàng
    order.status = req.body.status;
    await order.save();

    console.log("Order after update:", order);

    // Giảm số lượng ghế
    if (req.body.status === "Paid") {
      const flight = await Flight.findById(order.flightDetails.flightId);
      if (flight) {
        const { seatClass, numAdults, numChildren } = order.flightDetails;
        const totalPassengers = numAdults + numChildren;

        console.log("Flight before update:", flight);

        if (seatClass === "economy") {
          flight.numEconomyPassengers -= totalPassengers;
        } else if (seatClass === "business") {
          flight.numBusinessPassengers -= totalPassengers;
        }

        await flight.save();

        console.log("Flight after update:", flight);
      } else {
        console.error("Flight not found");
      }
    }

    res.send(order);
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).send(error);
  }
});

router.get('/', async (req, res) => {
  try {
    const orders = await OrderFlight.find();
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
});

router.get("/:orderId", async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const orderFlight = await OrderFlight.findById(orderId).populate('flightDetails.flightId');

    if (!orderFlight) {
      return res.status(404).json({ message: "Order flight not found" });
    }

    res.json(orderFlight);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
