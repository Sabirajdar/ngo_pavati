const receiptModel = require("../models/memberModel");
const puppeteer = require("puppeteer");
const path = require("path");
const ejs = require("ejs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ---------------- Next Receipt Sequence ----------------
async function getNextReceiptSequence(orgId, financial_year) {
  const maxReceiptSeq = await receiptModel.getMaxReceiptSequence(orgId, financial_year);
  const nextSeq = maxReceiptSeq + 1; // always next after last in table
  return { nextSeq };
}
// ---------------- Update tracker after save ----------------
async function updateTrackerAfterSave(orgId, sequenceNo, financial_year) {
  const trackerRows = await receiptModel.getSequence(orgId, financial_year);

  if (trackerRows.length > 0) {
    await receiptModel.updateTracker(orgId, financial_year, sequenceNo);
  } else {
    await receiptModel.createTracker(orgId, financial_year, sequenceNo);
  }
}
// ---------------- Save Receipt ----------------
exports.saveReceipt = async (req, res) => {
  console.log("User:", req.user);
  console.log("Body:", req.body);

  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    // ✅ Get Member
    const member = await receiptModel.getMemberByUsername(req.user.username);
    if (!member) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }
    const memberId = member.MEMBER_ID;

    // ✅ Get Organization
    const orgData = await receiptModel.getOrgByMember(memberId);
    if (!orgData) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }
    const orgId = orgData.ORG_ID;

    // ✅ Membership Check (Active Only)
const membership = await receiptModel.getLatestMembership(orgId);
    console.log("Membership:", membership);

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "No active membership found. Cannot generate receipt."
      });
    }

    const today = new Date();
    const endDate = new Date(membership.END_DATE);
    if (endDate < today) {
      return res.status(403).json({
        success: false,
        message: "Membership expired. Cannot generate receipt."
      });
    }

    // ✅ Receipt Sequence (using financial_year)
    const { financial_year } = req.body;
    const { nextSeq } = await getNextReceiptSequence(orgId, financial_year);
    let currentSeq = nextSeq;
    let receiptNo = `REC-${financial_year}-${String(currentSeq).padStart(3, "0")}`;

    const {
      payment_date,
      receipt_date,
      donor_name,
      pan_number,
      aadhar_number,
      mobile_number,
      email,
      address,
      donation_amount,
      amount_in_words,
      payment_mode,
      transaction_id,
      purpose_of_donation,
      received_for
    } = req.body;

    const donation_amount_num = Number(donation_amount);

    let saved = false;
    let attempts = 0;

    while (!saved && attempts < 3) {
      try {
        console.log(`Inserting receipt: ${receiptNo} ...`);
        await receiptModel.insertReceipt([
          receiptNo,
          financial_year,
          payment_date,
          receipt_date,
          donor_name,
          pan_number,
          aadhar_number,
          mobile_number,
          email,
          address,
          donation_amount_num,
          amount_in_words,
          received_for,
          purpose_of_donation,
          payment_mode,
          transaction_id,
          memberId,
          orgId
        ]);
        console.log("✅ Insert SUCCESS");

        await updateTrackerAfterSave(orgId, currentSeq, financial_year);
        saved = true;
      } catch (err) {
        console.error("❌ INSERT ERROR FULL:", err);
        console.error("❌ ERROR CODE:", err.code);
        console.error("❌ SQL MESSAGE:", err.sqlMessage);

        if (err.code === "ER_DUP_ENTRY") {
          currentSeq++;
          receiptNo = `REC-${financial_year}-${String(currentSeq).padStart(3, "0")}`;
          attempts++;
        } else {
          return res.status(500).json({
            success: false,
            message: `Database insert failed: ${err.sqlMessage || err.message}`
          });
        }
      }
    }

    if (!saved) {
      return res.status(500).json({
        success: false,
        message: "Could not save receipt after multiple attempts."
      });
    }

    res.json({
      success: true,
      message: "Receipt saved successfully",
      receiptNo
    });

  } catch (err) {
    console.error("Error saving receipt:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


// ---------------- SEARCH RECEIPTS ----------------
exports.searchReceipt = async (req, res) => {
  try {

    // ✅ GET query params (THIS WAS MISSING ❌)
    const { donorName, receiptDate, mobile, pan, page } = req.query;

    const currentPage = parseInt(page) || 1;
    const limit = 5;
    const offset = (currentPage - 1) * limit;

    // ✅ Get member
    const member = await receiptModel.getMemberByUsername(req.user.username);
    if (!member) return res.status(404).send("Member not found");

    // ✅ Get orgId
    const orgData = await receiptModel.getOrgByMember(member.MEMBER_ID);
    if (!orgData) return res.status(404).send("Org not found");

    const orgId = orgData.ORG_ID;
    console.log("ORG ID:", orgId);

    const query = {
      donorName: donorName || "",
      receiptDate: receiptDate || "",
      mobile: mobile || "",
      pan: pan || ""
    };

    // ❌ WRONG (you forgot orgId)
    // const allReceipts = await receiptModel.searchReceipts(query);

    // ✅ CORRECT
    const allReceipts = await receiptModel.searchReceipts(query, orgId);
console.log("QUERY:", query);
console.log("ORG ID:", orgId);
    console.log("Receipts found:", allReceipts.length);

    // ✅ Sort latest first
    allReceipts.sort((a, b) => new Date(b.RECEIPT_DATE) - new Date(a.RECEIPT_DATE));

    // ✅ Pagination
    const totalRecords = allReceipts.length;
    const totalPages = Math.ceil(totalRecords / limit);
    const paginatedReceipts = allReceipts.slice(offset, offset + limit);

    // ✅ Header data
    let data = {};
    let memberName = "Guest";

    if (req.user) {
      memberName = req.user.username || "Guest";

      const memberData = await receiptModel.getMemberByUsername(memberName);
      if (memberData && memberData.MEMBER_ID) {
        const homeData = await receiptModel.getHomePageData(memberData.MEMBER_ID);
        if (homeData) {
          data = Array.isArray(homeData) ? homeData[0] : homeData;
        }
      }
    }

    res.render("searchReceipt", {
      receipts: paginatedReceipts,
      query,
      data,
      memberName,
      currentPage,
      totalPages
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching receipts");
  }
};
// ---------------- GENERATE RECEIPT PDF ----------------
exports.generateReceipt = async (req, res) => {
  try {
    const receiptNo = req.params.receiptNo;

    // ✅ Get logged-in member
    const member = await receiptModel.getMemberByUsername(req.user.username);
    if (!member) {
      return res.status(404).send("Member not found");
    }

    // ✅ Get orgId
    const orgData = await receiptModel.getOrgByMember(member.MEMBER_ID);
    if (!orgData) {
      return res.status(404).send("Organization not found");
    }

    const orgId = orgData.ORG_ID;

    // ✅ Fetch correct receipt (IMPORTANT FIX)
    const data = await receiptModel.getReceiptFullData(receiptNo, orgId);

    if (!data) return res.status(404).send("Receipt not found");
console.log("LOGO PATH:", data.logo);
console.log("SIGN PATH:", data.signature);
    // ---------------- Images ----------------
    let logoUrl = data.logo 
  ? `http://localhost:7777/${data.logo.replace(/\\/g, "/")}` 
  : null;

let signatureUrl = data.signature 
  ? `http://localhost:7777/${data.signature.replace(/\\/g, "/")}` 
  : null;
    // ---------------- Template Data ----------------
    const templateData = {
      logoUrl,
      signatureUrl,

      orgName: data.ORG_NAME || "-",

      orgAddress: [
        data.ADD_LINE1,
        data.ADD_LINE2,
        data.CITY,
        data.DISTRICT,
        data.STATE,
        data.PINCODE
      ].filter(Boolean).join(", ") || "-",

      orgPhone: data.PRI_MOBILE ?? "-",
      orgEmail: data.ORG_EMAIL ?? "-",

      orgRegNumber: data.ORG_REG_NUMBER || "-",
      orgPAN: data.ORG_PAN || "-",

      org12A: data.org12A || "-",
      org12ADate: formatDateLong(data.org12ADate),

      org80G: data.org80G || "-",
      org80GDate: formatDateLong(data.org80GDate),

      receiptNumber: data.RECEIPT_NUMBER || "-",
      financialYear: data.FINANCIAL_YEAR || "-",

      receiptDate: formatDateLong(data.RECEIPT_DATE),
      paymentDate: formatDateLong(data.PAYMENT_DATE),

      donorName: data.DONOR_NAME || "-",
      address: data.ADDRESS || "-",
      mobile: data.MOBILE_NUMBER || "-",
      email: data.DONOR_EMAIL || "-",

      panNumber: data.PAN_NUMBER || "-",
      aadharNumber: data.AADHAAR_NUMBER || "-",

      amount: data.DONATION_AMOUNT || 0,
      amountWords: data.AMOUNT_IN_WORDS || "-",

      paymentMode: data.PAYMENT_MODE || "-",
      transactionId: data.TRANSACTION_ID || "-",
      purpose: data.PURPOSE_OF_DONATION || "-",

      declarationName: data.declarationName || "-",
      fatherFullName: data.fatherFullName || "-",

      memberPan: data.MEMBER_PAN || "-"
    };

    // ---------------- Render HTML ----------------
    const templatePath = path.join(__dirname, "../view/receiptTemplate.ejs");
    const html = await ejs.renderFile(templatePath, templateData);

    // ---------------- Generate PDF ----------------
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true
    });

    await browser.close();

    // ---------------- Send PDF ----------------
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=receipt-${receiptNo}.pdf`,
    });

    res.send(pdf);

  } catch (err) {
    console.error("PDF Generation Error:", err);
    res.status(500).send("PDF Generation Error");
  }
};

function formatDateLong(dateStr) {
  if (!dateStr) return "-";

  const date = new Date(dateStr);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

// ---------------- CONTACT PAGE ----------------
exports.showContactPage = async (req, res) => {

  const contact = await receiptModel.getOrgContact();

  const userId = req.user.id;
  const username = req.user.username;

  const member = await receiptModel.getMemberByUserId(userId);

  let data = {};
  if (member) {
    data = await receiptModel.getHomePageData(member.MEMBER_ID);
  }

  res.render("memcontact", {
    contact,
    data,
    memberName: username
  });

};


exports.getOrgDocuments = async (orgId) => {
  const [rows] = await receiptModel.query(
    `SELECT DOCUMENT_TYPE, DOCUMENT_PATH
     FROM documents
     WHERE ORG_ID = ?`,
    [orgId]
  );

  return rows;
};

exports.showHomePage = async (req, res) => {
  try {

    const userId = req.user.id;
    const username = req.user.username;

    const member = await receiptModel.getMemberByUserId(userId);

    if (!member) {
      return res.status(404).send("Member not found");
    }

    const memberId = member.MEMBER_ID;

    const data = await receiptModel.getHomePageData(memberId);

    res.render("home", {
      data,
      memberName: username
    });

  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).send("Server error");
  }
};

exports.generatePage = async (req, res) => {

  const userId = req.user.id;
  const username = req.user.username;

  const member = await receiptModel.getMemberByUserId(userId);

  let data = {};
    let membership = null;

  if (member) {
    data = await receiptModel.getHomePageData(member.MEMBER_ID);
        const orgData = await receiptModel.getOrgByMember(member.MEMBER_ID);
    if (orgData) {
membership = await receiptModel.getLatestMembership(orgData.ORG_ID);    }

  }

  res.render("generateReceipt", {
    data,
    memberName: username,
    membership
  });

};


exports.loginCtrl = async (req, res) => {
  try {

    res.render("login", {
      message: null
    });

  } catch (err) {
    console.log(err);

    res.render("login", {
      message: "Error loading login page"
    });
  }
};





exports.validateUser = async (req, res) => {
  try {

    const { username, password } = req.body;

    if (!username || !password) {
      return res.render("login", { message: "Username and Password required" });
    }

    // get user from database
    const user = await receiptModel.getUserByUsername(username);

    if (!user) {
      return res.render("login", { message: "User not found" });
    }

    // allow only MEMBER login
    if (user.ROLE !== "MEMBER") {
      return res.render("login", { message: "Only members can login here" });
    }

    if (user.STATUS !== "Active") {
      return res.render("login", { message: "Account is inactive" });
    }
const isMatch = password === user.PASSWORD;

if (!isMatch) {
  return res.render("login", { message: "Incorrect password" });
}
    const token = jwt.sign(
      {
        id: user.USER_ID,
        username: user.USER_USERNAME,
        role: user.ROLE
      },
      process.env.JWT_SECRET || "11$$$66&&&&4444",
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 3600000
    });

    res.redirect("/receipt/"); // redirect to homepage

  } catch (err) {

    console.error("Login error:", err);
    res.render("login", { message: "Internal Server Error" });

  }
};







