// Validation for User credentials
const Joi = require('joi')

// Register validation
const registerValidation = (requestBodyData) => {
    const schema = Joi.object({
        name: Joi.string().min(6).max(255).required(),
        email: Joi.string().min(6).max(255).required().email(),
        password: Joi.string().min(8).required(),
        confirmPassword: Joi.string().min(8).equal(Joi.ref("password")).required()
    })

    // Validate data before creating new user
    return schema.validate(requestBodyData)
}

// Login validation
const loginValidation = (requestBodyData) => {
    const schema = Joi.object({
        email: Joi.string().min(6).max(255).required().email(),
        password: Joi.string().min(8).required()
    })

    // Validate data before creating new user
    return schema.validate(requestBodyData)
}

module.exports.registerValidation = registerValidation
module.exports.loginValidation = loginValidation