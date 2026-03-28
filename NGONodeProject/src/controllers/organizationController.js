const orgService = require("../services/organizationService");
const orgModel = require("../models/organizationmodel");
const db = require("../config/db");

// SAVE ORGANIZATION
exports.saveOrganization = async (req, res) => {
try {

const formData = req.body;
const files = req.files || [];

await orgService.saveOrganization(formData, files);

res.send(`
<script>
alert("Organization Saved Successfully");
window.location.href="/organization";
</script>
`);

} catch (err) {
console.log(err);
res.send(`
<script>
alert("Error Saving Organization");
window.history.back();
</script>
`);
}
};


// SHOW ORGANIZATION DOCUMENTS
exports.showOrganization = async (req, res) => {
const orgId = req.params.id;
const documents = await orgModel.getDocumentsByOrg(orgId);
res.render("organization.ejs", { documents });
};


// LOAD SEARCH PAGE
exports.getSearchPage = (req, res) => {
res.render("orgSearch", { 
results: [],
query: {}
});
};


// SEARCH ORGANIZATIONS
exports.searchOrganizations = (req, res) => {

const criteria = req.query;

orgModel.Organization.search(criteria, (err, results) => {

if (err) {
console.log(err);
return res.status(500).send("Database Error");
}

res.render("orgSearch", { 
results,
query: criteria
});

});
};


// AUTOFILL ORG DETAILS
exports.getOrgDetails = (req, res) => {

const orgName = req.query.org_name;

const sql = `
SELECT 
o.ORG_NAME,
md.PRI_MOBILE,
md.EMAIL,
mm.MEMBERSHIP_STATUS
FROM mem_org_info o
LEFT JOIN members m ON o.MEMBER_ID = m.MEMBER_ID
LEFT JOIN member_details md ON m.MEMBER_ID = md.MEMBER_ID
LEFT JOIN member_membership mm ON o.ORG_ID = mm.ORG_ID
WHERE o.ORG_NAME LIKE ?
`;

db.query(sql, [`%${orgName}%`], (err, result) => {

if (err) {
console.log(err);
return res.json(null);
}

if (!result || result.length === 0) {
return res.json(null);
}

res.json({
mobile: result[0].PRI_MOBILE,
email: result[0].EMAIL,
status: result[0].MEMBERSHIP_STATUS
});

});
};


// EXPORT TO EXCEL
exports.exportOrganizations = async (req, res) => {

try {

const criteria = req.query;
const results = await orgService.getOrganizationsForExport(criteria);

let csv = "Organization Name,Member Name,Start Date,End Date,Status,Mobile\n";

results.forEach(r => {
csv += `${r.ORG_NAME},${r.MEMBER_NAME},${r.START_DATE},${r.END_DATE},${r.STATUS},${r.MOBILE}\n`;
});

res.header("Content-Type","text/csv");
res.attachment("organizations.csv");
res.send(csv);

} catch(err){
console.log(err);
res.status(500).send("Export Failed");
}
};


// EDIT ORGANIZATION
exports.editOrganization = (req,res)=>{

const orgId = req.params.id;

const orgQuery = `
SELECT 
o.*, m.*, md.*
FROM mem_org_info o
LEFT JOIN members m ON o.MEMBER_ID=m.MEMBER_ID
LEFT JOIN member_details md ON m.MEMBER_ID=md.MEMBER_ID
WHERE o.ORG_ID=?
`;

const membershipQuery = `
SELECT *
FROM member_membership
WHERE ORG_ID=?
ORDER BY MEMBERSHIP_ID DESC
`;

const documentQuery = `
SELECT *
FROM documents
WHERE ORG_ID=?
`;

db.query(orgQuery,[orgId],(err,org)=>{

if(err) return res.send(err);

db.query(membershipQuery,[orgId],(err,memberships)=>{

if(err) return res.send(err);

db.query(documentQuery,[orgId],(err,docs)=>{

if(err) return res.send(err);

// 🔥 DEBUG (remove later)
console.log("MEMBERSHIPS:", memberships);
console.log("DOCUMENTS:", docs);

res.render("organizationEdit",{
org:org[0],
memberships:memberships || [],
documents:docs || []
});

});

});

});

};

// UPDATE ORGANIZATION
exports.updateOrganization = async (req,res)=>{

const orgId = req.params.id;
const data = req.body;
const files = req.files || [];

try{

/* ORG UPDATE */
await db.promise().query(`
UPDATE mem_org_info SET
ORG_NAME=?,ORG_REG_NUMBER=?,ORG_REG_DATE=?,
ORG_80G_REG_NUMBER=?,ORG_80G_REG_DATE=?,
ORG_12A_REG_NUMBER=?,ORG_12A_REG_DATE=?,
ORG_PAN=?
WHERE ORG_ID=?`,
[
data.org_name,
data.reg_no,
data.reg_date || null,
data.reg_80g,
data.reg_80g_date || null,
data.reg_12a,
data.reg_12a_date || null,
data.org_pan,
orgId
]);

/* MEMBER UPDATE */
await db.promise().query(`
UPDATE members SET
FULL_NAME=?,PAN_NUMBER=?,AADHAR_NUMBER=?,MEM_DOB=?
WHERE MEMBER_ID=?`,
[
data.member_name,
data.member_pan,
data.aadhar,
data.dob || null,
data.member_id
]);

/* MEMBER DETAILS */
await db.promise().query(`
UPDATE member_details SET
PRI_MOBILE=?,ALT_MOBILE=?,LANDLINE_NUMBER=?,EMAIL=?,WEBSITE=?,
ADD_LINE1=?,ADD_LINE2=?,ADD_LINE3=?,
CITY=?,DISTRICT=?,STATE=?,PINCODE=?
WHERE MEMBER_ID=?`,
[
data.mobile,
data.alt_mobile,
data.landline,
data.email,
data.website,
data.address1 || '',
data.address2 || '',
data.address3 || '',
data.city || '',
data.dist || '',
data.state || '',
data.pin || '',
data.member_id
]);

/* ================= MEMBERSHIP UPDATE ================= */

const ids = Array.isArray(data.membership_id) ? data.membership_id : [data.membership_id];
const regDates = Array.isArray(data.registration_date) ? data.registration_date : [data.registration_date];
const startDates = Array.isArray(data.start_date) ? data.start_date : [data.start_date];
const endDates = Array.isArray(data.end_date) ? data.end_date : [data.end_date];
const amountArr = Array.isArray(data.membership_amount) ? data.membership_amount : [data.membership_amount];

for(let i=0;i<ids.length;i++){

  const today = new Date();
  today.setHours(0,0,0,0);

  let status = "Active";

  if (startDates[i] && endDates[i]) {

    const start = new Date(startDates[i]);
    const end = new Date(endDates[i]);

    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);

    if (today < start) {
        status = "InProgress";
    } 
    else if (today > end) {
        status = "Expired";
    } 
    else {
        status = "Active";
    }
  }

  if(ids[i]){

    // UPDATE existing membership
    await db.promise().query(`
      UPDATE member_membership SET
      REGISTRATION_DATE=?, START_DATE=?, END_DATE=?,
      MEMBERSHIP_STATUS=?, MEMBERSHIP_AMOUNT=?
      WHERE MEMBERSHIP_ID=?
    `, [
      regDates[i] || null,
      startDates[i] || null,
      endDates[i] || null,
      status,   // ✅ AUTO STATUS
      amountArr[i],
      ids[i]
    ]);

  } else {

    // INSERT new membership
    await db.promise().query(`
      INSERT INTO member_membership
      (ORG_ID, REGISTRATION_DATE, START_DATE, END_DATE,
       MEMBERSHIP_STATUS, MEMBERSHIP_AMOUNT, CREATED_BY)
      VALUES (?,?,?,?,?,?,?)
    `, [
      orgId,
      regDates[i] || null,
      startDates[i] || null,
      endDates[i] || null,
      status,   // ✅ AUTO STATUS
      amountArr[i],
      data.member_id
    ]);
  }

}

/* ================= DOCUMENT ================= */

for (let i = 0; i < files.length; i++) {

  const file = files[i];
  const docType = file.fieldname;

  await db.promise().query(
    "DELETE FROM documents WHERE ORG_ID=? AND DOCUMENT_TYPE=?",
    [orgId, docType]
  );

  await db.promise().query(`
    INSERT INTO documents
    (MEMBER_ID,ORG_ID,DOCUMENT_TYPE,DOCUMENT_NAME,DOCUMENT_PATH)
    VALUES (?,?,?,?,?)`,
    [
      data.member_id,
      orgId,
      docType,
      file.originalname,
      file.path.replace(/\\/g,'/')
    ]
  );
}

/* SUCCESS */
res.send(`
<script>
alert("Organization Updated Successfully");
window.location.href = "/organization/edit/${orgId}";
</script>
`);

}catch(err){

console.log("UPDATE ERROR:", err);

res.send(`
<script>
alert("Update Failed");
window.history.back();
</script>
`);
}

};