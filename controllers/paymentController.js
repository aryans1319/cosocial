const asyncHandler = require("express-async-handler");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../models/payment");

const checkOut = asyncHandler(async (req, res) => {
  try {
    const options = {
      amount: Number(req.body.amount * 100),
      currency: "INR",
    };
    console.log("Amount", req.body.amount);
    console.log("Options", options);
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_API_KEY,
      key_secret: process.env.RAZORPAY_API_SECRET_KEY,
    });
    const order = await instance.orders.create(options);
    console.log("Order", order);
    res.status(200).json({
      success: true,
      message: "Credits Purchased successfully",
      order,
    });
  } catch (error) {
    console.log("err", error);
    res.status(500).send(error);
  }
});

const paymentVerification = asyncHandler(async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    console.log("Request", req.body);

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_API_SECRET_KEY)
      .update(body.toString())
      .digest("hex");

    console.log("Expected Signature", expectedSignature);

    const isAuthentic = expectedSignature === razorpay_signature;
    console.log("isAuthentic", isAuthentic);
    if (isAuthentic) {
      await Payment.create({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });
      res.redirect(`http://localhost:3000/playground`);
    } else {
      res.status(400).json({
        success: false,
      });
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = {
  checkOut,
  paymentVerification,
};
