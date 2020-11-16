const express = require('express')
const app = express()
const projectAPI = require('./routes/projects')
const statusReportAPI = require('./routes/status')

app.use(express.json())
app.use('/projects', projectAPI)
app.use('/status', statusReportAPI)


const port = process.env.PORT || 3000

app.listen(port, (error) => {
    if(error) return console.log(error)
    console.log(`Server started on ${port}`)
})