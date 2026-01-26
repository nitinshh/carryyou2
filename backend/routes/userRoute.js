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
  router.post("/bookingAcceptReject",authentication,controller.userController.bookingAcceptReject)
  router.get(
    "/stripeDetailReturn",
    controller.userController.stripeDetailReturn
  );
  router.post("/webHookFrontEnd",controller.userController.webHookFrontEnd)
  router.post(
    "/stripeIntent",
    authentication,
    controller.userController.stripeIntent
  );
  router.post("/stripeWebhook", controller.userController.stripeWebhook(io));

  
  return router
}

