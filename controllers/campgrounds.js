const { Campground } = require('../models');
const { catchAsync, geocode } = require('../utilities');
const cloudinary = require('cloudinary');
/**
 * Mapbox
 * 1. require service 
 * 2. create instance passing in token
 * Methods will be available on instance
 */
const mapboxToken = process.env.MAPBOX_TOKEN;
const positionstackKey = process.env.POSITIONSTACK_KEY;

// const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
// const geocoder = mbxGeocoding({ accessToken: mapboxToken });

module.exports.showAllCampgrounds = catchAsync(async (req, res) => {
   const campgrounds = await Campground.find({});
   res.render('campgrounds/index', { campgrounds });
});

module.exports.renderNewForm = (req, res) => {
   res.render('campgrounds/new');
};

module.exports.createCampground = catchAsync(async (req, res) => {
   /** mapbox geocoding api 
    * mapbox.places results cannot be persisted to DB
    *  - use positionstack for this, basic plan $8/month for commercial use
    * mapbox suitable to process request in single execution
      const geoData = await geocoder.forwardGeocode({
         query: req.body.campground.location,
         limit: 5
      }).send();
      */
   //   console.log(geoData.body.features[0].geometry);
   const geodata = await geocode(req.body.campground.location);
   const { longitude, latitude } = geodata[0];
   const geoJSON = {
      type: 'Point',
      coordinates: [longitude, latitude]
   };


   // access uploaded files from multer (files will already be uploaded)
   console.log('CREATE CAMPGROUND: REQ.FILES', req.files);
   const camp = new Campground(req.body.campground);
   camp.author = req.user._id;
   camp.geometry = geoJSON;
   /**
    * add uploaded files to camp - map returns a new array of modified items from req.files
    * populate a default image on creation
    */
   camp.images = req.files.map(f => ({ url: f.path, filename: f.filename }));

   /**
    * consider checking if a camp exists before creating a new one. use geo location/postcode/bbox
    */

   await camp.save();

   req.flash('message', {
      camp: camp.title,
      alert: 'success', //'danger' for bootstrap
      msg: 'Campsite Created!'
   });



   console.log('CAMP PRE REDIRECT', camp);
   res.redirect(`/campgrounds/${camp._id}`);
});

/**
 * review 520 12:00 for advice on implementing population - limit and paginate results, update as scroll
 */
module.exports.showCampground = catchAsync(async (req, res) => {
   const camp = await Campground.findById(req.params.id).populate({
      path: 'reviews',
      populate: {
         path: 'author'
      }
   }).populate('author'); //better to store username on campgrounds if accessing regularly

   if (!camp) {
      req.flash('message', {
         alert: 'danger', //'danger' for bootstrap
         msg: 'Campsite Not Found!'
      });
      return res.redirect('/campgrounds');
      // throw new ExpressError('Campground Not Found', 500);
   }
   // the populate function also allows .sort() 
   camp.reviews.sort((el1, el2) => {
      if (el1.date > el2.date) return -1;
      if (el1.date < el2.date) return 1;
      return 0;
   });
   res.render('campgrounds/details', { camp, isShowPage: true });
});

module.exports.renderEditForm = catchAsync(async (req, res) => {
   const camp = await Campground.findById(req.params.id);
   res.render('campgrounds/edit', { camp });
});

module.exports.patchCampground = catchAsync(async (req, res) => {
   // check what happen if try to edit camp via postman that  doesnt exist
   const { id } = req.params;
   console.log(req.body);

   /**
    * run validators may not be necessary if using Joi?? -
    * -it's inclusion here is before adding Joi because updates dont run mongoose validations by default
    * 
    * below line finds and updates in one call to the DB rather than finding and then saving
    */
   const query = { ...req.body.campground };

   const newImages = req.files.map(f => ({ url: f.path, filename: f.filename }));
   const deleteImages = req.body.deleteImg;

   /** if there are new images add the $push command to query object */
   if (newImages) query.$push = { images: { $each: newImages } };

   const camp = await Campground.findByIdAndUpdate(id,
      query,
      { new: true, runValidators: true }
   );

   /**
    * Query CANNOT $push and $pull in the same operation
    * - MongoError: Updating the path 'images' would create a conflict at 'images' 
    * 
    * Two queries is only option
    */
   if (deleteImages) {
      for (let filename of deleteImages) {
         cloudinary.uploader.destroy(filename);
      }
      await camp.updateOne({ $pull: { images: { filename: { $in: deleteImages } } } });
   }

   req.flash('message',
      {
         camp: camp.title,
         alert: 'success', //'danger' for bootstrap
         msg: 'Campsite Updated!'
      });
   console.log(camp);
   res.redirect(`/campgrounds/${id}`);

});

module.exports.deleteCampground = catchAsync(async (req, res) => {
   const camp = await Campground.findByIdAndDelete(req.params.id);

   req.flash('message',
      {
         camp: camp.title,
         alert: 'warning',
         msg: 'Campsite Deleted!!!'
      });

   res.redirect(`/campgrounds`);
});