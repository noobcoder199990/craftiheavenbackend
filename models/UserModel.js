const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
	first_name: {
		type: String,
		required: true
	},
	last_name: {
		type: String
	},
	email: {
		type: String,
		required: true,
		unique: true,
		index: true
	},
	password: {
		type: String,
	},
}, {
	timestamps: true
});

let userModel = mongoose.models?.user || mongoose.model('user', userSchema);

module.exports = userModel;
