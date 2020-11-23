// This script file contains authentication code for user registration and login
const router = require('express').Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const db = require('../db')
const {registerValidation, loginValidation} = require('../validation')

// User Registration
router.post('/register', (req, res) => {

    // Validate data before creating new user
    const {error} = registerValidation(req.body)
    if(error) return res.status(400).send(error.details[0].message)
 

    // Check if user already exists in the database
    let sql = `SELECT IF(EXISTS(SELECT * FROM users WHERE email = '${req.body.email}'), 1, 0) AS result`

    db.query(sql, (err, emailExist) => {

        if(err) return res.send(err.message)

        if (emailExist[0].result) return res.status(400).send('Email already exists')

        // Hash the password
        bcrypt.genSalt(10, function(err, salt) {
            bcrypt.hash(req.body.password, salt, function(err, hash) {
                if (err) throw err

                // Check whether entered password entered for password and confirm password input fields are same
                if (req.body.password == req.body.confirmPassword) {
                    const user = {
                        name: req.body.name,
                        email: req.body.email,
                        password: hash
                    }
                    // Store hashed password and Create a new user
                    let sql = 'INSERT INTO users SET ?'
                    db.query(sql, user, (err, _) => {
                        if(err) throw err
                        res.send('Registration successful')
                    })
                }
                else return res.status(400).send('Passwords donot match')
            });
        });
    });    
})

// User login
router.post('/login', (req, res) => {

    // Validate data enetered before authenticating user
    const {error} = loginValidation(req.body)
    if(error) return res.status(400).send(error.details[0].message)

    // Check if user already exists in the database
    let sql = `SELECT user_id, password, IF(EXISTS(SELECT * FROM users WHERE email = '${req.body.email}'), 1, 0) FROM users WHERE email = '${req.body.email}';`
    db.query(sql, (err, user) => {

        if(err) return res.send(err.message)
        
        // Check whether user with entered email id exist
        if(!user.length) return res.status(400).send('Email doesn\'t exist')

        // Check if password entered is correct
        bcrypt.compare(req.body.password, user[0].password, function(err, result) {
            if(!result) return res.status(400).send('Password is incorrect')
            // Create and assign a token
            const token = jwt.sign({status: 'Authentication successful!'}, "process.env.TOKEN_SECRET")
            res.header('auth-token', token).send({_id: user[0].user_id, token: token})
        })
    })
})

module.exports = router