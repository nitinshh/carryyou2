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

const generateAlphaNumericInviteCode = (length = 12) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};


const generateUniqueInviteCode = async () => {
  let code;
  let exists = true;

  while (exists) {
    code = generateAlphaNumericInviteCode(12);

    const found = await Models.invitedCodeModel.findOne({
      where: { code },
    });

    exists = !!found;
  }

  return code;
};




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
        btcWalletAddress: req.body.btcWalletAddress || null,
        supportEmail: req.body.supportEmail || null,
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
            isAddedByAdmin: 0,
            [Op.eq]: 1, // "role" not equal to 1
          },
        },
      });
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
      let response = {
        userCount: userCount,
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
        isAddedByAdmin: 0
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

  userStatusChange: async (req, res) => {
    try {
      console.log("req.body", req.body);
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

  beginnerUsersList: async (req, res) => {
    try {
      let limit = Number(req.query.limit) || 10;
      let offset =
        Number(req.query.skip) > 0
          ? Number(req.query.skip) * limit
          : 0;

      let where = {
        level: 0,
        isAddedByAdmin: 1,
        role: 1,
      };

      if (req.query.search) {
        const search = `%${req.query.search}%`;
        where[Op.or] = [
          { fullName: { [Op.like]: search } },
          { email: { [Op.like]: search } },
          { phoneNumber: { [Op.like]: search } },
        ];
      }


      const response = await Models.userModel.findAndCountAll({
        where,
        limit,
        offset,
        order: [["createdAt", "DESC"]],
      });

      return commonHelper.success(
        res,
        Response.success_msg.userList,
        {
          data: response.rows,
          totalCount: response.count,
        }
      );
    } catch (error) {
      console.error("Beginner Users List Error:", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message
      );
    }
  },

  viewUser: async (req, res) => {
    try {
      const user = await Models.userModel.findOne({
        where: { id: req.params.id },
        attributes: { exclude: ["password"] },
      });

      if (!user) {
        return commonHelper.error(
          res,
          Response.error_msg.notFound,
          "User not found"
        );
      }

      return commonHelper.success(
        res,
        Response.success_msg.userDetail,
        user
      );
    } catch (error) {
      console.error("View User Error:", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message
      );
    }
  },

  beginnerUsersPositions: async (req, res) => {
    try {
      const users = await Models.userModel.findAll({
        where: { level: 0, isAddedByAdmin: 1 },
        attributes: ["position", "donerReceiver"],
      });

      const usedPositions = users
        .map((u) => u.position)
        .filter((p) => p !== null);

      const receiverExists = users.some((u) => u.donerReceiver === 1);

      const donorCount = users.filter((u) => u.donerReceiver === 0).length;

      return commonHelper.success(res, "Beginner meta", {
        usedPositions,
        receiverExists,
        donorCount,
      });
    } catch (error) {
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message
      );
    }
  },

  beginnerUserCreate: async (req, res) => {
    try {
      const {
        fullName,
        email,
        countryCode,
        phoneNumber,
        btcWalletAddress,
      } = req.body;

      const donerReceiver = Number(req.body.donerReceiver);
      const position = Number(req.body.position);

      if (!fullName || !email)
        return commonHelper.error(res, "Name & Email required");

      if (isNaN(position) || position < 0 || position > 10)
        return commonHelper.error(res, "Invalid position");

      if (![0, 1].includes(donerReceiver))
        return commonHelper.error(res, "Invalid donerReceiver");

      /* POSITION UNIQUE */
      const positionExists = await Models.userModel.findOne({
        where: { level: 0, position, role: 1 },
      });
      if (positionExists)
        return commonHelper.error(res, "Position already used");

      /* ONLY ONE RECEIVER */
      if (donerReceiver === 1) {
        const receiverCount = await Models.userModel.count({
          where: { level: 0, donerReceiver: 1, role: 1 },
        });
        if (receiverCount > 0)
          return commonHelper.error(res, "Receiver already exists");
      }

      /* MAX 10 DONORS */
      if (donerReceiver === 0) {
        const donorCount = await Models.userModel.count({
          where: { level: 0, donerReceiver: 0, role: 1 },
        });
        if (donorCount >= 10)
          return commonHelper.error(res, "Donor limit reached");
      }

      let profilePicture = null;
      if (req.files?.image) {
        profilePicture = await commonHelper.fileUpload(
          req.files.image,
          "images"
        );
      }

       const hashedPassword = await commonHelper.bcryptData(
              "123456",
              process.env.SALT
            );

      const user = await Models.userModel.create({
        fullName,
        email,
        countryCode,
        phoneNumber,
        btcWalletAddress,
        donerReceiver,
        position,
        level: 0,
        role: 1,
        profilePicture,
        isAddedByAdmin: 1,
        status: 1,
        password:hashedPassword
      });

      /** 🔥 INVITE CODE */
      const inviteCode = await generateUniqueInviteCode();

      await Models.invitedCodeModel.create({
        code: inviteCode,
        userId: user.id,
        isUsed: 0,
      });


      return commonHelper.success(res, "Beginner user created", user);
    } catch (error) {
      console.log("Beginner user create error:", error);
      return commonHelper.error(res, "Server error", error.message);
    }
  },

  beginnerUserDetail: async (req, res) => {
    try {
      const user = await Models.userModel.findOne({
        where: { id: req.params.id, level: 0 },
        attributes: { exclude: ["password"] },
      });

      if (!user)
        return commonHelper.error(res, "Not Found", "User not found");

      return commonHelper.success(res, "User detail", user);
    } catch (error) {
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message
      );
    }
  },

  beginnerUserUpdate: async (req, res) => {
    try {
      const {
        id,
        fullName,
        countryCode,
        phoneNumber,
        btcWalletAddress,
      } = req.body;

      const donerReceiver = Number(req.body.donerReceiver);
      const position = Number(req.body.position);

      const user = await Models.userModel.findOne({
        where: { id, level: 0 },
      });

      if (!user)
        return commonHelper.error(res, "Not Found", "User not found");

      /* ---------- BASIC VALIDATION ---------- */
      if (!fullName)
        return commonHelper.error(res, "Validation", "Full name required");

      if (isNaN(position) || position < 0 || position > 10)
        return commonHelper.error(res, "Validation", "Invalid position");

      if (![0, 1].includes(donerReceiver))
        return commonHelper.error(res, "Validation", "Invalid donerReceiver");

      /* ---------- POSITION UNIQUE ---------- */
      const positionUsed = await Models.userModel.findOne({
        where: {
          level: 0,
          position,
          id: { [Op.ne]: id },
        },
      });

      if (positionUsed)
        return commonHelper.error(res, "Validation", "Position already used");

      /* ---------- ROLE CHANGE RULES ---------- */

      // 🔁 Changing TO Receiver
      if (donerReceiver === 1 && user.donerReceiver !== 1) {
        const receiverExists = await Models.userModel.count({
          where: { level: 0, donerReceiver: 1 },
        });

        if (receiverExists > 0)
          return commonHelper.error(res, "Validation", "Receiver already exists");
      }

      // 🔁 Changing TO Donor
      if (donerReceiver === 0 && user.donerReceiver !== 0) {
        const donorCount = await Models.userModel.count({
          where: { level: 0, donerReceiver: 0 },
        });

        if (donorCount >= 10)
          return commonHelper.error(res, "Validation", "Donor limit reached");
      }

      /* ---------- IMAGE ---------- */
      let profilePicture = user.profilePicture;
      if (req.files?.image) {
        profilePicture = await commonHelper.fileUpload(
          req.files.image,
          "images"
        );
      }

      /* ---------- UPDATE ---------- */
      await Models.userModel.update(
        {
          fullName,
          countryCode,
          phoneNumber,
          btcWalletAddress,
          donerReceiver,
          position,
          profilePicture,
        },
        { where: { id } }
      );

      const updatedUser = await Models.userModel.findOne({
        where: { id },
        attributes: { exclude: ["password"] },
      });

      return commonHelper.success(
        res,
        Response.success_msg.updateSuccess,
        updatedUser
      );
    } catch (error) {
      console.error("Beginner User Update Error:", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message
      );
    }
  },

  advanceUsersList: async (req, res) => {
    try {
      let limit = Number(req.query.limit) || 10;
      let offset =
        Number(req.query.skip) > 0
          ? Number(req.query.skip) * limit
          : 0;

      let where = {
        level: 1,
        isAddedByAdmin: 1,
        role: 1,
      };

      if (req.query.search) {
        const search = `%${req.query.search}%`;
        where[Op.or] = [
          { fullName: { [Op.like]: search } },
          { email: { [Op.like]: search } },
          { phoneNumber: { [Op.like]: search } },
        ];
      }

      const response = await Models.userModel.findAndCountAll({
        where,
        limit,
        offset,
        order: [["createdAt", "DESC"]],
      });

      return commonHelper.success(
        res,
        Response.success_msg.userList,
        {
          data: response.rows,
          totalCount: response.count,
        }
      );
    } catch (error) {
      console.error("Advance Users List Error:", error);
      return commonHelper.error(
        res,
        Response.error_msg.intSerErr,
        error.message
      );
    }
  },

  advanceUsersPositions: async (req, res) => {
    try {
      const users = await Models.userModel.findAll({
        where: { level: 1, isAddedByAdmin: 1 },
        attributes: ["position", "donerReceiver"],
      });

      return commonHelper.success(res, "Advance meta", {
        usedPositions: users.map(u => u.position).filter(Boolean),
        receiverExists: users.some(u => u.donerReceiver === 1),
      });
    } catch (error) {
      return commonHelper.error(res, "Server error", error.message);
    }
  },

  advanceUserCreate: async (req, res) => {
    try {
      const {
        fullName,
        email,
        countryCode,
        phoneNumber,
        btcWalletAddress,
      } = req.body;

      const donerReceiver = Number(req.body.donerReceiver);
      const position = Number(req.body.position);

      if (!fullName || !email)
        return commonHelper.error(res, "Name & Email required");

      if (isNaN(position) || position < 0 || position > 10)
        return commonHelper.error(res, "Invalid position");

      if (![0, 1].includes(donerReceiver))
        return commonHelper.error(res, "Invalid donerReceiver");

      const exists = await Models.userModel.findOne({
        where: { level: 1, position, role: 1 },
      });
      if (exists)
        return commonHelper.error(res, "Position already used");

      if (donerReceiver === 1) {
        const count = await Models.userModel.count({
          where: { level: 1, donerReceiver: 1, role: 1 },
        });
        if (count > 0)
          return commonHelper.error(res, "Receiver already exists");
      }

      let profilePicture = null;
      if (req.files?.image) {
        profilePicture = await commonHelper.fileUpload(
          req.files.image,
          "images"
        );
      }

       const hashedPassword = await commonHelper.bcryptData(
              "123456",
              process.env.SALT
            );

      /** ✅ CREATE USER */
      const user = await Models.userModel.create({
        fullName,
        email,
        countryCode,
        phoneNumber,
        btcWalletAddress,
        donerReceiver,
        position,
        level: 1,
        role: 1,
        profilePicture,
        isAddedByAdmin: 1,
        status: 1,
        password:hashedPassword
      });

      /** 🔥 GENERATE & SAVE INVITE CODE */
      const inviteCode = await generateUniqueInviteCode();

      await Models.invitedCodeModel.create({
        code: inviteCode,
        userId: user.id,
        isUsed: 0,
      });

      return commonHelper.success(res, "Advance user created", user);
    } catch (error) {
      console.error("Advance user create error:", error);
      return commonHelper.error(res, "Server error", error.message);
    }
  },


  advanceUserUpdate: async (req, res) => {
    try {
      const { id, fullName, countryCode, phoneNumber, btcWalletAddress } =
        req.body;

      const donerReceiver = Number(req.body.donerReceiver);
      const position = Number(req.body.position);

      const user = await Models.userModel.findOne({
        where: { id, level: 1 },
      });

      if (!user)
        return commonHelper.error(res, "Not Found", "User not found");

      if (!fullName)
        return commonHelper.error(res, "Full name required");

      const used = await Models.userModel.findOne({
        where: { level: 1, position, id: { [Op.ne]: id } },
      });
      if (used)
        return commonHelper.error(res, "Position already used");

      let profilePicture = user.profilePicture;
      if (req.files?.image) {
        profilePicture = await commonHelper.fileUpload(req.files.image, "images");
      }

      await Models.userModel.update(
        {
          fullName,
          countryCode,
          phoneNumber,
          btcWalletAddress,
          donerReceiver,
          position,
          profilePicture,
        },
        { where: { id } }
      );

      return commonHelper.success(res, "Advance user updated");
    } catch (error) {
      return commonHelper.error(res, "Server error", error.message);
    }
  },

  advanceUserDetail: async (req, res) => {
    try {
      const user = await Models.userModel.findOne({
        where: { id: req.params.id, level: 1 },
        attributes: { exclude: ["password"] },
      });

      if (!user)
        return commonHelper.error(res, "Not Found", "User not found");

      return commonHelper.success(res, "User detail", user);
    } catch (error) {
      return commonHelper.error(res, "Server error", error.message);
    }
  },




};
