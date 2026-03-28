const contactModel = require("../models/contactmodel.js");

exports.getAllContacts = async () => {
  return await contactModel.getAllContacts();
};

exports.addContact = async (pri_mobile, alt_mobile, email, message) => {
  return await contactModel.insertContact(
    pri_mobile,
    alt_mobile,
    email,
    message
  );
};

exports.getContactById = async (id) => {
  return await contactModel.getContactById(id);
};

exports.updateContact = async (id, pri_mobile, alt_mobile, email, message) => {
  return await contactModel.updateContact(
    id,
    pri_mobile,
    alt_mobile,
    email,
    message
  );
};