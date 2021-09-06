const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: String,
    log: [{
        description: String,
        duration: Number,
        date: Date
    }]
});

module.exports = User = mongoose.model('User', userSchema);