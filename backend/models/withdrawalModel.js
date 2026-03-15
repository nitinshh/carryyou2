module.exports = (Sequelize, sequelize, DataTypes) => {
  return sequelize.define(
    "withdrawals",
    {
      ...require("./cors")(Sequelize, DataTypes),
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "users", // name of Target model
          key: "id", // key in Target model that we"re referencing
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
      tableName: "withdrawals",
    },
  );
};
