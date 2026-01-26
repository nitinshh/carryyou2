const Sequelize = require("sequelize");
const sequelize = require("../dbConnection").sequelize;

module.exports = {
  typeOfVechicleModel:require("./typeOfVehicleModel")(Sequelize, sequelize, Sequelize.DataTypes),
  userModel: require("./userModel")(Sequelize, sequelize, Sequelize.DataTypes),
  bookingModel: require("./bookingModel")(Sequelize, sequelize, Sequelize.DataTypes),
  bookingRejectedByModel:require("./bookingRejectedByModel")(Sequelize, sequelize, Sequelize.DataTypes),
  notificationModel: require("./notificationModel")(Sequelize, sequelize, Sequelize.DataTypes),
  cmsModel: require("./cmsModel")(Sequelize, sequelize, Sequelize.DataTypes),
  contactUsModel: require("./contactUsModel")(Sequelize, sequelize, Sequelize.DataTypes),
  transactionModel: require("./transactionModel")(Sequelize, sequelize, Sequelize.DataTypes),
  chatConstantModel:require("./chatConstantModel")(Sequelize, sequelize, Sequelize.DataTypes),
  messageModel:require("./messageModel")(Sequelize, sequelize, Sequelize.DataTypes),
};
