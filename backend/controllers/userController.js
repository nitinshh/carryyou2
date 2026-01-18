const Sequelize = require("sequelize");
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
const Response = require("../config/responses.js")


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
      if (req.files || req.files.profilePicture) {
        image = await commonHelper.fileUpload(
          req.files.profilePicture,
          "images"
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
          process.env.SALT
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

      /* =======================
         TWILIO SEND OTP (COMMENTED)
      ======================== */

      // if (payload.phoneNumber && payload.countryCode) {
      //   const phone = payload.countryCode + payload.phoneNumber;
      //   try {
      //     await otpManager.sendOTP(phone);
      //     console.log("OTP sent via Twilio to", phone);
      //   } catch (err) {
      //     console.error("Twilio OTP send failed:", err);
      //   }
      // }

      /* =======================
         JWT TOKEN
      ======================== */
      const token = jwt.sign(
        {
          id: newUser.id,
          email: newUser.email,
        },
        secretKey
      );

      let userDetail = await Models.userModel.findOne({
        where: { id: newUser.id },
        raw: true,
      });

      userDetail.token = token;

      return commonHelper.success(
        res,
        Response.success_msg.signUp,
        userDetail
      );
    } catch (error) {
      console.error("Error during signup:", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message
      );
    }
  },


  login: async (req, res) => {
    try {
      console.log("reqw.bod", req.body);
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
          customerId: customerId
        },
        {
          where: {
            id: user.id,
          },
        }
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
        secretKey
      );
      userDetail.token = token;

      return commonHelper.success(res, Response.success_msg.login, userDetail);
    } catch (err) {
      console.error("Error during login:", err);
      return commonHelper.error(res, Response.error_msg.intSerErr, err.message);
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

  forgetPassword: async (req, res) => {
    try {
      let schema = Joi.object().keys({
        email: Joi.string().email().required(),
      });
      let payload = await helper.validationJoi(req.body, schema);
      const { email } = payload;
      const user = await Models.userModel.findOne({
        where: { email: email },
        raw: true,
      });
      if (!user) {
        return commonHelper.failed(res, Response.failed_msg.emailNotReg);
      }
      // Generate OTP
      // const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otp = "1111";
      await Models.userModel.update({ otp: otp }, { where: { id: user.id } });
      // Here, you would typically send the OTP to the user's email.
      return commonHelper.success(res, Response.success_msg.otpSend);
    } catch (error) {
      console.error("Error during login:", err);
      return commonHelper.error(res, Response.error_msg.intSerErr, err.message);
    }
  },

  forgetPasswordUpdate: async (req, res) => {
    try {
      const schema = Joi.object().keys({
        newPassword: Joi.string().required(),
        email: Joi.string().email().required(),
      });
      let payload = await helper.validationJoi(req.body, schema);

      const { newPassword } = payload;

      const hashedNewPassword = await commonHelper.bcryptData(
        newPassword,
        process.env.SALT
      );

      await Models.userModel.update(
        { password: hashedNewPassword },
        { where: { email: req.body.email } }
      );

      return commonHelper.success(res, Response.success_msg.passwordUpdate);
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message
      );
    }
  },

  updateProfile: async (req, res) => {
    try {
      let image = null;

      // Upload image if provided
      if (req.files && req.files.image) {
        image = await commonHelper.fileUpload(req.files.image, "images");
      }

      // Preserve existing profile picture unless removed or updated
      let profilePicture = req.user.profilePicture;

      if (req.body && req.body.removeImage === "true") {
        profilePicture = null;
      }

      if (image) {
        profilePicture = image;
      }

      // Prepare object to update
      const objToSave = {
        fullName: req.body.fullName,
        profilePicture,
        phoneNumber: req.body.phoneNumber || null,
        countryCode: req.body.countryCode || null,
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
        updatedUser
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message
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
        req.user.password
      );

      if (!isPasswordValid) {
        return commonHelper.failed(res, Response.failed_msg.incorrectCurrPwd);
      }

      const hashedNewPassword = await commonHelper.bcryptData(
        newPassword,
        process.env.SALT
      );

      await Models.userModel.update(
        { password: hashedNewPassword },
        { where: { id: req.user.id } }
      );

      return commonHelper.success(res, Response.success_msg.passwordUpdate);
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message
      );
    }
  },

otpVerify: async (req, res) => {
  try {
    const schema = Joi.object({
      countryCode: Joi.string().required(),
      phoneNumber: Joi.string()
        .pattern(/^[0-9]{10}$/)
        .required()
        .messages({
          "string.pattern.base":
            "The phone number must be exactly 10 digits.",
        }),
      otp: Joi.string().required(),
    });

    const payload = await helper.validationJoi(req.body, schema);
    const { countryCode, phoneNumber, otp } = payload;

    // static OTP for now
    const STATIC_OTP = "1111";

    const user = await Models.userModel.findOne({
      where: {
        countryCode,
        phoneNumber,
      },
      raw: true,
    });

    if (!user) {
      return commonHelper.failed(
        res,
        Response.failed_msg.userNotFound
      );
    }

    if (otp !== STATIC_OTP) {
      return commonHelper.failed(
        res,
        Response.failed_msg.invalidOtp
      );
    }

    // mark OTP as verified & activate user
    await Models.userModel.update(
      {
        isOtpVerified: 1,
        status: 1,
      },
      { where: { id: user.id } }
    );

    // generate token (same as login)
    const token = jwt.sign(
      {
        id: user.id,
        phoneNumber: user.phoneNumber,
      },
      secretKey
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
      updatedUser
    );

  } catch (error) {
    console.log("OTP verify error:", error);
    return commonHelper.error(
      res,
      Response.error_msg.intSerErr,
      error.message
    );
  }
},

  resendOtp: async (req, res) => {
    try {
      /* =======================
         VALIDATION (PHONE ONLY)
      ======================== */
      const schema = Joi.object({
        countryCode: Joi.string().required(),
        phoneNumber: Joi.string()
          .pattern(/^[0-9]{10}$/)
          .required()
          .messages({
            "string.pattern.base":
              "The phone number must be exactly 10 digits.",
          }),
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

      /* =======================
         UPDATE OTP
      ======================== */
      await Models.userModel.update(
        {
          otpVerify: 0,
        },
        { where: { id: user.id } }
      );

      /* =======================
         TWILIO RESEND (COMMENTED)
      ======================== */

      // const phone = countryCode + phoneNumber;
      // try {
      //   await otpManager.sendOTP(phone);
      //   console.log("OTP resent via Twilio to", phone);
      // } catch (err) {
      //   console.error("Twilio OTP resend failed:", err);
      //   return commonHelper.failed(
      //     res,
      //     "Failed to resend OTP. Please try again."
      //   );
      // }

      return commonHelper.success(res, Response.success_msg.otpResend, {
        countryCode,
        phoneNumber,
      });
    } catch (error) {
      console.error("Error while resending OTP:", error);
      return commonHelper.error(
        res,
        Response.error_msg.otpResErr,
        error.message
      );
    }
  },

  userDetail: async (req, res) => {
    try {
      let response = await Models.userModel.findOne({
        where: {
          id: req.params.id,
        },
      });
      return commonHelper.success(res, Response.success_msg.userList, response);
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message
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
        error.message
      );
    }
  },

  getUserDetail: async (req, res) => {
    try {
      let response = await Models.userModel.findOne({
        where: {
          id: req.user.id,
        },
        include: [
          {
            model: Models.userDeliveryAddressModel,
          },
        ],
      });
      return commonHelper.success(
        res,
        Response.success_msg.userDetail,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message
      );
    }
  },

  cms: async (req, res) => {
    try {
      // fetch cms by type
      const cmsData = await Models.cmsModel.findOne({
        where: { type: req.body.type },
        raw: true,
      });

      if (!cmsData) {
        return commonHelper.failed(res, Response.failed_msg.noDataFound);
      }

      // fetch user language
      const user = await Models.userModel.findOne({
        where: { id: req.user.id },
        attributes: ["language"],
        raw: true,
      });

      const language = user?.language ?? 0;

      // language mapping
      let title, description;

      switch (language) {
        case 1:
          title = cmsData.titleInFinnish;
          description = cmsData.descriptionInFinnish;
          break;
        case 2:
          title = cmsData.titleInRussian;
          description = cmsData.descriptionInRussian;
          break;
        case 3:
          title = cmsData.titleInSwedish;
          description = cmsData.descriptionInSwedish;
          break;
        case 4:
          title = cmsData.titleInUkrainian;
          description = cmsData.descriptionInUkrainian;
          break;
        case 0:
        default:
          title = cmsData.titleInEnglish;
          description = cmsData.descriptionInEnglish;
          break;
      }

      // final response
      const response = {
        id: cmsData.id,
        type: cmsData.type,
        title,
        description,
      };

      return commonHelper.success(res, Response.success_msg.cms, response);

    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message
      );
    }
  },

  notificationStatusChange: async (req, res) => {
    try {
      const userId = req.user.id; // assuming userId comes from token middleware
      const { notificationType, value } = req.body; // e.g., { notificationType: "isEcoMilestoneNotificationOn", value: 0 }
      // Update only that field
      const updateData = {};
      updateData[notificationType] = value;

      await Models.userModel.update(updateData, {
        where: { id: userId },
      });
      return commonHelper.success(
        res,
        Response.success_msg.notificationStatusChange
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message
      );
    }
  },

  isOnlineStatusChange: async (req, res) => {
    try {
      await Models.userModel.update({
        isOnline: req.body.isOnline
      }, {
        where: {
          id: req.user.id
        }
      });
      return commonHelper.success(
        res,
        Response.success_msg.onlineStatusChange,
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message
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
        response
      );
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  },

  stripeIntent: async (req, res) => {
    try {
      console.log("🔔 stripeIntent req.body:", req.body);

      const { totalAmount, orderId, paymentMethod } = req.body;
      const amountInCents = Math.round(Number(totalAmount) * 100);

      const isCard = paymentMethod === 0;       // PaymentSheet
      const isGooglePay = paymentMethod === 2;  // PlatformPay (Google Pay)

      let customerId = null;
      let ephemeralKey = null;

      /* ======================================================
         STEP 1: CREATE CUSTOMER ONLY FOR CARD (PaymentSheet)
         ====================================================== */
      if (isCard) {
        const userDetail = await Models.userModel.findOne({
          where: { id: req.user.id },
        });

        if (!userDetail) {
          return commonHelper.failed(res, "User not found");
        }

        if (!userDetail.customerId) {
          const customer = await stripe.customers.create({
            email: userDetail.email,
            metadata: { userId: req.user.id },
          });

          customerId = customer.id;

          await Models.userModel.update(
            { customerId },
            { where: { id: req.user.id } }
          );
        } else {
          customerId = userDetail.customerId;
        }

        // Ephemeral key ONLY for PaymentSheet
        ephemeralKey = await stripe.ephemeralKeys.create(
          { customer: customerId },
          { apiVersion: "2023-10-16" }
        );
      }

      /* ======================================================
         STEP 2: CREATE PAYMENT INTENT
         ====================================================== */
      const paymentIntentParams = {
        amount: amountInCents,
        currency: "eur",
        metadata: {
          orderId,
          userId: req.user.id,
          paymentMethod: paymentMethod.toString(),
        },
      };

      // ✅ CARD (PaymentSheet)
      if (isCard) {
        paymentIntentParams.customer = customerId;
        paymentIntentParams.automatic_payment_methods = {
          enabled: true,
          allow_redirects: "never",
        };
      }

      // ✅ GOOGLE PAY (PlatformPay)
      if (isGooglePay) {
        paymentIntentParams.payment_method_types = ["card"];
        // ❌ NO customer
        // ❌ NO ephemeralKey
        // ❌ NO automatic_payment_methods
      }

      console.log("💳 Creating PaymentIntent with:", paymentIntentParams);

      const paymentIntent = await stripe.paymentIntents.create(
        paymentIntentParams
      );

      console.log("✅ PaymentIntent created:", paymentIntent.id);

      /* ======================================================
         STEP 3: SAVE TRANSACTION
         ====================================================== */
      await Models.transactionModel.create({
        transactionId: paymentIntent.id,
        userId: req.user.id,
        orderId,
        currency: "EUR",
        amount: totalAmount,
        paymentStatus: 0,
        paymentMethod,
      });

      /* ======================================================
         STEP 4: SEND RESPONSE
         ====================================================== */
      return commonHelper.success(res, "PaymentIntent created", {
        clientSecret: paymentIntent.client_secret,
        customer: isCard ? customerId : null,
        ephemeralKey: isCard ? ephemeralKey?.secret : null,
        transactionId: paymentIntent.id,
        publishableKey: process.env.STRIPE_PUBLIC_KEY,
      });

    } catch (error) {
      console.error("❌ stripeIntent error:", error);

      return commonHelper.error(
        res,
        "Stripe intent error",
        error.message || "Failed to create PaymentIntent"
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
        console.log("❌ Transaction not found for PaymentIntent:", paymentIntentId);
        // For webhooks it's usually better to return 200 so Stripe stops retrying
        return res.status(200).json({ received: true, message: "Transaction not found" });
      }

      // (Optional) you don't really need to retrieve again, but if you want:
      // const paymentIntentLive = await stripe.paymentIntents.retrieve(paymentIntentId);
      // if (paymentIntentLive.status !== "succeeded") { ... }

      // ✅ Mark transaction as paid
      await Models.transactionModel.update(
        { paymentStatus: 1 },
        { where: { transactionId: paymentIntentId } }
      );

      // ✅ Update order
      await Models.orderModel.update(
        {
          status: 0,
          isOrderComplete: 1,
        },
        { where: { id: transaction.orderId } }
      );

      // ✅ Clear cart
      await Models.cartModel.destroy({
        where: { userId: transaction.userId },
      });

      // ✅ Fetch order for notifications (if you need details)
      const order = await Models.orderModel.findOne({
        where: { id: transaction.orderId },
        include: [
          { model: Models.userModel, as: "driverDetail" },
          { model: Models.userDeliveryAddressModel, as: "address" },
        ],
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
