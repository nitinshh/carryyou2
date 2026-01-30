var express = require('express');
var router = express.Router();
const controller = require('../controllers/index');
const {authentication} = require('../middlewares/authentication');

module.exports=function(){
     router.post('/login', controller.frontendController.login);
     // router.use(authentication)
     router.post('/logOut',controller.frontendController.logOut);
     router.put("/updateProfile",controller.frontendController.updateProfile)
     router.put("/changePassword",controller.frontendController.changePassword)
     router.get("/dashboard",controller.frontendController.dashboard)
     router.get("/allUser",controller.frontendController.allUser)
     router.get("/allDriver",controller.frontendController.allDriver)
     router.put("/approveRejectDriver",controller.frontendController.approveRejectDriver)
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
     router.get("/getDetailTypeOfVechile/:id",controller.frontendController.getDetailTypeOfVechile)
     router.put("/updateTypeOfVechile",controller.frontendController.updateTypeOfVechile)
     router.delete("/deleteTypeOfVechile/:id",controller.frontendController.deleteTypeOfVechile)


     router.get("/cms/:type",controller.frontendController.cms)
     router.put("/cmsUpdate",controller.frontendController.cmsUpdate)
     // router.get("/cmsCreate",controller.frontendController.cmsCreate)

     router.get("/contactUsList",controller.frontendController.contactUsList)
     router.delete("/contactUsDelete/:id",controller.frontendController.contactUsDelete)
     router.get("/contactUsDetail/:id",controller.frontendController.contactUsDetail)

     return router
}
