module.exports = (Sequelize, sequelize, DataTypes) => {
    return sequelize.define(
        "orders",
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
            driverId: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: "users", // name of Target model
                    key: "id", // key in Target model that we"re referencing
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            addressId:{
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: "userDeliveryAddresses", // name of Target model
                    key: "id", // key in Target model that we"re referencing
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            orderId:{
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            deliveryDate:{
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            deliveryTimeSlot:{
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            couponCode:{
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            paymentMethod:{
                type: DataTypes.INTEGER(11),
                allowNull: true,
                defaultValue: 0 // 0-Online Payment,1-COD
            },
            quantity: {
                type: DataTypes.INTEGER(11),
                allowNull: true,
            },
            status:{
                type: DataTypes.INTEGER(11),
                allowNull:true,// 0-pending,1-ongoing,2-completed,3-cancelled
                defaultValue:0
            },
            isOrderComplete: {
                type: DataTypes.INTEGER(11),
                allowNull: true,
                defaultValue: 0, // 0-no,1-yes
            },
            specialNote: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            isDeleted: {
                type: DataTypes.INTEGER(11),
                allowNull: false,
                defaultValue: 0, // 0-no,1-yes
            },
            totalAmount: {
                type: DataTypes.DOUBLE,
                allowNull: true,
                defaultValue: 0,
            }
        },
        {
            timestamps: true,
            tableName: "orders",
        }
    );
};
