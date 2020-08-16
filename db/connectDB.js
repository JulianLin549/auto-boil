const mongoose = require('mongoose');

//DB Config
//process.env.DATABASE_ATLAS = 'mongodb+srv://' + process.env.DB_USER + ':' + process.env.DB_PWD + '@cluster0.qzive.mongodb.net/<dbname>?retryWrites=true&w=majority'
//process.env.DATABASE = 'mongodb://localhost:27017/acc_activate'


mongoose.connect(process.env.DATABASE_ATLAS, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: true,
        useCreateIndex: true
    })
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err));