const mongoClient = require('mongodb').MongoClient
const collections = require("./collections")
const state = {
    db:null
}
module.exports.connect = function(done){
    const url = "mongodb://localhost:27017"
    const dbname = collections.DTABASE_NAME

    mongoClient.connect(url,(err,data) => {
        if(err){
            return done(err)
        }else{
            state.db = data.db(dbname)
            done()
        }
    })
}

module.exports.get = function(){
    return state.db
}