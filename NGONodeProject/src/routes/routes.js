const express = require("express");
const router = express.Router();
const db = require("../config/db");
/* CONTROLLERS */

const controller = require("../controllers/AdminController.js");
const contactController = require("../controllers/contactController.js");
const newsController = require("../controllers/newsController.js");
const ctrl = require("../controllers/dashboardController");
const orgController = require("../controllers/organizationController");

const memberController=require("../controllers/memberController.js");
const authenticateToken = require("../middlewares/authMiddleware.js");


/* MULTER CONFIG */

const multer = require("multer");

const storage = multer.diskStorage({

destination: (req, file, cb) => {
cb(null, "uploads/");
},

filename: (req, file, cb) => {
cb(null, Date.now() + "_" + file.originalname);
}

});

const upload = multer({ storage });

/* ORGANIZATION SAVE */

router.get("/organization", (req,res)=>{
res.render("organization",{
documents: []
});
});

router.post(
"/organization/save",
upload.any(),
orgController.saveOrganization
);



/* SecretAdmin */
router.get("/super-secret-admin-123", controller.secretAdminPage);
router.post("/super-secret-admin-123", controller.createFirstAdmin);

router.get("/logout", (req, res) => {
  res.clearCookie("token");   // remove JWT cookie
  return res.redirect("/");   // go to login page
});

/* LOGIN ROUTES */

router.get("/", controller.loginCtrl);
router.get("/resetPassword", controller.ResetPasswordCtrl);
router.post("/reset-password", controller.resetPasswordCtrl);

router.get("/register", controller.RegisterCtrl);

/* REGISTER */

router.post("/savereg", controller.saveReg);
router.post("/saveadmin", controller.saveadmin);

/* LOGIN VALIDATE */

router.post("/validate", controller.validateUser);

/* ADMIN */

router.get("/editadmin", controller.editAdminForm);
router.post("/updateadmin", controller.updateAdmin);

/* DASHBOARDS */

router.get("/admindash", authenticateToken,controller.adminCtrl);
router.get("/userdash", authenticateToken, memberController.showHomePage);
/* PAGES */

router.get("/home", controller.homeCtrl);
router.get("/admin", controller.adminPageCtrl);
router.get("/news", controller.newsCtrl);

/* CONTACT */

router.get("/contact", contactController.contactCtrl);
router.post("/add-contact", contactController.addContact);
router.get("/contact/:id", contactController.editContact);
router.post("/update-contact/:id", contactController.updateContact);

/* NEWS */

router.get("/shownews", newsController.showNews);
router.post("/add-news", newsController.addNews);
router.get("/edit-news/:id", newsController.editNews);
router.post("/update-news/:id", newsController.updateNews);

router.get("/membership/next-id", (req, res) => {

db.query(
`SELECT IFNULL(MAX(MEMBERSHIP_ID),0) + 1 AS nextId 
 FROM member_membership`,
(err, rows) => {

if(err){
return res.status(500).json({error:err});
}

res.json({
membershipId: rows[0].nextId
});

});

});

router.get("/organization/:id", orgController.showOrganization);
// open search page
router.get("/search-page", orgController.getSearchPage);

// search organization
router.get("/search", orgController.searchOrganizations);

// autofill organization details
router.get("/getOrg", orgController.getOrgDetails);

router.get("/export-org", orgController.exportOrganizations);


router.get("/organization/edit/:id",orgController.editOrganization);

router.post(
"/organization/update/:id",
upload.any(),
orgController.updateOrganization
);

router.get(
"/organization/:id",
orgController.showOrganization
);

router.get(
"/getOrg",
orgController.getOrgDetails
);

router.get("/membership-next-id", (req, res) => {

db.query(
`SELECT IFNULL(MAX(MEMBERSHIP_ID),0) + 1 AS membershipId 
 FROM member_membership`,
(err, rows) => {

if (err) {
return res.status(500).json({ error: err });
}

res.json({
membershipId: rows[0].membershipId
});

});

});


/* Member route*/

router.get("/userdash", authenticateToken, memberController.showHomePage);
router.post("/receipt/save",authenticateToken, memberController.saveReceipt);
router.get("/receipt/generate", authenticateToken,memberController.generatePage);
router.get("/receipt/search",authenticateToken, memberController.searchReceipt);
router.get("/receipt/:receiptNo/pdf",authenticateToken, memberController.generateReceipt);
router.get("/receipt/memcontact",authenticateToken,memberController.showContactPage);


module.exports = router;