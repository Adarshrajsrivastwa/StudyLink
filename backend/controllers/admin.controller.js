const User = require("../Models/auth.model");
const Course = require("../Models/course.model");
const Resource = require("../Models/resource.model");
const Session = require("../Models/session.model");
const Community = require("../Models/community.model");
const Enrollment = require("../Models/enrollment.model");
const Purchase = require("../Models/purchase.model");

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const user = req.user;
    
    if (user.role !== "admin" && user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can access this endpoint",
      });
    }

    const { role, search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (role && role !== "all") {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .select("-password -otp -otpExpiry")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await User.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: users,
      count: users.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    console.error("Get all users error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Get all mentors (admin view)
exports.getAllMentors = async (req, res) => {
  try {
    const user = req.user;
    
    if (user.role !== "admin" && user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can access this endpoint",
      });
    }

    const mentors = await User.find({
      $or: [{ role: "teacher" }, { role: "mentor" }, { role: "admin" }, { role: "superadmin" }],
    })
      .select("-password -otp -otpExpiry")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: mentors,
      count: mentors.length,
    });
  } catch (err) {
    console.error("Get all mentors error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Get all courses (admin view)
exports.getAllCourses = async (req, res) => {
  try {
    const user = req.user;
    
    if (user.role !== "admin" && user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can access this endpoint",
      });
    }

    const courses = await Course.find({})
      .populate("instructor", "name email photoFileName")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: courses,
      count: courses.length,
    });
  } catch (err) {
    console.error("Get all courses error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Get all resources (admin view)
exports.getAllResources = async (req, res) => {
  try {
    const user = req.user;
    
    if (user.role !== "admin" && user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can access this endpoint",
      });
    }

    const resources = await Resource.find({})
      .populate("author", "name email photoFileName")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: resources,
      count: resources.length,
    });
  } catch (err) {
    console.error("Get all resources error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Get all sessions (admin view)
exports.getAllSessions = async (req, res) => {
  try {
    const user = req.user;
    
    if (user.role !== "admin" && user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can access this endpoint",
      });
    }

    const sessions = await Session.find({})
      .populate("course", "title instructorName")
      .populate("mentor", "name email photoFileName")
      .populate("enrolledStudents", "name email")
      .sort({ scheduledDate: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: sessions,
      count: sessions.length,
    });
  } catch (err) {
    console.error("Get all sessions error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Get all communities (admin only - all communities)
exports.getAllCommunities = async (req, res) => {
  try {
    const user = req.user;
    
    if (user.role !== "admin" && user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can access this endpoint",
      });
    }

    const communities = await Community.find({})
      .populate("createdBy", "name email photoFileName")
      .populate("members", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: communities,
      count: communities.length,
    });
  } catch (err) {
    console.error("Get all communities error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Get public communities (for students and mentors)
exports.getPublicCommunities = async (req, res) => {
  try {
    // Get only active and public communities
    const communities = await Community.find({
      isActive: true,
      isPublic: true,
    })
      .populate("createdBy", "name email photoFileName")
      .sort({ createdAt: -1 })
      .lean();

    // Ensure memberCount is calculated from members array length
    const communitiesWithCount = communities.map(community => ({
      ...community,
      memberCount: community.members ? community.members.length : (community.memberCount || 0),
    }));

    return res.status(200).json({
      success: true,
      data: communitiesWithCount,
      count: communitiesWithCount.length,
    });
  } catch (err) {
    console.error("Get public communities error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Create community
exports.createCommunity = async (req, res) => {
  try {
    const user = req.user;
    
    if (user.role !== "admin" && user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can create communities",
      });
    }

    const { name, description, category, isPublic, rules, discordLink } = req.body;

    if (!name || !description || !category) {
      return res.status(400).json({
        success: false,
        message: "Name, description, and category are required",
      });
    }

    let thumbnailUrl = null;
    if (req.file) {
      thumbnailUrl = req.file.path;
    }

    const community = new Community({
      name: name.trim(),
      description: description.trim(),
      category,
      createdBy: user._id,
      creatorName: user.name,
      members: [user._id],
      memberCount: 1,
      thumbnailUrl,
      isPublic: isPublic !== undefined ? isPublic : true,
      rules: rules || [],
      discordLink: discordLink ? discordLink.trim() : null,
    });

    await community.save();
    await community.populate("createdBy", "name email photoFileName");

    return res.status(201).json({
      success: true,
      message: "Community created successfully",
      data: community,
    });
  } catch (err) {
    console.error("Create community error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Update community
exports.updateCommunity = async (req, res) => {
  try {
    const user = req.user;
    
    if (user.role !== "admin" && user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can update communities",
      });
    }

    const { id } = req.params;
    const { name, description, category, isPublic, rules, isActive, discordLink } = req.body;

    const community = await Community.findById(id);

    if (!community) {
      return res.status(404).json({
        success: false,
        message: "Community not found",
      });
    }

    if (name !== undefined) community.name = name.trim();
    if (description !== undefined) community.description = description.trim();
    if (category !== undefined) community.category = category;
    if (isPublic !== undefined) community.isPublic = isPublic;
    if (rules !== undefined) community.rules = rules;
    if (isActive !== undefined) community.isActive = isActive;
    if (discordLink !== undefined) community.discordLink = discordLink ? discordLink.trim() : null;
    if (req.file) community.thumbnailUrl = req.file.path;

    await community.save();
    await community.populate("createdBy", "name email photoFileName");

    return res.status(200).json({
      success: true,
      message: "Community updated successfully",
      data: community,
    });
  } catch (err) {
    console.error("Update community error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Delete community
exports.deleteCommunity = async (req, res) => {
  try {
    const user = req.user;
    
    if (user.role !== "admin" && user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can delete communities",
      });
    }

    const { id } = req.params;

    const community = await Community.findByIdAndDelete(id);

    if (!community) {
      return res.status(404).json({
        success: false,
        message: "Community not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Community deleted successfully",
    });
  } catch (err) {
    console.error("Delete community error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = req.user;
    
    if (user.role !== "admin" && user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can delete users",
      });
    }

    const { id } = req.params;

    // Prevent deleting yourself
    if (user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    const userToDelete = await User.findById(id);

    if (!userToDelete) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent deleting other admins/superadmins
    if ((userToDelete.role === "admin" || userToDelete.role === "superadmin") && user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "You cannot delete admin accounts",
      });
    }

    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    console.error("Delete user error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Update user role
exports.updateUserRole = async (req, res) => {
  try {
    const user = req.user;
    
    if (user.role !== "admin" && user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can update user roles",
      });
    }

    const { id } = req.params;
    const { role } = req.body;

    if (!role || !["student", "teacher", "admin", "superadmin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Valid role is required",
      });
    }

    const userToUpdate = await User.findById(id);

    if (!userToUpdate) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Only superadmin can assign admin/superadmin roles
    if ((role === "admin" || role === "superadmin") && user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Only superadmin can assign admin roles",
      });
    }

    userToUpdate.role = role;
    await userToUpdate.save();

    return res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: userToUpdate,
    });
  } catch (err) {
    console.error("Update user role error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Get dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const user = req.user;
    
    if (user.role !== "admin" && user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can access this endpoint",
      });
    }

    const [
      totalUsers,
      totalMentors,
      totalStudents,
      totalCourses,
      totalResources,
      totalSessions,
      totalCommunities,
      totalEnrollments,
      totalPurchases,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ $or: [{ role: "teacher" }, { role: "mentor" }] }),
      User.countDocuments({ role: "student" }),
      Course.countDocuments({}),
      Resource.countDocuments({}),
      Session.countDocuments({}),
      Community.countDocuments({}),
      Enrollment.countDocuments({}),
      Purchase.countDocuments({ status: "completed" }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalMentors,
        totalStudents,
        totalCourses,
        totalResources,
        totalSessions,
        totalCommunities,
        totalEnrollments,
        totalPurchases,
      },
    });
  } catch (err) {
    console.error("Get dashboard stats error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Delete course (admin only)
exports.deleteCourse = async (req, res) => {
  try {
    const user = req.user;
    
    if (user.role !== "admin" && user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can delete courses",
      });
    }

    const { id } = req.params;
    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    await Course.findByIdAndDelete(id);
    await Enrollment.deleteMany({ course: id });

    return res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (err) {
    console.error("Delete course error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Delete resource (admin only)
exports.deleteResource = async (req, res) => {
  try {
    const user = req.user;
    
    if (user.role !== "admin" && user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can delete resources",
      });
    }

    const { id } = req.params;
    const resource = await Resource.findById(id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    await Resource.findByIdAndDelete(id);
    await Purchase.deleteMany({ resource: id });

    return res.status(200).json({
      success: true,
      message: "Resource deleted successfully",
    });
  } catch (err) {
    console.error("Delete resource error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Delete session (admin only)
exports.deleteSession = async (req, res) => {
  try {
    const user = req.user;
    
    if (user.role !== "admin" && user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can delete sessions",
      });
    }

    const { id } = req.params;
    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    await Session.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Session deleted successfully",
    });
  } catch (err) {
    console.error("Delete session error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Update course (admin only)
exports.updateCourse = async (req, res) => {
  try {
    const user = req.user;
    
    if (user.role !== "admin" && user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can update courses",
      });
    }

    const { id } = req.params;
    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const { title, description, category, level, price, isFree, isPublished, isActive } = req.body;

    if (title !== undefined) course.title = title;
    if (description !== undefined) course.description = description;
    if (category !== undefined) course.category = category;
    if (level !== undefined) course.level = level;
    if (price !== undefined) course.price = price;
    if (isFree !== undefined) course.isFree = isFree;
    if (isPublished !== undefined) course.isPublished = isPublished;
    if (isActive !== undefined) course.isActive = isActive;
    if (req.file) course.thumbnailUrl = req.file.path;

    await course.save();
    await course.populate("instructor", "name email photoFileName");

    return res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: course,
    });
  } catch (err) {
    console.error("Update course error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Update resource (admin only)
exports.updateResource = async (req, res) => {
  try {
    const user = req.user;
    
    if (user.role !== "admin" && user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can update resources",
      });
    }

    const { id } = req.params;
    const resource = await Resource.findById(id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    const { title, description, category, price, isFree, isActive } = req.body;

    if (title !== undefined) resource.title = title;
    if (description !== undefined) resource.description = description;
    if (category !== undefined) resource.category = category;
    if (price !== undefined) resource.price = price;
    if (isFree !== undefined) resource.isFree = isFree;
    if (isActive !== undefined) resource.isActive = isActive;
    if (req.file) resource.thumbnailUrl = req.file.path;

    await resource.save();
    await resource.populate("author", "name email photoFileName");

    return res.status(200).json({
      success: true,
      message: "Resource updated successfully",
      data: resource,
    });
  } catch (err) {
    console.error("Update resource error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

