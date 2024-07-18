const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const OrderFlight = require('../models/OrderFlight');
const Flight = require("../models/Flight");
const { generateVNPayUrl } = require('../utils/vnpay');
const config = require('config');
const crypto = require('crypto');
const querystring = require('qs');
const moment = require('moment'); // Import moment

// Other imports and code...


// Dynamic import for dateformat

  // POST /api/bookings
  // Lưu thông tin đặt vé vào cơ sở dữ liệu
  async function sendEmail(order) {
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'nguyenanhtu3703@gmail.com',
        pass: 'ietj qlee vvwb dtce',
      },
    });

    const mailOptions = {
      from: 'nguyenanhtu3703@gmail.com',
      to: order.contactInfo.email,
      subject: 'Payment Confirmation',
      text: `Your payment for order ${order._id} has been received successfully.`
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully');
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

  // Utility function to sort object keys
// Định nghĩa route POST để tạo URL thanh toán
router.post('/create_payment_url', async (req, res) => {
  process.env.TZ = 'Asia/Ho_Chi_Minh'; // Thiết lập múi giờ cho server

  const { orderId, bankCode, orderDescription, orderType, language } = req.body;

  try {
    console.log('Received orderId:', orderId); // In ra console để kiểm tra orderId nhận được

    // Tìm kiếm đơn hàng bằng orderId
    const order = await OrderFlight.findById(orderId);
    if (!order) {
      console.error('Order not found for orderId:', orderId); // In ra lỗi nếu không tìm thấy đơn hàng
      return res.status(404).send('Order not found'); // Trả về lỗi 404 nếu không tìm thấy đơn hàng
    }

    // Lấy địa chỉ IP của client
    const ipAddr =
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;

    // Lấy các thông tin cấu hình cho VNPay từ file cấu hình
    const tmnCode = config.get('vnp_TmnCode');
    const secretKey = config.get('vnp_HashSecret');
    const vnpUrl = config.get('vnp_Url');
    const returnUrl = config.get('vnp_ReturnUrl');

    const date = new Date();
    const createDate = moment(date).format('YYYYMMDDHHmmss'); // Sử dụng moment để định dạng ngày giờ
    const orderTxnRef = orderId.toString(); // Chuyển orderId thành chuỗi
    const amount = order.totalPrice; // Lấy tổng giá trị đơn hàng
    const locale = language || 'vn'; // Thiết lập ngôn ngữ (mặc định là 'vn')

    // Tạo đối tượng vnp_Params với các tham số cần thiết
    let vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: locale,
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderTxnRef,
      vnp_OrderInfo: orderDescription,
      vnp_OrderType: orderType,
      vnp_Amount: amount * 100, // Chuyển đổi thành tiền tệ VNĐ
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    // Thêm mã ngân hàng nếu có
    if (bankCode) {
      vnp_Params.vnp_BankCode = bankCode;
    }

    // Sắp xếp các thuộc tính của đối tượng theo thứ tự bảng chữ cái
    vnp_Params = sortObject(vnp_Params);

    // Tạo chữ ký HMAC SHA512 để bảo mật dữ liệu
    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    vnp_Params.vnp_SecureHash = signed; // Thêm chữ ký vào tham số
    const paymentUrl = `${vnpUrl}?${querystring.stringify(vnp_Params, { encode: false })}`; // Tạo URL thanh toán

    console.log('Generated payment URL:', paymentUrl); // In ra URL thanh toán đã tạo

    res.json({ paymentUrl }); // Trả về URL thanh toán cho client
  } catch (error) {
    console.error('Error creating payment URL:', error); // In ra lỗi nếu có
    res.status(500).send('Internal Server Error'); // Trả về lỗi 500 nếu có lỗi xảy ra
  }
});

// Route để xử lý phản hồi từ VNPay
router.get('/vnpay_return', async (req, res) => {
  const { vnp_ResponseCode, vnp_TxnRef } = req.query;

  try {
    // Xử lý phản hồi từ VNPay
    if (vnp_ResponseCode === '00') {
      // Nếu thanh toán thành công, cập nhật trạng thái đơn hàng
      const updatedOrder = await OrderFlight.findByIdAndUpdate(
        vnp_TxnRef, // Đảm bảo rằng vnp_TxnRef là _id của đơn hàng
        { $set: { status: 'paid' } },
        { new: true }
      );

      if (!updatedOrder) {
        console.error('Failed to update order status after successful payment'); // In ra lỗi nếu không cập nhật được trạng thái đơn hàng
        return res.status(500).send('Internal Server Error'); // Trả về lỗi 500 nếu không cập nhật được trạng thái đơn hàng
      }

      // Gửi email xác nhận hoặc thực hiện các hành động phù hợp
      sendOrderConfirmationEmail(updatedOrder); // Hàm gửi email xác nhận đơn hàng

      // Chuyển hướng đến trang thành công trên frontend
      return res.redirect(`http://localhost:3001/paymentflightsuccess?orderId=${vnp_TxnRef}`);
    } else {
      // Nếu thanh toán thất bại, xử lý tương ứng (chuyển hướng đến trang thất bại)
      return res.redirect(`http://localhost:3001/paymentflightfailure?orderId=${vnp_TxnRef}`);
    }
  } catch (error) {
    console.error('Error handling VNPay return:', error); // In ra lỗi nếu có
    return res.status(500).send('Internal Server Error'); // Trả về lỗi 500 nếu có lỗi xảy ra
  }
});

// Hàm hỗ trợ để sắp xếp các thuộc tính của đối tượng theo thứ tự bảng chữ cái
function sortObject(obj) {
  return Object.keys(obj).sort().reduce((result, key) => {
    result[key] = obj[key];
    return result;
  }, {});
}

// Function to send confirmation email
async function sendOrderConfirmationEmail(order) {
  try {
    const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'nguyenanhtu3703@gmail.com',
    pass: 'ietj qlee vvwb dtce',
  },
});

    const mailOptions = {
      from: 'nguyenanhtu3703@gmail.com', // Update with your Gmail account
      to: order.contactInfo.email,
      subject: 'Payment Confirmation',
      text: `Your payment for order ${order._id} has been received successfully.\n\nOrder Details:\nFrom: ${order.flightDetails.from}\nTo: ${order.flightDetails.to}\nDeparture Date: ${new Date(order.flightDetails.departureDate).toLocaleString()}\nNumber of Adults: ${order.flightDetails.numAdults}\nNumber of Children: ${order.flightDetails.numChildren}\nSeat Class: ${order.flightDetails.seatClass}\nTotal Price: ${order.totalPrice} VND\n\nContact Information:\nName: ${order.contactInfo.name}\nPhone: ${order.contactInfo.phone}\nEmail: ${order.contactInfo.email}\n\nPassenger Information:\n${order.passengerInfo.map(passenger => `Name: ${passenger.name}\nAge: ${passenger.age}\nType: ${passenger.type}\n`).join('\n')}`,
    };

    await transporter.sendMail(mailOptions);
    console.log('Confirmation email sent to', order.contactInfo.email);
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    throw error;
  }
}

async function sendPaymentSuccessEmail(order) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'nguyenanhtu3703@gmail.com',
      pass: 'ietj qlee vvwb dtce'
    }
  });

  const emailContent = `
    Payment successful! Here are your order details:
    From: ${order.flightDetails.from}
    To: ${order.flightDetails.to}
    Departure Date: ${new Date(order.flightDetails.departureDate).toLocaleString()}
    Number of Adults: ${order.flightDetails.numAdults}
    Number of Children: ${order.flightDetails.numChildren}
    Seat Class: ${order.flightDetails.seatClass}
    Total Price: ${order.totalPrice} VND
    Contact Info:
    Name: ${order.contactInfo.name}
    Phone: ${order.contactInfo.phone}
    Email: ${order.contactInfo.email}
    Passenger Info:
    ${order.passengerInfo.map(passenger => `
      Name: ${passenger.name}
      Age: ${passenger.age}
      Type: ${passenger.type}
    `).join('\n')}
  `;

  const mailOptions = {
    from: 'nguyenanhtu3703@gmail.com',
    to: order.contactInfo.email,
    subject: 'Payment Flight Success',
    text: emailContent
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Payment success email sent successfully');
  } catch (error) {
    console.error('Error sending payment success email:', error);
  }
}

function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
  }
  return sorted;
}

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

  // Route to create new booking
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

  // Route to update order status and decrement seat count
  router.put("/:id/status", async (req, res) => {
    try {
      const order = await OrderFlight.findById(req.params.id);
      if (!order) {
        return res.status(404).send("Order not found");
      }

      console.log("Order before update:", order);

      // Update order status
      order.status = req.body.status;
      await order.save();

      console.log("Order after update:", order);

      // Decrement seat count
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

  // Route to fetch all orders
  router.get('/', async (req, res) => {
    try {
      const orders = await OrderFlight.find();
      res.status(200).json(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
  });

  // Route to fetch a specific order by orderId
  router.get('/:orderId', async (req, res) => {
  try {
    const order = await OrderFlight.findById(req.params.orderId);
    if (!order) {
      return res.status(404).send('Order not found');
    }
    res.send(order);
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/update_status', async (req, res) => {
  const { orderId, status } = req.body;
  try {
    const order = await OrderFlight.findByIdAndUpdate(orderId, { status }, { new: true });
    if (!order) {
      return res.status(404).send('Order not found');
    }
    res.send(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/send_confirmation_email', async (req, res) => {
  const { orderId } = req.body;
  try {
    const order = await OrderFlight.findById(orderId);
    if (!order) {
      return res.status(404).send('Order not found');
    }

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'nguyenanhtu3703@gmail.com',
        pass: 'ietj qlee vvwb dtce',
      },
    });

    const mailOptions = {
      from: 'nguyenanhtu3703@gmail.com',
      to: order.contactInfo.email,
      subject: 'Payment Confirmation',
      text: `Your payment for order ${order._id} has been received successfully.\n\nOrder Details:\nFrom: ${order.flightDetails.from}\nTo: ${order.flightDetails.to}\nDeparture Date: ${new Date(order.flightDetails.departureDate).toLocaleString()}\nNumber of Adults: ${order.flightDetails.numAdults}\nNumber of Children: ${order.flightDetails.numChildren}\nSeat Class: ${order.flightDetails.seatClass}\nTotal Price: ${order.totalPrice} VND\n\nContact Information:\nName: ${order.contactInfo.name}\nPhone: ${order.contactInfo.phone}\nEmail: ${order.contactInfo.email}\n\nPassenger Information:\n${order.passengerInfo.map(passenger => `Name: ${passenger.name}\nAge: ${passenger.age}\nType: ${passenger.type}\n`).join('\n')}`,
    };

    await transporter.sendMail(mailOptions);
    res.send('Confirmation email sent');
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
