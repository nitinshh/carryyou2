module.exports = (Sequelize, sequelize, DataTypes) => {
  return sequelize.define(
    "lostItem",
    {
      ...require("./cors")(Sequelize, DataTypes),

      bookingId: {
        type: Sequelize.UUID,
        allowNull: true,
        defaultValue: null,
        references: {
          model: "bookings",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: true,
        defaultValue: null,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      driverId: {
        type: Sequelize.UUID,
        allowNull: true,
        defaultValue: null,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      countryCode: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      phoneNumber: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      userConfirm: {
        //this is user side user confirms that driver found the item or not
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0, // 0 means pending,1 means driver found
      },
      driverConfirm: {
        // this is driver side driver confirms that he have the item or not
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0, //1-> i Have the item 2-> i dont have
      },
      sendToAdminOrNot: {
        // if driver not respond or user not respond after 24 hours then send to admin for manual process
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0, // 0 means not send to admin,1 means send to admin
      },
      paymentStatus: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0, // 0 means pending,1 means paid
      },
      dropLatitude: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      dropLongitude: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      dropLocation: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      amount: {
        type: Sequelize.FLOAT,
        allowNull: true,
        defaultValue: null,
      },
      startNavigationStatus: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0, //  1 start, 2-> i am hear, 3-> completed
      },
    },
    {
      timestamps: true,
      tableName: "lostItem",
    },
  );
};
