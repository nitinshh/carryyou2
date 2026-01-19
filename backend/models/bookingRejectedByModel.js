module.exports = (Sequelize, sequelize, DataTypes) => {
    return sequelize.define(
        "bookingRejectedBy",
        {
            ...require("./cors")(Sequelize, DataTypes),

            bookingId: {
                type: Sequelize.UUID,
                allowNull: true,
                defaultValue: null,
                references: {
                    model: "bookings",
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
        },
        {
            timestamps: true,
            tableName: "bookingRejectedBy",
        }
    );
};
