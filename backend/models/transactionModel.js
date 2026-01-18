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
      currency: {
        type: DataTypes.STRING(10),
        allowNull: true,
        defaultValue: 'USD'
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
    }
  );
};
