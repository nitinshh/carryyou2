module.exports = (Sequelize, sequelize, DataTypes) => {
  return sequelize.define(
    "contactUs",
    {
      ...require("./cors")(Sequelize, DataTypes),
      subjectInEnglish: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
      },
      subjectInFinnish: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
      },
      messageInEnglish: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      messageInFinnish: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      priority:{
        type: DataTypes.INTEGER(11),
        allowNull: true,
        defaultValue: 0,  //1 for low 2 for medium 3 for high
        comment: "1 for low 2 for medium 3 for high",
      }
    },
    {
      timestamps: true,
      tableName: "contactUs",
    }
  );
};
