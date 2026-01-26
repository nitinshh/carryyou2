module.exports = (Sequelize, sequelize, DataTypes) => {
  return sequelize.define(
    "transactions",
    {
      ...require("./cors")(Sequelize, DataTypes),
      transactionId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
      },
      senderId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "users", // name of Target model
          key: "id", // key in Target model that we"re referencing
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      receiverId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "users", // name of Target model
          key: "id", // key in Target model that we"re referencing
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      bookingId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "bookings", // name of Target model
          key: "id", // key in Target model that we"re referencing
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      currency: {
        type: DataTypes.STRING(10),
        allowNull: true,
        defaultValue: "USD",
      },
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
      amount: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        defaultValue: null,
      },
      paymentStatus: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0, // 0 = pending 1 = success
      },
    },
    {
      timestamps: true,
      tableName: "transactions",
    },
  );
};
