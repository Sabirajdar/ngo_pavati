const bcrypt = require("bcryptjs");
const orgModel = require("../models/organizationModel");

/* SAVE ORGANIZATION */

exports.saveOrganization = async (data, files) => {

const hashedPassword = bcrypt.hashSync(data.password,8);

/* MEMBER CODE GENERATION */

const lastCodeData = await orgModel.getLastMemberCode();

let memberCode = "MEM001";

if(lastCodeData.length > 0 && lastCodeData[0].MEMBER_CODE){

let lastCode = lastCodeData[0].MEMBER_CODE;

let num = parseInt(lastCode.replace("MEM",""));

num++;

memberCode = "MEM" + String(num).padStart(3,"0");

}

/* USER INSERT */

const user = await orgModel.insertUser(
data.username,
hashedPassword
);

const userId = user.insertId;

/* MEMBER INSERT */

const memberId = await orgModel.insertMember(
memberCode,
data.member_name,
data.username,
hashedPassword,
data.member_pan,
data.aadhar,
data.dob || null,
userId
);

/* MEMBER DETAILS */

await orgModel.insertMemberDetails(
memberId,
data.mobile,
data.alt_mobile,
data.landline,
data.email,
data.website,
data.address1,
data.address2,
data.address3,
data.city,
data.dist,
data.state,
data.pin
);

/* ORGANIZATION */

const orgId = await orgModel.insertOrganization(
memberId,
data.org_name,
data.reg_no,
data.reg_date,
data.reg_80g,
data.reg_80g_date,
data.reg_12a,
data.reg_12a_date,
data.org_pan
);

/* MEMBERSHIP */

const startDates = data.start_date || [];

for(let i=0;i<startDates.length;i++){

await orgModel.insertMembership(
orgId,
data.registration_date[i],
data.start_date[i],
data.end_date[i],
data.membership_status[i],
data.membership_amount[i],
userId
);

}

/* DOCUMENT */

const types = data.document_type || [];

for(let i=0;i<files.length;i++){

await orgModel.insertDocument(
memberId,
orgId,
types[i],
files[i].originalname,
files[i].path
);

}

};

/* GET ORGANIZATIONS */

exports.getOrganizations = async () => {

return await orgModel.getOrganizations();

};

/* EXPORT ORGANIZATIONS */

exports.getOrganizationsForExport = async (criteria) => {

return await orgModel.getOrganizationsForExport(criteria);

};




