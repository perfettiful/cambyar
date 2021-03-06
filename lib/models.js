/*
 * models.js
 *   Declare models for mongoose
 */
var mongoose = require('mongoose');
var utils = require('./utils');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

/*
 * User model
 */
var User = new Schema({
    
    is_admin: Boolean,
    receive_emails: {
        type: Boolean,
        default: true,
    },    
    username: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        match: utils.emailCheck,
    },
    name: {
        first: String,
        last: String,
    },
    bio: {
        type: String,
        default: "No bio available",
    },
    points: {
        type: Number,
        min: 0,
        default: 0,
    },
    experience: {
        type: Number,
        min: 0,
        default: 0,
    },
    alerts: {
        type: Boolean,
        default: true,
    },
    expertise: [ObjectId],
    interests: [ObjectId],

});

/* 
 * Creates a virtual name.full field that
 *   captializes and concatenates user's first and last name
 */
User.virtual('name.full')
    .get(function(){
        return utils.nameFull(this.name);
    });


/*
 * Rating model
 */
var Rating = new Schema({
    user: ObjectId,
    rater: ObjectId,
    lesson: ObjectId,
    value: {
        type: Number,
        min: 0.0,
        max: 10.0,
    },

});


/*
 * Tag model
 */
var Tag = new Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: false,
    },

});


/* 
 * Lesson model
 */
var Lesson = new Schema({
    user: ObjectId,
    subjects: [ObjectId],

    description: String,
    title: {
        type: String,
        required: true,
    },
    loc: {
        type: [Number],
    },
    active: {
        type: Boolean,
        default: true,
    },
});


/*
 * Request model
 */
var Request = new Schema({
    from: ObjectId,
    to: {
        type: ObjectId,
        required: true,
    },
    lesson: {
        type: ObjectId,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['in_session', 'stale', 'pending', 'complete'],
        default: 'pending',
    }
});


/* 
 * Export models for outside use
 */
module.exports = {
    User: mongoose.model('User', User),
    Rating: mongoose.model('Rating', Rating),
    Tag: mongoose.model('Tag', Tag),
    Lesson: mongoose.model('Lesson', Lesson).collection.ensureIndex({loc: '2d'}),
    Request: mongoose.model('Request', Request),
}
