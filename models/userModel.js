const mongoose = require("mongoose")
const passport = require("passport")
const plm = require("passport-local-mongoose")

const userSchema = mongoose.Schema({
    username: String,
    email: String,
    contact: String,
    playlist:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'playlist'
    }],
    liked:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'song'
    }],
    profileimg:{
        type: String,
        default: '/images/def.img'
    },
    isAdmin: {
        type: Boolean,
        default: false
    }
})

userSchema.plugin(plm)

module.exports = mongoose.model('user', userSchema)