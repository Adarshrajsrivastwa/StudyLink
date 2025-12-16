const express = require("express");
const router = express.Router();
const { getPublicCommunities } = require("../controllers/admin.controller");

// Public route - get active communities for students and mentors
router.get("/", getPublicCommunities);

module.exports = router;

