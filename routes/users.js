var express = require('express');
const session = require('express-session');
const userOpretion = require('../Opretion/userOpretion');
var router = express.Router();
var opretions = require('../Opretion/userOpretion')
const { v4: uuidv4 } = require('uuid');
var fs = require("fs")
var path = require("path");
const Db = require('mongodb/lib/db');

/* GET home page. */
// checking the user is logedin
let login = (req, res, next) => {
  if (req.session.logedin) {
    req.session.logedin = true
    next()
  } else {
    res.render("users/login", { login: req.session.logedin })
  }
}

router.get('/', login, function (req, res, next) {
  userOpretion.getFriendsPostToUserHomePage(req.session.user._id).then((response) => {
    res.render('users/users-home', { user: req.session.user, login: req.session.logedin, allPost: response });
  })
});
router.get("/messeges", login, (req, res) => {

})
router.get("/signup", (req, res) => {
  res.render("users/signup", { userErr: req.session.usernameErr, login: req.session.logedin })
  req.session.usernameErr = false
})


router.post("/signup", async (req, res) => {
  if (req.body.MobilorEmail == '' || req.body.fullname == '' || req.body.username == '' || req.body.password == '') {
    res.redirect("/signup")
  } else {
    // creating new user accound
    opretions.usserSignup(req.body).then((result) => {
      req.session.logedin = true
      req.session.user = req.body
      res.redirect('/')
    })
  }
})
router.get("/login", (req, res) => {
  res.render("users/login")
})
router.post("/login", (req, res) => {
  userOpretion.userLogin(req.body).then((respose) => {
    if (respose.status) {
      req.session.logedin = true
      req.session.user = respose.user
      res.redirect("/")
    } else {
      res.redirect("/login")
    }
  })
})

router.get("/logout", (req, res) => {
  req.session.destroy()
  res.redirect("/")
})

router.get("/userpanul", login, (req, res) => {
  userOpretion.uesrPostCound(req.session.user._id).then((respomse) => {
    if (respomse) {
      let posts = respomse.post.userPost.length + ""
      let userPosts = respomse.post.userPost
      res.render("users/userpanul", { login: req.session.logedin, user: req.session.user, respomse: posts, post: userPosts })
    } else {
      res.render("users/userpanul", { login: req.session.logedin, user: req.session.user })
    }
  })
})

router.post("/user-post", (req, res) => {
  let postingpath = `./postingUser/userPost`
  let imgLocation = uuidv4() + "";
  // user post derectory
  var img = req.files.postImg


  if (fs.existsSync(postingpath)) {
    img.mv(`${postingpath}/post/${imgLocation}.jpg`)

  } else {

    fs.mkdir(postingpath + "/post", { recursive: true }, (err) => {
      if (err) throw err
      img.mv(`${postingpath}/post/${imgLocation}.jpg`)
    })
  }
  req.body.postImg = imgLocation
  userOpretion.userPostUploading(req.body, req.session.user._id, req.session.user.username).then(() => {
    res.redirect("/userpanul")
  })
})

router.post("/user-ig-post", (req, res) => {
  userOpretion.postIgtvPost(req.body, req.session.user._id).then(() => {
    res.redirect("/userpanul")
  })
})

router.post("/userPostCound", (req, res) => {
  userOpretion.uesrPostCound(req.session.user._id).then((respomse) => {
    let posts = respomse.post.userPost.length
    res.send(posts + "")
  })
})
router.get("/deletPost/:deletItem", (req, res) => {
  let deletItem = req.params.deletItem
  // console.log(deletItem.slice(2,-5))
  userOpretion.deletUserPOst(deletItem, req.session.user._id).then((respomse) => {
    res.redirect("/userpanul")
  })
})
router.get("/show-user/:id",login, (req, res) => {
  console.log(req.params.id);
  userOpretion.findUserPostCound(req.params.id).then((respomse) => {
    postCount = respomse[0].post
    console.log(postCount);
    // userId = respomse[0].userId
    // console.log(userId);
    res.render("users/findUser", { user: req.session.user, login: req.session.logedin })
    // res.status(200).send({ userId: respomse[0].userId, userPostCount: respomse[0].post.length, userPost: respomse[0].post })
  })
})



module.exports = router;