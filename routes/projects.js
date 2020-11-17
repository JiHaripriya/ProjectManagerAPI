const express = require('express')
const router = express.Router()
const Joi = require('joi')
const db = require('../db')
const utils = require('../utils')

// Server side validation
const projectDetailsSchema = Joi.object({
    project_name: Joi.string().max(150).required(),
    project_desc: Joi.string().max(201).pattern(new RegExp('^[a-zA-Z .]*$')).required(),
    percentage_complete: Joi.number().min(0).max(100).required(),
    start_date: Joi.date().required(),
    end_date: Joi.date().min(Joi.ref('start_date')).required(),
    tech_used: Joi.array()
})

router
.route('/')
.get((req, res) => {
    let sql = 'SELECT project_id as id, name as project_name, description as project_desc, percent as percentage_complete, start_date, end_date FROM projects';
    db.query(sql, (err, results) => {
        if(err) return res.send(err.message)

        let sql = `SELECT project_id, GROUP_CONCAT(technology_name) as technologies FROM project_technology_mapping GROUP BY project_id`
        db.query(sql, (err, technologyMapping) => {
            projects = results.map(eachProject => {
                eachProject.start_date = utils.getFullDate(eachProject.start_date), eachProject.end_date = utils.getFullDate(eachProject.end_date)
                eachProject["tech_used"] = technologyMapping[eachProject.id - 1] ? technologyMapping[eachProject.id - 1].technologies.split(',') : []
                return eachProject
            })
            res.send(projects)
        })
    })
})
.post((req, res) => {
    const {tech_used , ...projectDetails} = req.body
    const validationStatus = projectDetailsSchema.validate(req.body)
    // Handling bad requests
    if(validationStatus.error) return res.status(400).send(validationStatus.error.details.map(errorMsg => errorMsg.message))
    else {
        let sql = `INSERT INTO projects SET ?`
        db.query(sql, renameProjectObject(projectDetails), (err, result) => {
            if(err) throw err
            res.send(result)
        })
        let query = `SELECT project_id FROM projects WHERE name='${req.body.project_name}'`
        db.query(query, (err, result) => setTechnologyProjectMapping(tech_used, result[0].project_id))
    }
})

router
.route("/:id")
.put((req, res) => {
    const {tech_used , ...projectDetails} = req.body
    const validationStatus = projectDetailsSchema.validate(req.body)
    if(validationStatus.error) return res.status(400).send(validationStatus.error.details.map(errorMsg => errorMsg.message))
    else {
        let sql = `UPDATE projects SET ? WHERE project_id=${req.params.id}`
        db.query(sql, renameProjectObject(projectDetails), (err, result) => {
            if(err) throw err
            res.send(result)
        })
        
        // Remove previously entered technology list to update
        let query = `DELETE FROM project_technology_mapping WHERE project_id=${req.params.id}`
        db.query(query, (err, result) => {if(err) throw err})
        setTechnologyProjectMapping(req.body.tech_used, req.params.id)
    }
})

function renameProjectObject(parameters) {
    return {name: parameters.project_name, description: parameters.project_desc, percent: parameters.percentage_complete, start_date: parameters.start_date, end_date: parameters.end_date,}
}

function setTechnologyProjectMapping(technologyArray, projectId) {
    technologyArray.forEach(technology => {
        let sql = `INSERT INTO project_technology_mapping SET  ?`
        db.query(sql, {project_id: projectId, technology_name: technology}, (err, result) => {
            if(err) throw err
        })
    })
}

module.exports = router