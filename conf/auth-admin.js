let jwt = require('express-jwt')

const SECRET = process.env.NODE_ENV === 'production' ? process.env.SECRET : 'wtw-cryptowatchtower-2021-!&xf!roland'
const JWT_TOKEN_EXPIRY = 30 * 24 * 60 * 60 * 1000

function getTokenFromHeader(req){
  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
}

const auth = {
  required: jwt({
    secret: SECRET,
    userProperty: 'auth',
    algorithms: ['HS256'],
    getToken: getTokenFromHeader
  }),
  optional: jwt({
    secret: SECRET,
    userProperty: 'auth',
    credentialsRequired: false,
    algorithms: ['HS256'],
    getToken: getTokenFromHeader
  })
};

module.exports = {
  auth,
  SECRET,
  JWT_TOKEN_EXPIRY,
}

