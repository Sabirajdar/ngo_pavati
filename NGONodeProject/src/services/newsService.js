const newsModel = require("../models/newsmodel.js");

exports.getAllNews = async () => {
  return await newsModel.getAllNews();
};

exports.getActiveNews = async () => {
  return await newsModel.getActiveNews();
};

exports.addNews = async (title, description, status) => {
  return await newsModel.insertNews(title, description, status);
};

exports.getNewsById = async (id) => {
  return await newsModel.getNewsById(id);
};

exports.updateNews = async (id, title, description, status) => {
  return await newsModel.updateNews(id, title, description, status);
};