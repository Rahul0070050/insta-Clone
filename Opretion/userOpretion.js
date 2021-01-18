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
                    $project: {
                        _id: 0,
                        post: "$post.userPost"
                    }
                }
            ]).next((err, data) => {
                if (err) throw err
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
                    $project: {
                        _id: 0,
                        post: "$post.userPost"
                    }
                }
            ]).next((err, data) => {
                if (err) throw err
                resolve(data)
            })
        })
    },
    getFriendsPostToUserHomePage: (userId) => {
        let response = {}
        return new Promise(async (resolve, reject) => {
            // let userFriendsPost = await db.get().collection(collections.USER_FRIENDS_POST).findOne({ "post.userId": ObjectId(userId) }) // if user have friends 
            db.get().collection(collections.USER_COLLECTION).aggregate([
                {
                    $match:{_id:ObjectId(userId)}
                },
                {
                    $project:{
                        _id:0,
                        following:{
                            $size:"$following"
                        }
                    }
                }
            ]).next((err,data) => {
                if(err) throw err
                // console.log(data);
                response.friendsCound = data.following
                // response.status = true

                if(response.friendsCound == 123456789){ // problam bigins from heir
                    response.status = false
                }

                if (response.status) {

                    // db.get().collection(collections.USER_COLLECTION).aggregate([
                    //     {
                    //         $match: { _id: { $ne: ObjectId(userId) } }
                    //     },
                    //     {   // {{-- who doesn't have your Id. you not following that's user  - }} -finding and showing- the user
                    //         $match: { followers: { $ne: ObjectId(userId) } }
                    //     },
                    //     {
                    //         $project: {
                    //             _id: 1,
                    //             username: 1,
                    //             fullname: 1
                    //         }
                    //     },
                    //     {
                    //         $limit: 4
                    //     }
                    // ]).toArray((err, data) => {
                    //     if (err) throw err
                    //     //storing you not followed users
                    //     response.allUsers = data
                    // })

                    // db.get().collection(collections.USER_COLLECTION).aggregate([
                    //     {
                    //         $match:{_id:ObjectId(userId)}
                    //     },
                    //     {
                    //         $project:{
                    //             _id:0,
                    //             following:1
                    //         }
                    //     }
                    // ]).next((err,data) => {
                    //     if(err) throw err
                    //     console.log(data.following);
                    //     response.following = data.following
                        
                    //     db.get().collection(collections.USER_POST).aggregate([
                    //         {
                    //             $unwind:response.following
                    //         }
                    //     ]).toArray((err,data) => {
                    //         if(err) throw err
                    //         console.log(data);
                    //     })
                    // })

                    

                } else {
                    console.log(response.status);
                    db.get().collection(collections.USER_COLLECTION).aggregate([
                        {
                            $match: { _id: { $ne: ObjectId(userId) } }
                        },
                        {   // {{-- who doesn't have your Id. you not following that's user  - }} -finding and showing- the user
                            $match: { followers: { $ne: ObjectId(userId) } }
                        },
                        {
                            $project: {
                                _id: 1,
                                username: 1,
                                fullname: 1
                            }
                        },
                        {
                            $limit: 4
                        }
                    ]).toArray((err, data) => {
                        if (err) throw err
                        //storing you not followed users
                        response.allUsers = data
                    })


                    db.get().collection(collections.USER_POST).aggregate([
                    // get friends post and display here
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
                        if (response.data && response.allUsers) {
                            resolve(response)
                        }
                    })
                }
            })
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
                        "AllReadyFriend": {
                            $in: [ObjectId(userId), "$followers"]
                        }
                    }
                }
            ]).next((err, data) => {
                if (err) throw err
                foundUserAllData.friend = data.AllReadyFriend
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
        return new Promise(async (resolve, reject) => {
            db.get().collection(collections.USER_COLLECTION).updateOne({ _id: ObjectId(userId) }, {
                $push: {
                    following: ObjectId(foundUserId)
                }
            })
            db.get().collection(collections.USER_COLLECTION).updateOne({ _id: ObjectId(foundUserId) }, {
                $push: {
                    followers: ObjectId(userId)
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
                let cound = data.followers
                resolve(cound)
            })
        })
    },
    unfollow: (UnfollowUserId, userId) => {
        let respons = {}
        return new Promise((resolve, reject) => {
            db.get().collection(collections.USER_COLLECTION).updateOne({ _id: ObjectId(userId) }, {
                $pull: {
                    following: ObjectId(UnfollowUserId)
                }
            })
            db.get().collection(collections.USER_COLLECTION).updateOne({ _id: ObjectId(UnfollowUserId) }, {
                $pull: {
                    followers: ObjectId(userId)
                }
            })
            db.get().collection(collections.USER_COLLECTION).aggregate([
                {
                    $match: { _id: ObjectId(UnfollowUserId) }
                },
                {
                    $project: {
                        "followers": 1
                    }
                }
            ]).next((err, data) => {
                if (err) throw err
                let cound = data.followers
                resolve(cound)
            })
        })
    },
    getFollowers: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.USER_COLLECTION).aggregate([
                {
                    $match: {
                        $and: [
                            { _id: { $ne: ObjectId(userId) } },
                            // the '$all' proparty gives you all the array matching document //
                            { following: { $all: [ObjectId(userId)] } }
                        ]
                    }
                },
                {
                    $project: {
                        _id: 1,
                        username: 1,
                        "Im_following": { // my friends following me True || False
                            $in: [ObjectId(userId), "$followers"]
                        }
                    }
                },
                {
                    $sort: { "Im_following": -1 }
                }
            ]).toArray((err, data) => {
                if (err) throw err
                resolve(data)
            })
        })
    },
    removeFroundFromUserPanul: (removeId, userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.USER_COLLECTION).updateOne({ _id: ObjectId(userId) }, {
                $pull: {
                    following: ObjectId(removeId)
                }
            })
            db.get().collection(collections.USER_COLLECTION).updateOne({ _id: ObjectId(removeId) }, {
                $pull: {
                    followers: ObjectId(userId)
                }
            })
            db.get().collection(collections.USER_COLLECTION).aggregate([
                {
                    $match: { _id: ObjectId(userId) }
                },
                {
                    $project: {
                        _id: 0,
                        following: 1
                    }
                }
            ]).next((err, data) => {
                if (err) throw err
                let cound = data.following
                resolve(cound)
            })
        })
    },
    addFriendFromUserPanul: (addId, userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.USER_COLLECTION).updateOne({ _id: ObjectId(userId) }, {
                $push: {
                    following: ObjectId(addId)
                }
            })
            db.get().collection(collections.USER_COLLECTION).updateOne({ _id: ObjectId(addId) }, {
                $push: {
                    followers: ObjectId(userId)
                }
            })
            db.get().collection(collections.USER_COLLECTION).aggregate([
                {
                    $match: { _id: ObjectId(userId) }
                },
                {
                    $project: {
                        following: 1
                    }
                }
            ]).next((err, data) => {
                if (err) throw err
                let cound = data.following
                resolve(cound)
            })
        })
    },
    getFollowing: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.USER_COLLECTION).aggregate([
                {
                    $match: {
                        $and: [
                            { _id: { $ne: ObjectId(userId) } },
                            { followers: { $all: [ ObjectId(userId) ]} }
                        ]
                    }
                },
                {
                    $project: {
                        _id: 1,
                        username: 1,
                        "Im_following": { // my friends following me True || False
                            $in: [ObjectId(userId), "$followers"]
                        }
                    }
                },
                {
                    $sort:{Im_following:1}
                }
            ]).toArray((err, data) => {
                if (err) throw err
                resolve(data)
            })
        })
    },
    removeFromFllovers: (deleteId, userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.USER_COLLECTION).updateOne({ _id: ObjectId(userId) }, {
                $pull: {
                    followers: ObjectId(deleteId)
                }
            })
            db.get().collection(collections.USER_COLLECTION).updateOne({ _id: ObjectId(deleteId) }, {
                $pull: {
                    following: ObjectId(userId)
                }
            })
            db.get().collection(collections.USER_COLLECTION).aggregate([
                {
                    $match: {
                        $and: [
                            { _id: { $ne: ObjectId(userId) } },
                            // the '$all' proparty gives you all the array matching document //
                            { following: { $all: [ObjectId(userId)] } }
                        ]
                    }
                },
                {
                    $project: {
                        _id: 1,
                        username: 1,
                        "Im_following": { // my friends following me True || False
                            $in: [ObjectId(userId), "$followers"]
                        }
                    }
                },
                {
                    $sort: { "Im_following": -1 }
                }
            ]).toArray((err, data) => {
                if (err) throw err
                resolve(data)
            })
        })
    }
}