const Sequelize = require("sequelize");
const PRICING = require("../config/pricing");
const { Op, fn, col, literal } = require("sequelize");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const secretKey = process.env.SECRET_KEY;
const commonHelper = require("../helpers/commonHelper.js");
const helper = require("../helpers/validation.js");
const Models = require("../models/index");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const crypto = require("crypto");
const Response = require("../config/responses.js");

Models.bookingModel.belongsTo(Models.userModel,{foreignKey:"userId",as:"user"})
Models.bookingModel.belongsTo(Models.userModel,{foreignKey:"driverId",as:"driver"})
Models.bookingModel.belongsTo(Models.typeOfVechicleModel,{foreignKey:"typeOfVehicleId"})
Models.ratingModel.belongsTo(Models.userModel,{foreignKey:"userId",as:"user"})
Models.ratingModel.belongsTo(Models.userModel,{foreignKey:"driverId",as:"driver"})
module.exports = {
  signUp: async (req, res) => {
    try {
      const schema = Joi.object().keys({
        fullName: Joi.string().optional(),
        email: Joi.string().email().optional(),
        countryCode: Joi.string().optional(),
        phoneNumber: Joi.string().optional(),
        password: Joi.string().optional(),
        role: Joi.number().valid(1, 2).required(),
        city: Joi.string().optional(),
        country: Joi.string().optional(),
        deviceToken: Joi.string().optional(),
        deviceType: Joi.number().valid(1, 2).optional(),
      });

      let payload = await helper.validationJoi(req.body, schema);

      const { email, password, role } = payload;

      const user = await Models.userModel.findOne({
        where: { email: email, role: role },
        raw: true,
      });

      if (user && role == user.role) {
        return commonHelper.failed(res, Response.failed_msg.userWithEmail);
      }

      /* =======================
         STRIPE CUSTOMER
      ======================== */
      let customerId = null;
      if (payload.email) {
        const customer = await stripe.customers.create({
          description: "User Profile",
          email: payload.email,
        });
        customerId = customer.id;
      }

      /* =======================
         PROFILE IMAGE
      ======================== */
      let image = null;
      if (req.files && req.files.profilePicture) {
        image = await commonHelper.fileUpload(
          req.files.profilePicture,
          "images",
        );
      }

      /* =======================
         OTP SETUP (COMMENTED)
      ======================== */

      // const otp = "1111"; // static for now

      let objToSave = {
        fullName: payload.fullName,
        email: payload.email,
        role: payload.role,
        password: await commonHelper.bcryptData(
          payload.password,
          process.env.SALT,
        ),
        countryCode: payload.countryCode,
        phoneNumber: payload.phoneNumber,
        city: payload.city,
        country: payload.country,
        profilePicture: image,
        customerId: customerId,
        deviceToken: payload.deviceToken,
        deviceType: payload.deviceType,
      };

      let newUser = await Models.userModel.create(objToSave);

      let subject = "OTP";
      let emailLink = "otp";
      const transporter = await commonHelper.nodeMailer();
      const emailTamplate = await commonHelper.forgetPasswordLinkHTML(
        req,
        newUser,
        subject,
        emailLink,
      );
      // await transporter.sendMail(emailTamplate);
      const token = jwt.sign(
        {
          id: newUser.id,
          email: newUser.email,
        },
        secretKey,
      );

      let userDetail = await Models.userModel.findOne({
        where: { id: newUser.id },
        raw: true,
      });

      userDetail.token = token;

      return commonHelper.success(
        res,
        Response.success_msg.otpSend,
        userDetail,
      );
    } catch (error) {
      console.error("Error during signup:", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message,
      );
    }
  },

  login: async (req, res) => {
    try {
      const schema = Joi.object().keys({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
        deviceToken: Joi.string().optional(), // static data, will come from frontend
        deviceType: Joi.number().valid(1, 2).optional(),
        role: Joi.number().valid(1, 2).required(),
      });
      let payload = await helper.validationJoi(req.body, schema);

      const { email, password, role } = payload;

      const user = await Models.userModel.findOne({
        where: { email: email, role: role },
        raw: true,
      });

      if (!user) {
        return commonHelper.failed(res, Response.failed_msg.invalidCrd);
      }
      if (user && user.role == 2 && user.adminApprovalStatus == 0) {
        return commonHelper.failed(res, Response.failed_msg.accNotAppoved);
      }
      if (user && user.role == 2 && user.adminApprovalStatus == 2) {
        return commonHelper.failed(res, Response.failed_msg.accReject);
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return commonHelper.failed(res, Response.failed_msg.invalidPassword);
      }
      let customerId = user.customerId;
      if (user.customerId == null) {
        const customer = await stripe.customers.create({
          description: "User Profile",
          email: user.email,
        });
        customerId = customer.id;
      }
      await Models.userModel.update(
        {
          deviceToken: payload.deviceToken,
          deviceType: payload.deviceType,
          customerId: customerId,
        },
        {
          where: {
            id: user.id,
          },
        },
      );
      let userDetail = await Models.userModel.findOne({
        where: { email: email },
        raw: true,
      });
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
        },
        secretKey,
      );
      userDetail.token = token;

      return commonHelper.success(res, Response.success_msg.login, userDetail);
    } catch (err) {
      console.error("Error during login:", err);
      return commonHelper.error(res, Response.error_msg.intSerErr, err.message);
    }
  },

  licenceDetailAdd: async (req, res) => {
    try {
      let licenceFrontImage = null;
      if (req.files || req.files.licenceFrontImage) {
        licenceFrontImage = await commonHelper.fileUpload(
          req.files.licenceFrontImage,
          "images",
        );
      }
      let licenceBackImage = null;
      if (req.files || req.files.licenceBackImage) {
        licenceBackImage = await commonHelper.fileUpload(
          req.files.licenceBackImage,
          "images",
        );
      }
      let pictureOfVehicle = null;
      if (req.files || req.files.pictureOfVehicle) {
        pictureOfVehicle = await commonHelper.fileUpload(
          req.files.pictureOfVehicle,
          "images",
        );
      }
      let vehicleRegistrationImage = null;
      if (req.files || req.files.vehicleRegistrationImage) {
        vehicleRegistrationImage = await commonHelper.fileUpload(
          req.files.vehicleRegistrationImage,
          "images",
        );
      }
      let insurancePolicyImage = null;
      if (req.files || req.files.insurancePolicyImage) {
        insurancePolicyImage = await commonHelper.fileUpload(
          req.files.insurancePolicyImage,
          "images",
        );
      }
      let objToUpate = {
        licenceFrontImage: licenceFrontImage,
        licenceBackImage: licenceBackImage,
        driversLicenseNumber: req.body.driversLicenseNumber,
        pictureOfVehicle: pictureOfVehicle,
        issuedOn: req.body.issuedOn,
        licenceType: req.body.licenceType,
        dob: req.body.dob,
        nationality: req.body.nationality,
        expiryDate: req.body.expiryDate,
        typeOfVehicleId: req.body.typeOfVehicleId,
        vehicleRegistrationImage: vehicleRegistrationImage,
        registrationExpiryDate: req.body.registrationExpiryDate,
        insurancePolicyImage: insurancePolicyImage,
        insuranceExpiryDate: req.body.insuranceExpiryDate,
        vehicleNumber: req.body.vehicleNumber,
      };
      await Models.userModel.update(objToUpate, {
        where: {
          id: req.user.id,
        },
      });
      let userDetail = await Models.userModel.findOne({
        where: {
          id: req.user.id,
        },
      });
      return commonHelper.success(
        res,
        Response.success_msg.userDetail,
        userDetail,
      );
    } catch (error) {
      console.error("Error during signup:", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message,
      );
    }
  },

  logOut: async (req, res) => {
    try {
      const schema = Joi.object().keys({
        deviceToken: Joi.string().optional(), // static data, will come from frontend
        deviceType: Joi.number().valid(1, 2).optional(),
      });
      let payload = await helper.validationJoi(req.body, schema);
      let objToUpate = {
        deviceToken: payload.deviceToken,
      };
      await Models.userModel.update(objToUpate, {
        where: {
          id: req.user.id,
        },
      });
      return commonHelper.success(res, Response.success_msg.logOut);
    } catch (error) {
      console.error("Error during login:", err);
      return commonHelper.error(res, Response.error_msg.intSerErr, err.message);
    }
  },

  forgotPassword: async (req, res) => {
    try {
      const schema = Joi.object().keys({
        email: Joi.string().email().required(),
      });
      let payload = await helper.validationJoi(req.body, schema);
      const { email } = payload;
      const user = await Models.userModel.findOne({
        where: { email: email },
      });
      if (!user) {
        return commonHelper.failed(res, Response.failed_msg.noAccWEmail);
      }
      const resetToken = await commonHelper.randomStringGenerate(req, res);
      if (user && user.customerId == null) {
        const customer = await stripe.customers.create({
          description: "Edify",
          email: req.body.email,
        });
        var customerId = customer.id;
      }
      await Models.userModel.update(
        {
          resetToken: resetToken,
          resetTokenExpires: new Date(Date.now() + 3600000), // 1 hour
          customerId: user && user.customerId ? user.customerId : customerId,
        },
        {
          where: {
            email: email,
          },
        },
      );
      const resetUrl = `${req.protocol}://${await commonHelper.getHost(
        req,
        res,
      )}/users/resetPassword?token=${resetToken}`; // Add your URL
      let subject = "Reset Password";
      let emailLink = "forgotPassword";
      const transporter = await commonHelper.nodeMailer();
      const emailTamplate = await commonHelper.forgetPasswordLinkHTML(
        req,
        user,
        resetUrl,
        subject,
        emailLink,
      );
      await transporter.sendMail(emailTamplate);
      return commonHelper.success(res, Response.success_msg.passwordLink);
    } catch (error) {
      console.error("Forgot password error:", error);
      return commonHelper.error(
        res,
        Response.error_msg.forgPwdErr,
        error.message,
      );
    }
  },
  resendForgotPasswordLink: async (req, res) => {
    try {
      const schema = Joi.object().keys({
        email: Joi.string().email().required(),
      });
      let payload = await helper.validationJoi(req.body, schema);
      const { email } = payload;
      const user = await Models.userModel.findOne({
        where: { email: email },
      });
      if (!user) {
        return commonHelper.failed(res, Response.failed_msg.noAccWEmail);
      }
      const resetToken = await commonHelper.randomStringGenerate(req, res);
      await Models.userModel.update(
        {
          resetToken: resetToken,
          resetTokenExpires: new Date(Date.now() + 3600000), // 1 hour
        },
        {
          where: {
            email: email,
          },
        },
      );
      const resetUrl = `${req.protocol}://${await commonHelper.getHost(
        req,
        res,
      )}/users/resetPassword?token=${resetToken}`; // Add your URL
      let subject = "Reset Password";
      const transporter = await commonHelper.nodeMailer();
      const emailTamplate = await commonHelper.forgetPasswordLinkHTML(
        req,
        user,
        resetUrl,
        subject,
      );
      await transporter.sendMail(emailTamplate);
      return commonHelper.success(res, Response.success_msg.passwordLink);
    } catch (error) {
      console.error("Forgot password error:", error);
      return commonHelper.error(
        res,
        Response.error_msg.forgPwdErr,
        error.message,
      );
    }
  },
  resetPassword: async (req, res) => {
    try {
      let data = req.user;
      res.render("changePassword", { data: data });
    } catch (error) {
      console.error("Reset password error:", error);
      return commonHelper.error(
        res,
        Response.error_msg.resetPwdErr,
        error.message,
      );
    }
  },
  forgotChangePassword: async (req, res) => {
    try {
      const schema = Joi.object().keys({
        id: Joi.string().required(),
        newPassword: Joi.string().required(),
        confirmPassword: Joi.string().required(),
      });

      let payload = await helper.validationJoi(req.body, schema);
      //Destructing the data
      const { id, newPassword, confirmPassword } = payload;

      if (newPassword !== confirmPassword) {
        return commonHelper.failed(res, Response.failed_msg.pwdNoMatch);
      }

      const user = await Models.userModel.findOne({
        where: { id: id },
        raw: true,
      });
      if (!user) {
        return commonHelper.failed(res, Response.failed_msg.userNotFound);
      }

      const hashedNewPassword = await commonHelper.bcryptData(
        newPassword,
        process.env.SALT,
      );

      await Models.userModel.update(
        {
          password: hashedNewPassword,
          resetToken: null,
          resetTokenExpires: null,
        },
        { where: { id: id } },
      );

      return res.render("successPassword", {
        message: Response.success_msg.passwordChange,
      });
    } catch (error) {
      console.error("Error while changing the password", error);
      return commonHelper.error(
        res,
        Response.error_msg.chngPwdErr,
        error.message,
      );
    }
  },

  updateProfile: async (req, res) => {
    try {
      let image = null;
      if (req.files && req.files.profilePicture) {
        image = await commonHelper.fileUpload(
          req.files.profilePicture,
          "images",
        );
      }

      // Preserve existing profile picture unless removed or updated
      let profilePicture = req.user.profilePicture;

      if (image) {
        profilePicture = image;
      }

      // Prepare object to update
      const objToSave = {
        fullName: req.body.fullName,
        profilePicture: image ? image : profilePicture,
        phoneNumber: req.body.phoneNumber,
        countryCode: req.body.countryCode,
      };

      await Models.userModel.update(objToSave, {
        where: {
          id: req.user.id,
        },
      });

      const updatedUser = await Models.userModel.findOne({
        where: { id: req.user.id },
        attributes: { exclude: ["password"] },
      });

      return commonHelper.success(
        res,
        Response.success_msg.updateProfile,
        updatedUser,
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message,
      );
    }
  },

  licenceDetailUpdate: async (req, res) => {
    try {
      let licenceFrontImage = null;
      if (req.files || req.files.licenceFrontImage) {
        licenceFrontImage = await commonHelper.fileUpload(
          req.files.licenceFrontImage,
          "images",
        );
      }
      let licenceBackImage = null;
      if (req.files || req.files.licenceBackImage) {
        licenceBackImage = await commonHelper.fileUpload(
          req.files.licenceBackImage,
          "images",
        );
      }
      let objToUpate = {
        licenceFrontImage: licenceFrontImage,
        licenceBackImage: licenceBackImage,
        driversLicenseNumber: req.body.driversLicenseNumber,
        issuedOn: req.body.issuedOn,
        licenceType: req.body.licenceType,
        dob: req.body.dob,
        nationality: req.body.nationality,
        expiryDate: req.body.expiryDate,
      };
      await Models.userModel.update(objToUpate, {
        where: {
          id: req.user.id,
        },
      });
      let userDetail = await Models.userModel.findOne({
        where: {
          id: req.user.id,
        },
      });
      return commonHelper.success(res, Response.success_msg.logOut, userDetail);
    } catch (error) {
      console.error("Error during signup:", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message,
      );
    }
  },

  vehicleInformationUpdate: async (req, res) => {
    try {
      let pictureOfVehicle = null;
      if (req.files || req.files.pictureOfVehicle) {
        pictureOfVehicle = await commonHelper.fileUpload(
          req.files.pictureOfVehicle,
          "images",
        );
      }
      let vehicleRegistrationImage = null;
      if (req.files || req.files.vehicleRegistrationImage) {
        vehicleRegistrationImage = await commonHelper.fileUpload(
          req.files.vehicleRegistrationImage,
          "images",
        );
      }
      let insurancePolicyImage = null;
      if (req.files || req.files.insurancePolicyImage) {
        insurancePolicyImage = await commonHelper.fileUpload(
          req.files.insurancePolicyImage,
          "images",
        );
      }
      let objToUpate = {
        pictureOfVehicle: pictureOfVehicle,
        typeOfVehicleId: req.body.typeOfVehicleId,
        vehicleRegistrationImage: vehicleRegistrationImage,
        registrationExpiryDate: req.body.registrationExpiryDate,
        insurancePolicyImage: insurancePolicyImage,
        insuranceExpiryDate: req.body.insuranceExpiryDate,
        vehicleNumber: req.body.vehicleNumber,
      };
      await Models.userModel.update(objToUpate, {
        where: {
          id: req.user.id,
        },
      });
      let userDetail = await Models.userModel.findOne({
        where: {
          id: req.user.id,
        },
      });
      return commonHelper.success(res, Response.success_msg.logOut, userDetail);
    } catch (error) {
      console.error("Error during signup:", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message,
      );
    }
  },

  changePassword: async (req, res) => {
    try {
      const schema = Joi.object().keys({
        currentPassword: Joi.string().required(),
        newPassword: Joi.string().required(),
      });
      let payload = await helper.validationJoi(req.body, schema);

      const { currentPassword, newPassword } = payload;

      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        req.user.password,
      );

      if (!isPasswordValid) {
        return commonHelper.failed(res, Response.failed_msg.incorrectCurrPwd);
      }

      const hashedNewPassword = await commonHelper.bcryptData(
        newPassword,
        process.env.SALT,
      );

      await Models.userModel.update(
        { password: hashedNewPassword },
        { where: { id: req.user.id } },
      );

      return commonHelper.success(res, Response.success_msg.passwordUpdate);
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message,
      );
    }
  },

  otpVerify: async (req, res) => {
    try {
      const schema = Joi.object({
        email: Joi.string().required(),
        otp: Joi.string().required(),
      });

      const payload = await helper.validationJoi(req.body, schema);
      const { email, otp } = payload;

      // static OTP for now
      const STATIC_OTP = "1111";

      const user = await Models.userModel.findOne({
        where: {
          email,
        },
        raw: true,
      });

      if (!user) {
        return commonHelper.failed(res, Response.failed_msg.userNotFound);
      }

      if (otp !== STATIC_OTP) {
        return commonHelper.failed(res, Response.failed_msg.invalidOtp);
      }

      // mark OTP as verified & activate user
      await Models.userModel.update(
        {
          isOtpVerified: 1,
          status: 1,
        },
        { where: { id: user.id } },
      );

      // generate token (same as login)
      const token = jwt.sign(
        {
          id: user.id,
          phoneNumber: user.phoneNumber,
        },
        secretKey,
      );

      // fetch updated user
      let updatedUser = await Models.userModel.findOne({
        where: { id: user.id },
        raw: true,
      });

      updatedUser.token = token;

      return commonHelper.success(
        res,
        Response.success_msg.otpVerify,
        updatedUser,
      );
    } catch (error) {
      console.log("OTP verify error:", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message,
      );
    }
  },

  resendOtp: async (req, res) => {
    try {
      /* =======================
         VALIDATION (PHONE ONLY)
      ======================== */
      const schema = Joi.object({
        countryCode: Joi.string().optional(),
        phoneNumber: Joi.string().optional(),
      });

      const payload = await helper.validationJoi(req.body, schema);
      const { countryCode, phoneNumber } = payload;

      /* =======================
         USER LOOKUP
      ======================== */
      const user = await Models.userModel.findOne({
        where: {
          countryCode,
          phoneNumber,
        },
      });

      if (!user) {
        return commonHelper.failed(res, Response.failed_msg.userNotFound);
      }
      await Models.userModel.update(
        {
          otpVerify: 0,
        },
        { where: { id: user.id } },
      );
      let subject = "OTP";
      let emailLink = "otp";
      const transporter = await commonHelper.nodeMailer();
      const emailTamplate = await commonHelper.forgetPasswordLinkHTML(
        req,
        user,
        subject,
        emailLink,
      );
      // await transporter.sendMail(emailTamplate);
      return commonHelper.success(res, Response.success_msg.otpResend, {
        countryCode,
        phoneNumber,
      });
    } catch (error) {
      console.error("Error while resending OTP:", error);
      return commonHelper.error(
        res,
        Response.error_msg.otpResErr,
        error.message,
      );
    }
  },

  deleteUser: async (req, res) => {
    try {
      await Models.userModel.destroy({
        where: {
          id: req.user.id,
        },
      });
      return commonHelper.success(res, "User deleted successfully!");
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message,
      );
    }
  },

  getUserDetail: async (req, res) => {
    try {
      let response = await Models.userModel.findOne({
        where: {
          id: req.user.id,
        },
      });
      return commonHelper.success(
        res,
        Response.success_msg.userDetail,
        response,
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message,
      );
    }
  },

  cms: async (req, res) => {
    try {
      // fetch cms by type
      const response = await Models.cmsModel.findOne({
        where: { type: req.body.type },
        raw: true,
      });
      return commonHelper.success(res, Response.success_msg.cms, response);
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message,
      );
    }
  },

  notificationStatusChange: async (req, res) => {
    try {
      const userId = req.user.id; // assuming userId comes from token middleware
      await Models.userModel.update(
        { isNotificationOnOff: req.body.isNotificationOnOff },
        {
          where: { id: userId },
        },
      );
      return commonHelper.success(
        res,
        Response.success_msg.notificationStatusChange,
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message,
      );
    }
  },

  isOnlineStatusChange: async (req, res) => {
    try {
      await Models.userModel.update(
        {
          isOnline: req.body.isOnline,
        },
        {
          where: {
            id: req.user.id,
          },
        },
      );
      return commonHelper.success(res, Response.success_msg.onlineStatusChange);
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message,
      );
    }
  },

  updateUserLocation: async (req, res) => {
    try {
      await Models.userModel.update(
        {
          location: req.body.location,
          latitude: req.body.latitude,
          longitude: req.body.longitude,
        },
        {
          where: {
            id: req.user.id,
          },
        },
      );
      return commonHelper.success(res, Response.success_msg.onlineStatusChange);
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message,
      );
    }
  },

  driverList: async (req, res) => {
    try {
      if (
        (req.user && req.user.latitude == null) ||
        req.user.longitude == null
      ) {
        return commonHelper.failed(res, Response.failed_msg.noLocationAdd);
      }
      const { latitude, longitude } = req.user;
      const radiusInKm = 1; // 1 KM

      const response = await Models.userModel.findAll({
        attributes: {
          include: [
            [
              Sequelize.literal(`
              (6371 * acos(
                cos(radians(${latitude}))
                * cos(radians(latitude))
                * cos(radians(longitude) - radians(${longitude}))
                + sin(radians(${latitude}))
                * sin(radians(latitude))
              ))
            `),
              "distance",
            ],
          ],
        },
        where: {
          role: 2, // drivers only
          status: 1, // active
          isOnline: 1,
          latitude: { [Op.ne]: null },
          longitude: { [Op.ne]: null },
        },
        having: Sequelize.literal(`distance <= ${radiusInKm}`),
        order: Sequelize.literal("distance ASC"),
      });
      return commonHelper.success(
        res,
        Response.success_msg.driverList,
        response,
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message,
      );
    }
  },

  getTypeOfVechileList: async (req, res) => {
    try {
      let response = await Models.typeOfVechicleModel.findAll({
        where: { isDelete: 0 },
      });
      return commonHelper.success(
        res,
        Response.success_msg.typeOfVechileList,
        response,
      );
    } catch (error) {
      console.log("Error:", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message,
      );
    }
  },

  getPriceListWithVechile: async (req, res) => {
    try {
      const { pickUpLatitude, pickUpLongitude, dropLatitude, dropLongitude } =
        req.body;

      if (
        !pickUpLatitude ||
        !pickUpLongitude ||
        !dropLatitude ||
        !dropLongitude
      ) {
        return commonHelper.failed(res, "Lat/Long required");
      }

      // 1️⃣ Distance
      const distanceKm = await commonHelper.getDistanceInKm(
        pickUpLatitude,
        pickUpLongitude,
        dropLatitude,
        dropLongitude,
      );

      const distanceMiles = distanceKm * 0.621371;

      // 2️⃣ Time (estimate)
      const timeMinutes = (distanceKm / PRICING.avgSpeedKmph) * 60;

      // 3️⃣ Get vehicle types
      const vehicles = await Models.typeOfVechicleModel.findAll({
        raw: true,
      });

      // 4️⃣ Calculate price per vehicle
      const priceList = vehicles.map((vehicle) => {
        let fare =
          PRICING.baseFare +
          PRICING.costPerMile * distanceMiles +
          PRICING.costPerMinute * timeMinutes +
          PRICING.serviceFee;

        // Vehicle multiplier (optional)
        if (vehicle.price > 0) {
          fare = fare * vehicle.price;
        }

        // Minimum fare check
        if (fare < PRICING.minimumFare) {
          fare = PRICING.minimumFare;
        }

        return {
          id: vehicle.id,
          name: vehicle.name,
          image: vehicle.image,
          estimatedFare: Number(fare.toFixed(2)),
          distanceKm: Number(distanceKm.toFixed(2)),
          durationMinutes: Math.ceil(timeMinutes),
        };
      });

      return commonHelper.success(
        res,
        Response.success_msg.priceList,
        priceList,
      );
    } catch (error) {
      console.log("getPriceList error:", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message,
      );
    }
  },

  createBooking: (io) => async (req, res) => {
    try {
      const {
        pickUpLatitude,
        pickUpLongitude,
        driverId, // optional (if direct booking)
      } = req.body;
      const otp = Math.floor(1000 + Math.random() * 9000);
      // 1️⃣ Create booking
      const booking = await Models.bookingModel.create({
        userId: req.user.id,
        pickUpLocation: req.body.pickUpLocation,
        pickUpLatitude,
        pickUpLongitude,
        destinationLocation: req.body.destinationLocation,
        destinationLatitude: req.body.destinationLatitude,
        destinationLongitude: req.body.destinationLongitude,
        amount: req.body.amount,
        distance: req.body.distance,
        typeOfVehicleId: req.body.typeOfVehicleId,
        scheduleType: req.body.scheduleType, //1 for instant and 2 for schedule for future
        bookingDate: req.body.bookingDate || null,
        bookingTime: req.body.bookingDate || null,
        paymentStatus: 0,
        otp: otp,
      });

      let userDetail = await Models.userModel.findOne({
        where: { id: req.user.id },
        raw: true,
      });
      const ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: userDetail.customerId },
        { apiVersion: "2022-11-15" },
      );
      // const amount = parseFloat((req.body.amount * 100).toFixed(2));
      const amount = parseInt(Number(req.body.amount) * 100);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "USD",
        customer: userDetail.customerId,
        // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
        automatic_payment_methods: {
          enabled: true,
        },
      });
      let result = {
        paymentIntent: paymentIntent,
        ephemeralKey: ephemeralKey.secret,
        customer: userDetail.customerId,
        publishableKey: process.env.STRIPE_PK_KEY,
        transactionId: paymentIntent.id,
        bookingId: booking.id,
      };
      let adminId = await Models.userModel.findOne({
        where: {
          role: 0,
        },
        raw: true,
      });
      let objToSave = {
        senderId: req.user.id,
        receiverId: adminId.id,
        amount: req.body.amount,
        transactionId: paymentIntent.id,
        bookingId: booking.id,
      };
      await Models.transactionModel.create(objToSave);
      return commonHelper.success(
        res,
        Response.success_msg.paymentIntent,
        result,
      );

      // 2️⃣ Find nearby drivers (10 KM)
      const drivers = await Models.userModel.findAll({
        attributes: [
          "id",
          "socketId",
          "latitude",
          "longitude",
          [
            Sequelize.literal(`
            (6371 * acos(
              cos(radians(${pickUpLatitude}))
              * cos(radians(latitude))
              * cos(radians(longitude) - radians(${pickUpLongitude}))
              + sin(radians(${pickUpLatitude}))
              * sin(radians(latitude))
            ))
          `),
            "distance",
          ],
        ],
        where: {
          role: 2, // DRIVER ROLE
          isOnline: 1,
          socketId: { [Op.ne]: null },
        },
        having: Sequelize.literal("distance <= 10"),
        order: [[Sequelize.literal("distance"), "ASC"]],
        raw: true,
      });

      // 3️⃣ Emit to all nearby drivers
      drivers.forEach((driver) => {
        io.to(driver.socketId).emit("createBooking", booking);
      });

      return commonHelper.success(
        res,
        Response.success_msg.bookingCreate,
        booking,
      );
    } catch (error) {
      console.log("createBooking error:", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message,
      );
    }
  },

  bookingList: async (req, res) => {
    try {
      let response;
      if (req.user.role == 1) {
        response = await Models.bookingModel.findAll({
          where: {
            userId: req.user.id,
          },
          include: [
            {
              model: Models.userModel,
              as: "driver",
            },
          ],
          order: [["createdAt", "DESC"]],
        });
      } else if (req.user.role == 2) {
        // 1️⃣ Get driver location
        const driver = await Models.userModel.findOne({
          where: { id: req.user.id },
          attributes: ["latitude", "longitude"],
          raw: true,
        });

        if (!driver || !driver.latitude || !driver.longitude) {
          return commonHelper.failed(res, "Driver location not available");
        }

        const { latitude, longitude } = driver;

        // 2️⃣ Find nearby bookings (10 KM)
        response = await Models.bookingModel.findAll({
          attributes: {
            include: [
              [
                Sequelize.literal(`
                (6371 * acos(
                  cos(radians(${latitude}))
                  * cos(radians(pickUpLatitude))
                  * cos(radians(pickUpLongitude) - radians(${longitude}))
                  + sin(radians(${latitude}))
                  * sin(radians(pickUpLatitude))
                ))
              `),
                "distance",
              ],
            ],
          },
          where: {
            status: 0, // ⏳ pending bookings only
            driverId: null, // not accepted by any driver
            paymentStatus: 1,
            // ❌ Exclude rejected by this driver
            id: {
              [Op.notIn]: literal(`(
              SELECT bookingId
              FROM bookingRejectedBy
              WHERE driverId = '${req.user.id}'
            )`),
            },
          },
          having: Sequelize.literal("distance <= 100"),
          order: [[Sequelize.literal("distance"), "ASC"]],
          include: [
            {
              model: Models.userModel,
              as: "user",
              attributes: ["id", "fullName", "phoneNumber"],
            },
          ],
        });
        let acceptedBooking = await Models.bookingModel.findAll({
          where: {
            driverId: req.user.id,
          },
        });
        if (acceptedBooking && acceptedBooking.length > 0) {
          acceptedBooking.forEach((item) => {
            response.push(item);
          });
        }
      }

      return commonHelper.success(
        res,
        Response.success_msg.bookingList,
        response,
      );
    } catch (error) {
      console.log("bookingList error:", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message,
      );
    }
  },

  bookingDetail: async (req, res) => {
    try {
      let response = await Models.bookingModel.findOne({
        where: {
          id: req.query.bookingId,
        },
        include: [
          {
            model: Models.typeOfVechicleModel,
          },
          {
            model: Models.userModel,
            as: "user",
          },
          {
            model: Models.userModel,
            as: "driver",
            attributes: {
              include: [
                [
                  Sequelize.literal(`(
        SELECT COALESCE(ROUND(AVG(rating), 1), 0)
        FROM ratings
        WHERE ratings.driverId = driver.id
      )`),
                  "avgRating",
                ],
              ],
            },
          },
        ],
      });

      return commonHelper.success(
        res,
        Response.success_msg.bookingDetail,
        response,
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message,
      );
    }
  },

  bookingJobHistory: async (req, res) => {
    try {
      const { status } = req.query;
      const limit = parseInt(req.query.limit, 10) || 10;
      const skip = parseInt(req.query.skip, 10) || 0;
      const offset = skip * limit;
      // Decide column based on role
      const whereCondition = {};

      if (req.user.role === 1) {
        whereCondition.userId = req.user.id;
      } else if (req.user.role === 2) {
        whereCondition.driverId = req.user.id;
      }

      // Status mapping
      if (status == 0) {
        whereCondition.status = 9;
      } else if (status == 1) {
        whereCondition.status = 0;
      } else {
        whereCondition.status = {
          [Op.in]: [6, 8],
        };
      }

      const response = await Models.bookingModel.findAll({
        where: whereCondition,
        include: [
          {
            model: Models.userModel,
            as: "user",
          },
          {
            model: Models.userModel,
            as: "driver",
          },
        ],
        limit,
        offset,
        order: [["createdAt", "DESC"]],
      });

      return commonHelper.success(
        res,
        Response.success_msg.bookingHistory,
        response,
      );
    } catch (error) {
      console.log("bookingJobHistory error:", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message,
      );
    }
  },
  reviewsListing:async(rew,res)=>{
      try {
      let response = await Models.ratingModel.findAll({
        where:{
          driverId:req.query.driverId
        },
        include:[
          {
            model:Models.userModel,
            as:"user"
          },
          {
            model:Models.userModel,
            as:"driver"
          }
        ]
      });
      return commonHelper.success(
        res,
        Response.success_msg.ratingDone,
        response,
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message,
      );
    }
  },
  bookingAcceptReject: (io) => async (req, res) => {
    try {
      // 1 for accpet 2 for reject 3 for cancel by user
      if (req.body.status == 1) {
        await Models.bookingModel.update(
          { status: 1, driverId: req.user.id },
          { where: { id: req.body.bookingId } },
        );
        let response = await Models.bookingModel.findOne({
          where: {
            id: req.body.bookingId,
          },
          include: [
            {
              model: Models.userModel,
              as: "user",
            },
            {
              model: Models.userModel,
              as: "driver",
            },
          ],
        });
        let userDetail = await Models.userModel.findOne({
          where: { id: response.userId },
          raw: true,
        });
        io.to(userDetail.socketId).emit("bookingAcceptReject", response);
        return commonHelper.success(
          res,
          Response.success_msg.bookingAccept,
          response,
        );
      } else if (req.body.status == 2) {
        await Models.bookingModel.update(
          { status: 1 },
          { where: { id: req.body.bookingId } },
        );
        let objToSave = {
          driverId: req.user.id,
          bookingId: req.body.bookingId,
        };
        await Models.bookingRejectedByModel.create(objToSave);
        let response = await Models.bookingModel.findOne({
          where: {
            id: req.body.bookingId,
          },
          include: [
            {
              model: Models.userModel,
              as: "user",
            },
            {
              model: Models.userModel,
              as: "driver",
            },
          ],
        });
        let userDetail = await Models.userModel.findOne({
          where: { id: response.userId },
          raw: true,
        });
        io.to(userDetail.socketId).emit("bookingAcceptReject", response);
        return commonHelper.success(
          res,
          Response.success_msg.bookingReject,
          response,
        );
      } else if (req.body.status == 3) {
        await Models.bookingModel.update(
          { status: 3 , reason: req.body.reason},
          { where: { id: req.body.bookingId } },
        );
        let response = await Models.bookingModel.findOne({
          where: {
            id: req.body.bookingId,
          },
          include: [
            {
              model: Models.userModel,
              as: "user",
            },
            {
              model: Models.userModel,
              as: "driver",
            },
          ],
        });
        let userDetail = await Models.userModel.findOne({
          where: { id: response.driverId },
          raw: true,
        });
        io.to(userDetail.socketId).emit("cancelBooking", response);
        return commonHelper.success(
          res,
          Response.success_msg.bookingCancel,
          response,
        );
      }
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message,
      );
    }
  },

  bookingStatusChange: (io) => async (req, res) => {
    try {
      //1 for accpet 2 for reject 3 for cancel by user
      // 4 for start 5 for i am here 6 complete(in this 4 digit pin in this user will share pin with driver)
      //  7 for cancel by driver 8 for compelet by user 9 for ongoing
      if (req.body.status == 4) {
        await Models.bookingModel.update(
          { status: 4 },
          { where: { id: req.body.bookingId } },
        );
        let response = await Models.bookingModel.findOne({
          where: {
            id: req.body.bookingId,
          },
          include: [
            {
              model: Models.userModel,
              as: "user",
            },
            {
              model: Models.userModel,
              as: "driver",
            },
          ],
        });
        let userDetail = await Models.userModel.findOne({
          where: { id: response.userId },
          raw: true,
        });
        io.to(userDetail.socketId).emit("bookingStatusChange", response);
        return commonHelper.success(
          res,
          Response.success_msg.rideStart,
          response,
        );
      } else if (req.body.status == 5) {
        await Models.bookingModel.update(
          { status: 5 },
          { where: { id: req.body.bookingId } },
        );
        let response = await Models.bookingModel.findOne({
          where: {
            id: req.body.bookingId,
          },
          include: [
            {
              model: Models.userModel,
              as: "user",
            },
            {
              model: Models.userModel,
              as: "driver",
            },
          ],
        });
        let userDetail = await Models.userModel.findOne({
          where: { id: response.userId },
          raw: true,
        });
        io.to(userDetail.socketId).emit("bookingStatusChange", response);
        return commonHelper.success(
          res,
          Response.success_msg.bookingReject,
          response,
        );
      } else if (req.body.status == 6) {
        let bookingDetail = await Models.bookingModel.findOne({
          where: {
            id: req.body.bookingId,
          },
          raw: true,
        });
        // if (req.body && req.body.otp == bookingDetail.opt) {
        await Models.bookingModel.update(
          { status: 6, otpVerify: 1 },
          { where: { id: req.body.bookingId } },
        );
        let response = await Models.bookingModel.findOne({
          where: {
            id: req.body.bookingId,
          },
          include: [
            {
              model: Models.userModel,
              as: "user",
            },
            {
              model: Models.userModel,
              as: "driver",
            },
          ],
        });
        let userDetail = await Models.userModel.findOne({
          where: { id: response.userId },
          raw: true,
        });
        io.to(userDetail.socketId).emit("bookingStatusChange", response);
        return commonHelper.success(
          res,
          Response.success_msg.bookingComplete,
          response,
        );
        // } else {
        //   return commonHelper.failed(res, Response.failed_msg.invalidOtp);
        // }
      } else if (req.body.status == 7) {
        await Models.bookingModel.update(
          { status: 7 },
          { where: { id: req.body.bookingId } },
        );
        let response = await Models.bookingModel.findOne({
          where: {
            id: req.body.bookingId,
          },
          include: [
            {
              model: Models.userModel,
              as: "user",
            },
            {
              model: Models.userModel,
              as: "driver",
            },
          ],
        });
        let userDetail = await Models.userModel.findOne({
          where: { id: response.userId },
          raw: true,
        });
        io.to(userDetail.socketId).emit("bookingStatusChange", response);
        return commonHelper.success(
          res,
          Response.success_msg.bookingCancelDriver,
          response,
        );
      } else if (req.body.status == 8) {
        await Models.bookingModel.update(
          { status: 8 },
          { where: { id: req.body.bookingId } },
        );
        let response = await Models.bookingModel.findOne({
          where: {
            id: req.body.bookingId,
          },
          include: [
            {
              model: Models.userModel,
              as: "user",
            },
            {
              model: Models.userModel,
              as: "driver",
            },
          ],
        });
        let userDetail = await Models.userModel.findOne({
          where: { id: response.driverId },
          raw: true,
        });
        io.to(userDetail.socketId).emit("bookingStatusChange", response);
        return commonHelper.success(
          res,
          Response.success_msg.bookingCompleteByUser,
          response,
        );
      } else if (req.body.status == 9) {
        await Models.bookingModel.update(
          { status: 9 },
          { where: { id: req.body.bookingId } },
        );
        let response = await Models.bookingModel.findOne({
          where: {
            id: req.body.bookingId,
          },
          include: [
            {
              model: Models.userModel,
              as: "user",
            },
            {
              model: Models.userModel,
              as: "driver",
            },
          ],
        });
        let userDetail = await Models.userModel.findOne({
          where: { id: response.driverId },
          raw: true,
        });
        io.to(userDetail.socketId).emit("bookingStatusChange", response);
        return commonHelper.success(
          res,
          Response.success_msg.bookingOnGoing,
          response,
        );
      }
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message,
      );
    }
  },

  ratingDriver: async (req, res) => {
    try {
      let objToSave = {
        userId: req.user.id,
        driverId: req.body.driverId,
        rating: req.body.rating,
      };
      let response = await Models.ratingModel.create(objToSave);
      return commonHelper.success(
        res,
        Response.success_msg.ratingDone,
        response,
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message,
      );
    }
  },

  calculate_price: async (req, res) => {
    try {
      let {
        pickupLat,
        pickupLong,
        destinationLat,
        destinationLong,
        surge = 0,
      } = req.body;

      // Convert surge to boolean (0 = false, 1 = true)
      surge = Number(surge) === 1;

      // Validate input
      if (!pickupLat || !pickupLong || !destinationLat || !destinationLong) {
        return commonHelper.error(res, "All required fields are missing.");
      }

      // Parse coordinates
      pickupLat = parseFloat(pickupLat);
      pickupLong = parseFloat(pickupLong);
      destinationLat = parseFloat(destinationLat);
      destinationLong = parseFloat(destinationLong);

      const axios = require("axios");
      const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

      // Fetch route from Google Maps
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${pickupLat},${pickupLong}&destination=${destinationLat},${destinationLong}&key=${GOOGLE_MAPS_API_KEY}`,
      );

      if (response.data.status !== "OK") {
        return commonHelper.error(
          res,
          "Failed to fetch route from Google Maps.",
        );
      }

      const leg = response.data.routes[0].legs[0];
      const distanceMiles = leg.distance.value / 1609.34; // meters to miles

      // Get all vehicle types
      const vehicleTypes = await Models.vehicleTypesModel.findAll({
        where: { status: 1 },
      });

      if (!vehicleTypes || vehicleTypes.length === 0) {
        return commonHelper.error(res, "No vehicle types found.");
      }

      // Build response for each vehicle type
      const results = vehicleTypes.map((vehicleType) => {
        const avgSpeed = parseFloat(vehicleType.avgSpeedMph) || 18; // fallback
        const durationMinutes = (distanceMiles / avgSpeed) * 60;

        let cost =
          parseFloat(vehicleType.baseFare) +
          parseFloat(vehicleType.perMileRate) * distanceMiles +
          parseFloat(vehicleType.perMinuteRate) * durationMinutes;

        if (surge) {
          cost *= 2;
        }

        const durationText = `${Math.floor(durationMinutes)} minutes ${(
          (durationMinutes % 1) *
          60
        ).toFixed(0)} seconds`;

        return {
          vehicleTypeId: vehicleType.id,
          vehicleType: vehicleType.name,
          estimatedCost: parseFloat(cost.toFixed(2)),
          distanceInMiles: parseFloat(distanceMiles.toFixed(2)),
          durationInMinutes: parseFloat(durationMinutes.toFixed(2)),
          durationText,
          surgeApplied: surge,
        };
      });

      return commonHelper.success(
        res,
        "Estimated ride cost calculated successfully",
        results,
      );
    } catch (error) {
      console.error("Calculate Price Error:", error);
      return commonHelper.error(
        res,
        "Something went wrong while calculating price.",
      );
    }
  },

  stripeDetailReturn: async (req, res) => {
    try {
      let response = {
        SK: process.env.STRIPE_SECRET_KEY,
        PK: process.env.STRIPE_PUBLIC_KEY,
      };
      return commonHelper.success(
        res,
        "Stripe sk and pk list get successfully",
        response,
      );
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  },

  stripeIntent: async (req, res) => {
    try {
      let userDetail = await Models.userModel.findOne({
        where: { id: req.user.id },
        raw: true,
      });
      const ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: userDetail.customerId },
        { apiVersion: "2022-11-15" },
      );
      const amount = parseFloat((req.body.amount * 100).toFixed(2));

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "USD",
        customer: userDetail.customerId,
        // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
        automatic_payment_methods: {
          enabled: true,
        },
      });
      let result = {
        paymentIntent: paymentIntent,
        ephemeralKey: ephemeralKey.secret,
        customer: userDetail.customerId,
        publishableKey: process.env.STRIPE_PK_KEY,
        transactionId: paymentIntent.id,
      };
      let adminId = await Models.userModel.findOne({
        where: {
          role: 0,
        },
        raw: true,
      });
      let objToSave = {
        senderId: req.user.id,
        receiverId: adminId.id,
        amount: req.body.amount,
        transactionId: paymentIntent.id,
      };
      await Models.transactionModel.create(objToSave);
      return commonHelper.success(
        res,
        Response.success_msg.paymentIntent,
        result,
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message,
      );
    }
  },

  webHookFrontEnd:(io)=> async (req, res) => {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        req.body.transactionId,
      );
      let transactionDetail = await Models.transactionModel.findOne({
        where: { transactionId: req.body.transactionId },
        raw: true,
      });
      if (paymentIntent.status === "succeeded") {
        await Models.transactionModel.update(
          {
            paymentStatus: 1,
          },
          {
            where: {
              transactionId: req.body.transactionId,
            },
          },
        );
        await Models.bookingModel.update(
          { paymentStatus: 1 },
          { where: { id: transactionDetail.bookingId } },
        );
        let bookingDetail = await Models.bookingModel.findOne({
          where: { id: transactionDetail.bookingId },
          raw: true,
        });
        // 2️⃣ Find nearby drivers (10 KM)
        const drivers = await Models.userModel.findAll({
          attributes: [
            "id",
            "socketId",
            "latitude",
            "longitude",
            [
              Sequelize.literal(`
            (6371 * acos(
              cos(radians(${bookingDetail.pickUpLatitude}))
              * cos(radians(latitude))
              * cos(radians(longitude) - radians(${bookingDetail.pickUpLongitude}))
              + sin(radians(${bookingDetail.pickUpLatitude}))
              * sin(radians(latitude))
            ))
          `),
              "distance",
            ],
          ],
          where: {
            role: 2, // DRIVER ROLE
            isOnline: 1,
            socketId: { [Op.ne]: null },
          },
          having: Sequelize.literal("distance <= 100"),
          order: [[Sequelize.literal("distance"), "ASC"]],
          raw: true,
        });
       console.log("drivers",drivers)
        // 3️⃣ Emit to all nearby drivers
        drivers.forEach((driver) => {
          io.to(driver.socketId).emit("createBooking", bookingDetail);
        });
      }
      return commonHelper.success(
        res,
        Response.success_msg.stripeWebHookFrontEnd,
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message,
      );
    }
  },

  stripeWebhook: (io) => async (req, res) => {
    try {
      // Stripe sends an "event" object, NOT { transactionId }
      const event = req.body;
      console.log("🔥 Stripe Webhook Received:", event.type);

      // We only care about successful payment_intent events
      if (event.type !== "payment_intent.succeeded") {
        console.log("ℹ️ Ignoring event type:", event.type);
        return res.status(200).json({ received: true });
      }

      const paymentIntent = event.data?.object;

      if (!paymentIntent || paymentIntent.object !== "payment_intent") {
        console.log("❌ Invalid webhook payload shape:", event.data);
        return res.status(400).send("Invalid payload");
      }

      const paymentIntentId = paymentIntent.id; // e.g. "pi_3Pxxxx"
      console.log("💳 payment_intent.succeeded for:", paymentIntentId);

      // Find our transaction using the PaymentIntent ID
      const transaction = await Models.transactionModel.findOne({
        where: { transactionId: paymentIntentId },
        raw: true,
      });

      if (!transaction) {
        console.log(
          "❌ Transaction not found for PaymentIntent:",
          paymentIntentId,
        );
        // For webhooks it's usually better to return 200 so Stripe stops retrying
        return res
          .status(200)
          .json({ received: true, message: "Transaction not found" });
      }

      // (Optional) you don't really need to retrieve again, but if you want:
      // const paymentIntentLive = await stripe.paymentIntents.retrieve(paymentIntentId);
      // if (paymentIntentLive.status !== "succeeded") { ... }

      // ✅ Mark transaction as paid
      await Models.transactionModel.update(
        { paymentStatus: 1 },
        { where: { transactionId: paymentIntentId } },
      );

      // ✅ Update order
      await Models.orderModel.update(
        {
          status: 0,
          isOrderComplete: 1,
        },
        { where: { id: transaction.orderId } },
      );

      // ✅ Clear cart
      await Models.cartModel.destroy({
        where: { userId: transaction.userId },
      });

      // ✅ Fetch order for notifications (if you need details)
      const order = await Models.orderModel.findOne({
        where: { id: transaction.orderId },
      });

      const admin = await Models.userModel.findOne({ where: { role: 0 } });

      // Admin notification
      await Models.notificationModel.create({
        senderId: transaction.userId,
        recevierId: admin?.id,
        orderId: transaction.orderId,
        typeOfNotification: 1,
        message: `A new order has been placed.`,
      });

      // User notification
      await Models.notificationModel.create({
        senderId: null,
        recevierId: transaction.userId,
        orderId: transaction.orderId,
        typeOfNotification: 2,
        message: `Your order has been successfully placed.`,
      });

      console.log("🎉 Stripe webhook processed successfully");
      return res.status(200).json({ received: true });
    } catch (error) {
      console.log("Stripe Webhook Error:", error);
      return res.status(500).send("Webhook error");
    }
  },
};
