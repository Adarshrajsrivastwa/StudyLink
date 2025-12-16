const express = require("express");
const router = express.Router();
const {
  getAllMentors,
  getMyCourses,
  getMyConversations,
  getMyEarnings,
  getMyStudents,
} = require("../controllers/mentor.controller");
const { authenticate } = require("../middlewares/auth");

// Public route to get all mentors
router.get("/", getAllMentors);

// Protected routes - mentor dashboard
router.use(authenticate);

router.get("/my/courses", getMyCourses);
router.get("/my/conversations", getMyConversations);
router.get("/my/earnings", getMyEarnings);
router.get("/my/students", getMyStudents);

module.exports = router;
