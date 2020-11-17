const express = require('express');
const router = express.Router();
const db = require('../db');

router
    .route('/')
    .get((req, res) => {
        let sql = 'SELECT r.resource_id AS id, project_id, name, email_id AS email, billable, rate_per_hour FROM project_resource_mapping AS pr JOIN resources AS r WHERE pr.resource_id = r.resource_id;';
        let query = db.query(sql, (err, results) => {
            if (err) return res.send(err.message);
            else {
                results.forEach(resource => {
                    if(resource.billable == 1) resource.billable = 'True'
                    else resource.billable = 'False'
                })
                console.log(results)
                res.send(JSON.stringify(results));
            }
        });
    })
    .post((req, res) => {
        const postObj = req.body;
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
                                res.send(allocateResourceToProject(result[0].resource_id, postObj));
                            }
                        });
                    }
                });
            } else {
                // Resource with given email id exists in resources table.
                res.send(allocateResourceToProject(result[0].resource_id, postObj));
            }
        });
    })
    .put((req, res) => {
        const putObj = req.body;
        let sql = `UPDATE project_resource_mapping AS prm JOIN resources AS r ON prm.resource_id = r.resource_id SET billable = ${putObj.billable}, rate_per_hour = ${putObj.rate_per_hour} WHERE project_id = ${putObj.project_id} AND email_id = '${putObj.email}';`;
        let query = db.query(sql, (err, result) => {
            if (err) return res.send(err.message);
            else res.send(result);
        });
    })
    .delete((req, res) => {
        const deleteObj = req.body;
        let sql = `DELETE prm FROM project_resource_mapping AS prm JOIN resources AS r ON prm.resource_id = r.resource_id WHERE project_id = ${deleteObj.project_id} AND email_id = '${deleteObj.email}';`;
        let query = db.query(sql, (err, result) => {
            if (err) return res.send(err.message);
            else res.send(result);
        });
    });

function allocateResourceToProject(id, postObj) {
    // Insert into project_resource_mapping table.
    const sql = `INSERT INTO project_resource_mapping VALUES (${postObj.project_id}, ${id}, ${postObj.billable}, ${postObj.rate_per_hour});`;
    const query = db.query(sql, (err, result) => {
        if (err) return res.send(err.message);
        else return result;
    });
}

module.exports = router;