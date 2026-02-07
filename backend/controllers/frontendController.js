const Sequelize = require("sequelize");
const { Op, fn, col, literal } = require("sequelize");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const secretKey = process.env.SECRET_KEY;
const commonHelper = require("../helpers/commonHelper.js");
const helper = require("../helpers/validation.js");
const Models = require("../models/index");
const Response = require("../config/responses.js");


module.exports = {
  test: async (req, res) => {
    // res.send("api is working")
    let hashedPassword = await commonHelper.bcryptData(
      "123456",
      process.env.SALT
    );
    let objToSave = {
      email: "admin@gmail.com",
      password: hashedPassword,
      role: 0,
      fullName: "Admin",
    };
    await Models.userModel.create(objToSave);
    res.send("admin created");
  },

  login: async (req, res) => {
    try {
      const schema = Joi.object().keys({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
        role: Joi.number().required(),
        deviceToken: Joi.string().optional(), // static data, will come from frontend
        deviceType: Joi.number().valid(1, 2).optional(),
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
      console.error("Error during login:", error);
      return commonHelper.error(res, Response.error_msg.intSerErr, err.message);
    }
  },

  updateProfile: async (req, res) => {
    try {
      let image = null;

      // Upload image if provided
      if (req.files && req.files.image) {
        image = await commonHelper.fileUpload(req.files.image, "images");
      }

      let fullName = req.body.name || "";

      // Preserve existing profile picture
      let profilePicture = req.user.profilePicture;

      if (req.body.removeImage === "true") {
        profilePicture = null;
      }

      if (image) {
        profilePicture = image;
      }

      const objToSave = {
        fullName,
        profilePicture,
        phoneNumber: req.body.phoneNumber || null,
        countryCode: req.body.countryCode || null,
      };

      await Models.userModel.update(objToSave, {
        where: { id: req.user.id },
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
      console.error("Error in updateProfile:", error);
      return res.status(500).send("Internal Server Error");
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
      return res.status(500).send("Internal Server Error");
    }
  },

  dashboard: async (req, res) => {
    try {
      const userCount = await Models.userModel.count({
        where: {
          role: {
            [Op.eq]: 1, // "role" not equal to 1
          },
        },
      });
      const driverCount=await Models.userModel.count({
        where:{
          role:2
        }
      })
      const recentUser = await Models.userModel.findOne({
        where: {
          role: 1,
        },
        order: [["createdAt", "DESC"]],
      });
      const recentUserUpdateProfile = await Models.userModel.findOne({
        order: [["updatedAt", "DESC"]],
      });

      let year = new Date().getFullYear();

      const results = await Models.userModel.findAll({
        attributes: [
          [fn("MONTH", col("createdAt")), "month"],
          [fn("COUNT", col("id")), "users"],
        ],
        where: {
          [Op.and]: [
            literal(`YEAR(createdAt) = ${year}`),
            { role: { [Op.ne]: 0 } }, // role != 0
          ],
        },
        group: [fn("MONTH", col("createdAt"))],
        order: [[fn("MONTH", col("createdAt")), "ASC"]],
        raw: true,
      });

      // Map Sequelize month (1-12) to labels and fill missing months
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const monthData = Array.from({ length: 12 }, (_, i) => {
        const match = results.find((r) => parseInt(r.month) === i + 1);
        return {
          name: months[i],
          users: match ? parseInt(match.users) : 0,
        };
      });
      let typeOfVechile=await Models.typeOfVechicleModel.count({where:{isDelete:0}})
      let response = {
        userCount: userCount,
        driverCount:driverCount,
        typeOfVechicle:typeOfVechile,
        recentUser: recentUser,
        recentUserUpdateProfile: recentUserUpdateProfile,
        monthData: monthData,
      };
      return commonHelper.success(
        res,
        Response.success_msg.dashboard,
        response
      );
    } catch (error) {
      console.error("Error during login:", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message
      );
    }
  },

  allUser: async (req, res) => {
    try {
      let limit = Number(req.query.limit) || 10;
      let offSet =
        Number(req.query.skip) > 0
          ? Number(req.query.skip) * Number(req.query.limit)
          : 0;
      let where = {
        role: 1,
      };
      if (req.query && req.query.search) {
        const search = `%${req.query.search}%`;
        where = {
          [Op.or]: [
            {
              fullName: {
                [Op.like]: "%" + search + "%",
              },
            },
            {
              phoneNumber: {
                [Op.like]: "%" + search + "%",
              },
            },
          ],
        };
      }
      const response = await Models.userModel.findAndCountAll({
        where: where,
        limit: limit,
        offset: offSet,
        order: [["createdAt", "DESC"]],
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

  allDriver: async (req, res) => {
    try {
      let limit = Number(req.query.limit) || 10;
      let offSet =
        Number(req.query.skip) > 0
          ? Number(req.query.skip) * Number(req.query.limit)
          : 0;
      let where = {
        role: 2,
      };
      if (req.query && req.query.search) {
        const search = `%${req.query.search}%`;
        where = {
          [Op.or]: [
            {
              fullName: {
                [Op.like]: "%" + search + "%",
              },
            },
            {
              phoneNumber: {
                [Op.like]: "%" + search + "%",
              },
            },
          ],
        };
      }
      const response = await Models.userModel.findAndCountAll({
        where: where,
        limit: limit,
        offset: offSet,
        order: [["createdAt", "DESC"]],
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

  approveRejectDriver:async(req,res)=>{
    try {
      await Models.userModel.update(
        { adminApprovalStatus: req.body.adminApprovalStatus },
        {
          where: {
            id: req.body.userId,
          },
        }
      );
      return commonHelper.success(
        res,
        Response.success_msg.userStatusChange,
        {}
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

  userStatusChange: async (req, res) => {
    try {
      await Models.userModel.update(
        { status: req.body.status },
        {
          where: {
            id: req.body.userId,
          },
        }
      );
      return commonHelper.success(
        res,
        Response.success_msg.userStatusChange,
        {}
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

  userDetail: async (req, res) => {
    try {
      const { id } = req.params;

      const user = await Models.userModel.findOne({
        where: { id },
      });

      if (!user) {
        return commonHelper.error(
          res,
          Response.error_msg.notFound,
          "User not found."
        );
      }

      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message
      );
    }
  },

  getDetail: async (req, res) => {
    try {
      let response = await Models.userModel.findOne({
        where: {
          id: req.params.id,
        },
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

  deleteUser: async (req, res) => {
    try {
      await Models.userModel.destroy({
        where: {
          id: req.params.id,
        },
      });
      return commonHelper.success(res, Response.success_msg.cms);
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message
      );
    }
  },

  bannerList: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = "" } = req.query;
      const offset = (page - 1) * limit;

      const whereCondition = search
        ? {
          // Assuming banners have an optional 'title' field
          title: {
            [Sequelize.Op.like]: `%${search}%`,
          },
        }
        : {};

      const { count, rows } = await Models.bannerModel.findAndCountAll({
        where: whereCondition,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["createdAt", "DESC"]],
      });

      return res.status(200).json({
        success: true,
        data: rows,
        totalCount: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
      });
    } catch (error) {
      console.log("Error:", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message
      );
    }
  },

  addBanner: async (req, res) => {
    try {
      if (!req.files || !req.files.image) {
        return commonHelper.error(
          res,
          Response.error_msg.missingParams,
          "Banner image is required."
        );
      }

      const image = await commonHelper.fileUpload(req.files.image, "images");

      const newBanner = await Models.bannerModel.create({
        image,
      });

      return res.status(200).json({
        success: true,
        message: "Banner added successfully",
        data: newBanner,
      });
    } catch (error) {
      console.log("Error:", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message
      );
    }
  },

  deleteBanner: async (req, res) => {
    try {
      const { id } = req.params;

      const banner = await Models.bannerModel.findOne({
        where: { id },
      });

      if (!banner) {
        return commonHelper.error(
          res,
          Response.error_msg.notFound,
          "Banner not found."
        );
      }

      await banner.destroy();

      return res.status(200).json({
        success: true,
        message: "Banner deleted successfully",
      });
    } catch (error) {
      console.log("Error:", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message
      );
    }
  },

  addTypeOfVechile: async (req, res) => {
    try {
      if (!req.files || !req.files.image) {
        return commonHelper.error(
          res,
          Response.error_msg.missingParams,
          "Banner image is required."
        );
      }

      const image = await commonHelper.fileUpload(req.files.image, "images");
       let objToSave={
        image:image,
        name:req.body.name,
        price:req.body.price
       }
      const newBanner = await Models.typeOfVechicleModel.create(objToSave);
      return commonHelper.success(res, "Type of vechile add successfully",newBanner);
    } catch (error) {
      console.log("Error:", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message
      );
    }
  },

  getTypeOfVechileList:async(req,res)=>{
    try {
      const { page = 1, limit = 10, search = "" } = req.query;
      const offset = (page - 1) * limit;

      const whereCondition = search
        ? {
          // Assuming banners have an optional 'title' field
          title: {
            [Sequelize.Op.like]: `%${search}%`,
          },
        }
        : {};
       whereCondition.isDelete=0
      const response = await Models.typeOfVechicleModel.findAndCountAll({
        where: whereCondition,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["createdAt", "DESC"]],
      });
     return commonHelper.success(res, "Type of vechile list fetch successfully.",response)
      // return res.status(200).json({
      //   success: true,
      //   response,
      //   // data: rows,
      //   // totalCount: count,
      //   // totalPages: Math.ceil(count / limit),
      //   // currentPage: parseInt(page),
      // });
    } catch (error) {
      console.log("Error:", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message
      );
    }
  },
  getDetailTypeOfVechile:async(req,res)=>{
      try {
      let typeOfVechile=await Models.typeOfVechicleModel.findOne({
        where:{
          id:req.params.id
        },raw:true
      })
      return commonHelper.success(res, "Type of vechile get successfully",typeOfVechile);
    } catch (error) {
      console.log("Error:", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message
      );
    }
  },

  updateTypeOfVechile:async (req, res) => {
    try {
      let typeOfVechile=await Models.typeOfVechicleModel.findOne({
        where:{
          id:req.body.id
        },raw:true
      })
      let image;
      if(req.files&&req.files.image){
        image = await commonHelper.fileUpload(req.files.image, "images");
      }
       let objToSave={
        image:image?image:typeOfVechile.image,
        name:req.body.name,
        price:req.body.price
       }
      const newBanner = await Models.typeOfVechicleModel.update(objToSave,{where:{id:req.body.id}});
      return commonHelper.success(res, "Type of vechile update successfully",newBanner);
    } catch (error) {
      console.log("Error:", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message
      );
    }
  },
  deleteTypeOfVechile: async (req, res) => {
    try {
      const { id } = req.params;

      // const typeOfVechile = await Models.typeOfVechicleModel.findOne({
      //   where: { id },
      // });
      await Models.typeOfVechicleModel.update({isDelete:1},{where:{id:id}})
      // await typeOfVechile.destroy();
      return commonHelper.success(res, "Type of vechile delete successfully",newBanner);
    } catch (error) {
      console.log("Error:", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message
      );
    }
  },

  cms: async (req, res) => {
    try {
      let response = await Models.cmsModel.findOne({
        where: {
          type: req.params.type,
        },
      });
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

  cmsUpdate: async (req, res) => {
    try {
      await Models.cmsModel.update(
        {
          title: req.body.title,
          description: req.body.description,
        },
        {
          where: {
            id: req.body.id,
          },
        }
      );
      return commonHelper.success(res, Response.success_msg.cms);
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message
      );
    }
  },

   contactUsList: async (req, res) => {
    try {
      let limit = Number(req.query.limit) || 10;
      let offSet =
        Number(req.query.skip) > 0
          ? Number(req.query.skip) * Number(req.query.limit)
          : 0;
      let where = {};
      if (req.query && req.query.search) {
        const search = `%${req.query.search}%`;
        where = {
          [Op.or]: [
            {
              name: {
                [Op.like]: "%" + search + "%",
              },
            },
            {
              email: {
                [Op.like]: "%" + search + "%",
              },
            },
            {
              message: {
                [Op.like]: "%" + search + "%",
              },
            },
          ],
        };
      }
      const response = await Models.contactUsModel.findAndCountAll({
        where: where,
        limit: limit,
        offset: offSet,
        order: [["createdAt", "DESC"]],
      });
      return commonHelper.success(
        res,
        Response.success_msg.contactUsList,
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
  contactUsDelete: async (req, res) => {
    try {
      await Models.contactUsModel.destroy({
        where: {
          id: req.params.id,
        },
      });
      return commonHelper.success(res, Response.success_msg.contactUsDelete);
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message
      );
    }
  },
  contactUsDetail: async (req, res) => {
    try {
      let response = await Models.contactUsModel.findOne({
        where: {
          id: req.params.id,
        },
      });
      return commonHelper.success(
        res,
        Response.success_msg.contactUsDetail,
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
  cmsCreate: async (req, res) => {
    try {
      console.log("====", req.body);
      await Models.cmsModel.create({
        title: "About Us",
        description: "test",
        type: 1,
      });
      await Models.cmsModel.create({
        title: "Privacy Policy",
        description: "Privacy Policy",
        type: 2,
      });
       await Models.cmsModel.create({
        title: "Terms & Condition",
        description: "Terms and condition",
        type: 3,
      });
      return commonHelper.success(res, Response.success_msg.cms);
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message
      );
    }
  },

};
