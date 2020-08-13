module.exports = {
    MongoURI: 'mongodb+srv://' + process.env.DB_USER + ':' + process.env.DB_PWD + '@cluster0.qzive.mongodb.net/<dbname>?retryWrites=true&w=majority'
}