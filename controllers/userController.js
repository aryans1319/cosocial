const { User, GoogleUser } = require("../models/index");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");

const signUp = asyncHandler(async (req, res) => {
  if (req.body.googleAccessToken) {
    // google oauth
    axios
      .get("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: {
          Authorization: `Bearer ${req.body.googleAccessToken}`,
          "accept-encoding": "*",
        },
      })
      .then(async (response) => {
        const username = response.data.given_name;
        const email = response.data.email;    
        const alreadyExistingUser = await GoogleUser.findOne({
          email: email,
        });

        if (alreadyExistingUser) {
          return res.status(400).json({
            message: "User Already Exists!",
          });
        }

        const newGoogleUser = await GoogleUser.create({
          email,
          username,
        });

        const token = jwt.sign(
          {
            email,
            username,
          },
          process.env.ACCESS_TOKEN_SECRET
        );

        res.status(200).json({
          newGoogleUser,
          token,
        });
      })
      .catch((error) => {
        res.status(400).json({
          message: "Invalid Credentials",
        });
      });
  } else {
    const { email, password } = req.body;

    try {
      if (!(email && password )) {
        return res.status(400).json({
          message: "All fields are compulsory",
        });
      }

      const existingUser = await User.findOne({
        email: email,
      });

      if (existingUser) {
        return res.status(400).json({
          message: "User already exists",
        });
      }
      const userID = uuidv4();
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await User.create({
        email: email,
        password: hashedPassword,
        userID: userID,
      });

      res.status(201).json({
        user: newUser,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Something went wrong",
      });
    }
  }
});
const signIn = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  try {
    const cookies = req.cookies;
    if (!(email && password)) {
      return res.status(400).json({
        message: "All fields are compulsory",
      });
    }
    const existingUser = await User.findOne({ email: email }).exec();

    if (!existingUser) {
      return res.status(404).json({
        message: "User not found! Signup Now",
      });
    }

    const matchedPassword = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (!matchedPassword) {
      return res.status(400).json({
        message: "Invalid Credentials",
      });
    }

    const accessTokenPayload = {
      UserInfo: {
        userID: existingUser._id.toString(),
        username: existingUser.email,
      },
    };

    const accessToken = jwt.sign(
      accessTokenPayload,
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    const newRefreshToken = jwt.sign(
      { username: existingUser.email },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "15s" }
    );

    let newRefreshTokenArray = !cookies.jwt
      ? existingUser.refreshToken
      : existingUser.refreshToken.filter(
          (newToken) => newToken !== cookies.jwt
        );

    if (cookies.jwt) {
      /*
        - User logs in but never uses Refresh token and does not logout
        - Refresh token is stolen
        - if 1 & 2, reuse detection is needed to clear all RTs when user logs in
      */
      const refreshToken = cookies.jwt;
      const foundToken = await User.findOne({
        refreshToken,
      }).exec();
      if (!foundToken) {
        console.log("attempted refresh token reuse at login!");
        newRefreshTokenArray = [];
      }
      res.clearCookie("jwt", {
        httpOnly: true,
        sameSite: "none",
        secure: false,
      });
    }
    existingUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
    const result = await existingUser.save();
    res.cookie("jwt", newRefreshToken, {
      maxAge: 1000 * 60 * 60 * 24,
      sameSite: "none",
      httpOnly: true,
      secure: false,
    });
    res.status(200).json({
      accessToken: accessToken,
      userID: existingUser._id,
      message: "Login Successful",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
});

const signOut = asyncHandler(async (req, res) => {
  const cookies = req.cookies;
  if (!cookies.jwt) {
    res.status(204).json({
      message: "No cookies",
    });
  }

  const refreshToken = cookies.jwt;
  // Is refresh token in DB?
  const existingUser = await User.findOne({ refreshToken }).exec();
  if (!existingUser) {
    res.clearCookie("jwt", {
      httpOnly: true,
      sameSite: "none",
      secure: false,
    });
    res.status(204).json({
      message: "Logged Out",
    });
  }
  // Delete refresh token in the database
  existingUser.refreshToken = existingUser.refreshToken.filter(
    (newToken) => newToken !== refreshToken
  );
  const result = await existingUser.save();
  console.log(result);
  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: "none",
    secure: false,
  });
});

const handleRefreshToken = asyncHandler(async (req, res) => {
  const cookies = req.cookies;

  if (!cookies.jwt) return res.status(401).json({ message: "Unauthorized" });
  const refreshToken = cookies.jwt;
  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: "none",
    secure: false,
  });
  const existingUser = await User.findOne({ refreshToken }).exec();
  // Detected Refresh Token reuse
  if (!existingUser) {
    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, async (err, decoded) => {
      if (err || existingUser.email !== decoded.email) {
        return res.status(403).json({
          message: "Forbidden",
        });
      }
      console.log("attempted refresh token reuse");
      const hackedUser = await User.findOne({
        email: decoded.email,
      }).exec();
      hackedUser.refreshToken = [];
      const result = await hackedUser.save();
      console.log(result);
    });
    return res.status(403).json({
      message: "Unauthorized",
    });
  }
  const newRefreshTokenArray = existingUser.refreshToken.filter(
    (newToken) => newToken !== refreshToken
  );
  jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, async (err, decoded) => {
    if (err) {
      console.log("Expired refresh token");
      existingUser.refreshToken = [...newRefreshTokenArray];
      const result = await existingUser.save();
      console.log(result);
    }
    if (err || existingUser.email !== decoded.email)
      return res.status(403).json({ message: "Forbidden" });
    // Refresh token was still valid
    const accessToken = jwt.sign(
      {
        UserInfo: {
          email: existingUser.email,
        },
      },
      ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    const newRefreshToken = jwt.sign(
      { username: existingUser.email },
      REFRESH_TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    existingUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
    const result = await existingUser.save();
    res.cookie("jwt", newRefreshToken, {
      maxAge: 1000 * 60 * 60 * 24,
      sameSite: "none",
      httpOnly: true,
      secure: false,
    });
    res.json({ accessToken });
  });
});

module.exports = {
  signIn,
  signUp,
  signOut,
  handleRefreshToken,
};
