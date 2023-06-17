const mongoose = require('mongoose');

const placeSchema = new  mongoose.Schema({

    trafficAlerts: [{
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    time: {
      type: Date,
      required: true
    }
  }]


});

const PlaceModel = mongoose.model('Place', placeSchema);

module.exports = PlaceModel;