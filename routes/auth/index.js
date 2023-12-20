'use strict'

require('dotenv').config()
let jwt = require('jsonwebtoken')
const { Pool, Client } = require("pg")
const bcrypt = require('bcrypt')
const { password } = require('pg/lib/defaults')
const dbAuth = require("../../modules/dbAuth")

const pool = new Pool(dbAuth)

module.exports = async function (fastify, opts) {
  fastify.get('/', async function (request, reply) {
    return 'this is an example'
  })

  fastify.post('/post/refresh-token', async function (request, reply) {
    try {
      const req_login = request.body.login
      const req_password = request.body.password

      const client = await pool.connect()
      const res = await client.query(
        'SELECT password FROM app_user WHERE login=$1',
        [req_login]
      )
      client.release()

      if(res.rows[0] == null)
        throw new Error('Wrong login or password')

      let hash = res.rows[0].password
      
      if(!await bcrypt.compare(req_password, hash))  {
        throw new Error('Wrong login or password')
      }

      const refresh_token = jwt.sign({
        "data": {
          "login": req_login
        }
      }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRESIN })

      return `Bearer ${refresh_token}`
    } catch (err) {
      console.log(err)
      reply.code(500).send(err.message)
    }
  })

  fastify.get('/z', async function (request, reply) {
    try {
      return await bcrypt.hash("password", 10)
    } catch (err) {
      console.log(err)
      reply.code(500).send(err.message)
    }
  })

  fastify.post('/post/access-token', async function (request, reply) {
    try {
      const reqFullToken = request.body.token
      const reqToken = reqFullToken.split(" ")[1]

      jwt.verify(reqToken, process.env.JWT_REFRESH_SECRET, function(err, decoded) {
        if(err != null) {
          throw new Error('Wrong token')
        }

        const access_token = jwt.sign({
          "data": decoded.data
        }, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRESIN })

        reply.send(`Bearer ${access_token}`)
      })
    } catch (err) {
      console.log(err)
      reply.code(500).send(err.message)
    }
  })
}
