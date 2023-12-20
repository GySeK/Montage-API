require('dotenv').config()
let jwt = require('jsonwebtoken')

module.exports = (request) => {
    if ("authorization" in request.headers == false)
      throw new Error('No token in headers')
    const auth = request.headers.authorization
    const token = auth.split(" ")[1]

    return jwt.verify(token, process.env.JWT_ACCESS_SECRET, function(err, decoded) {
      if(err != null) {
        throw new Error('Wrong token')
      }

      return decoded.data
    })
}