var express = require('express');
var router = express.Router();
const controller = require('../controllers/index');
const {authentication} = require('../middlewares/authentication');

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

     router.delete("/deleteUser/:id", controller.frontendController.deleteUser)

     // Banners Routes
     router.get("/bannerList", controller.frontendController.bannerList);
     router.post("/addBanner", controller.frontendController.addBanner);
     router.delete("/deleteBanner/:id", controller.frontendController.deleteBanner);

     router.post("/addTypeOfVechile",controller.frontendController.addTypeOfVechile)
     router.get("/getTypeOfVechleList",controller.frontendController.getTypeOfVechileList)
     router.put("/updateTypeOfVechile",controller.frontendController.updateTypeOfVechile)
     router.delete("/deleteTypeOfVechile",controller.frontendController.deleteTypeOfVechile)

     return router
}
