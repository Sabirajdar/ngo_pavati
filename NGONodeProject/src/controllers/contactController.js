const contactService = require("../services/contactservice.js");


exports.contactCtrl = async (req, res) => {
  try {
    const contactData = await contactService.getAllContacts();

    res.render("contact", {
      
      contactData: contactData,
      editData: null
    });

  } catch (err) {
    console.log(err);
    res.send("Database Error");
  }
};


exports.addContact = async (req, res) => {

  const { pri_mobile, alt_mobile, email, message } = req.body;

  try {

    await contactService.addContact(
      pri_mobile,
      alt_mobile,
      email,
      message
    );

    res.redirect("/contact");

  } catch (err) {
    console.log(err);
    res.send("Insert Failed");
  }
};


/* EDIT CONTACT */
exports.editContact = async (req, res) => {

  const id = req.params.id;

  try {

    const contactData = await contactService.getAllContacts();

    const editData = await contactService.getContactById(id);

    res.render("contact", {
      contactData: contactData,
      editData: editData
    });

  } catch (err) {
    console.log(err);
    res.send("Error");
  }
};


/* UPDATE CONTACT */
exports.updateContact = async (req, res) => {

  const id = req.params.id;

  const { pri_mobile, alt_mobile, email, message } = req.body;

  try {

    await contactService.updateContact(
      id,
      pri_mobile,
      alt_mobile,
      email,
      message
    );

    res.redirect("/contact");

  } catch (err) {
    console.log(err);
    res.send("Update Failed");
  }
};