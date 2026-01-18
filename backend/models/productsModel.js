module.exports = (Sequelize, sequelize, DataTypes) => {
    return sequelize.define(
        "products",
        {
            ...require("./cors")(Sequelize, DataTypes),
            categoryId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: "categories", // name of Target model
                    key: "id", // key in Target model that we"re referencing
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
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
            price: {
                type: DataTypes.DOUBLE,
                allowNull: false,
                defaultValue: 0
            },
            loyaltyPoint: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            refillEcoPoint: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            discount: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            quantity: {
                type: DataTypes.STRING(100),
                allowNull: true,
                defaultValue: null
            },
            status: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1, // 1: active, 0: inactive
            }
        },
        {
            timestamps: true,
            tableName: "products",
        }
    );
};
