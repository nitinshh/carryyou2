var express = require('express');
var router = express.Router();
const controller = require('../controllers/index');
const { authentication, forgotPasswordVerify } = require('../middlewares/authentication');
const passport = require("passport")
module.exports = function (io) {

  return router
}

