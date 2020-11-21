const express = require('express')
const app = express()
const cors = require('cors')
const projectAPI = require('./routes/projects')
const resourceAPI = require('./routes/resources')
const statusReportAPI = require('./routes/status')
const authenticationAPI = require('./routes/auth')

app.use(cors())
app.use(express.json())
app.use('/api/user', authenticationAPI)
app.use('/projects', projectAPI)
app.use('/resources', resourceAPI)
app.use('/status', statusReportAPI)

const port = process.env.PORT || 3000

app.listen(port, (error) => {
    if(error) return console.log(error)
    console.log(`Server started on ${port}`)
})