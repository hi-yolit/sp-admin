const { Client } = require('pg')

const client = new Client({
  user: 'spadmin',
  host: '102.211.29.233',
  database: 'spd',
  password: 'salespath@wesomeNESS99',
  port: 5432,
})

async function testConnection() {
  try {
    await client.connect()
    console.log('Connection successful!')
    const result = await client.query('SELECT NOW()')
    console.log('Query result:', result.rows[0])
  } catch (err) {
    console.error('Connection error:', err)
  } finally {
    await client.end()
  }
}

testConnection()