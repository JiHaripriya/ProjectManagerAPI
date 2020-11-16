const mysql = require('mysql')

// Create connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Enter your password here',
    database: 'project_management_system'
});

// Connect to database
connection.connect((err) => {
    if(err) throw err
    console.log('Connection established')
})

module.exports = connection