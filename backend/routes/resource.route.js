const express = require("express");
const router = express.Router();
const {
  getAllResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  getMyPurchases,
  getMyResources,
} = require("../controllers/resource.controller");
const { createOrder, verifyPayment } = require("../controllers/payment.controller");
const { authenticate } = require("../middlewares/auth");

const upload = require("../middlewares/upload");

// Public routes
router.get("/", getAllResources);

// Protected routes - MUST come before /:id route to avoid route conflicts
router.get("/my/purchases", authenticate, getMyPurchases);
router.get("/my", authenticate, getMyResources);

// Public route for single resource (must come after /my routes)
router.get("/:id", getResourceById);
router.post("/", authenticate, upload.single("thumbnail"), createResource);
router.put("/:id", authenticate, upload.single("thumbnail"), updateResource);
router.delete("/:id", authenticate, deleteResource);

// Payment routes
router.post("/purchase/create-order", authenticate, createOrder);
router.post("/purchase/verify", authenticate, verifyPayment);

// Course payment routes (using same controllers)
const { createCourseOrder } = require("../controllers/payment.controller");
router.post("/course/create-order", authenticate, createCourseOrder);

module.exports = router;

