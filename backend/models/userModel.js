module.exports = (Sequelize, sequelize, DataTypes) => {
  return sequelize.define(
    "users",
    {
      ...require("./cors")(Sequelize, DataTypes),

      role: {
        type: DataTypes.INTEGER, // 0 for admin 1 for user/customers 2 for drivers
        allowNull: true,
        defaultValue: 1,
        comment: "0 for admin 1 for user/customers 2 for drivers",
      },

      adminApprovalStatus: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0, // 0 = pending, 1 = approved, 2 = rejected
      },
      isNotificationOnOff:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue:1
      },

      fullName: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },

      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      countryCode: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },

      phoneNumber: {
        type: DataTypes.STRING(15),
        allowNull: true,
      },

      password: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      profilePicture: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
      },

      city: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      country: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      socialType: {
        type: DataTypes.INTEGER,
        allowNull: true, // 1 FOR GOOOGLE 2 FOR FACEBOOK 3 FOR APPLE
        defaultValue: 0,
      },

      socialId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
      },

      customerId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
      },

      status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0, // 0 means inactive. 1 means active
        comment: "0 => inactive, 1 => active",
      },

      isOtpVerified: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0, // 0 means no, 1 means yes
      },

      location: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      latitude: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      longitude: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      isOnline: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1, // 0 means offline, 1 means online
      },

      licenceFrontImage: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      licenceBackImage: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      driversLicenseNumber: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      issuedOn: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      licenceType: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      dob: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      nationality: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      expiryDate: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      pictureOfVehicle: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      typeOfVehicle: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0, // 0 for bike, 1 for car, 2 for van
      },

      vehicleRegistrationImage: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      registrationExpiryDate: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      insurancePolicyImage: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      insuranceExpiryDate: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      vehicleNumber: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      resetToken: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
      },

      resetTokenExpires: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },

      deviceToken: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
      },

      deviceType: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
      },
      socketId:{
        type:DataTypes.STRING(255),
        allowNull:true,
        defaultValue:null
      }
    },
    {
      timestamps: true,
      tableName: "users",
    }
  );
};
