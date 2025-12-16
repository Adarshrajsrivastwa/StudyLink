const express = require("express");
const router = express.Router();
const {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollInCourse,
  getMyCourses,
  updateLessonProgress,
} = require("../controllers/course.controller");
const { authenticate } = require("../middlewares/auth");
const upload = require("../middlewares/upload");

// Public routes
router.get("/", getAllCourses);
router.get("/:id", getCourseById);

// Protected routes
router.post("/", authenticate, upload.single("thumbnail"), createCourse);
router.put("/:id", authenticate, upload.single("thumbnail"), updateCourse);
router.delete("/:id", authenticate, deleteCourse);
router.post("/enroll", authenticate, enrollInCourse);
router.get("/my/enrollments", authenticate, getMyCourses);
router.post("/progress", authenticate, updateLessonProgress);

module.exports = router;


