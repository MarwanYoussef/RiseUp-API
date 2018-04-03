const mongoose = require('mongoose');
const Request = mongoose.model('Request');
const User = mongoose.model('User');

module.exports.getAllRequests = async (req, res) => {
    Request.find().then((requests) => {
      res.status(200).send({requests});
    }, (e) => {
      res.status(500).send(e);
    })
}

module.exports.addRequest = async (req, res) => {
  if(!req.body.request) {
    res.status(400).send('Request is required');
  }
  else if(!req.body.request.description) {
    res.status(400).send('You must add description');
  }
  else {
    var request = new Request({
      user: {
        _id: req.user._id,
        name : req.user.profile.fullName
      },
      description: req.body.request.description
    })

    request.save().then((request) => {
      res.status(200).send({request});
    }, (e) => {
      res.status(500).send(e);
    })
  }
}

module.exports.rejectRequest = async (req, res) => {
  if(!req.body.request) {
    res.status(400).send('Request is required');
  }
  else {
    var request = req.body.request;
    var id = request._id;
    request.status = 'Rejected';

    Request.findByIdAndUpdate(id, {$set: request}, {new: true}).then((request) => {
      if(! request) {
        res.status(404).send();
      }
      else {
        res.status(200).send({request});
      }
    }, (e) => {
      res.status(500).send(e);
    })
  }
}

module.exports.acceptRequest = async (req, res) => {
  if(!req.body.request) {
    res.status(400).send('Request is required');
  }
  else {
    var request = req.body.request;
    var id = request._id;
    request.status = 'Accepted';

    Request.findByIdAndUpdate(id, {$set: request}, {new: true}).then((request) => {
      if(! request) {
        res.status(404).send('Request is not found');
      }
      else {
        var user = req.user;
        var userid = user._id;
        user.roles.push('expert');

        return User.findByIdAndUpdate(userid, {$set: user}, {new: true}).then((user) => {
            res.status(200).send({request});
        }, (e) => {
          res.status(500).send(e);
        })
      }
    }, (e) => {
      res.status(500).send(e);
    })
  }
}

module.exports.suspendExpert = async(req, res) => {
  if(! req.body.user) {
    res.status(404).send('User was not sent');
  }
  else if(! req.body.user._id) {
      res.status(404).send('id of user must be sent');
  }
  else {
    var id = req.body.user._id;
    User.find({_id: id}).then((Suser) => {
       if(! Suser) {
         return res.status(404).send();
       }
       var user = Suser[0];
       var roles = user.roles;
       var newRoles = roles.filter((role) => role !== 'expert');
       user.roles = newRoles;
       return User.findByIdAndUpdate(id, {$set: user}, {new: true}).then((updatedUser) => {
         if(! updatedUser) {
           res.status(404).send();
         }
         else {
           res.status(200).send({updatedUser});
         }
       }, (e) => {
         res.status(500).send();
       })
      })
   }
}