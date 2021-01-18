var express = require('express');
const session = require('express-session');
const userOpretion = require('../Opretion/userOpretion');
var router = express.Router();
var opretions = require('../Opretion/userOpretion')
const { v4: uuidv4 } = require('uuid');
var fs = require("fs")
var path = require("path");
const Db = require('mongodb/lib/db');
const { json, response } = require('express');

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
    res.render('users/users-home', { user: req.session.user, login: req.session.logedin, allPost: response.data, allUsers:response.allUsers });
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
    res.render("users/userpanul",{
      user:req.session.user,
      login: req.session.logedin,
      userId: respomse.userId,
      fullname:respomse.fullname,
      userName: respomse.username,
      emailId:respomse.MobilorEmail,
      friend: respomse.friend,
      followersCound: respomse.followers.length,
      followingCound: respomse.following.length,
      allPost: respomse.postData,
      allPostCound: respomse.postData.length
    })
  })
})

router.post("/user-post", (req, res) => {
  let post = {}
  let postingpath = `./postingUser/userPost`
  post.imgLocation = uuidv4() + "";
  // user post derectory
  var img = req.files.img
  if (fs.existsSync(postingpath)) {
    img.mv(`${postingpath}/post/${post.imgLocation}.jpg`)

  } else {
    fs.mkdir(postingpath + "/post", { recursive: true }, (err) => {
      if (err) throw err
      img.mv(`${postingpath}/post/${post.imgLocation}.jpg`)
    })
  }
  req.body.postImg = post.imgLocation
  userOpretion.userPostUploading(req.body, req.session.user._id, req.session.user.username).then((response) => {
    res.send(response).status(200)
  })
})


router.post("/userPostCound", (req, res) => {
  userOpretion.uesrPostCound(req.session.user._id).then((respomse) => {
    let posts = respomse.post
    if (posts) {
      let posts = respomse.post.userPost.length
      res.send(posts + "")
    }
  })
})
router.post("/post_delet", (req, res) => {
  let deletItem = req.body.postId
  userOpretion.deletUserPOst(deletItem, req.session.user._id).then((respomse) => {
    var path = `postingUser/userPost/post/${deletItem}.jpg`
    fs.unlink(path,(err) => {
      if(err) throw err
      res.send(respomse).status(200)
    })
  })
})

router.get("/selectedUser",(req,res) => {
  userOpretion.foundUserData(req.session.finduserId,req.session.user._id).then((respomse) => {
    res.render("users/findUser",
    {
      user:req.session.user,
      login: req.session.logedin,
      userId: respomse.userId,
      fullname:respomse.fullname,
      userName: respomse.username,
      emailId:respomse.MobilorEmail,
      friend: respomse.friend,
      followersCound: respomse.followers.length,
      followingCound: respomse.following.length,
      allPost: respomse.postData,
      allPostCound: respomse.postData.length
    })
  })
})
router.get("/show-user/:id", login, (req, res) => {
  req.session.finduserId = req.params.id
  if (req.session.finduserId == req.session.user._id) {
    res.redirect("/userpanul")
  }else{
    res.redirect("/selectedUser")
  }
})


router.post("/addFriend", (req, res) => {
  userOpretion.addFriend(req.body.foundUser, req.session.user._id).then((respomse) => {
    res.send(respomse)
  })
})
router.post("/deleteUser",(req,res) => {
  userOpretion.unfollow(req.body.userId,req.session.user._id).then((respomse) => {
    res.send(respomse)
  })
})
router.get("/get-all-followers",(req,res) => {
  userOpretion.getFollowers(req.session.user._id).then((response) => {
    res.send(response);
  })
})


router.post("/remove-fround-from-user-panul",(req,res) => {
  userOpretion.removeFroundFromUserPanul(req.body.userId,req.session.user._id).then((respomse) => {
    res.send(respomse)
  })
})

router.post("/follow-friend-from-user-panul",(req,res) => {
  userOpretion.addFriendFromUserPanul(req.body.foundUser,req.session.user._id).then((response) => {
    res.send(response)
  })
})
router.get("/get-following",(req,res) => {
  userOpretion.getFollowing(req.session.user._id).then((response) => {
    res.send(response)
  })
})

router.post("/remove-follower",(req,res) => {
  userOpretion.removeFromFllovers(req.body.userId,req.session.user._id).then((response) => {
    res.send(response)
  })
})





module.exports = router;