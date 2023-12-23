const mongoose = require("mongoose")

const playlistSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    songs:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'song'
    }],
    poster: {
        type: String,
        default:'/images/musicicon.webp'
    }
})

module.exports = mongoose.model('playlist', playlistSchema)