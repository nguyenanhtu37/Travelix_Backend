const crypto = require('crypto');
const querystring = require('querystring');

const config = {
  vnp_TmnCode: '0O628SN5', // Replace with your VNPay TmnCode
  vnp_HashSecret: '8IBJCCXDIJN210KK4W4HMOK384MJBOSF', // Replace with your VNPay HashSecret
  vnp_Url: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  vnp_ReturnUrl: 'http://localhost:5000/api/orderflight/vnpay_return'
};

function generateVNPayUrl(order) {
  const { _id, totalPrice, contactInfo } = order;

  const params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: config.vnp_TmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: _id.toString(),
    vnp_OrderInfo: `Payment for order ${_id}`,
    vnp_OrderType: 'other',
    vnp_Amount: totalPrice * 100, // Amount in VND (multiplied by 100)
    vnp_ReturnUrl: config.vnp_ReturnUrl,
    vnp_IpAddr: '127.0.0.1',
    vnp_CreateDate: new Date().toISOString().slice(0, 19).replace(/[-T:]/g, '')
  };

  // Sort the parameters alphabetically
  const sortedParams = {};
  Object.keys(params)
    .sort()
    .forEach(key => {
      sortedParams[key] = params[key];
    });

  const signData = querystring.stringify(sortedParams, { encode: false });
  const hmac = crypto.createHmac('sha512', config.vnp_HashSecret);
  const secureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  const vnpUrl = `${config.vnp_Url}?${querystring.stringify(sortedParams)}&vnp_SecureHash=${secureHash}`;
  return vnpUrl;
}

module.exports = {
  generateVNPayUrl
};
