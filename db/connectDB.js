const mongoose = require('mongoose');

//DB Config
//db = 'mongodb+srv://' + process.env.DB_USER + ':' + process.env.DB_PWD + '@cluster0.qzive.mongodb.net/<dbname>?retryWrites=true&w=majority'
db = 'mongodb://localhost:27017/acc_activate'


mongoose.connect(process.env.DATABASE, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: true,
        useCreateIndex: true
    })
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err));