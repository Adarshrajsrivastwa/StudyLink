const Settings = require("../models/settings.model");

// Get Discord invite link (public)
exports.getDiscordInviteLink = async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: "discord_invite_link" });
    
    if (!setting) {
      return res.status(200).json({
        success: true,
        data: {
          inviteLink: null,
          message: "Discord invite link not set",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        inviteLink: setting.value,
        updatedAt: setting.updatedAt,
      },
    });
  } catch (err) {
    console.error("Get Discord invite link error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Update Discord invite link (admin only)
exports.updateDiscordInviteLink = async (req, res) => {
  try {
    const user = req.user;

    // Check if user is admin or superadmin
    if (user.role !== "admin" && user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can update Discord invite link",
      });
    }

    const { inviteLink } = req.body;

    if (!inviteLink || !inviteLink.trim()) {
      return res.status(400).json({
        success: false,
        message: "Discord invite link is required",
      });
    }

    // Validate Discord invite link format
    const discordLinkPattern = /^(https?:\/\/)?(www\.)?(discord\.(gg|com)|discordapp\.com)\/invite\/[a-zA-Z0-9]+$/;
    if (!discordLinkPattern.test(inviteLink.trim())) {
      return res.status(400).json({
        success: false,
        message: "Invalid Discord invite link format",
      });
    }

    // Update or create the setting
    const setting = await Settings.findOneAndUpdate(
      { key: "discord_invite_link" },
      {
        key: "discord_invite_link",
        value: inviteLink.trim(),
        description: "Discord community invite link",
        updatedBy: user._id,
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Discord invite link updated successfully",
      data: {
        inviteLink: setting.value,
        updatedAt: setting.updatedAt,
      },
    });
  } catch (err) {
    console.error("Update Discord invite link error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Get all settings (admin only)
exports.getAllSettings = async (req, res) => {
  try {
    const user = req.user;

    // Check if user is admin or superadmin
    if (user.role !== "admin" && user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can view all settings",
      });
    }

    const settings = await Settings.find().populate("updatedBy", "name email").sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: settings,
      count: settings.length,
    });
  } catch (err) {
    console.error("Get all settings error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};


