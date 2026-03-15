var express = require('express');
var router = express.Router();
const controller = require('../controllers/index');
const { authentication, forgotPasswordVerify } = require('../middlewares/authentication');
const passport = require("passport")
module.exports = function (io) {
  router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
  );

  router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/' }),
    (req, res) => {
      const result = req.user;
      const userData = result.userData;
      const encodedData = encodeURIComponent(JSON.stringify(userData));
      return res.redirect(`${process.env.FRONTEND_URL}/login?userData=${encodedData}`);
    }
  );

  router.get("/facebook", passport.authenticate("facebook", { scope: ['email'] }));
  router.get(
    "/facebook/callback",
    passport.authenticate("facebook", { failureRedirect: `${process.env.FRONTEND_URL}/login`, session: false }),
    (req, res) => {
      const result = req.user;
      const userData = result.userData;
      const encodedData = encodeURIComponent(JSON.stringify(userData));
      return res.redirect(`${process.env.FRONTEND_URL}/login?userData=${encodedData}`);
    }
  );


  router.get("/apple", passport.authenticate("apple", { scope: ['email'] }));
  router.get(
    "/apple/callback",
    passport.authenticate("apple", { failureRedirect: `${process.env.FRONTEND_URL}/login`, session: false }),
    (req, res) => {
      const result = req.user;
      const userData = result.userData;
      const encodedData = encodeURIComponent(JSON.stringify(userData));
      return res.redirect(`${process.env.FRONTEND_URL}/login?userData=${encodedData}`);
    }
  );
  router.post("/test",controller.frontendController.addTypeOfVechile)

  router.post('/signUp', controller.userController.signUp);
  router.post('/login', controller.userController.login);
  router.post("/licenceDetailAdd",authentication,controller.userController.licenceDetailAdd)
  router.post('/logout', authentication, controller.userController.logOut);
  router.post('/forgotPassword', controller.userController.forgotPassword);
  router.post('/resendForgotPasswordLink', controller.userController.resendForgotPasswordLink);
  router.get('/resetPassword', forgotPasswordVerify, controller.userController.resetPassword);
  router.post('/forgotChangePassword', controller.userController.forgotChangePassword);
  router.post('/changePassword', authentication, controller.userController.changePassword);
  router.post('/otpVerify', controller.userController.otpVerify);
  router.post('/resendOtp', controller.userController.resendOtp);
  router.post("/cms", authentication, controller.userController.cms)
  router.put("/updateProfile", authentication, controller.userController.updateProfile)
  router.put("/licenceDetailUpdate",authentication,controller.userController.licenceDetailUpdate)
  router.put("/vehicleInformationUpdate",authentication,controller.userController.vehicleInformationUpdate)
  router.post("/deleteUser", authentication, controller.userController.deleteUser)
  router.get("/getUserDetail", authentication, controller.userController.getUserDetail)
  router.put("/notificationStatusChange", authentication, controller.userController.notificationStatusChange)
  router.post("/isOnlineStatusChange", authentication, controller.userController.isOnlineStatusChange)
  router.post("/updateUserLocation",authentication,controller.userController.updateUserLocation),
  router.get("/driverList",authentication,controller.userController.driverList)

  // booking regarding api

  router.get("/getTypeOfVechileList" ,controller.userController.getTypeOfVechileList)
  router.post("/getPriceListWithVechile",controller.userController.getPriceListWithVechile)
  router.post("/createBooking",authentication,controller.userController.createBooking(io))
  router.get("/bookingList",authentication,controller.userController.bookingList)
  router.post("/bookingAcceptReject",authentication,controller.userController.bookingAcceptReject(io))
  router.post("/bookingStatusChange",authentication,controller.userController.bookingStatusChange(io))
  router.post("/itemLoastStatusChange",authentication,controller.userController.itemLoastStatusChange(io))
  router.get("/driverWallet",authentication,controller.userController.driverWallet)
  router.post("/ratingDriver",authentication,controller.userController.ratingDriver)
  router.get("/bookingDetail",authentication,controller.userController.bookingDetail)
  router.get("/bookingJobHistory",authentication,controller.userController.bookingJobHistory)
  router.get("/reviewsListing",authentication,controller.userController.reviewsListing)
  router.get(
    "/stripeDetailReturn",
    controller.userController.stripeDetailReturn
  );
  router.post("/webHookFrontEnd",controller.userController.webHookFrontEnd(io))
  router.post(
    "/stripeIntent",
    authentication,
    controller.userController.stripeIntent
  );
  router.post("/stripeWebhook", controller.userController.stripeWebhook(io));

  router.post("/stripeConnect", authentication, controller.userController.addStripeAccount)
  router.get("/stripeConnectUrl", controller.userController.stripeConnectReturnUrl)
  router.post("/withdrawAmount", authentication, controller.userController.withdrawAmount(io))
 
  router.get("/couponCodeList",authentication,controller.userController.couponCodeList)
  router.post("/applyCouponCode",authentication,controller.userController.applyCouponCode)
  router.post("/submitLostItemRequestDriver",authentication,controller.userController.submitLostItemRequestDriver)
  router.post("/sendRequestToAdminByUser",authentication,controller.userController.sendRequestToAdminByUser)
  router.post("/driverFoundItemConfimByUser",authentication,controller.userController.driverFoundItemConfimByUser)
  router.post("/driverHaveItemConfimByDriver",authentication,controller.userController.driverHaveItemConfimByDriver)
  router.get("/getLostItemRequest",authentication,controller.userController.getLostItemRequest)
  router.post("/payAmountStripeForLostItem",authentication,controller.userController.payAmountStripeForLostItem(io))
  router.post("/webHookFrontEndLostItem",authentication,controller.userController.webHookFrontEndLostItem(io))
  return router
}

