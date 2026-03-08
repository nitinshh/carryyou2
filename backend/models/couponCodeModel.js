module.exports = (Sequelize, sequelize, DataTypes) => {
  return sequelize.define(
    "couponCode",
    {
      ...require("./cors")(Sequelize, DataTypes),
      name: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue:null
      },
      code:{
        type:DataTypes.STRING,
        allowNull:true,
        defaultValue:null
      },
      percentageOff: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0.0,
      },
      isDelete:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue:0
      }
    },
    {
      timestamps: true,
      tableName: "couponCode",
    }
  );
};
