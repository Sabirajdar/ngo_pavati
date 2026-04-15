const regService = require("../services/adminservice.js"); 
const contactService = require("../services/contactservice.js");
const newsService = require("../services/newsService.js");
const dashboardService = require("../services/dashboardservice");
const orgService = require("../services/organizationService");
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookie = require("cookie-parser");
//secretAdmin

/* ================= SECRET ADMIN PAGE ================= */

exports.secretAdminPage = async (req, res) => {
  try {
    const rows = await new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM users WHERE ROLE='ADMIN'",
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    if (rows.length > 0) {
      return res.send("Access Denied");
    }

    res.render("secretAdmin", { editAdmin: null });

  } catch (err) {
    console.error(err);
    res.send("Error loading page");
  }
};

/* ================= CREATE FIRST ADMIN ================= */

exports.createFirstAdmin = async (req, res) => {
  try {
    const { username, password, status } = req.body;

    if (!username || !password) {
      return res.send("All fields are required");
    }

    const rows = await new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM users WHERE ROLE='ADMIN'",
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    if (rows.length > 0) {
      return res.send("Admin already exists");
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    await new Promise((resolve, reject) => {
      db.query(
        `INSERT INTO users (USER_USERNAME, PASSWORD, ROLE, STATUS)
        VALUES (?, ?, 'ADMIN', ?)`,
        [username, hashedPassword, status],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    res.send("Admin Created Successfully");

  } catch (err) {
    console.error(err);
    res.send("Error creating admin");
  }
};



// Login page
exports.loginCtrl = async (req, res) => {
  try {
    const contactData = await contactService.getAllContacts();
    const news = await newsService.getActiveNews();   // only active news

    res.render("login", {
      contact: contactData.length > 0 ? contactData[0] : null,
      news: news
    });

  } catch (err) {
    console.log(err);

    res.render("login", {
      contact: null,
      news: []
    });
  }
};

// Reset password page
exports.ResetPasswordCtrl = (req, res) => {
  res.render("ResetPassword.ejs");
};

// Register page
exports.RegisterCtrl = (req, res) => {
  res.render("register.ejs");
};

// Save MEMBER registration
exports.saveReg = async (req, res) => {
  try {
    const { username, password } = req.body;
    const role = "MEMBER";
    const status = "Active";

    await regService.regserviceLogic(username, password, role, status);

    res.render("login", { message: "Register Successfully..." });
  } catch (err) {
    console.error("Controller error:", err);
    res.render("login", { message: "Registration Failed!..." });
  }
};

// Save ADMIN registration
exports.saveadmin = async (req, res) => {
  try {
    const { username, password, status } = req.body; // get status from form
    const role = "ADMIN";

    await regService.regserviceLogic(username, password, role, status);

    // Redirect to admin dashboard after successful admin creation
    res.redirect("/admin");
  } catch (err) {
    console.error("Controller error:", err);
    res.send("Registration Failed!");
  }
};

// Validate login
exports.validateUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1️⃣ Validate input
    if (!username || !password) {
      return res.status(400).send("Username and password are required");
    }

    // 2️⃣ Get user
    const user = await regService.getOriginalPassword(username);

    if (!user) {
      return res.status(404).send("User not found");
    }

    // 3️⃣ Check status
    if (user.STATUS !== "Active") {
      return res.status(403).send("Your account is Inactive.");
    }

    // 4️⃣ Compare password
const cleanPassword = password.trim();
console.log("Entered:", password.trim());
console.log("Stored:", user.PASSWORD);
const isMatch = bcrypt.compareSync(cleanPassword, user.PASSWORD);
console.log("Match:", isMatch);

if (!isMatch) {
  console.log("Entered:", cleanPassword);
  console.log("Stored Hash:", user.PASSWORD);
  return res.status(401).send("Incorrect password");
}

    // 5️⃣ Create JWT
    const token = jwt.sign(
      {
        id: user.USER_ID,
        username: user.USER_USERNAME,
        role: user.ROLE,
      },
      "11$$$66&&&&4444",
      { expiresIn: "1h" }
    );

    // 6️⃣ Set cookie (IMPORTANT FIXES HERE)
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 60 * 60 * 1000, // 1 hour
      // secure: true,   // use in production (HTTPS)
      // sameSite: "strict"
    });

    // 7️⃣ Redirect based on role
    if (user.ROLE === "ADMIN" || user.ROLE === "SUPER_ADMIN") {
      return res.redirect("/admindash");
    } else if (user.ROLE === "MEMBER") {
      return res.redirect("/userdash");
    } else {
      return res.status(403).send("Unauthorized role");
    }

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).send("Internal Server Error");
  }
};

// exports.resetPasswordCtrl = async (req, res) => {
//   try {
//     // Get logged-in user from token
//     const token = req.cookies.token;
//     if (!token) return res.redirect("/login");

//     const jwt = require("jsonwebtoken");
//     const user = jwt.verify(token, "11$$$66&&&&4444"); // same secret you used for login

//     const { newPassword } = req.body;
//     if (!newPassword) {
//       return res.render("ResetPassword.ejs", { message: "Password is required!" });
//     }

//     const bcrypt = require("bcryptjs");
//     const hashedPassword = bcrypt.hashSync(newPassword, 8);

//     const result = await regService.updatePasswordById(user.id, hashedPassword);

//     res.render("login.ejs", { message: "Password reset successfully!" });

//   } catch (err) {
//     console.error("Reset Password Error:", err);
//     res.render("ResetPassword.ejs", { message: "Internal Server Error" });
//   }
// };


exports.resetPasswordCtrl = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.redirect("/login");

    const user = jwt.verify(token, "11$$$66&&&&4444");

    const { newPassword } = req.body;

    if (!newPassword) {
      return res.render("ResetPassword.ejs", { message: "Password is required!" });
    }

    const hashedPassword = bcrypt.hashSync(newPassword.trim(), 10);

    await regService.updatePasswordById(user.id, hashedPassword);

    res.render("login.ejs", { message: "Password reset successfully!" });

  } catch (err) {
    console.error(err);
    res.render("ResetPassword.ejs", { message: "Internal Server Error" });
  }
};

exports.adminCtrl = async (req, res) => {

  try {

    const admins = await regService.getAllAdmins();
    const newsData = await newsService.getAllNews();
    const contactData = await contactService.getAllContacts();
    const dashboardData = await dashboardService.getDashboardData();
    const organizations = await orgService.getOrganizations();

    let editAdmin = null;

    if(req.query.id){
      editAdmin = await regService.getAdminById(req.query.id);
    }

    res.render("admindash", {
      admins,
      newsData,
      contactData,
      organizations,
      documents: [],
    
      counts: dashboardData.counts,
      expiringMembers: dashboardData.expiringMembers,
      editAdmin: editAdmin,   // important
      editData: null
    });

  } catch (err) {

    console.log(err);

  }

};

exports.editAdminForm = async (req, res) => {
  try {
    const id = req.query.id;
    const admin = await regService.getAdminById(id);

    if (!admin) {
      return res.redirect("/admindash");
    }

    res.render("editAdmin.ejs", { admin }); //send single admin to ejs
  } catch (err) {
    console.error("Edit Admin Error:", err);
    res.send("Internal Server Error");
  }
};

// exports.updateAdmin = async (req, res) => {
//   try {
//     const { id, username, password, status } = req.body;

//     await regService.updateAdminById(id, username, password, status);

//     res.redirect("/admin");
//   } catch (err) {
//     console.error("Update Admin Error:", err);
//     res.send("Internal Server Error");
//   }
// };


exports.updateAdmin = async (req, res) => {
  try {
    const { id, username, password, status } = req.body;

    let hashedPassword = password;

    // only hash if password is changed
    if (password) {
      hashedPassword = bcrypt.hashSync(password.trim(), 10);
    }

    await regService.updateAdminById(id, username, hashedPassword, status);

    res.redirect("/admin");

  } catch (err) {
    console.error("Update Admin Error:", err);
    res.send("Internal Server Error");
  }
};

// User dashboard page
exports.userCtrl = (req, res) => {
  res.render("home.ejs");
};

exports.homeCtrl = async (req, res) => {

  try {

    const dashboardData = await dashboardService.getDashboardData();

    res.render("dashboard", {
      counts: dashboardData.counts,
      expiringMembers: dashboardData.expiringMembers
    });

  } catch (err) {

    console.log(err);

    res.render("dashboard", {
      counts: null,
      expiringMembers: []
    });

  }

};



exports.adminPageCtrl = async (req,res)=>{

try{

const admins = await regService.getAllAdmins();

let editAdmin = null;

if(req.query.id){
editAdmin = await regService.getAdminById(req.query.id);
}

res.render("admin",{
admins: admins,
editAdmin: editAdmin
});

}catch(err){

console.log(err);

res.render("admin",{
admins: [],
editAdmin: null
});

}

};

exports.newsCtrl = async (req, res) => {

  try {

    const newsData = await newsService.getAllNews();

    res.render("news", {
      newsData: newsData,
      editData: null
    });

  } catch (err) {

    console.log(err);

    res.render("news", {
      newsData: [],
      editData: null
    });

  }

};

exports.contactCtrl = (req, res) => {
  res.render("contact.ejs");
};






