const express = require("express");
const router = express.Router();
const {
  getDiscordInviteLink,
  updateDiscordInviteLink,
  getAllSettings,
} = require("../controllers/settings.controller");
const { authenticate } = require("../middlewares/auth");

// Public route - get Discord invite link
router.get("/discord-invite", getDiscordInviteLink);

// Protected routes - admin only
router.use(authenticate);

// Update Discord invite link (admin only)
router.put("/discord-invite", updateDiscordInviteLink);

// Get all settings (admin only)
router.get("/", getAllSettings);

module.exports = router;


