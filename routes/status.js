const express = require('express')
const router = express.Router()
const Joi = require('joi')
const db = require('../db')
const utils = require('../utils')
const verify = require('./verifyToken')

// Server side validation
const statusReportSchema = Joi.object({
    projectId : Joi.number().required(),
    date : Joi.date().required(),
    resourceName: Joi.string().required(),
    emailId: Joi.string().required(),
    activityType: Joi.string().required(),
    hoursSpent: Joi.string().required(),
    submitDate: Joi.string().required(),
    submitTime: Joi.string().required()
})

router
.route('/')
.get(verify, (req, res) => {
    let sql = `SELECT sr.project_id, sr.date, r.name, r.email_id, sr.activity, sr.hours_spent, sr.posted_on FROM status_report AS sr
               LEFT JOIN project_resource_mapping AS pr ON sr.project_id = pr.project_id 
               LEFT JOIN resources AS r ON sr.resource_id = r.resource_id`;
    
    db.query(sql, (err, results) => {
        // If no such table exisits, ER_NO_SUCH_TABLE is the response
        if(err) return res.send(err.message)

        // List of all Status Reports
        statusReports = results.map(eachReport => {
            return { "projectId": eachReport.project_id, "date": utils.getFullDate(eachReport.date),"resourceName": eachReport.name,
                "emailId": eachReport.email_id, "activityType": eachReport.activity, "hoursSpent": eachReport.hours_spent, "submitDate": utils.getFullDate(eachReport.posted_on), "submitTime": utils.getFullTime(eachReport.posted_on)}
        })

        // Format list of reports to match codebase representation
        // Group resources by project
        const result = statusReports.reduce((groups, current) => {
            groups[current.projectId] = groups[current.projectId] || []
            groups[current.projectId].push(current)
            return groups
        }, {})

        // Extract grouped values as an array
        statusReports = Object.values(result)

        // Remove project_id property from object
        statusReports.forEach(eachProjectStatus => { eachProjectStatus.forEach(eachReport => delete eachReport.projectId)})

        res.send(statusReports)
    })
})
// Post status report
.post(verify, (req, res) => {

    // Get resource id of :email passed
    let sql = `SELECT resource_id FROM resources WHERE email_id='${req.body.emailId}'` 
    db.query(sql, (err, result) => {

        if(err) return res.send(err.message)

        const resourceId = result[0].resource_id
        const validationStatus = statusReportSchema.validate(req.body)
        
        // Handling bad requests
        if(validationStatus.error) return res.status(400).send(validationStatus.error.details.map(errorMsg => errorMsg.message))
        else {

            const statusReport = {
                project_id: req.body.projectId,
                date : req.body.date,
                resource_id: resourceId,
                activity: req.body.activityType,
                hours_spent : req.body.hoursSpent,
                posted_on: `${req.body.submitDate} ${req.body.submitTime}`
            }

            let sql = `INSERT INTO status_report SET ?`
            db.query(sql, statusReport, (err, response) => {
                if(err) return res.send(err.message)
                res.send(response)
            })
        }
    })
})

module.exports = router