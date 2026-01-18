const en = require("../config/locales/en");
const fi = require("../config/locales/fi");
const ru = require("../config/locales/ru");
const sv = require("../config/locales/sv");
const uk = require("../config/locales/uk");

const messages = { en, fi, ru, sv, uk };

const getMessages = (lang = "en") => {
  return messages[lang] || messages["en"];
};

module.exports = { getMessages };
