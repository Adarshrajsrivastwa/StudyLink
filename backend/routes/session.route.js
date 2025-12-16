const express = require("express");
const router = express.Router();
const {
  createSession,
  getMySessions,
  getCourseSessions,
  getStudentSessions,
  joinSession,
  updateSession,
  deleteSession,
} = require("../controllers/session.controller");
const { authenticate } = require("../middlewares/auth");

// Mentor routes
router.post("/", authenticate, createSession);
router.get("/my", authenticate, getMySessions);
router.put("/:sessionId", authenticate, updateSession);
router.delete("/:sessionId", authenticate, deleteSession);

// Student routes
router.get("/student/my", authenticate, getStudentSessions);
router.post("/join", authenticate, joinSession);

// Course sessions (public for enrolled students)
router.get("/course/:courseId", authenticate, getCourseSessions);

module.exports = router;


