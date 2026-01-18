module.exports = (Sequelize, sequelize, DataTypes) => {
    return sequelize.define(
        "userDeliveryAddresses",
        {
            ...require("./cors")(Sequelize, DataTypes),
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

            name: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },

            location: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            latitude: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            longitude: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            streetNo: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            houseNo: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            state: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            country: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            postalCode: {
                type: DataTypes.STRING(20),
                allowNull: true,
            },
            isDeafult: {
                type: DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 0 // 0 means no, 1 means yes
            }
        },
        {
            timestamps: true,
            tableName: "userDeliveryAddresses",
        }
    );
};
