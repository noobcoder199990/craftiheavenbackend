const { error } = require("./response");
const log = require("./logger");
function jwtVerify(req, res, next) {
  log.info(req.user);
  if (req.user && req.user._id) next();
  else {
    return error(res, 401, "You are not authorised ");
  }
}

module.exports = jwtVerify;
