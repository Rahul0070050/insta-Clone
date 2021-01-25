const collections = require('../config/collections');
var db = require('../config/connection');
var bcrupt = require('bcrypt');
var ObjectId = require('mongodb').ObjectID;
const { reject } = require('bcrypt/promises');
const { resolve } = require('path');
const { response } = require('express');

module.exports = {
    userSignup: (userData) => {
        userData.profile = false
        userData.following = []
        userData.followers = []
        return new Promise(async (resolve, reject) => {
            userData.password = await bcrupt.hash(userData.password, 10)
            db.get().collection(collections.USER_COLLECTION).insertOne(userData).then((data) => {
                let post = {
                    userId: ObjectId(data.ops[0]._id),
                    userPost: [],
                }
                let id = ObjectId(data.ops[0]._id)
                db.get().collection(collections.USER_POST).insertOne({ post, followers: [id] })
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
            db.get().collection(collections.USER_POST).updateOne({ "post.userId": ObjectId(userId) }, {
                $push: {
                    "post.userPost": {
                        time: new Date(),
                        name: userName,
                        img: UserPost.postImg,
                        discription: UserPost.description,
                        comments: []
                    }
                }
            })
            db.get().collection(collections.USER_POST).aggregate([{
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
                $sort: { "post.userPost.time": -1 }
            },
            {
                $project: {
                    userId: "$post.userId",
                    post: "$post.userPost"
                }
            }
            ]).toArray((err, data) => {
                if (err) throw err
                // console.log(data);
                resolve(data)
            })
        })
    },
    uesrPostCound: (userId) => {
        let foundUserAllData = {}
        return new Promise(async (resolve, reject) => {
            db.get().collection(collections.USER_COLLECTION).aggregate([{
                $match: { _id: ObjectId(userId) }
            },
            {
                $project: {
                    _id: 1,
                    MobilorEmail: 1,
                    fullname: 1,
                    username: 1,
                    following: 1,
                    followers: 1,
                    profile: 1
                }
            }
            ]).next((err, data) => {
                if (err) throw err
                foundUserAllData.MobilorEmail = data.MobilorEmail,
                    foundUserAllData.fullname = data.fullname,
                    foundUserAllData.username = data.username,
                    foundUserAllData.following = data.following,
                    foundUserAllData.followers = data.followers,
                    foundUserAllData.userId = data._id,
                    foundUserAllData.profile = data.profile
            })
            db.get().collection(collections.USER_POST).aggregate([{
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
                $sort: { "post.userPost.time": -1 }
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
                // console.log(foundUserAllData);
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
            db.get().collection(collections.USER_POST).aggregate([{
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
                $sort: { "post.userPost.time": -1 }
            },
            {
                $project: {
                    userId: "$post.userId",
                    post: "$post.userPost"
                }
            }
            ]).toArray((err, data) => {
                if (err) throw err
                resolve(data)
            })
        })
    },
    getFriendsPostToUserHomePage: (userId) => {
        let response = {}
        return new Promise(async (resolve, reject) => {
            db.get().collection(collections.USER_COLLECTION).aggregate([{
                $match: { _id: ObjectId(userId) }
            },
            {
                $project: {
                    _id: 0,
                    following: {
                        $size: "$following"
                    }
                }
            }
            ]).next((err, data) => {
                if (err) throw err
                response.friendsCound = data.following
                response.status = true

                if (response.friendsCound == 0) { // problam bigins from heir
                    response.status = false
                }
                if (response.status) {
                    // console.log(response.status);
                    db.get().collection(collections.USER_COLLECTION).aggregate([{
                        $match: { _id: { $ne: ObjectId(userId) } }
                    },
                    { // {{-- who doesn't have your Id. you not following that's user  - }} -finding and showing- the user
                        $match: { followers: { $ne: ObjectId(userId) } }
                    },
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            fullname: 1,
                            profile: 1
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
                    //if case
                    db.get().collection(collections.USER_COLLECTION).aggregate([
                        {
                            $match: {
                                $or: [
                                    { followers: { $all: [ObjectId(userId)] } },
                                    { _id: ObjectId(userId) }
                                ]
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                username: 1,
                                profile: 1
                            }
                        },
                        {
                            $lookup: {
                                from: "posts",
                                localField: "_id",
                                foreignField: "post.userId",
                                as: "post"
                            }
                        },
                        {
                            $unwind: "$post"
                        },
                        {
                            $project: {
                                profile: 1,
                                userId: "$_id",
                                username: "$username",
                                post: "$post.post.userPost",
                            }
                        },
                        {
                            $unwind: "$post"
                        },
                        {
                            $sort: { "post.time": -1 }
                        }
                    ]).toArray((err, data) => {
                        if (err) throw err
                        response.data = data
                        if ((response.data && response.allUsers) || (response.data || response.allUsers)) {
                            resolve(response)
                        }
                    })
                } else {
                    // console.log(response.status);
                    db.get().collection(collections.USER_COLLECTION).aggregate([
                        {
                            $match: { _id: { $ne: ObjectId(userId) } }
                        },
                        { // {{-- who doesn't have your Id. you not following that's user  - }} -finding and showing- the user
                            $match: { followers: { $ne: ObjectId(userId) } }
                        },
                        {
                            $project: {
                                _id: 1,
                                username: 1,
                                fullname: 1,
                                profile: 1
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


                    db.get().collection(collections.USER_COLLECTION).aggregate([
                        // else case
                        {
                            $project: {
                                _id: 1,
                                username: 1,
                                profile: 1
                            }
                        },
                        {
                            $lookup: {
                                from: "posts",
                                localField: "_id",
                                foreignField: "post.userId",
                                as: "post"
                            }
                        },
                        {
                            $unwind: "$post"
                        },
                        {
                            $project: {
                                profile: 1,
                                userId: "$_id",
                                username: "$username",
                                post: "$post.post.userPost",
                            }
                        },
                        {
                            $unwind: "$post"
                        },
                        {
                            $sort: { "post.time": -1 }
                        }
                    ]).toArray((err, data) => {
                        if (err) throw err
                        response.data = data
                        console.log(data);
                        if (response.data && response.allUsers) {
                            resolve(response);
                        }
                    })
                }
            })
        })
    },
    foundUserData: (foundUser, userId) => {
        let foundUserAllData = {}
        return new Promise((resolve, reject) => {
            db.get().collection(collections.USER_COLLECTION).aggregate([{
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
            db.get().collection(collections.USER_COLLECTION).aggregate([{
                $match: { _id: ObjectId(foundUser) }
            },
            {
                $project: {
                    _id: 1,
                    MobilorEmail: 1,
                    fullname: 1,
                    username: 1,
                    following: 1,
                    followers: 1,
                    profile: 1
                }
            }
            ]).next((err, data) => {
                if (err) throw err
                foundUserAllData.MobilorEmail = data.MobilorEmail,
                    foundUserAllData.fullname = data.fullname,
                    foundUserAllData.username = data.username,
                    foundUserAllData.following = data.following,
                    foundUserAllData.followers = data.followers,
                    foundUserAllData.userId = data._id,
                    foundUserAllData.profile = data.profile
            })
            db.get().collection(collections.USER_POST).aggregate([{
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
            db.get().collection(collections.USER_POST).updateOne({ "post.userId": ObjectId(foundUserId) }, {
                $push: {
                    followers: ObjectId(userId)
                }
            })
            db.get().collection(collections.USER_COLLECTION).aggregate([{
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
            db.get().collection(collections.USER_POST).updateOne({ "post.userId": ObjectId(UnfollowUserId) }, {
                $pull: {
                    followers: ObjectId(userId)
                }
            })
            db.get().collection(collections.USER_COLLECTION).aggregate([{
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
            db.get().collection(collections.USER_COLLECTION).aggregate([{
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
                    profile: 1,
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
                console.log(data);
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
            db.get().collection(collections.USER_POST).updateOne({ "post.userId": ObjectId(removeId) }, {
                $pull: {
                    followers: ObjectId(userId)
                }
            })
            db.get().collection(collections.USER_COLLECTION).aggregate([{
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
            db.get().collection(collections.USER_POST).updateOne({ "post.userId": ObjectId(addId) }, {
                $push: {
                    followers: ObjectId(userId)
                }
            })
            db.get().collection(collections.USER_COLLECTION).aggregate([{
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
            db.get().collection(collections.USER_COLLECTION).aggregate([{
                $match: {
                    $and: [
                        { _id: { $ne: ObjectId(userId) } },
                        { followers: { $all: [ObjectId(userId)] } }
                    ]
                }
            },
            {
                $project: {
                    _id: 1,
                    profile: 1,
                    username: 1,
                    "Im_following": { // my friends following me True || False
                        $in: [ObjectId(userId), "$followers"]
                    }
                }
            },
            {
                $sort: { Im_following: 1 }
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
            db.get().collection(collections.USER_COLLECTION).aggregate([{
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
                    profile: 1,
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
    editProfile: (userId) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collections.USER_COLLECTION).findOne({ _id: ObjectId(userId) })
            resolve(user)
        })
    },
    checkPassword: (userId, password) => {
        let response = {}
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collections.USER_COLLECTION).findOne({ _id: ObjectId(userId) })
            bcrupt.compare(password, user.password).then((respons) => {
                if (response) {
                    response.status = true
                } else {
                    response.status = false
                }
                resolve(respons)
            })
        })
    },
    chaingePassword: (userId, newPassword) => {
        return new Promise(async (resolve, reject) => {
            newPassword = await bcrupt.hash(newPassword, 10)
            db.get().collection(collections.USER_COLLECTION).updateOne({ _id: ObjectId(userId) }, {
                $set: {
                    password: newPassword
                }
            }).then((response) => {
                resolve(response)
            })
        })
    },
    profiledit: (userId, userData) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.USER_COLLECTION).updateOne({ _id: ObjectId(userId) }, {
                $set: {
                    fullname: userData.fullnme,
                    MobilorEmail: userData.EmailorPhone,
                }
            }).then((response) => {
                resolve(true)
            })

        })
    },
    uplodeProfile: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.USER_COLLECTION).updateOne({ _id: ObjectId(userId) }, {
                $set: {
                    profile: true
                }
            }).then(() => {
                resolve(true)
            })
        })
    },
    getfoundUserFollowers: (userId, foundUserId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.USER_COLLECTION).aggregate([
                {
                    $match: {
                        following: { $all: [ObjectId(foundUserId)] }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        username: 1,
                        profile: 1,
                        "following_me": { // my friends following me True || False
                            $in: [ObjectId(userId), "$followers"]
                        }
                    }
                },
                {
                    $sort:{following_me:1}
                }
            ]).toArray((err, data) => {
                if (err) throw err
                resolve(data)
            })
        })
    },
    getfoundUserFollowing: (userId, foundUserId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.USER_COLLECTION).aggregate([
                {
                    $match: {
                        followers: { $all: [ObjectId(foundUserId)] }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        username: 1,
                        profile: 1,
                        "following_me": {
                            $in: [ObjectId(userId), "$followers"]
                        }
                    }
                },
                {
                    $sort:{following_me:1}
                }
            ]).toArray((err, data) => {
                if (err) throw err
                resolve(data)
            })
        })
    }
}