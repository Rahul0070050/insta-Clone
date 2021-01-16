const collections = require('../config/collections');
var db = require('../config/connection');
var bcrupt = require('bcrypt');
var ObjectId = require('mongodb').ObjectID;
const { reject } = require('bcrypt/promises');
const { resolve } = require('path');

module.exports = {
    usserSignup: (userData) => {
        userData.following = []
        userData.followers = []
        return new Promise(async (resolve, reject) => {
            userData.password = await bcrupt.hash(userData.password, 10)
            db.get().collection(collections.USER_COLLECTION).insertOne(userData).then((data) => {
                resolve(data.ops[0])
            })
        })
    },
    getUserName: (userName) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collections.USER_COLLECTION).findOne({ username: userName }).then((response) => {
                console.log('1232321');
                if (response) {
                    resolve(response, status = true)
                } else {
                    resolve(status = false)
                }
            })
        })
    },
    userLogin: (userData) => {
        let response = {}
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collections.USER_COLLECTION).findOne({ MobilorEmail: userData.MobilorEmail })
            if (user) {
                bcrupt.compare(userData.password, user.password).then((result) => {
                    if (result) {
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {
                        console.log("0");
                        response.status = false
                        resolve(response)
                    }
                })
            } else {
                response.status = false
                resolve(response)
            }
        })
    },
    userPostUploading: (UserPost, userId, userName) => {
        return new Promise(async (resolve, reject) => {
            let post = await db.get().collection(collections.USER_POST).findOne({ "post.userId": ObjectId(userId) })
            if (post) {
                db.get().collection(collections.USER_POST).updateOne({ "post.userId": ObjectId(userId) },
                    {
                        $push: {
                            "post.userPost":
                            {
                                time: new Date(),
                                name: userName,
                                img: UserPost.postImg,
                                discription: UserPost.description,
                                comments: []
                            }
                        }
                    }
                )
            } else {
                let post = {
                    userId: ObjectId(userId),
                    userPost: [
                        {
                            time: new Date(),
                            name: userName,
                            img: UserPost.postImg,
                            discription: UserPost.description,
                            comments: []
                        }
                    ]
                }
                db.get().collection(collections.USER_POST).insertOne({ post })
            }
            db.get().collection(collections.USER_POST).aggregate([
                {
                    $match: { "post.userId": ObjectId(userId) }
                },
                {
                    $project:{
                        _id:0,
                        post:"$post.userPost"
                    }
                }
            ]).next((err, data) => {
                if (err) throw err
                // console.log(data);
                resolve(data)
            })
        })
    },
    uesrPostCound: (userId) => {
        let foundUserAllData = {}
        return new Promise(async (resolve, reject) => {
            db.get().collection(collections.USER_COLLECTION).aggregate([
                {
                    $match: { _id: ObjectId(userId) }
                },
                {
                    $project: {
                        _id: 1,
                        MobilorEmail: 1,
                        fullname: 1,
                        username: 1,
                        following: 1,
                        followers: 1
                    }
                }
            ]).next((err, data) => {
                if (err) throw err
                foundUserAllData.MobilorEmail = data.MobilorEmail,
                    foundUserAllData.fullname = data.fullname,
                    foundUserAllData.username = data.username,
                    foundUserAllData.following = data.following,
                    foundUserAllData.followers = data.followers,
                    foundUserAllData.userId = data._id
            })
            db.get().collection(collections.USER_POST).aggregate([
                {
                    $match: { "post.userId": ObjectId(userId) }
                },
                {
                    $project: {
                        _id: 0,
                        post: 1,
                    }
                },
                {
                    $unwind: "$post.userPost"
                },
                {
                    $project: {
                        userId: "$post.userId",
                        post: "$post.userPost"
                    }
                }
            ]).toArray((err, data) => {
                if (err) throw err
                foundUserAllData.postData = data
                resolve(foundUserAllData)
            })
        })

    },
    deletUserPOst: (deletItemIdentifire, userId) => {
        return new Promise((resolve, reject) => {
            //mongoDb deleting "Array of Object"
            db.get().collection(collections.USER_POST).update({ "post.userId": ObjectId(userId) }, {
                //mongoDB removing a Object from Array using "$pull"
                $pull: { "post.userPost": { "img": deletItemIdentifire } }
            })
            db.get().collection(collections.USER_POST).aggregate([
                {
                    $match: { "post.userId": ObjectId(userId) }
                },
                {
                    $project:{
                        _id:0,
                        post:"$post.userPost"
                    }
                }
            ]).next((err, data) => {
                if (err) throw err
                // console.log(data);
                resolve(data)
            })
        })
    },
    getFriendsPostToUserHomePage: (userId) => {
        let response = {}
        return new Promise(async (resolve, reject) => {
            let userFriendsPost = await db.get().collection(collections.USER_FRIENDS_POST).findOne({ "post.userId": ObjectId(userId) }) // if user have friends 
            if (userFriendsPost) {
                // get friends post and display here
            } else {
                db.get().collection(collections.USER_COLLECTION).aggregate([
                    {
                        $match:{_id:{$ne:ObjectId(userId)}}
                    },
                    {
                        $project:{
                            _id:1,
                            // allUsers:{$ne:["$_id",ObjectId(userId)]},
                            username:1
                        }
                    },
                    {
                        $limit:4
                    }
                ]).toArray((err,data) => {
                    if(err) throw err
                    response.allUsers = data
                })
                db.get().collection(collections.USER_POST).aggregate([
                    {
                        $project:
                        {
                            _id: 0,
                            userId: "$post.userId",
                            "post.userPost": 1,
                        }
                    },
                    {
                        $unwind: "$post.userPost"
                    },
                    {
                        $project:
                        {
                            post: "$post.userPost",
                            name: "$post.name",
                            userId: 1
                        }
                    },
                    {
                        $sort: { "post.time": -1 }
                    }
                ]).toArray((err, data) => {
                    if (err) throw err
                    response.data = data
                    if(response.data && response.allUsers){
                        resolve(response)
                    }
                })
            }
        })
    },
    foundUserData: (foundUser, userId) => {
        let foundUserAllData = {}
        return new Promise((resolve, reject) => {
            db.get().collection(collections.USER_COLLECTION).aggregate([
                {
                    $match: { _id: ObjectId(foundUser) }
                },
                {
                    $project: {
                        _id: 0,
                        "AllReadyFriend": {
                            $in: [userId, "$followers"]
                        }
                    }
                }
            ]).next((err, data) => {
                if (err) throw err
                foundUserAllData.friend = data.AllReadyFriend
                // console.log(data.AllReadyFriend);
            })
            db.get().collection(collections.USER_COLLECTION).aggregate([
                {
                    $match: { _id: ObjectId(foundUser) }
                },
                {
                    $project: {
                        _id: 1,
                        MobilorEmail: 1,
                        fullname: 1,
                        username: 1,
                        following: 1,
                        followers: 1
                    }
                }
            ]).next((err, data) => {
                if (err) throw err
                foundUserAllData.MobilorEmail = data.MobilorEmail,
                    foundUserAllData.fullname = data.fullname,
                    foundUserAllData.username = data.username,
                    foundUserAllData.following = data.following,
                    foundUserAllData.followers = data.followers,
                    foundUserAllData.userId = data._id
            })
            db.get().collection(collections.USER_POST).aggregate([
                {
                    $match: { "post.userId": ObjectId(foundUser) }
                },
                {
                    $project: {
                        _id: 0,
                        post: 1,
                    }
                },
                {
                    $unwind: "$post.userPost"
                },
                {
                    $project: {
                        userId: "$post.userId",
                        post: "$post.userPost"
                    }
                }
            ]).toArray((err, data) => {
                if (err) throw err
                foundUserAllData.postData = data
                resolve(foundUserAllData)
            })
        })
    },
    addFriend: (foundUserId, userId) => {
        let respons = {}
        return new Promise(async (resolve, reject) => {
            db.get().collection(collections.USER_COLLECTION).updateOne({ _id: ObjectId(userId) }, {
                $push: {
                    following: foundUserId
                }
            })
            db.get().collection(collections.USER_COLLECTION).updateOne({ _id: ObjectId(foundUserId) }, {
                $push: {
                    followers: userId
                }
            })
            db.get().collection(collections.USER_COLLECTION).aggregate([
                {
                    $match: { _id: ObjectId(foundUserId) }
                },
                {
                    $project: {
                        "followers": 1
                    }
                }
            ]).next((err, data) => {
                if (err) throw err
                respons.foundUserFolloversCound = data.followers.length
                // console.log(respons.foundUserFolloversCound);
                resolve(respons)
            })
        })
    },
    unfollow: (UnfollowUserId, userId) => {
        let respons = {}
        return new Promise((resolve, reject) => {
            db.get().collection(collections.USER_COLLECTION).updateOne({ _id: ObjectId(userId) }, {
                $pull: {
                    following: UnfollowUserId
                }
            })
            db.get().collection(collections.USER_COLLECTION).updateOne({ _id: ObjectId(UnfollowUserId) }, {
                $pull: {
                    followers: userId
                }
            })
            db.get().collection(collections.USER_COLLECTION).aggregate([
                {
                    $match: { _id: ObjectId(userId) }
                },
                {
                    $project: {
                        "followers": 1
                    }
                }
            ]).next((err, data) => {
                if (err) throw err
                respons.foundUserFolloversCound = data.followers.length
                // console.log(respons.foundUserFolloversCound);
                resolve(respons)
            })
        })
    },
    // postIgtvPost:()
}
