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
      pickUpLocation: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      pickUpLatitude: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      pickUpLongitude: {
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
       // 1 for accpet 2 for reject 3 for cancel by user
      // 4 for start 5 for i am here 6 complete(in this 4 digit pin in this user will share pin with driver)
      //  7 for cancel by driver 8 for compelet by user 9 for ongoing
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
      typeOfVehicleId: {
        type: Sequelize.UUID,
        allowNull: true,
        defaultValue: null,
        references: {
          model: "typeOfVechile",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      scheduleType:{
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,  //1 FOR Instant 2 for schedule
      },
      bookingDate:{
        type:DataTypes.DATEONLY,
        allowNull:true,
        defaultValue:null
      },
      bookingTime:{
        type:DataTypes.TIME,
        allowNull:true,
        defaultValue:null
      },
      paymentStatus:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue:0
      },
      otp:{
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue:null
      },
      otpVerify:{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue:0
      },
      reason:{
        type:DataTypes.TEXT,
        allowNull:true,
        defaultValue:null
      }
    },
    {
      timestamps: true,
      tableName: "bookings",
    },
  );
};
