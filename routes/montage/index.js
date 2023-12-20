'use strict'
const { Pool, Client } = require("pg")
const dbAuth = require("../../modules/dbAuth")
const checkAuth = require("../../modules/checkAuth")
const getTokenData = require("../../modules/getTokenData")

const pool = new Pool(dbAuth)

module.exports = async function (fastify, opts) {
  fastify.addHook('preHandler', (request, reply, done) => {
    try {
      checkAuth(request, reply, "montage")
      done()
    } catch (err) {
      console.log(err)
      reply.code(500).send(err.message)
      done()
    }
  })

  fastify.get('/get/name', async function (request, reply) {
    try {
      const tokenData = getTokenData(request)

      const client = await pool.connect()
      const res = await client.query(
        'SELECT first_name, last_name, middle_name FROM app_user WHERE login=$1',
        [tokenData.login]
      )
      client.release()

      return res.rows[0]
    } catch (err) {
      console.log(err)
      reply.code(500).send(err.message)
    }
  })

  fastify.get('/get/task-list', async function (request, reply) {
    try {
      const tokenData = getTokenData(request)

      const client = await pool.connect()
      const res = await client.query(
        'SELECT t.creator_login, ut.id, t.title, t.end_time FROM user_task AS ut, task AS t WHERE ut.task_id=t.id AND user_login=$1 AND is_done=false',
        [tokenData.login]
      )
      client.release()

      return res.rows
    } catch (err) {
      console.log(err)
      reply.code(500).send(err.message)
    }
  })

  fastify.get('/get/task', async function (request, reply) {
    try {
      const utId = request.query.ut_id

      const client = await pool.connect()
      const res = await client.query(
        'SELECT t.title, t.task_description AS description, t.creator_login, t.end_time, ut.is_done FROM task AS t, user_task AS ut WHERE ut.task_id=t.id AND ut.id=$1',
        [utId]
      )
      client.release()

      return res.rows[0]
    } catch (err) {
      console.log(err)
      reply.code(500).send(err.message)
    }
  })

  fastify.put('/put/task/done', async function (request, reply) {
    try {
      const tokenData = getTokenData(request)
      const done = request.body.done
      const id = request.body.id

      const client = await pool.connect()
      await client.query(
        'UPDATE user_task SET is_done=$1 WHERE id=$2 AND user_login=$3',
        [done, id, tokenData.login]
      )
      client.release()

      return 0
    } catch (err) {
      console.log(err)
      reply.code(500).send(err.message)
    }
  })
}
