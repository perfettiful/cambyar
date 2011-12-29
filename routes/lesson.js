var mongoose = require('mongoose');
var async = require('async');
var models = mongoose.models;

exports.create = function(req, res) {
    res.render('create-lesson');

};

exports.save = function(req, res, next) {
    tags = req.body.tags.split(',');
    async.map(tags, function(tag, cb) {
        var tag_lower = tag.toLowerCase();
        var id;
        models.Tag.findOne({name: tag_lower}, function(err, results) {
            if(!results) {
                var new_tag = new models.Tag({
                    name: tag_lower,
                });
                new_tag.save(function(err) {
                    if(err) cb(err, null);
                    else cb(null,new_tag._id);
                });
            } else {
                cb(null,results._id);
            }
        });
    }, function(err, results) {
        var lesson = new models.Lesson({
            user: req.user._id, 
            description: req.body.desc,
            title: req.body.title,
            subjects: results, 
        });    
        lesson.save(function(err) {
            console.log(JSON.stringify(lesson)); 
            if(err) return next(err);
            res.redirect('/');
        });
        
    });
}

exports.list = function(req, res, next) {
    models.Lesson.find({}, function(err, lessons) {
        if(err) return next(err);
        res.render('lessons', {
            'lessons': lessons,
        });
    });
}

exports.search = function(req, res, next) {
    var term = req.body.search_bar;
    var regex = new RegExp(term,'i');
    var results = [];
    models.Lesson.find({description: regex}, function(err, primary) {
        if(err) return next(err);
        results = results.concat(primary);
        async.map(results, function(lesson, cb) {
            cb(null,lesson._id);
        }, function(err, ids) {
            if(err) next(err);
            var terms = term.split(' ');
            regex.compile('('+terms.join('|')+')','i');
            models.Lesson.find({description: regex, _id: {$nin: ids}}, function(err,secondary) {
                if(err) return next(err);
                results = results.concat(secondary);
                res.render('lessons', {
                    'lessons': results,
                });
            });
        });
    });
}

exports.page = function(req, res, next) {
    models.Lesson.findById(req.params.id, function(err, lesson) {
        if(err) {
            if(err.message !== 'Invalid ObjectId') return next(err);
        }
        /* No lesson by that id exists */
        if(!lesson) {
            return res.send('<strong>Hey this isn\' a page</strong>',404);
        } else {
            models.User.findById(lesson.user, function(err, user) {
                if(err) return next(err);
                if(!user) {
                    return;
                } //some serious shit went down
                lesson.author = user;
                res.render('lesson', {
                    'lesson': lesson,
                });

            }); 
        }
    });
}

exports.requestForm = function(req, res, next) {
    models.Lesson.findById(req.query.l, function(err, lesson) {
        if(err) {
            if(err.message !== 'Invalid ObjectId') return next(err);
        }
        if(!lesson) res.send('Nothing here. Move Along', 404);
        models.User.findById(lesson.user, function(err, user) {
            if(err) return next(err);
            if(!user) return; //render something later?

            res.render('send-request', {
                'teacher': user,
                'lesson': lesson,
            });
        });
    });   
}

exports.sendRequest = function(req, res, next) {
    console.log(req.query.l);
    models.Lesson.findById(req.query.l, function(err, lesson) {
        if(err) { 
            if(err.message !== 'Invalid ObjectId') return next(err);
        } 
        if(!lesson) res.send('Nothing here', 404);
        
        var request = new models.Request({
            to: lesson.user,
            message: req.body.message,
            lesson: lesson._id,
        });
        if(req.loggedIn) request.from = req.user._id;
       
        request.save(function(err) {
            if(err) return next(err);
            console.log(JSON.stringify(request));
            res.redirect('/lessons/'+lesson._id);
        });
    });

}









