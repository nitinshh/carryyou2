module.exports = (Sequelize, sequelize, DataTypes) => {
  return sequelize.define(
    "cms",
    {
      ...require("./cors")(Sequelize, DataTypes),
      titleInEnglish: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      titleInFinnish: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      titleInRussian: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      titleInSwedish: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      titleInUkrainian: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      descriptionInEnglish: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      descriptionInFinnish: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      descriptionInRussian: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      descriptionInSwedish: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      descriptionInUkrainian: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      type: {
        type: DataTypes.INTEGER(11),
        allowNull: true,
        defaultValue: 0,  //1 for about us 2 for privacy policy 3 for terms and conditions
        comment: "1 for about us 2 for privacy policy 3 for terms and conditions",
      },
    },
    {
      timestamps: true,
      tableName: "cms",
    }
  );
};
