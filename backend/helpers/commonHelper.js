const path = require("path");
const fs = require("fs");
const { v4: uuid } = require("uuid");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const emailTamplate = require("./emailTemplate/forgetPassword");
var admin = require("firebase-admin");
// var serviceAccount = require("");
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

module.exports = {
  success: async (res, message, body = {}) => {
    try {
      return res.status(200).json({
        success: true,
        code: 200,
        message: message,
        body: body,
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  },

  failed: async (res, msg, body = {}) => {
    try {
      console.log("msg",msg)
      return res.status(400).json({
        success: false,
        message: msg,
        code: 400,
        body: {},
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  },
  failedError: async (res, msg, body = {}) => {
    try {
      return res.status(401).json({
        success: false,
        message: msg,
        code: 401,
        body: {},
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  },
  error: async (res, msg, body = {}) => {
    try {
      return res.status(500).json({
        success: false,
        message: msg,
        code: 500,
        body: {},
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  },

  fileUpload: async (file, folder = "images") => {
    try {
      if (!file || !file.name) return null;

      // Get file extension
      const fileExtension = file.name.split(".").pop();

      // Generate unique file name
      const name = `${uuid()}.${fileExtension}`;

      // Build folder path inside /public
      const folderPath = path.join(__dirname, "..", "public", folder);
      console.log("folderPath",folderPath)
      console.log("first",fs.existsSync(folderPath))
      // ✅ Create folder if it doesn't exist
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      // Build final file path
      const filePath = path.join(folderPath, name);

      // Move file
      await file.mv(filePath);

      // Return relative path
      return `/${folder}/${name}`;
    } catch (error) {
      console.error("Error during file upload:", error);
      return null;
    }
  },

  uploadThumbAndVideo: async (file) => {
    const videoName = file.name;
    console.log("🚀 ~ videoName:", videoName);
    const fileExt = videoName.split(".").pop(); // Extract file extension

    // Generate a random name for the thumbnail
    const letters = "ABCDE1234567890FGHJK1234567890MNPQRSTUXY";
    let thumbnailName = "";
    while (thumbnailName.length < 28) {
      const randIndex = Math.floor(Math.random() * letters.length);
      thumbnailName += letters[randIndex];
    }
    const thumbnailExt = "jpg"; // Customize the thumbnail extension if needed
    const thumbnailFullName = `${thumbnailName}.${thumbnailExt}`;

    console.log("🚀 ~ thumbnailFullName:", thumbnailFullName);

    // Move the video file to the specified folder
    await file.mv(`public/images/${videoName}`);

    // Create a promise to handle the ffmpeg function
    return new Promise((resolve, reject) => {
      ffmpeg(`public/images/${videoName}`)
        .screenshots({
          timestamps: ["05%"],
          filename: thumbnailFullName,
          folder: `public/images`,
          size: "320x240",
        })
        .on("end", (result) => {
          console.log("🚀  file: helper.js:141  .on ~ result:", result);
          let image = `/images/${videoName}`;
          let thumbnail = `/images/${thumbnailFullName}`;
          resolve({ image, thumbnail: thumbnail });

          return { image, thumbnail: thumbnail };
        })
        .on("error", (err) => {
          reject(err);
        });
    });
  },

  bcryptData: async (newPassword, salt) => {
    try {
      // Ensure `salt` is a number if passed as a string
      const saltRounds = typeof salt === "string" ? parseInt(salt, 10) : salt;

      // Hash the password using the salt rounds
      return await bcrypt.hash(newPassword, saltRounds);
    } catch (error) {
      console.log("bcrypt User error", error);
      throw error;
    }
  },

  getHost: async (req, res) => {
    const host =
      req.headers.host || `${req.hostname}:${req.connection.localPort}`;
    return host;
  },

  sidIdGenerateTwilio: async (req, res) => {
    try {
      const serviceSid = await otpManager.createServiceSID("appCleaning", "4");
      console.log("Service SID created:", serviceSid);
      return serviceSid;
    } catch (error) {
      console.error("Error generating Service SID:", error);
      throw new Error("Failed to generate Service SID");
    }
  },

  randomStringGenerate: async (req, res) => {
    try {
      return crypto.randomBytes(32).toString("hex");
    } catch (error) {
      console.log("randomString generate error", error);
      throw error;
    }
  },

  nodeMailer: async (req, res) => {
    try {
      let transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        secure: false, // Set to `true` for port 465, `false` for port 587
        auth: {
          user: process.env.MAIL_USERNAME,
          pass: process.env.MAIL_PASSWORD,
        },
      });
      return transporter;
    } catch (error) {
      console.log("nodeMailer error", error);
      throw error;
    }
  },

  forgetPasswordLinkHTML: async (req, user, resetUrl, subject) => {
    try {
      let mailOptions = {
        from: process.env.MAIL_USERNAME,
        to: user.email,
        subject: subject,
        html: await emailTamplate.forgetPasswordLinkHTML(req, resetUrl),
      };
      return mailOptions;
    } catch (error) {
      console.log("forgetPassword error", error);
      throw error;
    }
  },
  forgetPassword: async (req, user, otp, subject) => {
    try {
      let mailOptions = {
        from: process.env.MAIL_USERNAME,
        to: user.email,
        subject: subject,
        html: await emailTamplate.forgotPassword(req, otp),
      };
      return mailOptions;
    } catch (error) {
      console.log("forgetPassword error", error);
      throw error;
    }
  },
  accountApproved: async (user, password, url, subject) => {
    try {
      let mailOptions = {
        from: process.env.MAIL_USERNAME,
        to: user.email,
        subject: subject,
        html: await emailTamplate.accountApproved(user.email, password, url),
      };
      return mailOptions;
    } catch (error) {
      console.log("forgetPassword error", error);
      throw error;
    }
  },
  generateOTP: async () => {
    return Math.floor(1000 + Math.random() * 9000); // ensures a 4-digit number from 1000–9999
  },
  session: async (req, res, next) => {
    if (req.session.user) {
      next();
    } else {
      return res.redirect("/admin/login");
    }
  },
  sendFirebasePush: async function (deviceToken, bodyData, type, deviceType) {
    bodyData.priority = "high";
    bodyData.sound = "default";

    if (!bodyData.title) {
      bodyData.title = bodyData.message;
    }
    // Convert all bodyData values to strings
    const stringifiedData = {};
    for (let key in bodyData) {
      if (bodyData.hasOwnProperty(key)) {
        stringifiedData[key] = String(bodyData[key]);
      }
    }

    const message = {
      // notification is used for ios
      token: deviceToken,
      ...(deviceType == 2 &&
        deviceType != null && {
          notification: {
            title: bodyData.title,
            body: bodyData.message,
          },
        }),

      // data is used for android
      data: {
        ...stringifiedData,
        type: String(type),
      },
      // ...(deviceType == 1 &&
      //   deviceType != null && {
      //     data: {
      //       ...stringifiedData,
      //       type: String(type),
      //     },
      //   }),
      android:
        deviceType == 1
          ? {
              priority: "high",
            }
          : undefined,

      apns:
        deviceType == 2
          ? {
              payload: {
                aps: {
                  sound: "default",
                },
              },
            }
          : undefined,
    };

    admin
      .messaging()
      .send(message)
      .then((response) => {
        console.log("Notification sent:", response);
        return true;
      })
      .catch((error) => {
        console.error("Error sending notification:", error);
        return true;
      });
  },
};
