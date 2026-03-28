const db = require("../config/db.js");


exports.getAllNews = () => {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM NEWS ORDER BY NEWS_ID DESC", (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

exports.getActiveNews = () => {
  return new Promise((resolve, reject) => {

    const sql = `
      SELECT * FROM NEWS 
      WHERE STATUS = 'ACTIVE' 
      ORDER BY NEWS_ID DESC
    `;

    db.query(sql, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });

  });
};

exports.insertNews = (title, description, status) => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO NEWS (NEWS_TITLE, NEWS_DESCRIPTION, STATUS)
      VALUES (?, ?, ?)
    `;

    db.query(sql, [title, description, status], (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};


exports.getNewsById = (id) => {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM NEWS WHERE NEWS_ID = ?",
      [id],
      (err, result) => {
        if (err) reject(err);
        else resolve(result[0]);
      }
    );
  });
};


exports.updateNews = (id, title, description, status) => {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE NEWS
      SET NEWS_TITLE=?, NEWS_DESCRIPTION=?, STATUS=?
      WHERE NEWS_ID=?
    `;

    db.query(sql, [title, description, status, id], (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};