const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const truncate = require(__dirname + "/truncate.js");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const mongoose = require("mongoose");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.set("strictQuery", true);
mongoose.connect(
  "mongodb+srv://nandhakumarapp:nandhakumarapp@cluster0.nxftgfw.mongodb.net/blogDB",function(){console.log("Successfully connected to db")}
);

const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  uname: String,
});

const PostSchema = new mongoose.Schema({
  postTitle: String,
  postContent: String,
});

UserSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", UserSchema);
const Post = mongoose.model("Post", PostSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, { id: user.id, username: user.username });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

//////////////////////////////////////// App particulars /////////////////////////////////////////////
// Home handlers
app.get("/", function (req, res) {
  if (req.isAuthenticated()) {
    Post.find(function (err, posts) {
      if (err) {
        console.log(err);
      } else {
        User.findOne({ _id: req.user.id }, function (err, user) {
          console.log(user)
          res.render("home", {
            user: req.user.username,
            posts,
            uname: user.uname,
          });
        });
      }
    });
  } else {
    res.redirect("/register");
  }
});

//Compose handlers
app.get("/compose", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("compose");
  } else {
    res.redirect("/register");
  }
});

app.post("/compose", function (req, res) {
  const postTitle = req.body.titleInput;
  const postContent = req.body.contentInput;
  if (req.isAuthenticated()) {
    const newPost = new Post({
      postTitle,
      postContent,
    });
    newPost.save();
    res.redirect("/");
  } else {
    res.redirect("/register");
  }
});

//post handler
app.get("/posts/:id", function (req, res) {
  const postId = req.params.id;
  if(req.isAuthenticated()){
    Post.find({ _id: postId }, function (err, post) {
      if (err) console.log(err);
      else {
        console.log(post);
        res.render("post", ...post);
      }
    });
  }
  
});

/////////////////////////////////////////////// User management /////////////////////////////////////////////

app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/register", function (req, res) {
  const username = req.body.username;
  const password = req.body.password;
  const uname = req.body.uname;

  User.register({ username, uname }, password, function (err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/");
      });
    }
  });
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/");
      });
    }
  });
});

// Logout
app.get("/logout", function (req, res) {
  req.logout(req.user, (err) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/login");
    }
  });
});

app.listen(process.env.PORT || 3000, function () {
  console.log("Server started on port 3000");
});
