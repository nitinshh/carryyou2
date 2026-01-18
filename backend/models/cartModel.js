module.exports = (Sequelize, sequelize, DataTypes) => {
    return sequelize.define(
        "carts",
        {
            ...require("./cors")(Sequelize, DataTypes),
            productId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: "products", // name of Target model
                    key: "id", // key in Target model that we"re referencing
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            userId: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: "users", // name of Target model
                    key: "id", // key in Target model that we"re referencing
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            quantity: {
                type: DataTypes.INTEGER(11),
                allowNull: true,
            },
        },
        {
            timestamps: true,
            tableName: "carts",
        }
    );
};
