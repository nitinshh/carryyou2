module.exports = (Sequelize, sequelize, DataTypes) => {
    return sequelize.define(
        "productsImages",
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
            image: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
        },
        {
            timestamps: true,
            tableName: "productsImages",
        }
    );
};
