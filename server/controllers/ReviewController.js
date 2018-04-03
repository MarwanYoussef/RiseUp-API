const _ = require('lodash');
const mongoose = require('mongoose');
const {ObjectId} = require('mongodb');
Review = mongoose.model('Review');
OfficeHour = mongoose.model('OfficeHour');

module.exports.createOfficeHour = async (req, res) => {

    var officeHour = new OfficeHour();
    officeHour.user = req.body.officeHour.user;
    officeHour.expert = req.body.officeHour.expert;
    officeHour.title = req.body.officeHour.title;
    officeHour.description = req.body.officeHour.description;

    officeHour.save().then((officeHour) => {
        res.send(officeHour);
    }).catch((err) => {
        res.status(500).send(err);
    });
};

module.exports.getReviewsOnUser = async (req, res) => {

    var userId = req.params.id;

    Review.find({ 'reviewed._id': userId }).then((reviews) => {
        res.send({ reviews });
    }).catch((err) => {
        res.status(500).send(err);
    });

};

module.exports.postReview = async (req, res) => {

    if(!req.body.review)
        res.status(400).send('No review');

    if(!req.body.review.rating)
        res.status(400).send('Rating not specified');

    if(!req.body.review.reviewer)
        res.status(400).send('Reviewer not specified');

    if(!req.body.review.reviewed)
        res.status(400).send('Reviewed user not specified');

    if(!req.body.review.officeHours)
        res.status(400).send('Office hours not specified');
    
    OfficeHour.findOne({ _id: req.body.review.officeHours }, (err, officeHour) => {

        if(!officeHour)
            res.status(400).send('Office hours not found');

        // TODO: Make sure the reviewer is either the user or the expert
        // TODO: Make sure the reviewed is either the user or the expert
        // TODO: Make sure the reviewer and reviewed are not the same.

    });

    var reviewToSave = new Review();
    reviewToSave.reviewer = req.body.review.reviewer;
    reviewToSave.reviewed = req.body.review.reviewed;
    reviewToSave.officeHours = req.body.review.officeHours;
    reviewToSave.description = req.body.review.description;
    reviewToSave.rating = req.body.review.rating;

    reviewToSave.save().then((review) => {
        res.send(review);
    }).catch((err) => {
        res.status(500).send(err);
    });

};