const bcrypt = require("bcryptjs");
const regModel = require("../models/adminmodel.js");

exports.regserviceLogic = async (username, password, role, status) => {
  try {
    const hashedPassword = bcrypt.hashSync(password, 8);
    return await regModel.saveRegData(username, hashedPassword, role, status);
  } catch (err) {
    console.error("Service error:", err);
    throw new Error("Failed to register user");
  }
};

exports.getOriginalPassword = async (username) => {
  return await regModel.getPasswordFromDB(username);
};

exports.updatePasswordById = async (userId, hashedPassword) => {
  const regModel = require("../models/adminmodel.js");
  return await regModel.updatePasswordById(userId, hashedPassword);
};

exports.getAdminById = async (id) => {
  const regModel = require("../models/adminmodel.js");
  return await regModel.getAdminById(id);
};

exports.updateAdminById = async (id, username, password, status) => {
  let updatedPassword;

  if (password && password.trim() !== "") {
    // ✅ new password entered
    updatedPassword = bcrypt.hashSync(password, 8);
  } else {
    // ✅ keep old password
    const existingUser = await regModel.getAdminById(id);
    updatedPassword = existingUser.PASSWORD;
  }

  return await regModel.updateAdminById(id, username, updatedPassword, status);
};

exports.getAllAdmins = async () => {
  return await regModel.getAllAdmins();
};