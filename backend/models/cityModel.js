module.exports = (Sequelize, sequelize, DataTypes) => {
    return sequelize.define(
        "city",
        {
            ...require("./cors")(Sequelize, DataTypes),
            title: {
                type: DataTypes.STRING(255),
                allowNull: true
            },
            status: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1, // 1: active, 0: inactive
            }
        },
        {
            timestamps: true,
            tableName: "city",
        }
    );
};
