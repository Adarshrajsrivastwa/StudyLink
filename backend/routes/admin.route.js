const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getAllMentors,
  getAllCourses,
  getAllResources,
  getAllSessions,
  getAllCommunities,
  getPublicCommunities,
  createCommunity,
  updateCommunity,
  deleteCommunity,
  deleteUser,
  updateUserRole,
  getDashboardStats,
  deleteCourse,
  deleteResource,
  deleteSession,
  updateCourse,
  updateResource,
} = require("../controllers/admin.controller");
const { authenticate } = require("../middlewares/auth");
const upload = require("../middlewares/upload");

// All routes require authentication
router.use(authenticate);

// Dashboard stats
router.get("/stats", getDashboardStats);

// Users
router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUser);
router.put("/users/:id/role", updateUserRole);

// Mentors
router.get("/mentors", getAllMentors);

// Courses
router.get("/courses", getAllCourses);
router.put("/courses/:id", upload.single("thumbnail"), updateCourse);
router.delete("/courses/:id", deleteCourse);

// Resources
router.get("/resources", getAllResources);
router.put("/resources/:id", upload.single("thumbnail"), updateResource);
router.delete("/resources/:id", deleteResource);

// Sessions
router.get("/sessions", getAllSessions);
router.delete("/sessions/:id", deleteSession);

// Communities
router.get("/communities", getAllCommunities);
router.post("/communities", upload.single("thumbnail"), createCommunity);
router.put("/communities/:id", upload.single("thumbnail"), updateCommunity);
router.delete("/communities/:id", deleteCommunity);

module.exports = router;

