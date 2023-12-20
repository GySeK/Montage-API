'use strict'

require('dotenv').config()
const { Pool, Client } = require("pg")
const bcrypt = require('bcrypt')

const prog = async () => {
    try {
        console.log("Start DB create")

        try {
            const client = new Client({
                host: process.env.DB_HOST,
                port: process.env.DB_PORT,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
            })

            await client.connect()
            await client.query("CREATE DATABASE " + process.env.DB_DATABASE)
            await client.end()
            console.log("End DB create")
            console.log()
        } catch (dbErr) {
            throw new Error("Error init db - " + dbErr)
        }

        console.log("Start tables init")
        try {
            const pool = new Pool({
                host: process.env.DB_HOST,
                port: process.env.DB_PORT,
                database: process.env.DB_DATABASE,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
            })

            const client = await pool.connect()

            try {
                await client.query('BEGIN')

                await client.query(
                    "CREATE TABLE IF NOT EXISTS user_role(id SERIAL PRIMARY KEY, role_name VARCHAR(20) NOT NULL, UNIQUE(role_name))"
                )

                await client.query(
                    "INSERT INTO user_role(role_name) VALUES ('admin'), ('moder'), ('montage') ON CONFLICT DO NOTHING"
                )

                await client.query(
                    "CREATE TABLE IF NOT EXISTS app_user (login VARCHAR(30) PRIMARY KEY, role_id INTEGER NOT NULL, first_name VARCHAR(50) NOT NULL, last_name VARCHAR(50) NOT NULL, middle_name VARCHAR(50) NOT NULL, password VARCHAR(100) NOT NULL, FOREIGN KEY (role_id) REFERENCES user_role (id))"
                )

                const hashPassword = await bcrypt.hash("password", parseInt(process.env.BCRYPT_SALT_ROUNDS))

                await client.query(
                    "INSERT INTO app_user (login, role_id, first_name, last_name, middle_name, password) VALUES('Admin', (SELECT id FROM user_role WHERE role_name='admin'), 'Админ', 'Админов', 'Админович', $1) ON CONFLICT DO NOTHING",
                    [hashPassword]
                )

                await client.query(
                    "INSERT INTO app_user (login, role_id, first_name, last_name, middle_name, password) VALUES('Montage', (SELECT id FROM user_role WHERE role_name='montage'), 'Монтажник', 'Монтажниковов', 'Монтажникович', $1) ON CONFLICT DO NOTHING",
                    [hashPassword]
                )

                await client.query(
                    "CREATE TABLE IF NOT EXISTS task (id SERIAL PRIMARY KEY, title VARCHAR(50) NOT NULL, task_description TEXT, creator_login VARCHAR(30) NOT NULL, end_time timestamp with time zone, FOREIGN KEY (creator_login) REFERENCES app_user (login))"
                )

                await client.query(
                    "CREATE TABLE IF NOT EXISTS user_task (id SERIAL PRIMARY KEY, user_login VARCHAR(30) NOT NULL, task_id INTEGER NOT NULL, is_done BOOLEAN DEFAULT FALSE, UNIQUE(user_login, task_id), FOREIGN KEY (user_login) REFERENCES app_user (login) ON DELETE CASCADE)"
                )

                await client.query('COMMIT')

                console.log("End tables init")
            } catch (e) {
                await client.query('ROLLBACK')
                throw e
            } finally {
                client.release()
            }
        } catch (dbErr) {
            throw new Error("Error tables init - " + dbErr)
        }
    } catch (err) {
        console.log(err)
    }
}

prog()
.then()
.finally(() => {
    process.exit()
})