require('dotenv').config()
let jwt = require('jsonwebtoken')
const { Pool, Client } = require("pg")
const dbAuth = require("./dbAuth")

const checkAuth = (roles, requiredRole, role) => {
    if(!Object.hasOwn(roles, requiredRole))
      return false

    if(!Object.hasOwn(roles, role))
      return false

    if(requiredRole === role) 
      return true

    for(let possibleRole of roles[requiredRole]) {
      if(possibleRole === role)
        return true
    }

    return false
}

const authRoles = {
    "admin": [],
    "moder": ["admin"],
    "montage": ["moder", "admin"]
}

module.exports = async (request, reply, requiredRole = null) => {
    if ("authorization" in request.headers == false) {
        reply
            .code(401)
            .send("Token not found")

        return
    }
    const auth = request.headers.authorization
    const token = auth.split(" ")[1]
    
    jwt.verify(token, process.env.JWT_ACCESS_SECRET, async function(err, decoded) {
        try {
            if(err != null)
                throw new Error('Wrong token')

            if(requiredRole == null)
                return

            const login = decoded.data.login

            const client = new Client(dbAuth)
            await client.connect()
            const res = await client.query(
                'SELECT role_name FROM user_role WHERE id=(SELECT role_id FROM app_user WHERE login=$1)',
                [login]
            )
            await client.end()

            const role = res.rows[0].role_name
            if(!checkAuth(authRoles, requiredRole, role))
                throw new Error('Wrong role')
        } catch (err) {
            console.log(err)
            reply.code(500).send(err.message)
        }
    })
}