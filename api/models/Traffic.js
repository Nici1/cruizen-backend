const mongoose = require('mongoose');

const trafficAlertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coordinates: {
    type: [Number],
    required: true
  },
  time: {
    type: Date,
    required: true
  },
  detections: {
    type: [Number],
    default: []
  }
});

const TrafficAlert = mongoose.model('TrafficAlert', trafficAlertSchema);

module.exports = TrafficAlert;
