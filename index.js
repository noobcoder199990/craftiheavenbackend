const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var { error } = require('./response.js');
const cors = require('cors');
const log = require('./logger/index.js');
const userModel = require('./models/UserModel.js');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static('website'));
app.use(cors({ origin: JSON.parse(process.env.ALLOWED_ORIGINS), credentials: true }));
app.use((req, res, next) => {
	log.debug(req.query);
	if ((req.cookies && req.cookies['jwt']) || (req.headers.authorization != undefined && req.headers.authorization.includes('Bearer '))) {
		let token = req.cookies['jwt'];
		if (req.headers.authorization) {
			token = req.headers.authorization.split('Bearer ')[1];
		}
		jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
			if (err) {
				res.clearCookie('jwt');
				log.debug(err);
				return error(res, 401, 'Unauthorized');
			}
			try {
				let doc = await userModel.findById(decoded.payload).exec();
				if (doc) {
					req.user = doc;
					return next();
				}
				res.clearCookie('jwt');
				// req.headers.authorization = '';
				req.headers.authorization = '';
				req.headers.authorization = '';

				next();
			} catch (err) {
				error(res, 500, 'Internal server error');
			}
		});
	} else {
		next();
	}
});
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on('reconnect', () => {
	log.debug('reconnected with db!');
});

mongoose.connection.on('disconnected', () => {
	log.debug(`DB disconnected ${new Date()}`);
});


module.exports = app;
