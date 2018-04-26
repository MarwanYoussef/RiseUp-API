const mongoose = require('mongoose');

const RequestSchema = mongoose.Schema({
  user: {
    _id: {
      type: String,
    },
    name: {
      type: String,
    }
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'Pending'
  }
});

module.exports.Request = mongoose.model('Request', RequestSchema);
