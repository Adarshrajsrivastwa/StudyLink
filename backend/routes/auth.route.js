const express = require("express");
const router = express.Router();
const { login, register, getProfile, updateProfile, deleteProfilePicture } = require("../controllers/auth.controller");
const { authenticate } = require("../middlewares/auth");
const upload = require("../middlewares/upload");

router.post("/login", login);
router.post("/register", register);
router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, upload.single("photo"), updateProfile);
router.delete("/profile/picture", authenticate, deleteProfilePicture);

module.exports = router;
