const express = require('express');
const router = express.Router();
const OrderFlight = require('../models/OrderFlight');
const Flight = require("../models/Flight");
// POST /api/bookings
// Lưu thông tin đặt vé vào cơ sở dữ liệu
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
