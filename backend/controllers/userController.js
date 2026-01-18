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


Models.productModel.belongsTo(Models.categoryModel, { foreignKey: "categoryId" });
Models.productModel.hasMany(Models.productsImagesModel, { foreignKey: "productId" })
Models.userModel.hasMany(Models.userDeliveryAddressModel, { foreignKey: "userId" })
Models.cartModel.belongsTo(Models.productModel, { foreignKey: "productId" })
Models.orderModel.belongsTo(Models.productModel, { foreignKey: "productId" })
Models.orderModel.belongsTo(Models.userDeliveryAddressModel, { foreignKey: "addressId" })
Models.orderModel.belongsTo(Models.userModel, { foreignKey: "driverId", as: "driverDetail" })
Models.orderModel.belongsTo(Models.userDeliveryAddressModel, { as: "address", foreignKey: "addressId" });

module.exports = {
  adminDetail: async (req, res) => {
    try {
      let response = await Models.userModel.findOne({
        where: {
          role: 0,
        },
      });
      return commonHelper.success(
        res,
        req.msg.success_msg.userDetail,
        response
      );
    } catch (error) {
      console.error("Error during login:", err);
      return commonHelper.error(res, req.msg.error_msg.intSerErr, err.message);
    }
  },

  signUp: async (req, res) => {
    try {
      const schema = Joi.object().keys({
        fullName: Joi.string().required(),
        email: Joi.string().email().required(),
        countryCode: Joi.string().optional(),
        phoneNumber: Joi.string().optional(),
        password: Joi.string().required(),
        role: Joi.number().valid(0, 1, 2).required(),
        deviceToken: Joi.string().optional(), // static data, will come from frontend
        deviceType: Joi.number().valid(1, 2).optional(),
      });
      let payload = await helper.validationJoi(req.body, schema);

      const { email, password, role } = payload;

      const user = await Models.userModel.findOne({
        where: { email: email, role: role },
        raw: true,
      });
      if (user && role == user.role) {
        return commonHelper.failed(res, req.msg.failed_msg.userWithEmail);
      }

      let customerId = null;
      if (payload.email) {
        const customer = await stripe.customers.create({
          description: "User Profile",
          email: payload.email,
        });
        customerId = customer.id;
      }

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
        customerId: customerId,
        deviceToken: payload.deviceToken,
        deviceType: payload.deviceType,
      };
      let newUser = await Models.userModel.create(objToSave);

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
      return commonHelper.success(res, req.msg.success_msg.signUp, userDetail);
    } catch (error) {
      console.error("Error during login:", error);
      return commonHelper.error(
        res,
        req.msg.error_msg.intSerErr,
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
        role: Joi.number().valid(0, 1, 2).required(),
      });
      let payload = await helper.validationJoi(req.body, schema);

      const { email, password, role } = payload;

      const user = await Models.userModel.findOne({
        where: { email: email, role: role },
        raw: true,
      });

      if (!user) {
        return commonHelper.failed(res, req.msg.failed_msg.invalidCrd);
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return commonHelper.failed(res, req.msg.failed_msg.invalidPassword);
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
          location: payload.location,
          latitude: payload.latitude,
          longitude: payload.longitude,
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

      return commonHelper.success(res, req.msg.success_msg.login, userDetail);
    } catch (err) {
      console.error("Error during login:", err);
      return commonHelper.error(res, req.msg.error_msg.intSerErr, err.message);
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
      return commonHelper.success(res, req.msg.success_msg.logOut);
    } catch (error) {
      console.error("Error during login:", err);
      return commonHelper.error(res, req.msg.error_msg.intSerErr, err.message);
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
        return commonHelper.failed(res, req.msg.failed_msg.emailNotReg);
      }
      // Generate OTP
      // const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otp = "1111";
      await Models.userModel.update({ otp: otp }, { where: { id: user.id } });
      // Here, you would typically send the OTP to the user's email.
      return commonHelper.success(res, req.msg.success_msg.otpSend);
    } catch (error) {
      console.error("Error during login:", err);
      return commonHelper.error(res, req.msg.error_msg.intSerErr, err.message);
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

      return commonHelper.success(res, req.msg.success_msg.passwordUpdate);
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        req.msg.error_msg.intSerErr,
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
        req.msg.success_msg.updateProfile,
        updatedUser
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        req.msg.error_msg.intSerErr,
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
        return commonHelper.failed(res, req.msg.failed_msg.incorrectCurrPwd);
      }

      const hashedNewPassword = await commonHelper.bcryptData(
        newPassword,
        process.env.SALT
      );

      await Models.userModel.update(
        { password: hashedNewPassword },
        { where: { id: req.user.id } }
      );

      return commonHelper.success(res, req.msg.success_msg.passwordUpdate);
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        req.msg.error_msg.intSerErr,
        error.message
      );
    }
  },

  otpVerify: async (req, res) => {
    try {
      const { email, otp } = req.body;

      // static OTP for now
      const STATIC_OTP = "1111";

      const user = await Models.userModel.findOne({
        where: { email },
        raw: true,
      });

      if (!user) {
        return commonHelper.failed(
          res,
          req.msg.failed_msg.userNotFound
        );
      }

      if (otp !== STATIC_OTP) {
        return commonHelper.failed(
          res,
          req.msg.failed_msg.invalidOtp
        );
      }

      // mark otp as verified
      await Models.userModel.update(
        { isOtpVerified: 1, status: 1 },
        { where: { id: user.id } }
      );

      // generate token (same as login)
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
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
        req.msg.success_msg.otpVerify,
        updatedUser
      );

    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        req.msg.error_msg.intSerErr,
        error.message
      );
    }
  },

  resendOtp: async (req, res) => {
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
        return commonHelper.failed(res, req.msg.failed_msg.emailNotReg);
      }
      // Generate OTP
      // const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otp = "1111";
      await Models.userModel.update({ otp: otp }, { where: { id: user.id } });
      // Here, you would typically send the OTP to the user's email.
      return commonHelper.success(res, req.msg.success_msg.otpResend);
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        req.msg.error_msg.intSerErr,
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
      return commonHelper.success(res, req.msg.success_msg.userList, response);
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        req.msg.error_msg.intSerErr,
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
        req.msg.error_msg.intSerErr,
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
        req.msg.success_msg.userDetail,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        req.msg.error_msg.intSerErr,
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
        return commonHelper.failed(res, req.msg.failed_msg.noDataFound);
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

      return commonHelper.success(res, req.msg.success_msg.cms, response);

    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        req.msg.error_msg.intSerErr,
        error.message
      );
    }
  },

  faq: async (req, res) => {
    try {
      // get user language
      const user = await Models.userModel.findOne({
        where: { id: req.user.id },
        attributes: ["language"],
        raw: true,
      });

      const language = user?.language ?? 0;

      // column mapping
      const questionMap = {
        0: "questionInEnglish",
        1: "questionInFinnish",
        2: "questionInRussian",
        3: "questionInSwedish",
        4: "questionInUkrainian",
      };

      const answerMap = {
        0: "answerInEnglish",
        1: "answerInFinnish",
        2: "answerInRussian",
        3: "answerInSwedish",
        4: "answerInUkrainian",
      };

      const questionColumn = questionMap[language] || "questionInEnglish";
      const answerColumn = answerMap[language] || "answerInEnglish";

      const response = await Models.faqModel.findAll({
        attributes: [
          "id",
          [Sequelize.col(questionColumn), "question"],
          [Sequelize.col(answerColumn), "answer"],
        ],
        order: [["createdAt", "DESC"]],
        raw: true,
      });

      return commonHelper.success(
        res,
        req.msg.success_msg.faq,
        response
      );

    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        req.msg.error_msg.intSerErr,
        error.message
      );
    }
  },

  dashboardData: async (req, res) => {
    try {
      let response = {};
      // Determine language from request
      const lang = req.headers.language || "en";
      let limit = 6;
      // Map language to correct DB column
      const titleColumnMap = {
        en: "titleInEnglish",
        fi: "titleInFinnish",
        ru: "titleInRussian",
        sw: "titleInSwedish",
        uk: "titleInUkrainian",
      };
      const descriptionColumnMap = {
        en: "descriptionInEnglish",
        fi: "descriptionInFinnish",
        ru: "descriptionInRussian",
        sw: "descriptionInSwedish",
        uk: "descriptionInUkrainian",
      };
      const titleColumn = titleColumnMap[lang] || "titleInEnglish";
      const descriptionColumn =
        descriptionColumnMap[lang] || "descriptionInEnglish";
      let categoryList = await Models.categoryModel.findAll({
        attributes: [
          "id",
          "image",
          [Sequelize.col(titleColumn), "title"], // alias selected title
        ],
        order: [["id", "DESC"]],
      });
      let productList = await Models.productModel.findAll({
        where: { discount: 0 },
        attributes: [
          "id",
          "price",
          "loyaltyPoint",
          "refillEcoPoint",
          "categoryId",
          "discount",
          "quantity",
          [Sequelize.col(titleColumn), "title"], // alias selected title
          [Sequelize.col(descriptionColumn), "description"],
        ],
        include: [
          {
            model: Models.productsImagesModel,
          },
        ],
        limit,
        order: [["id", "DESC"]],
      });
      let discountedProducts = await Models.productModel.findAll({
        where: {
          discount: {
            [Op.gt]: 0,
          },
        },
        attributes: [
          "id",
          "price",
          "loyaltyPoint",
          "categoryId",
          "refillEcoPoint",
          "discount",
          "quantity",
          [Sequelize.col(titleColumn), "title"], // alias selected title
          [Sequelize.col(descriptionColumn), "description"],
        ],
        include: [
          {
            model: Models.productsImagesModel,
          },
        ],
        limit,
        order: [["id", "DESC"]],
      });

      response.categoryList = categoryList;
      response.productList = productList;
      response.discountedProducts = discountedProducts;
      response.loyaltyPoints = req.user.loyaltyPoints || 0;
      response.ecoPoints = req.user.ecoPoints || 0;
      return commonHelper.success(
        res,
        req.msg.success_msg.dashboardData,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        req.msg.error_msg.intSerErr,
        error.message
      );
    }
  },

  productList: async (req, res) => {
    try {
      const lang = req.headers.language || "en";
      let limit = Number(req.query.limit) || 10;
      let offSet =
        Number(req.query.skip) > 0
          ? Number(req.query.skip) * Number(req.query.limit)
          : 0;
      const titleColumnMap = {
        en: "titleInEnglish",
        fi: "titleInFinnish",
        ru: "titleInRussian",
        sw: "titleInSwedish",
        uk: "titleInUkrainian",
      };
      const descriptionColumnMap = {
        en: "descriptionInEnglish",
        fi: "descriptionInFinnish",
        ru: "descriptionInRussian",
        sw: "descriptionInSwedish",
        uk: "descriptionInUkrainian",
      };

      const titleColumn = titleColumnMap[lang] || "titleInEnglish";
      const descriptionColumn =
        descriptionColumnMap[lang] || "descriptionInEnglish";

      let response = await Models.productModel.findAndCountAll({
        distinct: true, // ✅ ensures unique product count
        col: "id", // ✅ count based on product id
        attributes: [
          "id",
          "price",
          "loyaltyPoint",
          "refillEcoPoint",
          "categoryId",
          "discount",
          "quantity",
          [Sequelize.col(`products.${titleColumn}`), "title"],
          [Sequelize.col(`products.${descriptionColumn}`), "description"],
        ],
        include: [
          {
            model: Models.productsImagesModel,
          },
          {
            model: Models.categoryModel,
            attributes: [
              "id",
              "image",
              [Sequelize.col(titleColumn), "title"], // alias selected title
            ],
          },
        ],
        limit: limit,
        offset: offSet,
      });

      return commonHelper.success(
        res,
        req.msg.success_msg.productDetails,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        req.msg.error_msg.intSerErr,
        error.message
      );
    }
  },

  productDetails: async (req, res) => {
    try {
      const lang = req.headers.language || "en";

      const titleColumnMap = {
        en: "titleInEnglish",
        fi: "titleInFinnish",
        ru: "titleInRussian",
        sw: "titleInSwedish",
        uk: "titleInUkrainian",
      };
      const descriptionColumnMap = {
        en: "descriptionInEnglish",
        fi: "descriptionInFinnish",
        ru: "descriptionInRussian",
        sw: "descriptionInSwedish",
        uk: "descriptionInUkrainian",
      };

      const titleColumn = titleColumnMap[lang] || "titleInEnglish";
      const descriptionColumn =
        descriptionColumnMap[lang] || "descriptionInEnglish";

      const productId = req.params.productId || req.query.productId;
      if (!productId) {
        return commonHelper.error(res, "Product ID is required");
      }

      let response = await Models.productModel.findOne({
        where: { id: productId },
        attributes: [
          "id",
          "price",
          "loyaltyPoint",
          "refillEcoPoint",
          "categoryId",
          "discount",
          "quantity",
          [Sequelize.col(`products.${titleColumn}`), "title"],
          [Sequelize.col(`products.${descriptionColumn}`), "description"],
        ],
        include: [
          {
            model: Models.productsImagesModel,
          },
          {
            model: Models.categoryModel,
            attributes: [
              "id",
              "image",
              [Sequelize.col(titleColumn), "title"], // alias selected title
            ],
          },
        ],
      });

      return commonHelper.success(
        res,
        req.msg.success_msg.productDetails,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        req.msg.error_msg.intSerErr,
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
        req.msg.success_msg.notificationStatusChange
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        req.msg.error_msg.intSerErr,
        error.message
      );
    }
  },

  postalCodeList: async (req, res) => {
    try {
      const { cityId } = req.query;

      if (!cityId) {
        return res.status(400).json({
          code: 400,
          message: 'cityId is required',
        });
      }

      const list = await Models.postalCodeModel.findAll({
        where: { cityId, status: 1 },
        attributes: ['postalCode'],
        order: [['postalCode', 'ASC']],
        raw: true,
      });

      return res.status(200).json({
        code: 200,
        message: 'Postal codes fetched successfully',
        body: list,
      });
    } catch (error) {
      console.error('postalCodeList error:', error);
      return res.status(500).json({
        code: 500,
        message: 'Internal server error',
      });
    }
  },

  cityList: async (req, res) => {
    try {
      const list = await Models.cityModel.findAll({
        order: [['title', 'ASC']],
        raw: true,
      });

      return res.status(200).json({
        code: 200,
        message: 'City list fetched successfully',
        body: list,
      });
    } catch (error) {
      console.error('cityList error:', error);
      return res.status(500).json({
        code: 500,
        message: 'Internal server error',
      });
    }
  },

  userAddressAdd: async (req, res) => {
    try {
      console.log('userAddressAdd req.body:', req.body);
      const schema = Joi.object({
        name: Joi.string().trim().required().messages({
          'string.empty': 'Full name is required',
        }),

        country: Joi.string().trim().required().messages({
          'string.empty': 'Country is required',
        }),

        location: Joi.string().trim().required().messages({
          'string.empty': 'City is required',
        }),

        streetNo: Joi.string().trim().required().messages({
          'string.empty': 'Street address is required',
        }),

        houseNo: Joi.string().trim().required().messages({
          'string.empty': 'House / Apartment number is required',
        }),

        postalCode: Joi.string().trim().required().messages({
          'string.empty': 'Postal code is required',
        }),

        latitude: Joi.number().optional(),
        longitude: Joi.number().optional(),

        isDefault: Joi.number().valid(0, 1).optional(),
      });

      const payload = await helper.validationJoi(req.body, schema);
      payload.userId = req.user.id;

      // Handle default address
      if (payload.isDefault === 1) {
        await Models.userDeliveryAddressModel.update(
          { isDefault: 0 },
          { where: { userId: req.user.id } }
        );
      }

      const newAddress = await Models.userDeliveryAddressModel.create(payload);

      return commonHelper.success(
        res,
        req.msg.success_msg.userAddressAdd,
        newAddress
      );
    } catch (error) {
      console.error('userAddressAdd error:', error);

      return commonHelper.error(
        res,
        error.isJoi
          ? error.message // 👈 clean validation msg for GlobalAlert
          : req.msg.error_msg.intSerErr,
        error.message
      );
    }
  },

  userAddressList: async (req, res) => {
    try {
      let addressList = await Models.userDeliveryAddressModel.findAll({
        where: { userId: req.user.id },
      });
      return commonHelper.success(
        res,
        req.msg.success_msg.userAddressList,
        addressList
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        req.msg.error_msg.intSerErr,
        error.message
      );
    }
  },

  userAddressEdit: async (req, res) => {
    try {
      const schema = Joi.object().keys({
        addressId: Joi.string().required(),
        name: Joi.string().optional(),
        houseNo: Joi.string().optional(),
        streeNo: Joi.string().optional(),
        state: Joi.string().optional(),
        country: Joi.string().optional(),
        postalCode: Joi.string().optional(),
        location: Joi.string().optional(),
        latitude: Joi.number().optional(),
        longitude: Joi.number().optional(),
        isDefault: Joi.number().valid(0, 1).optional(),
      });
      let payload = await helper.validationJoi(req.body, schema);
      await Models.userDeliveryAddressModel.update(payload, {
        where: { id: payload.addressId, userId: req.user.id },
      });
      let updatedAddress = await Models.userDeliveryAddressModel.findOne({
        where: { id: payload.addressId, userId: req.user.id },
      });
      return commonHelper.success(
        res,
        req.msg.success_msg.userAddressEdit,
        updatedAddress
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        req.msg.error_msg.intSerErr,
        error.message
      );
    }
  },

  userAddressDelete: async (req, res) => {
    try {
      await Models.userDeliveryAddressModel.destroy({
        where: { id: req.body.addressId, userId: req.user.id },
      });
      return commonHelper.success(res, req.msg.success_msg.userAddressDelete);
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        req.msg.error_msg.intSerErr,
        error.message
      );
    }
  },

  userAddressDetail: async (req, res) => {
    try {
      let addressDetail = await Models.userDeliveryAddressModel.findOne({
        where: { id: req.query.addressId, userId: req.user.id },
      });
      return commonHelper.success(
        res,
        req.msg.success_msg.userAddressDetail,
        addressDetail
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        req.msg.error_msg.intSerErr,
        error.message
      );
    }
  },

  addToCart: async (req, res) => {
    try {
      let schema = Joi.object().keys({
        productId: Joi.string().required(),
        quantity: Joi.any().required(),
      });
      let payload = await helper.validationJoi(req.body, schema);
      payload.userId = req.user.id;
      let existingCartItem = await Models.cartModel.findOne({
        where: { userId: req.user.id, productId: payload.productId },
      });
      if (existingCartItem) {
        existingCartItem.quantity += payload.quantity;
        await existingCartItem.save();
        return commonHelper.success(
          res,
          req.msg.success_msg.addToCart,
          existingCartItem
        );
      }
      let newCartItem = await Models.cartModel.create(payload);
      return commonHelper.success(
        res,
        req.msg.success_msg.addToCart,
        newCartItem
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        req.msg.error_msg.intSerErr,
        error.message
      );
    }
  },

  getCart: async (req, res) => {
    try {
      const lang = req.headers.language || "en";

      const titleColumnMap = {
        en: "titleInEnglish",
        fi: "titleInFinnish",
        ru: "titleInRussian",
        sw: "titleInSwedish",
        uk: "titleInUkrainian",
      };
      const descriptionColumnMap = {
        en: "descriptionInEnglish",
        fi: "descriptionInFinnish",
        ru: "descriptionInRussian",
        sw: "descriptionInSwedish",
        uk: "descriptionInUkrainian",
      };

      const titleColumn = titleColumnMap[lang] || "titleInEnglish";
      const descriptionColumn =
        descriptionColumnMap[lang] || "descriptionInEnglish";
      let cartItems = await Models.cartModel.findAll({
        where: { userId: req.user.id },
        include: [
          {
            model: Models.productModel,
            attributes: [
              "id",
              "price",
              "loyaltyPoint",
              "refillEcoPoint",
              "categoryId",
              "discount",
              [Sequelize.col(`${titleColumn}`), "title"],
              [Sequelize.col(`${descriptionColumn}`), "description"],
            ],
            include: [
              {
                model: Models.productsImagesModel,
              },
            ],
          },
        ],
      });
      return commonHelper.success(res, req.msg.success_msg.viewCart, cartItems);
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        req.msg.error_msg.intSerErr,
        error.message
      );
    }
  },

  removeFromCart: async (req, res) => {
    try {
      await Models.cartModel.destroy({
        where: { id: req.query.cartId, userId: req.user.id },
      });
      return commonHelper.success(res, req.msg.success_msg.removeFromCart);
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        req.msg.error_msg.intSerErr,
        error.message
      );
    }
  },

  updateCartQuantity: async (req, res) => {
    try {
      let schema = Joi.object().keys({
        cartItemId: Joi.string().required(),
        quantity: Joi.any().optional(),
        type: Joi.any().optional(),
      });
      let payload = await helper.validationJoi(req.body, schema);
      payload.userId = req.user.id;
      let existingCartItem = await Models.cartModel.findOne({
        where: { userId: req.user.id, id: payload.cartItemId },
      });
      if (existingCartItem && payload.type == 2) {
        existingCartItem.quantity += 1;
        await existingCartItem.save();
        return commonHelper.success(res, req.msg.success_msg.addToCart);
      } else {
        existingCartItem.quantity -= 1;
        await existingCartItem.save();
        return commonHelper.success(res, req.msg.success_msg.removeFromCart);
      }
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        req.msg.error_msg.intSerErr,
        error.message
      );
    }
  },

  placeOrder: async (req, res) => {
    try {
      let cartItems = await Models.cartModel.findAll({
        where: { userId: req.user.id },
      });

      if (cartItems.length === 0) {
        return commonHelper.failed(res, "Cart is empty");
      }

      let firstCreatedOrder = null;   // << store first order here

      for (let item of cartItems) {
        const orderId =
          "ORD" + Math.random().toString(36).substring(2, 10).toUpperCase();

        let orderPayload = {
          userId: req.user.id,
          productId: item.productId,
          quantity: item.quantity,
          addressId: req.body.addressId,
          deliveryDate: req.body.deliveryDate,
          deliveryTimeSlot: req.body.deliveryTimeSlot,
          specialNote: req.body.specialNote,
          couponCode: req.body.couponCode,
          paymentMethod: req.body.paymentMethod,
          orderId: orderId,
        };

        const newOrder = await Models.orderModel.create(orderPayload);

        // Save first order UUID for Stripe
        if (!firstCreatedOrder) {
          firstCreatedOrder = newOrder;
        }
      }

      return commonHelper.success(res, req.msg.success_msg.placeOrder, {
        orderId: firstCreatedOrder.id,  // << IMPORTANT
      });

    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        req.msg.error_msg.intSerErr,
        error.message
      );
    }
  },

  getOrders: async (req, res) => {
    try {
      const lang = req.headers.language || "en";

      const titleColumnMap = {
        en: "titleInEnglish",
        fi: "titleInFinnish",
        ru: "titleInRussian",
        sw: "titleInSwedish",
        uk: "titleInUkrainian",
      };
      const descriptionColumnMap = {
        en: "descriptionInEnglish",
        fi: "descriptionInFinnish",
        ru: "descriptionInRussian",
        sw: "descriptionInSwedish",
        uk: "descriptionInUkrainian",
      };

      const titleColumn = titleColumnMap[lang] || "titleInEnglish";
      const descriptionColumn =
        descriptionColumnMap[lang] || "descriptionInEnglish";
      let orders = await Models.orderModel.findAll({
        where: { userId: req.user.id, isOrderComplete: 1 },
        include: [
          {
            model: Models.productModel,
            attributes: [
              "id",
              "price",
              "loyaltyPoint",
              "refillEcoPoint",
              "categoryId",
              "discount",
              "quantity",
              [Sequelize.col(`${titleColumn}`), "title"],
              [Sequelize.col(`${descriptionColumn}`), "description"],
            ],
          },
          {
            model: Models.userDeliveryAddressModel,
          },
          {
            model: Models.userModel,
            as: "driverDetail",
          },
        ],
      });
      return commonHelper.success(res, req.msg.success_msg.getOrders, orders);
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        req.msg.error_msg.intSerErr,
        error.message
      );
    }
  },

  getOrderDetails: async (req, res) => {
    try {
      let order = await Models.orderModel.findOne({
        where: { id: req.body.orderId, userId: req.user.id },
        include: [
          {
            model: Models.productModel,
          },
        ],
      });
      return commonHelper.success(
        res,
        req.msg.success_msg.getOrderDetails,
        order
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        req.msg.error_msg.intSerErr,
        error.message
      );
    }
  },

  customerSupport: async (req, res) => {
    try {
      const lang = req.headers.language || "en";
      let objToSave = {
        subjectInEnglish: req.body.subject,
        messageInEnglish: req.body.message,
        priority: req.body.priority,
      };
      let order = await Models.contactUsModel.create(objToSave);
      return commonHelper.success(
        res,
        req.msg.success_msg.getOrderDetails,
        order
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        req.msg.error_msg.intSerErr,
        error.message
      );
    }
  },

  isOnlineStatusChange: async (req, res) => {
    try {
      const lang = req.headers.language || "en";
      await Models.userModel.update({
        isOnline: req.body.isOnline
      }, {
        where: {
          id: req.user.id
        }
      });
      return commonHelper.success(
        res,
        req.msg.success_msg.onlineStatusChange,
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        req.msg.error_msg.intSerErr,
        error.message
      );
    }
  },

  dashboardDataDriver: async (req, res) => {
    try {
      const lang = req.headers.language || "en";

      let startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      let endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      let response = {};

      let activeOrder = await Models.orderModel.count({
        where: {
          driverId: req.user.id,
          status: 0
        }
      });

      let todayOrder = await Models.orderModel.count({
        where: {
          driverId: req.user.id,
          deliveryDate: {
            [Op.between]: [startOfToday, endOfToday],
          },
        },
      });

      let totalDelivery = await Models.orderModel.count({
        where: {
          driverId: req.user.id,
          status: 2
        }
      });

      let orders = await Models.orderModel.findAll({
        where: {
          driverId: req.user.id
        },
        include: [
          {
            model: Models.userDeliveryAddressModel,
          }
        ]
      });

      response.activeOrder = activeOrder;
      response.todayItems = todayOrder;
      response.totalDelivery = totalDelivery;
      response.orders = orders;

      return commonHelper.success(
        res,
        req.msg.success_msg.onlineStatusChange,
        response
      );

    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        req.msg.error_msg.intSerErr,
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

  // stripeWebhook: (io) => async (req, res) => {
  //   try {
  //     console.log("Stripe Webhook Received:", req.body);
  //     const { transactionId } = req.body;

  //     if (!transactionId) {
  //       return res.status(400).send("Missing paymentIntent ID");
  //     }

  //     const paymentIntent = await stripe.paymentIntents.retrieve(transactionId);

  //     const transaction = await Models.transactionModel.findOne({
  //       where: { transactionId },
  //       raw: true,
  //     });

  //     if (!transaction) {
  //       return commonHelper.failed(res, "Transaction not found");
  //     }

  //     if (paymentIntent.status !== "succeeded") {
  //       return commonHelper.failed(
  //         res,
  //         `PaymentIntent failed: ${paymentIntent.status}`
  //       );
  //     }

  //     await Models.transactionModel.update(
  //       { paymentStatus: 1 },
  //       { where: { transactionId } }
  //     );

  //     await Models.orderModel.update(
  //       {
  //         status: 0,
  //         isOrderComplete: 1,
  //       },
  //       { where: { id: transaction.orderId } }
  //     );

  //     await Models.cartModel.destroy({
  //       where: { userId: transaction.userId }
  //     });

  //     const order = await Models.orderModel.findOne({
  //       where: { id: transaction.orderId },
  //       include: [
  //         { model: Models.userModel, as: "user" },
  //         { model: Models.userAddressModel, as: "address" },
  //       ],
  //     });

  //     const admin = await Models.userModel.findOne({ where: { role: 0 } });

  //     await Models.notificationModel.create({
  //       senderId: transaction.userId,
  //       receiverId: admin?.id,
  //       orderId: transaction.orderId,
  //       typeOfNotification: 1,
  //       message: `A new order has been placed.`,
  //     });

  //     await Models.notificationModel.create({
  //       senderId: null,
  //       receiverId: transaction.userId,
  //       orderId: transaction.orderId,
  //       typeOfNotification: 2,
  //       message: `Your order has been successfully placed.`,
  //     });

  //     return commonHelper.success(res, "Stripe webhook processed successfully");

  //   } catch (error) {
  //     console.log("Stripe Webhook Error:", error);
  //     return res.status(500).send("Webhook error");
  //   }
  // },

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
