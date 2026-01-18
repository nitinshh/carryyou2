module.exports = (Sequelize, sequelize, DataTypes) => {
    return sequelize.define(
        "postalCodes",
        {
            ...require("./cors")(Sequelize, DataTypes),
            cityId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: "city", // name of Target model
                    key: "id", // key in Target model that we"re referencing
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            postalCode: {
                type: DataTypes.STRING(20),
                allowNull: false
            },
            status: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1, // 1: active, 0: inactive
            }
        },
        {
            timestamps: true,
            tableName: "postalCodes",
        }
    );
};
