const db = require("../config/db");

exports.checkAdminExists = () => {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM users WHERE ROLE='ADMIN'",
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });
};

/* Create new admin */
exports.createAdmin = (username, password, status) => {
  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO users (USER_USERNAME, PASSWORD, ROLE, STATUS)
       VALUES (?, ?, 'ADMIN', ?)`,
      [username, password, status],
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });
};

// ---------------- Get Sequence ----------------
exports.getSequence = (orgId, year) => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT LAST_SEQUENCE
       FROM receipt_sequence_tracker
       WHERE ORG_ID = ? AND YEAR = ?`,
      [orgId, year],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};
// ---------------- Update Tracker ----------------
exports.updateTracker = (orgId, year, sequenceNo) => {
  return new Promise((resolve, reject) => {
    db.query(
      `UPDATE receipt_sequence_tracker
       SET LAST_SEQUENCE = ?
       WHERE ORG_ID = ? AND YEAR = ?`,
      [sequenceNo, orgId, year],
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });
};

// ---------------- Create Tracker ----------------
exports.createTracker = (orgId, year, seq) => {
  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO receipt_sequence_tracker (ORG_ID, YEAR, LAST_SEQUENCE, FINANCIAL_YEAR)
       VALUES (?, ?, ?, ?)`,
      [orgId, year, seq, year], // ✅ pass 'year' as FINANCIAL_YEAR
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });
};
// ---------------- Insert Receipt ----------------
exports.insertReceipt = (data) => {
  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO receipts (
        RECEIPT_NUMBER,
        FINANCIAL_YEAR,
        PAYMENT_DATE,
        RECEIPT_DATE,
        DONOR_NAME,
        PAN_NUMBER,
        AADHAAR_NUMBER,
        MOBILE_NUMBER,
        EMAIL,
        ADDRESS,
        DONATION_AMOUNT,
        AMOUNT_IN_WORDS,
        RECEIVED_FOR,
        PURPOSE_OF_DONATION,
        PAYMENT_MODE,
        TRANSACTION_ID,
        MEMBER_ID,
        ORG_ID   -- ✅ ADDED
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      data,
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });
};


exports.getReceiptFullData = (receiptNo, orgId) => {
  return new Promise((resolve, reject) => {

    db.query(`
SELECT
r.*,
r.EMAIL AS DONOR_EMAIL,

m.FULL_NAME AS declarationName,
SUBSTRING(m.FULL_NAME, LOCATE(' ', m.FULL_NAME) + 1) AS fatherFullName,
m.PAN_NUMBER AS MEMBER_PAN,

org.ORG_NAME,
org.ORG_REG_NUMBER,
org.ORG_REG_DATE,
org.ORG_PAN,

org.ORG_12A_REG_NUMBER AS org12A,
org.ORG_12A_REG_DATE AS org12ADate,

org.ORG_80G_REG_NUMBER AS org80G,
org.ORG_80G_REG_DATE AS org80GDate,

md.PRI_MOBILE,
md.EMAIL AS ORG_EMAIL,
md.ADD_LINE1,
md.ADD_LINE2,
md.CITY,
md.DISTRICT,
md.STATE,
md.PINCODE,

logo.DOCUMENT_PATH AS logo,
sign.DOCUMENT_PATH AS signature

FROM receipts r

LEFT JOIN members m 
ON m.MEMBER_ID = r.MEMBER_ID

LEFT JOIN mem_org_info org 
ON org.ORG_ID = r.ORG_ID

LEFT JOIN member_details md 
ON md.MEMBER_ID = r.MEMBER_ID

LEFT JOIN documents logo
ON logo.ORG_ID = org.ORG_ID 
AND logo.DOCUMENT_TYPE = 'ORG_80G_CERTIFICATE'

LEFT JOIN documents sign
ON sign.ORG_ID = org.ORG_ID 
AND sign.DOCUMENT_TYPE = 'ORG_12A_CERTIFICATE'

WHERE r.RECEIPT_NUMBER = ? AND r.ORG_ID = ?
LIMIT 1
`, [receiptNo, orgId],   // ✅ pass both params
(err, rows) => {

  if (err) return reject(err);
  if (!rows.length) return resolve(null);

  const data = rows[0];

  data.declarationName = data.declarationName || "";
  data.fatherFullName = data.fatherFullName || "-";

  resolve(data);
});

});
};

// ---------------- Get Org Documents ----------------
exports.getOrgDocuments = (orgId) => {
  return new Promise((resolve, reject) => {

    db.query(
      `SELECT DOCUMENT_TYPE, DOCUMENT_PATH
       FROM documents
       WHERE ORG_ID = ?`,
      [orgId],
      (err, rows) => {

        if (err) reject(err);
        else resolve(rows);

      }
    );

  });
};

// ---------------- Get Latest Contact ----------------
exports.getOrgContact = () => {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM contact_us ORDER BY CONT_US_ID DESC LIMIT 1",
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows[0] || null);
      }
    );
  });
};
// ---------------- Search Receipts ----------------
// ---------------- Search Receipts ----------------
exports.searchReceipts = (query, orgId) => {
  return new Promise((resolve, reject) => {

    let sql = `
      SELECT 
        RECEIPT_NUMBER,
        DONOR_NAME,
        MOBILE_NUMBER,
        PAN_NUMBER,
        RECEIPT_DATE,
        DONATION_AMOUNT,
        RECEIVED_FOR,
        ORG_ID
      FROM receipts
      WHERE ORG_ID = ?
    `;

    const params = [orgId];

    // ✅ Donor Name
    if (query.donorName?.trim()) {
      sql += " AND DONOR_NAME LIKE ?";
      params.push(`%${query.donorName.trim()}%`);
    }

    // ✅ Receipt Date
    if (query.receiptDate?.trim()) {
      sql += " AND DATE(RECEIPT_DATE) = DATE(?)";
      params.push(query.receiptDate);
    }

    // ✅ Mobile
    if (query.mobile?.trim()) {
      sql += " AND MOBILE_NUMBER LIKE ?";
      params.push(`%${query.mobile.trim()}%`);
    }

    // ✅ PAN
    if (query.pan?.trim()) {
      sql += " AND PAN_NUMBER LIKE ?";
      params.push(`%${query.pan.trim()}%`);
    }

    // ✅ Sorting (latest first)
    sql += " ORDER BY RECEIPT_DATE DESC, RECEIPT_NUMBER DESC";

    console.log("FINAL SQL:", sql);
    console.log("PARAMS:", params);

    db.query(sql, params, (err, rows) => {
      if (err) {
        console.error("❌ SQL ERROR:", err);
        return reject(err);
      }

      console.log("✅ Rows Found:", rows.length);
      resolve(rows);
    });

  });
};

// ---------------- Get Org By Member ----------------
exports.getOrgByMember = (memberId) => {
  return new Promise((resolve, reject) => {

    db.query(
      `SELECT ORG_ID
       FROM mem_org_info
       WHERE MEMBER_ID = ?
       ORDER BY ORG_ID DESC
       LIMIT 1`,
      [memberId],
      (err, rows) => {

        if (err) reject(err);
        else resolve(rows[0]);

      }
    );

  });
};


exports.getHomePageData = (memberId) => {
  return new Promise((resolve, reject) => {

    const sql = `
SELECT 
  org.ORG_NAME,
  org.ORG_REG_NUMBER,
  org.ORG_REG_DATE,
  org.ORG_80G_REG_NUMBER,
  org.ORG_80G_REG_DATE,
  org.ORG_12A_REG_NUMBER,
  org.ORG_12A_REG_DATE,

  COALESCE(mem.MEMBERSHIP_ID, '-') AS MEMBERSHIP_ID,
  COALESCE(mem.START_DATE, '-') AS START_DATE,
  COALESCE(mem.END_DATE, '-') AS END_DATE,
  COALESCE(mem.MEMBERSHIP_STATUS, 'Not Assigned') AS MEMBERSHIP_STATUS,

  m.FULL_NAME,
  m.PAN_NUMBER,
  m.AADHAR_NUMBER,

  COALESCE(det.PRI_MOBILE, '-') AS PRI_MOBILE,
  COALESCE(det.ALT_MOBILE, '-') AS ALT_MOBILE,
  COALESCE(det.LANDLINE_NUMBER, '-') AS LANDLINE_NUMBER,
  COALESCE(det.EMAIL, '-') AS EMAIL,
  COALESCE(det.WEBSITE, '-') AS WEBSITE

FROM members m

LEFT JOIN mem_org_info org 
ON org.MEMBER_ID = m.MEMBER_ID

LEFT JOIN member_details det 
ON det.MEMBER_ID = m.MEMBER_ID

LEFT JOIN member_membership mem 
ON mem.ORG_ID = org.ORG_ID
AND mem.MEMBERSHIP_ID = (
    SELECT m2.MEMBERSHIP_ID
    FROM member_membership m2
    WHERE m2.ORG_ID = org.ORG_ID
    ORDER BY 
        (m2.MEMBERSHIP_STATUS = 'Active') DESC,
        m2.START_DATE DESC
    LIMIT 1
)

WHERE m.MEMBER_ID = ?;
`;

    db.query(sql, [memberId], (err, rows) => {

      if (err) return reject(err);
      if (!rows.length) return resolve(null);

      const row = rows[0];

      const formatDate = (dateStr) => {
        if (!dateStr || dateStr === '-') return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      };

      resolve({
        ...row,
        ORG_REG_DATE: formatDate(row.ORG_REG_DATE),
        ORG_80G_REG_DATE: formatDate(row.ORG_80G_REG_DATE),
        ORG_12A_REG_DATE: formatDate(row.ORG_12A_REG_DATE),
        START_DATE: formatDate(row.START_DATE),
        END_DATE: formatDate(row.END_DATE),
      });

    });

  });
};

exports.getMemberByUserId = (userId) => {
  return new Promise((resolve, reject) => {

    const sql = `
      SELECT MEMBER_ID
      FROM members
      WHERE USER_ID = ?
      LIMIT 1
    `;

    db.query(sql, [userId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows[0]);
    });

  });
};

// Get user for login
exports.getUserByUsername = (username) => {
  return new Promise((resolve, reject) => {

    db.query(
      `SELECT USER_ID, USER_USERNAME, PASSWORD, ROLE, STATUS
       FROM users
       WHERE USER_USERNAME = ?`,
      [username],
      (err, rows) => {

        if (err) reject(err);
        else resolve(rows.length ? rows[0] : null);

      }
    );

  });
};

// Get member id using username
exports.getMemberByUsername = (username) => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT MEMBER_ID FROM members WHERE USER_NAME = ?`,
      [username],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows.length ? rows[0] : null);
      }
    );
  });
};
exports.getMaxReceiptSequence = (orgId, year) => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT MAX(CAST(SUBSTRING(RECEIPT_NUMBER, LENGTH(CONCAT('REC-', ?, '-')) + 1) AS UNSIGNED)) AS max_seq
       FROM receipts
       WHERE RECEIPT_NUMBER LIKE ? AND ORG_ID = ?`,
      [`${year}`, `REC-${year}-%`, orgId],
      (err, rows) => {
        if (err) return reject(err);
        // If no receipts exist, start with 0
        resolve(rows[0].max_seq ? Number(rows[0].max_seq) : 0);
      }
    );
  });
};

exports.getLatestMembership = (orgId) => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT MEMBERSHIP_STATUS, START_DATE, END_DATE
       FROM member_membership
       WHERE ORG_ID = ?
       AND MEMBERSHIP_STATUS = 'Active'
       ORDER BY END_DATE DESC
       LIMIT 1`,
      [orgId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows[0] || null);
      }
    );
  });
};
// exports.getMembershipStatus = (orgId) => {
//   return new Promise((resolve, reject) => {

//     db.query(
//       `SELECT MEMBERSHIP_STATUS, END_DATE
//        FROM member_membership
//        WHERE ORG_ID = ?
//        ORDER BY END_DATE DESC
//        LIMIT 1`,
//       [orgId],
//       (err, rows) => {

//         if (err) reject(err);
//         else resolve(rows[0]);

//       }
//     );

//   });
// };