const Sequelize = require("sequelize");
const sequelize = require("../dbConnection").sequelize;

module.exports = {
  cityModel: require("./cityModel")(Sequelize, sequelize, Sequelize.DataTypes),
  postalCodeModel: require("./postalCodeModel")(Sequelize, sequelize, Sequelize.DataTypes),
  categoryModel: require("./categoryModel")(Sequelize, sequelize, Sequelize.DataTypes),
  userModel: require("./userModel")(Sequelize, sequelize, Sequelize.DataTypes),
  userDeliveryAddressModel: require("./userDeliveryAddressesModel")(Sequelize, sequelize, Sequelize.DataTypes),
  productModel: require("./productsModel")(Sequelize, sequelize, Sequelize.DataTypes),
  productsImagesModel: require("./productsImagesModel")(Sequelize, sequelize, Sequelize.DataTypes),
  couponModel: require("./couponModel")(Sequelize, sequelize, Sequelize.DataTypes),
  notificationModel: require("./notificationModel")(Sequelize, sequelize, Sequelize.DataTypes),
  cmsModel: require("./cmsModel")(Sequelize, sequelize, Sequelize.DataTypes),
  faqModel: require("./faqModel")(Sequelize, sequelize, Sequelize.DataTypes),
  contactUsModel: require("./contactUsModel")(Sequelize, sequelize, Sequelize.DataTypes),
  cartModel: require("./cartModel")(Sequelize, sequelize, Sequelize.DataTypes),
  orderModel: require("./orderModel")(Sequelize, sequelize, Sequelize.DataTypes),
  transactionModel: require("./transactionModel")(Sequelize, sequelize, Sequelize.DataTypes),
};
