const { validationResult } = require('express-validator');  

function success(res, result = 'OK', status = 200) {
	res.status(status).json({ status: status, success: true, response: result });
}

function error(res, status = 500, error = 'Some internal server error occurred') {
	res.status(status).json({ status: status, success: false, response: error });
}

function checkPermission(action, possession, resource) {
	return (req, res, next) => {
		 
		if (!permission.granted) {
			return error(res, 403, 'Oops! are not authorized, please contact site admin.');
		}
		req.filterData = permission.filter;
		next();
	};
}

function checkError(req, res, next) {
	const errors = validationResult(req);
    
	// log.debug(errors);
     
	if (!errors.isEmpty()) { 
		return error(res, 422, errors.array()[0].msg || 'invalid parameters');
	}

	next();
}

function checkDisabled(req, res, next) {
	if (req.user.disabled) return error(res, 400, 'Your account has been disabled. Please contact support.');
	next();
}

function checkAdmin(req, res, next) {
	if (req.user && req.user.admin) {
		return next();
	}
	return error(res, 403, 'You are not authorized to perform this action');
}

module.exports = { success, error, checkError, checkDisabled, checkAdmin, checkPermission };
