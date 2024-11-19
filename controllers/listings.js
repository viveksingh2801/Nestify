const Listing = require("../models/listing");

module.exports.index = async (req, res) => {
  const allListing = await Listing.find();
  res.render("listings/index.ejs", { allListing });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.search = async (req, res) => {
  const { q } = req.query; // 'q' search query parameter

  if (!q) {
    return res.redirect("/listings"); // No query? Redirect to all listings
  }

  try {
    const searchResults = await Listing.find({
      $or: [
        { title: { $regex: q, $options: "i" } }, // Case-insensitive search on 'title'
        { location: { $regex: q, $options: "i" } }, // Case-insensitive search on 'location'
        { country: { $regex: q, $options: "i" } }, // Case-insensitive search on 'country'
      ],
    });
    console.log(searchResults);
    res.render("listings/searchResults.ejs", { searchResults, query: q });
  } catch (error) {
    console.error("Error fetching search results:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports.showListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist");
    res.redirect("/listings");
  }
  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
  let url = req.file.path;
  let filename = req.file.filename;

  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { url, filename };

  // const {title, description, image, price, location, country} = req.body;
  // const newListing = new Listing({
  //     title: title,
  //     description: description,
  //     image: image,
  //     price: price,
  //     location: location,
  //     country: country,
  // })
  await newListing.save();
  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist");
    res.redirect("/listings");
  }
  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  const { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
    await listing.save();
  }
  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};

// module.exports.paymentForm = (req, res) => {
//   res.render("listings/payment.ejs");
// };

module.exports.paymentForm = (req, res) => {
  const { price, id } = req.query;

  if (!price || !id) {
    return res.status(400).send("Price or Listing ID missing");
  }

  // Render the payment page with price
  res.render("listings/payment.ejs", { price, id });
};


const crypto = require('crypto');

module.exports.confirmForm = (req, res) => {
    const { price, id } = req.query;

    // Generate a fake reference ID
    const refId = crypto.randomBytes(6).toString('hex').toUpperCase();

    // Redirect to confirmation page with the reference ID
    res.render('listings/confirmation.ejs', { price, id, refId });
};
