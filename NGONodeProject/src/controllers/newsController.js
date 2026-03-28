const newsService = require("../services/newsService.js");


exports.showNews = async (req, res) => {
  try {

    const news = await newsService.getActiveNews();

    res.render("news", {
      newsData: news,   // ✅ FIXED
      editData: null
    });

  } catch (err) {
    console.log(err);
    res.send("Database Error");
  }
};


exports.addNews = async (req, res) => {
  const { title, description, status } = req.body;

  try {
    await newsService.addNews(title, description, status);

    res.redirect("/news");   // 🔥 better than "/"
  } catch (err) {
    console.log(err);
    res.send("Insert Failed");
  }
};


exports.editNews = async (req, res) => {

  const id = req.params.id;

  try {

    const editData = await newsService.getNewsById(id);

    const newsData = await newsService.getAllNews();

    res.render("news", {
      newsData: newsData,
      editData: editData
    });

  } catch (err) {
    console.log(err);
    res.send("Error Fetching Data");
  }
};


exports.updateNews = async (req, res) => {

  const id = req.params.id;
  const { title, description, status } = req.body;

  try {

    await newsService.updateNews(id, title, description, status);

    res.redirect("/");

  } catch (err) {
    console.log(err);
    res.send("Update Failed");
  }
};