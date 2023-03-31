const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const apiRoutes = require("./routes/index");
const connectDB = require("./config/db");
// const auth = require('./middlewares/auth.js')

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

connectDB();

// const instance = new Razorpay ({
//     key_id: process.env.RAZORPAY_API_KEY ,
//     key_secret: process.env.RAZORPAY_API_SECRET_KEY,
// });

app.use("/api", apiRoutes);

app.get("/", (req, res) => {
  res.send("Hi API is working fine");
});
// app.use(auth);

app.get("/payment/getkey", (req, res) => {
  res.status(200).json({
    key: process.env.RAZORPAY_API_KEY,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, console.log(`Server Running Successfully on ${PORT}`));
