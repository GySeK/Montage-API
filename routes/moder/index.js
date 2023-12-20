'use strict'
const { Pool, Client } = require("pg")
const dbAuth = require("../../modules/dbAuth")
const checkAuth = require("../../modules/checkAuth")
const getTokenData = require("../../modules/getTokenData")

const pool = new Pool(dbAuth)

module.exports = async function (fastify, opts) {
  fastify.addHook('preHandler', (request, reply, done) => {
    try {
      checkAuth(request, reply, "moder")
      done()
    } catch (err) {
      console.log(err)
      reply.code(500).send(err.message)
      done()
    }
  })

  fastify.post('/post/task', async function (request, reply) {
    try {
      const tokenData = getTokenData(request)
      console.log(tokenData.login)

      const title = request.body.title
      const description = request.body.description

      let endTime = null
      if(request.body.hasOwnProperty('end_time'))
        endTime = request.body.end_time


      const client = await pool.connect()
      await client.query(
        'INSERT INTO task(title, task_description, creator_login, end_time) VALUES($1, $2, $3, $4)',
        [title, description, tokenData.login, endTime]
      )
      client.release()

      return 0
    } catch (err) {
      console.log(err)
      reply.code(500).send(err.message)
    }
  })

  fastify.delete('/delete/task', async function (request, reply) {
    try {
      const tokenData = getTokenData(request)
      const id = request.body.id

      const client = await pool.connect()
      const res = await client.query('DELETE FROM task WHERE id=$1 AND creator_login=$2',
      [id, tokenData.login]
      )
      client.release()

      return 0
    } catch (err) {
      console.log(err)
      reply.code(500).send(err.message)
    }
  })

  fastify.post('/post/user-task', async function (request, reply) {
    try {
      const tokenData = getTokenData(request)

      const userLogin = request.body.user_login
      const taskId = request.body.task_id

      const client = await pool.connect()
 
      try {
        await client.query('BEGIN')
        const res = await client.query(
          'SELECT EXISTS(SELECT * FROM task WHERE creator_login=$1 AND id=$2)', 
          [tokenData.login, taskId]
        )

        console.log(res.rows[0])

        if(!res.rows[0].exists)
          throw new Error("Wrong task")

        await client.query(
          'INSERT INTO user_task(user_login, task_id) VALUES($1, $2)',
          [userLogin, taskId])
        await client.query('COMMIT')
      } catch (e) {
        await client.query('ROLLBACK')
        throw e
      } finally {
        client.release()
      }

      return 0
    } catch (err) {
      console.log(err)
      reply.code(500).send(err.message)
    }
  })

  fastify.delete('/delete/user-task', async function (request, reply) {
    try {
      const tokenData = getTokenData(request)
      const id = request.body.id

      const client = await pool.connect()

      try {
        await client.query('BEGIN')
        const res = await client.query(
          'SELECT EXISTS(SELECT * FROM task WHERE creator_login=$1 AND id=(SELECT task_id FROM user_task WHERE id=$2))', 
          [tokenData.login, id]
        )

        console.log(res.rows[0])

        if(!res.rows[0].exists)
          throw new Error("Wrong task")

        await client.query(
          'DELETE FROM user_task WHERE id=$1',
          [id])
        await client.query('COMMIT')
      } catch (e) {
        await client.query('ROLLBACK')
        throw e
      } finally {
        client.release()
      }

      return 0
    } catch (err) {
      console.log(err)
      reply.code(500).send(err.message)
    }
  })
}
