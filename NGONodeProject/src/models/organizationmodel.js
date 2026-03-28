const db = require("../config/db");

/* GET LAST MEMBER CODE */

exports.getLastMemberCode = () => {

return new Promise((resolve,reject)=>{

db.query(
`SELECT MEMBER_CODE
FROM members
WHERE MEMBER_CODE IS NOT NULL
ORDER BY MEMBER_ID DESC
LIMIT 1`,
(err,result)=>{

if(err) reject(err);
else resolve(result);

});

});

};

/* INSERT MEMBER */

exports.insertMember = (
memberCode,
name,
username,
password,
pan,
aadhar,
dob,
userId
)=>{

return new Promise((resolve,reject)=>{

db.query(
`INSERT INTO members
(MEMBER_CODE,FULL_NAME,USER_NAME,PASSWORD,PAN_NUMBER,AADHAR_NUMBER,MEM_DOB,USER_ID)
VALUES (?,?,?,?,?,?,?,?)`,
[
memberCode,
name,
username,
password,
pan,
aadhar,
dob,
userId
],
(err,result)=>{

if(err) reject(err);
else resolve(result.insertId);

});

});

};

/* INSERT USER */

exports.insertUser = (username,password)=>{

return new Promise((resolve,reject)=>{

db.query(
`INSERT INTO users
(USER_USERNAME,PASSWORD,ROLE,STATUS)
VALUES (?,?,?,?)`,
[
username,
password,
"MEMBER",
"Active"
],
(err,result)=>{

if(err) reject(err);
else resolve(result);

});

});

};

/* MEMBER DETAILS */

exports.insertMemberDetails = (
memberId,
mobile,
altMobile,
landline,
email,
website,
add1,
add2,
add3,
city,
district,
state,
pin
)=>{

return new Promise((resolve,reject)=>{

db.query(
`INSERT INTO member_details
(MEMBER_ID,PRI_MOBILE,ALT_MOBILE,LANDLINE_NUMBER,EMAIL,WEBSITE,
ADD_LINE1,ADD_LINE2,ADD_LINE3,CITY,DISTRICT,STATE,PINCODE)
VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
[
memberId,
mobile,
altMobile,
landline,
email,
website,
add1,
add2,
add3,
city,
district,
state,
pin
],
(err,result)=>{

if(err) reject(err);
else resolve(result);

});

});

};

/* ORGANIZATION */

exports.insertOrganization = (
memberId,
name,
regNo,
regDate,
reg80g,
reg80gDate,
reg12a,
reg12aDate,
pan
)=>{

return new Promise((resolve,reject)=>{

db.query(
`INSERT INTO mem_org_info
(MEMBER_ID,ORG_NAME,ORG_REG_NUMBER,ORG_REG_DATE,
ORG_80G_REG_NUMBER,ORG_80G_REG_DATE,
ORG_12A_REG_NUMBER,ORG_12A_REG_DATE,
ORG_PAN)
VALUES (?,?,?,?,?,?,?,?,?)`,
[
memberId,
name,
regNo,
regDate,
reg80g,
reg80gDate,
reg12a,
reg12aDate,
pan
],
(err,result)=>{

if(err) reject(err);
else resolve(result.insertId);

});

});

};

/* MEMBERSHIP */

exports.insertMembership = (
orgId,
regDate,
startDate,
endDate,
status,
amount,
createdBy
)=>{

return new Promise((resolve,reject)=>{

db.query(
`INSERT INTO member_membership
(ORG_ID,REGISTRATION_DATE,START_DATE,END_DATE,
MEMBERSHIP_STATUS,MEMBERSHIP_AMOUNT,CREATED_BY)
VALUES (?,?,?,?,?,?,?)`,
[
orgId,
regDate,
startDate,
endDate,
status,
amount,
createdBy
],
(err,result)=>{

if(err) reject(err);
else resolve(result);

});

});

};

/* DOCUMENT */

exports.insertDocument = (
memberId,
orgId,
type,
name,
path
)=>{

return new Promise((resolve,reject)=>{

db.query(
`INSERT INTO documents
(MEMBER_ID,ORG_ID,DOCUMENT_TYPE,DOCUMENT_NAME,DOCUMENT_PATH)
VALUES (?,?,?,?,?)`,
[
memberId,
orgId,
type,
name,
path
],
(err,result)=>{

if(err) reject(err);
else resolve(result);

});

});

};

exports.getOrganizations = () => {

return new Promise((resolve,reject)=>{

db.query(
"SELECT * FROM mem_org_info ORDER BY ORG_ID DESC",
(err,result)=>{

if(err) reject(err);
else resolve(result);

});

});

};

exports.getDocumentsByOrg = (orgId) => {

return new Promise((resolve,reject)=>{

db.query(
"SELECT * FROM documents WHERE ORG_ID=?",
[orgId],
(err,result)=>{

if(err) reject(err);
else resolve(result);

});

});

};


exports.Organization = {
search: (criteria, callback) => {

let query = `
SELECT 
o.ORG_ID,
o.ORG_NAME,
m.FULL_NAME AS MEMBER_NAME,
mm.START_DATE,
mm.END_DATE,
mm.MEMBERSHIP_STATUS AS STATUS,
md.PRI_MOBILE AS MOBILE
FROM mem_org_info o
LEFT JOIN members m ON o.MEMBER_ID = m.MEMBER_ID
LEFT JOIN member_details md ON m.MEMBER_ID = md.MEMBER_ID
LEFT JOIN member_membership mm ON o.ORG_ID = mm.ORG_ID
WHERE 1=1
`;

let params = [];

if(criteria.org_name){
query += " AND o.ORG_NAME LIKE ?";
params.push('%'+criteria.org_name+'%');
}

if(criteria.status){
query += " AND mm.MEMBERSHIP_STATUS=?";
params.push(criteria.status);
}

if(criteria.mobile){
query += " AND md.PRI_MOBILE=?";
params.push(criteria.mobile);
}

if(criteria.membership_id){
query += " AND mm.MEMBERSHIP_ID=?";
params.push(criteria.membership_id);
}

if(criteria.registration_date){
query += " AND o.ORG_REG_DATE=?";
params.push(criteria.registration_date);
}

if(criteria.org_pan){
query += " AND o.ORG_PAN=?";
params.push(criteria.org_pan);
}

if(criteria.member_pan){
query += " AND m.PAN_NUMBER=?";
params.push(criteria.member_pan);
}

if(criteria.email){
query += " AND md.EMAIL=?";
params.push(criteria.email);
}

db.query(query,params,callback);

}
};


exports.getOrganizationsForExport = (criteria) => {

return new Promise((resolve, reject) => {

let query = `
SELECT 
o.ORG_NAME,
m.FULL_NAME AS MEMBER_NAME,
mm.START_DATE,
mm.END_DATE,
mm.MEMBERSHIP_STATUS AS STATUS,
md.PRI_MOBILE AS MOBILE
FROM mem_org_info o
LEFT JOIN members m ON o.MEMBER_ID = m.MEMBER_ID
LEFT JOIN member_details md ON m.MEMBER_ID = md.MEMBER_ID
LEFT JOIN member_membership mm ON o.ORG_ID = mm.ORG_ID
WHERE 1=1
`;

let params = [];

if (criteria.org_name) {
query += " AND o.ORG_NAME LIKE ?";
params.push(`%${criteria.org_name}%`);
}

if (criteria.status) {
query += " AND mm.MEMBERSHIP_STATUS = ?";
params.push(criteria.status);
}

if (criteria.mobile) {
query += " AND md.PRI_MOBILE = ?";
params.push(criteria.mobile);
}

if (criteria.membership_id) {
query += " AND mm.MEMBERSHIP_ID = ?";
params.push(criteria.membership_id);
}

db.query(query, params, (err, result) => {

if(err) reject(err);
else resolve(result);

});

});

};