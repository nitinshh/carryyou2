module.exports = (Sequelize, sequelize, DataTypes) => {
  return sequelize.define(
    "contactUs",
    {
      ...require("./cors")(Sequelize, DataTypes),
      name: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
      },
      countryCode: {
        type: DataTypes.STRING(30),
        allowNull: true,
        defaultValue: null,
      },
      phoneNumber: {
        type: DataTypes.STRING(30),
        allowNull: true,
        defaultValue: null,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      timestamps: true,
      tableName: "contactUs",
    }
  );
};
