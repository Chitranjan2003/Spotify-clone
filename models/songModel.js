const mongoose = require("mongoose")

const songSchema = mongoose.Schema({
    title: String,
    artist: String,
    album: String,
    catagory:[{
        type: String,
        enum: ['hindi', 'punjabi']
    }],
    likes:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }],
    size: Number,
    poster: String,
    fileName: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('song', songSchema)