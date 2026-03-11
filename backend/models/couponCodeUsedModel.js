module.exports = (Sequelize, sequelize, DataTypes) => {
  return sequelize.define(
    "couponCodeUsed",
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
      couponCodeId: {
        type: Sequelize.UUID,
        allowNull: true,
        defaultValue: null,
        references: {
          model: "couponCode",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
    //   bookingId: {
    //     type: Sequelize.UUID,
    //     allowNull: true,
    //     defaultValue: null,
    //     references: {
    //       model: "bookings",
    //       key: "id",
    //     },
    //     onUpdate: "CASCADE",
    //     onDelete: "CASCADE",
    //   }
    },
    {
      timestamps: true,
      tableName: "couponCodeUsed",
    },
  );
};
