var express = require('express');
var router = express.Router();
const controller = require('../controllers/index');
const {authentication,forgotPasswordVerify} = require('../middlewares/authentication');

module.exports=function(){
     router.post('/login', controller.frontendController.login);
     router.use(authentication)
     router.post('/logOut',controller.frontendController.logOut);
     router.put("/updateProfile",controller.frontendController.updateProfile)
     router.put("/changePassword",controller.frontendController.changePassword)
     router.get("/dashboard",controller.frontendController.dashboard)
     router.get("/allUser",controller.frontendController.allUser)
     router.get("/getDetail/:id",controller.frontendController.getDetail)
     router.put("/userStatusChange",controller.frontendController.userStatusChange) 

     router.get("/userDetail/:id", controller.frontendController.userDetail)

     router.get("/beginnerUsersList", controller.frontendController.beginnerUsersList)
     router.get("/viewUser/:id", controller.frontendController.viewUser)
     router.delete("/deleteUser/:id", controller.frontendController.deleteUser)

     router.get("/beginnerUsersPositions", controller.frontendController.beginnerUsersPositions)
     router.post("/beginnerUserCreate", controller.frontendController.beginnerUserCreate)
     router.put("/beginnerUserUpdate", controller.frontendController.beginnerUserUpdate)
     router.get("/beginnerUserDetail/:id", controller.frontendController.beginnerUserDetail)

     router.get("/advanceUsersPositions", controller.frontendController.advanceUsersPositions)
     router.post("/advanceUserCreate", controller.frontendController.advanceUserCreate)
     router.put("/advanceUserUpdate", controller.frontendController.advanceUserUpdate)
     router.get("/advanceUserDetail/:id", controller.frontendController.advanceUserDetail)
     router.get("/advanceUsersList", controller.frontendController.advanceUsersList)


     // Banners Routes
     router.get("/bannerList", controller.frontendController.bannerList);
     router.post("/addBanner", controller.frontendController.addBanner);
     router.delete("/deleteBanner/:id", controller.frontendController.deleteBanner);

     return router
}
