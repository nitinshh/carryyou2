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

  router.get("/adminDetail", controller.userController.adminDetail)
  router.post('/signUp', controller.userController.signUp);
  router.post('/login', controller.userController.login);
  router.post('/logout', authentication, controller.userController.logOut);
  router.post("/forgetPassword", controller.userController.forgetPassword)
  router.post("/forgetPasswordUpdate", controller.userController.forgetPasswordUpdate)
  router.post('/changePassword', authentication, controller.userController.changePassword);
  router.post('/otpVerify', controller.userController.otpVerify);
  router.post('/resendOtp', controller.userController.resendOtp);
  router.post("/cms", authentication, controller.userController.cms)
  router.get("/faq", authentication, controller.userController.faq)
  router.put("/updateProfile", authentication, controller.userController.updateProfile)
  router.post("/deleteUser", authentication, controller.userController.deleteUser)
  router.get("/getUserDetail", authentication, controller.userController.getUserDetail)
  router.get("/dashboardData", authentication, controller.userController.dashboardData)
  router.put("/notificationStatusChange", authentication, controller.userController.notificationStatusChange)

  router.get("/productList", authentication, controller.userController.productList)
  router.get("/productDetails", authentication, controller.userController.productDetails)

  router.get("/postalCodeList", authentication, controller.userController.postalCodeList)
  router.get('/cityList', authentication, controller.userController.cityList);


  router.post("/userAddressAdd", authentication, controller.userController.userAddressAdd)
  router.get("/userAddressList", authentication, controller.userController.userAddressList)
  router.put("/userAddressEdit", authentication, controller.userController.userAddressEdit)
  router.delete("/userAddressDelete", authentication, controller.userController.userAddressDelete)
  router.get("/userAddressDetail", authentication, controller.userController.userAddressDetail)

  router.post("/addToCart", authentication, controller.userController.addToCart)
  router.get("/getCart", authentication, controller.userController.getCart)
  router.delete("/removeFromCart", authentication, controller.userController.removeFromCart)
  router.put("/updateCartQuantity", authentication, controller.userController.updateCartQuantity)
  router.post("/placeOrder", authentication, controller.userController.placeOrder)
  router.get("/getOrders", authentication, controller.userController.getOrders)
  router.post("/getOrderDetails", authentication, controller.userController.getOrderDetails)

  router.post("/customerSupport", authentication, controller.userController.customerSupport)

  router.get(
    "/stripeDetailReturn",
    controller.userController.stripeDetailReturn
  );
  router.post(
    "/stripeIntent",
    authentication,
    controller.userController.stripeIntent
  );
  router.post("/stripeWebhook", controller.userController.stripeWebhook(io));

  //driver side
  router.post("/isOnlineStatusChange", authentication, controller.userController.isOnlineStatusChange)
  router.get("/dashboardDataDriver", authentication, controller.userController.dashboardDataDriver)
  
  return router
}

