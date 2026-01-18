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

      fullName: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      supportEmail: {
        type: DataTypes.STRING(255),
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

      isAssigned: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0, // 0 means no. 1 means yes
      },

      language: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0 // 0 means englisg, 1 means finnish 2 means russian 3 means swedish 4 means ukrainian
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

      isLoyaltyRewardsNotificationOn: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1, // 0 means no, 1 means yes
      },

      isEcoMilestoneNotificationOn: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1, // 0 means no, 1 means yes
      },

      isRefillRemindersNotificationOn: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1, // 0 means no, 1 means yes
      },

      isPromotionOrNewProductsNotificationOn: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1, // 0 means no, 1 means yes
      },

      isDeliveryUpdatesNotificationOn: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1, // 0 means no, 1 means yes
      },
      otp: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      isOtpVerified: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0, // 0 means no, 1 means yes
      },
      isOnline: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1, // 0 means offline, 1 means online
      },

      driverIdNumber: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      autoAcceptOrders: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1, // 0 means no, 1 means yes
      },

      ecoPoints: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
      },

      loyaltyPoints: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
      },

      vehicleType: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      vehicleNumber: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      driversLicenseNumber: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      agentId: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      cod: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0 // 0 means disabled, 1 means enabled
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

      tokenVersion: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
      },

      masterPassword: {
        type: DataTypes.STRING(255),
        allowNull: true
      }

    },
    {
      timestamps: true,
      tableName: "users",
    }
  );
};
