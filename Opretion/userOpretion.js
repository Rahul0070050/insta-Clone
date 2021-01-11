const collections = require('../config/collections');
var db = require('../config/connection');
var bcrupt = require('bcrypt');
var ObjectId = require('mongodb').ObjectID;
const { reject } = require('bcrypt/promises');
const { resolve } = require('path');

module.exports = {
    usserSignup: (userData) => {
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
        console.log(userName);
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
                                discription: UserPost.postDescription,
                            }
                        }
                    }
                ).then(() => {
                    resolve()
                })
            } else {
                let post = {
                    userId: ObjectId(userId),
                    userPost: [
                        {
                            time: new Date(),
                            name: userName,
                            img: UserPost.postImg,
                            discription: UserPost.postDescription
                        }
                    ]
                }
                db.get().collection(collections.USER_POST).insertOne({ post }).then((respomse) => {
                    resolve()
                })
            }
        })
    },
    postIgtvPost: (userData, userId) => {
        return new Promise((req, res) => {
            console.log(userData, userId);
            let igPost = db.get().collection(collections.USSER_IG_POST)
        })
    },
    uesrPostCound: (userId) => {
        return new Promise(async (resolve, reject) => {
            let userPost = await db.get().collection(collections.USER_POST).findOne({ "post.userId": ObjectId(userId) })
            if (userPost) {
                db.get().collection(collections.USER_POST).aggregate([
                    {
                        $match: { "post.userId": ObjectId(userId) }
                    }
                ]).next((err, data) => {
                    if (err) throw err
                    resolve(data)
                })
            } else {
                resolve(false)
            }
        })
    },
    deletUserPOst: (deletItemIdentifire, userId) => {
        return new Promise((resolve, reject) => {
            //mongoDb deleting "Array of Object"
            db.get().collection(collections.USER_POST).update({ "post.userId": ObjectId(userId) }, {
                //mongoDB removing a Object from Array using "$pull"
                $pull: { "post.userPost": { "img": deletItemIdentifire } }
            }).then((respomse) => {
                resolve()
            })
        })
    },
    getFriendsPostToUserHomePage: (userId) => {
        return new Promise(async (resolve, reject) => {
            let userFriendsPost = await db.get().collection(collections.USER_FRIENDS_POST).findOne({ "post.userId": ObjectId(userId) })
            if (userFriendsPost) {

            } else {
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
                    console.log(data);
                    resolve(data)
                })
            }
        })
    },
    findUserPostCound: (userId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collections.USER_POST).aggregate([
                {
                    $match: { "post.userId": ObjectId(userId) }
                },
                {
                    $project: {
                        _id: 0,
                        userId: "$post.userId",
                        post: "$post.userPost"
                    }
                }
            ]).toArray((err, data) => {
                if (err) throw err
                resolve(data)
            })
        })
    }
}
