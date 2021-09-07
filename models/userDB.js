const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: String,
    log: [{
        description: {
          type: String,
          required: true
        },
        duration: {
          type: Number,
          required: true
        },
        date: {
          type: Date,
          required: true
        }
    }]
});

module.exports = User = mongoose.model('User', userSchema);