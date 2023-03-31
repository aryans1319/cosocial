const express = require("express");

const {
  UserController,
  PaymentController,
  CreditController,
  ContentController,
} = require("../../controllers/index");

const router = express.Router();

/*  ----------- User Routes ------------- */

router.post("/signup", UserController.signUp);
router.post("/signin", UserController.signIn);
router.get("/signout", UserController.signOut);
router.get("/refresh", UserController.handleRefreshToken);

/*  ----------- Payment Routes ------------- */

router.post("/check-out", PaymentController.checkOut);
router.post("/verification", PaymentController.paymentVerification);

/*  ----------- Credit Routes ------------- */

router.post("/credit-balance", CreditController.creditBalance);
router.post("/buy-credits", CreditController.purchaseCredits);
router.post("/update-credits", CreditController.reduceCredits);
/*  ----------- Playground Routes ------------- */

router.get("/all-content", ContentController.getAllContent);
router.post("/create", ContentController.createContent);
router.put("/update/:id", ContentController.updateContent);

module.exports = router;
