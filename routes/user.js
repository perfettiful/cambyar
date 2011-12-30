/*
 * user.js
 *   Render user pages
 */
var async = require('async');
var mongoose = require('mongoose');
var models = mongoose.models;

/*
 * GET request for user profile
 */
exports.view = function(req, res, next) {
    models.User.findOne({username: req.params.username}, function(err, user) {
        if(err) return next(err);
        if(!user) return res.send('User Doesn\'t exist', 404);
        res.render('user', {
            'this_user': user,
        });
    });
}


/*
 * GET request for editing a profile
 */
exports.edit = function(req, res, next) {
    models.Tag.find({_id: {$in : req.user.interests}}, function(err, interests) {
        if (err) return next(err);
        models.Tag.find({_id: {$in: req.user.expertise}}, function(err, expertise) {
            if(err) return next(err);
            res.render('edit-profile', {
                'interests': interests,
                'expertise': expertise,
            });
        });

    });
}


/*
 * POST request for updating a profile
 */
exports.update = function(req, res, next) {
    var interests = req.body.interests.split(',');
    var expertise = req.body.expertise.split(',');
    models.User.findOne({'email': req.body.email}, function(err, user) {
        if (err) return next(err);
        if (user && user.username !== req.user.username) { 
            res.redirect('/user/edit-profile'); 
        } else {
            async.map(interests, function(interest, cb) {
                models.Tag.findOne({name: interest}, function(err, tag) {
                    if (err) cb(err, null);
                    else if (!tag) {
                        var new_tag = new models.Tag({name: interest});
                        new_tag.save(function(err) {
                            cb(null, new_tag._id);
                        });
                    }
                    else cb(null, tag._id);
                });
            }, function(err, interest_ids) {
                if (err) return next(err);
                async.map(expertise, function(subject, cb) {
                    models.Tag.findOne({name: subject}, function(err, tag) {
                        if (err) cb(err, null);
                        else if (!tag){
                            var new_tag = new models.Tag({name: subject});
                            new_tag.save(function(err) {
                                cb(null, new_tag._id);
                            });
                        }
                        else cb(null, tag._id);
                    });
                }, function(err, expert_ids) {
                    if (err) return next(err);
                    models.User.update({username: req.user.username}, {
                        'name': {
                            'first': req.body.name_first,
                            'last':  req.body.name_last,
                        },
                        'email': req.body.email,
                        'interests': interest_ids,
                        'expertise': expert_ids,
                    }, function (err) {
                        if (err) return next(err);
                        res.redirect('/user/'+req.user.username);
                    }); 
                });
            
            });
        }
    });
}
