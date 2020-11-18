const express = require('express');
const router = express.Router();
const joi = require('joi');
const db = require('../db');

// Server side validation
const resourceDetailsSchema = joi.object({
    id: joi.number().required(),
    project_id: joi.number().required(),
    name: joi.string().max(100).pattern(new RegExp('^[a-zA-Z .]*$')).required(),
    email: joi.string().max(100).pattern(new RegExp('^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$')).required(),
    billable: joi.string().valid('True', 'False').required(),
    rate_per_hour: joi.number().min(0).required()
});

router
    .route('/')
    .get((req, res) => {
        let sql = 'SELECT r.resource_id AS id, project_id, name, email_id AS email, billable, rate_per_hour FROM project_resource_mapping AS pr JOIN resources AS r WHERE pr.resource_id = r.resource_id;';
        let query = db.query(sql, (err, results) => {
            if (err) return res.send(err.message);
            else {
                results.forEach(resource => {
                    if (resource.billable == 1) resource.billable = 'True'
                    else resource.billable = 'False'
                })
                res.send(JSON.stringify(results));
            }
        });
    })
    .post((req, res) => {
        const postObj = req.body;
        postObj.rate_per_hour = postObj.billable === 'False' ? 0 : postObj.rate_per_hour;
        const validationStatus = resourceDetailsSchema.validate(postObj);
        // Handling bad requests
        if (validationStatus.error) {
            console.log(validationStatus.error)
            return res.status(400).send(validationStatus.error.details.map(errorMsg => errorMsg.message));
        }
        else {
            const sql = `SELECT resource_id FROM resources WHERE email_id = '${postObj.email}';`;
            const query = db.query(sql, (err, result) => {
                if (err) return res.send(err.message);
                else if (!result.length) { // Resource with given email id does not exist in resources table. So insert into table. 
                    const sql = `INSERT INTO resources (name, email_id) VALUES ('${postObj.name}', '${postObj.email}');`;
                    const query = db.query(sql, (err, _) => {
                        if (err) return res.send(err.message);
                        else {
                            // Get resource_id of resource with given email id.
                            const sql = `SELECT resource_id FROM resources WHERE email_id = '${postObj.email}';`;
                            const query = db.query(sql, (err, result) => {
                                if (err) return res.send(err.message);
                                else {
                                    const id = result[0].resource_id;
                                    const sql = `INSERT INTO project_resource_mapping VALUES (${postObj.project_id}, ${id}, ${postObj.billable}, ${postObj.rate_per_hour});`;
                                    const query = db.query(sql, (err, result) => {
                                        if (err) throw err;
                                        else res.send(result);
                                    });
                                }
                            });
                        }
                    });
                } else {
                    // Resource with given email id exists in resources table.
                    const id = result[0].resource_id;
                    const sql = `INSERT INTO project_resource_mapping VALUES (${postObj.project_id}, ${id}, ${postObj.billable}, ${postObj.rate_per_hour});`;
                    const query = db.query(sql, (err, result) => {
                        if (err) throw err;
                        else res.send(result);
                    });
                }
            });
        }
    })
    .put((req, res) => {
        const putObj = req.body;
        const validationStatus = resourceDetailsSchema.validate(putObj);
        // Handling bad requests
        if (validationStatus.error) return res.status(400).send(validationStatus.error.details.map(errorMsg => errorMsg.message));
        else {
            let sql = `UPDATE project_resource_mapping AS prm JOIN resources AS r ON prm.resource_id = r.resource_id SET billable = ${putObj.billable}, rate_per_hour = ${putObj.rate_per_hour} WHERE project_id = ${putObj.project_id} AND email_id = '${putObj.email}';`;
            let query = db.query(sql, (err, result) => {
                if (err) return res.send(err.message);
                else res.send(result);
            });
        }
    })
    .delete((req, res) => {
        const deleteObj = req.body;
        const validationStatus = resourceDetailsSchema.validate(deleteObj);
        // Handling bad requests
        if (validationStatus.error) return res.status(400).send(validationStatus.error.details.map(errorMsg => errorMsg.message));
        else {
            let sql = `DELETE prm FROM project_resource_mapping AS prm JOIN resources AS r ON prm.resource_id = r.resource_id WHERE project_id = ${deleteObj.project_id} AND email_id = '${deleteObj.email}';`;
            let query = db.query(sql, (err, result) => {
                if (err) return res.send(err.message);
                else res.send(result);
            });
        }
    });

module.exports = router;