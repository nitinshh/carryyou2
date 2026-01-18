module.exports = (Sequelize, sequelize, DataTypes) => {
  return sequelize.define(
    "coupons",
    {
      ...require("./cors")(Sequelize, DataTypes),
      title: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1, // 0 means inactive. 1 means active
        comment: "0 => inactive, 1 => active",
      },
      discount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      }
    },
    {
      timestamps: true,
      tableName: "coupons",
    }
  );
};
