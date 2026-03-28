const service = require("../services/dashboardservice");

exports.dashboardPage = async (req,res)=>{

const data = await service.getDashboardData();

res.render("dashboard",{
counts:data.counts,
expiringMembers:data.expiringMembers
});

};