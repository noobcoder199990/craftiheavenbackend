const { error } = require("./response");
const log = require("./logger");
function issuperadmin(req, res, next) {
  log.debug(req.user);
  if (req.user && req.user._id && req.user.email === "shijo1@yopmail.com") {
    next();
  } else {
    return error(res, 401, "You are not authorised ");
  }
}

module.exports = issuperadmin;
