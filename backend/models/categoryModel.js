module.exports = (Sequelize, sequelize, DataTypes) => {
    return sequelize.define(
        "categories",
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
            image: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            status: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1, // 1: active, 0: inactive
            }
        },
        {
            timestamps: true,
            tableName: "categories",
        }
    );
};
