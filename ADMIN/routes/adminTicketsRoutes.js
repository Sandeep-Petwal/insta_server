const express = require('express');
const { getAllIssues, getIssue } = require('../controller/ticketsController');
const adminTicketsRoutes = express.Router();
const { authentication } = require('../middleware/adminAuth');


// get all issues
adminTicketsRoutes.get("/get-all", authentication, getAllIssues);

// get single issue
adminTicketsRoutes.get("/get-issue/:id", authentication, getIssue);


module.exports = adminTicketsRoutes