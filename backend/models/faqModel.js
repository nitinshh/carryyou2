module.exports = (Sequelize, sequelize, DataTypes) => {
  return sequelize.define(
    "faq",
    {
      ...require("./cors")(Sequelize, DataTypes),
      questionInEnglish: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
      },
      questionInFinnish: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
      },
      questionInRussian: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
      },
      questionInSwedish: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
      },
      questionInUkrainian: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
      },
      answerInEnglish: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      answerInFinnish: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      answerInRussian: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      answerInSwedish: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      answerInUkrainian: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      timestamps: true,
      tableName: "faq",
    }
  );
};
