const db = require("../config/db.js");

exports.getAllContacts = () => {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM CONTACT_US ORDER BY CONT_US_ID DESC",
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });
};

exports.insertContact = (pri_mobile, alt_mobile, email, message) => {
  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO CONTACT_US (PRI_MOBILE, ALT_MOBILE, EMAIL, MESSAGE)
       VALUES (?, ?, ?, ?)`,
      [pri_mobile, alt_mobile, email, message],
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });
};

exports.getContactById = (id) => {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM CONTACT_US WHERE CONT_US_ID = ?",
      [id],
      (err, result) => {
        if (err) reject(err);
        else resolve(result[0]);
      }
    );
  });
};

exports.updateContact = (id, pri_mobile, alt_mobile, email, message) => {
  return new Promise((resolve, reject) => {
    db.query(
      `UPDATE CONTACT_US 
       SET PRI_MOBILE=?, ALT_MOBILE=?, EMAIL=?, MESSAGE=? 
       WHERE CONT_US_ID=?`,
      [pri_mobile, alt_mobile, email, message, id],
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });
};