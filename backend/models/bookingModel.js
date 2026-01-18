module.exports = (Sequelize, sequelize, DataTypes) => {
    return sequelize.define(
        "bookings",
        {
            ...require("./cors")(Sequelize, DataTypes),

            userId: {
                type: Sequelize.UUID,
                allowNull: true,
                defaultValue: null,
                references: {
                    model: "users",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            driverId: {
                type: Sequelize.UUID,
                allowNull: true,
                defaultValue: null,
                references: {
                    model: "users",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            deliveryCode: {
                type: DataTypes.STRING(10),
                allowNull: true,
                defaultValue: null,
            },
            fromLocation: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            fromLatitude: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            fromLongitude: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            destinationLocation: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            destinationLatitude: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            destinationLongitude: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            status: {
                type: DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 0, // 0 = pending, 1 = accepted, 2 = inProgress, 3 = completed, 4 = cancelled
            },
            amount: {
                type: DataTypes.DOUBLE,
                allowNull: true,
                defaultValue: 0,
            },
            distance: {
                type: DataTypes.DOUBLE,
                allowNull: true,
                defaultValue: 0,
            },
            rideType: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
        },
        {
            timestamps: true,
            tableName: "bookings",
        }
    );
};
