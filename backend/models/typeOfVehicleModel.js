module.exports = (Sequelize, sequelize, DataTypes) => {
  return sequelize.define(
    "typeOfVechile",
    {
      ...require("./cors")(Sequelize, DataTypes),
      name: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue:null
      },
      image: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue:null
      },
      price: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0.0,
      },
    },
    {
      timestamps: true,
      tableName: "typeOfVechile",
    }
  );
};
