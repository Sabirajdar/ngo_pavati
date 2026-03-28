const model = require("../models/dashboardmodel");

exports.getDashboardData = async () => {

const counts = await model.getDashboardCounts();

const expiringMembers = await model.getExpiringMembers();

return {counts, expiringMembers};

};