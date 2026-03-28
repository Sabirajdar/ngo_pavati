const db = require("../config/db.js");

exports.saveRegData = (username, password, role, status) => {
  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO users (USER_USERNAME, PASSWORD, ROLE, STATUS) VALUES (?, ?, ?, ?)`,
      [username, password, role, status],
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });
};

exports.getPasswordFromDB = (username) => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT USER_ID, USER_USERNAME, PASSWORD, ROLE, STATUS FROM users WHERE USER_USERNAME = ?`,
      [username],
      (err, result) => {
        if (err) reject(err);
        else if (result.length === 0) resolve(null);
        else resolve(result[0]);
      }
    );
  });
};

exports.updatePasswordById = (userId, hashedPassword) => {
  return new Promise((resolve, reject) => {
    db.query(
      "UPDATE users SET PASSWORD = ? WHERE USER_ID = ?",
      [hashedPassword, userId],
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });
};

exports.getAllAdmins = () => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT USER_ID, USER_USERNAME, ROLE, STATUS, CREATED_DATE FROM users WHERE ROLE = 'ADMIN'`,
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });
};


exports.getAdminById = (id) => {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT USER_ID, USER_USERNAME, PASSWORD, STATUS FROM users WHERE USER_ID = ?",
      [id],
      (err, result) => {
        if (err) reject(err);
        else resolve(result[0]);
      }
    );
  });
};


exports.updateAdminById = (id, username, password, status) => {
  return new Promise((resolve, reject) => {
    db.query(
      "UPDATE users SET USER_USERNAME = ?, PASSWORD = ?, STATUS = ? WHERE USER_ID = ?",
      [username, password, status, id],
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });
};