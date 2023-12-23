var express = require('express');
var router = express.Router();
var users = require("../models/userModel");
var songModel = require("../models/songModel")
var playlistModel = require("../models/playlistModel")
const passport = require('passport');
var localStrategy = require("passport-local");
passport.use(new localStrategy(users.authenticate()))
const mongoose = require("mongoose")
var multer = require("multer")
var id3 = require("node-id3")
const {Readable} = require("stream")
var crypto = require("crypto");
const userModel = require('../models/userModel');

mongoose.connect("mongodb://0.0.0.0/Spotify-Clone").then(()=>{
  console.log("connected to database")
}).catch(err => {
  console.log(err)
})

const conn = mongoose.connection

var gfsBucket, gfsBucketPoster
conn.once('open', () => {
  gfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: 'audio'
  })
  gfsBucketPoster = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: 'poster'
  })
})

// User authentication Start
router.post('/register',function(req, res, next) {
  var newUser = {
    username: req.body.username,
    email: req.body.email,
    }
      users.register(newUser, req.body.password)
    .then(function(u){
      passport.authenticate("local")(req, res, async function(){
        
        const songs = await songModel.find()
        const defaultplaylist = await playlistModel.create({
          name: req.body.username,
          owner: req.user._id,
          songs: songs.map(song => song._id)
        })

        const newUser = await userModel.findOne({
          _id: req.user._id
        })

        newUser.playlist.push(defaultplaylist._id)

        await newUser.save()

        res.redirect("/")
      })
    })
});

router.get('/auth', function(req, res, next) {
  res.render('register');
});

router.post('/login',passport.authenticate("local",{
  successRedirect: "/",
  failureRedirect: "/login"
}),function(req, res, next) {});


router.get('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});


function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  else{
    res.redirect("/auth")
  }
}

function isAdmin(req, res, next){
  if(req.user.isAdmin) return next()
  else return res.redirect('/')
}
// User authentication End


/* GET home page. */
router.get('/', isLoggedIn, async function(req, res, next) {
  const currentUser = await userModel.findOne({
    _id: req.user._id
  }).populate('playlist').populate({
    path: 'playlist',
    populate: {
      path: 'songs',
      model: 'song'
    }
  })
  res.render('index', {currentUser});
});

router.get('/poster/:posterName', (req, res, next)=>{
  gfsBucketPoster.openDownloadStreamByName(req.params.posterName).pipe(res)
})


// Upload Music Code Start
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
router.post('/uploadMusic', isLoggedIn, isAdmin, upload.array("song") , async function(req, res, next) {
  await Promise.all(req.files.map(async file=>{

  const randomName = crypto.randomBytes(20).toString('hex')
  const songData = id3.read(file.buffer)
  Readable.from(file.buffer).pipe(gfsBucket.openUploadStream(randomName))
  Readable.from(songData.image.imageBuffer).pipe(gfsBucketPoster.openUploadStream(randomName + 'poster'))
  await songModel.create({
    title: songData.title,
    artist: songData.artist,
    album: songData.album,
    size: file.size,
    poster: randomName + 'poster',
    fileName: randomName
  })
   }))
  res.send("songs uploaded")
});

router.get('/uploadMusic', isLoggedIn,isAdmin, (req, res, next)=>{
  res.render("uploadMusic")
})

router.get('/stream/:musicName', async(req,res,next)=>{
  const currentSong = await songModel.findOne({
    fileName: req.params.musicName
  })
  const stream = gfsBucket.openDownloadStreamByName(req.params.musicName)
  res.set('content-Tpye', 'audio/mpeg')
  res.set('content-Length', currentSong.size + 1)
  res.set('content-Range', `bytes 0-${currentSong.size - 1}/${currentSong.size}`)
  res.set('content-ranges', 'bytes')
  res.status(206)
  
  stream.pipe(res)
})

router.get('/search',(req, res, next)=>{
  res.render('search')
})

router.post('/search', async (req, res, next)=>{
  const searchedMusic = await songModel.find({
    title: {$regex: req.body.search}
  })
  res.json({
    songs: searchedMusic
  })
})

router.get('/like',(req, res, next)=>{
  res.render('like')
})

module.exports = router;
