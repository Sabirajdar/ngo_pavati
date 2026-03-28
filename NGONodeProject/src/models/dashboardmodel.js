const db = require("../config/db");

/* GET DASHBOARD COUNTS */

exports.getDashboardCounts = () => {

return new Promise((resolve,reject)=>{

db.query("SELECT COUNT(*) AS total FROM members",(err,totalMembers)=>{

if(err) return reject(err);

db.query(`
SELECT COUNT(*) AS total
FROM member_membership
WHERE CURDATE() BETWEEN START_DATE AND END_DATE
`,(err,active)=>{

if(err) return reject(err);

db.query(`
SELECT COUNT(*) AS total
FROM member_membership
WHERE CURDATE() > END_DATE
`,(err,expired)=>{

if(err) return reject(err);

db.query(`
SELECT COUNT(*) AS total
FROM member_membership
WHERE END_DATE BETWEEN CURDATE() 
AND DATE_ADD(CURDATE(),INTERVAL 30 DAY)
`,(err,expiring)=>{

if(err) return reject(err);

db.query(`
SELECT SUM(MEMBERSHIP_AMOUNT) AS total
FROM member_membership
`,(err,amount)=>{

if(err) return reject(err);

resolve({
totalMembers: totalMembers[0].total,
activeMembers: active[0].total,
expiredMembers: expired[0].total,
expiringSoon: expiring[0].total,
totalAmount: amount[0].total
});

}); // amount query end

}); // expiring query end

}); // expired query end

}); // active query end

}); // totalMembers query end

}); // promise end

};



/* GET EXPIRING MEMBERS */

exports.getExpiringMembers = () => {

return new Promise((resolve,reject)=>{

db.query(`
SELECT 
m.FULL_NAME,
o.ORG_NAME,
mm.END_DATE,
DATEDIFF(mm.END_DATE,CURDATE()) AS daysLeft,
mm.MEMBERSHIP_STATUS,
d.PRI_MOBILE
FROM member_membership mm
JOIN mem_org_info o ON mm.ORG_ID = o.ORG_ID
JOIN members m ON o.MEMBER_ID = m.MEMBER_ID
JOIN member_details d ON m.MEMBER_ID = d.MEMBER_ID
WHERE mm.END_DATE BETWEEN CURDATE() 
AND DATE_ADD(CURDATE(),INTERVAL 30 DAY)  ORDER BY mm.END_DATE ASC
LIMIT 10
`,(err,rows)=>{

if(err) return reject(err);

resolve(rows);

});

});

};