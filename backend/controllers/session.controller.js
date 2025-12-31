const Session = require("../Models/session.model");
const Course = require("../Models/course.model");
const Enrollment = require("../Models/enrollment.model");

// Create session (mentor only)
exports.createSession = async (req, res) => {
  try {
    const mentor = req.user;

    // Check if user is mentor
    if (mentor.role !== "teacher" && mentor.role !== "admin" && mentor.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Only mentors can create sessions",
      });
    }

    const { courseId, title, description, scheduledDate, duration, meetingLink, maxStudents } = req.body;

    // Validation
    if (!courseId || !title || !scheduledDate || !meetingLink) {
      return res.status(400).json({
        success: false,
        message: "Course, title, scheduled date, and meeting link are required",
      });
    }

    // Check if course exists and mentor is the instructor
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    if (course.instructor.toString() !== mentor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only create sessions for your own courses",
      });
    }

    // Validate scheduled date is in the future
    const scheduledDateTime = new Date(scheduledDate);
    if (scheduledDateTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Scheduled date must be in the future",
      });
    }

    // Create session
    const session = new Session({
      course: courseId,
      mentor: mentor._id,
      title: title.trim(),
      description: description ? description.trim() : "",
      scheduledDate: scheduledDateTime,
      duration: duration || 60,
      meetingLink: meetingLink.trim(),
      maxStudents: maxStudents || 50,
      status: "scheduled",
    });

    await session.save();

    // Populate course and mentor details
    await session.populate("course", "title instructorName");
    await session.populate("mentor", "name email photoFileName");

    return res.status(201).json({
      success: true,
      message: "Session created successfully",
      data: session,
    });
  } catch (err) {
    console.error("Create session error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Get mentor's sessions
exports.getMySessions = async (req, res) => {
  try {
    const mentor = req.user;

    if (mentor.role !== "teacher" && mentor.role !== "admin" && mentor.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Only mentors can access this endpoint",
      });
    }

    const sessions = await Session.find({ mentor: mentor._id })
      .populate("course", "title instructorName thumbnailUrl")
      .populate("enrolledStudents", "name email photoFileName")
      .sort({ scheduledDate: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: sessions,
      count: sessions.length,
    });
  } catch (err) {
    console.error("Get my sessions error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Get sessions for a course
exports.getCourseSessions = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user?._id;

    const sessions = await Session.find({ 
      course: courseId,
      status: { $in: ["scheduled", "ongoing"] }
    })
      .populate("course", "title instructorName")
      .populate("mentor", "name email photoFileName")
      .sort({ scheduledDate: 1 })
      .lean();

    // Check if user is enrolled in the course
    let isEnrolled = false;
    if (userId) {
      const enrollment = await Enrollment.findOne({
        student: userId,
        course: courseId,
      });
      isEnrolled = !!enrollment;
    }

    // Add enrollment status for each session
    sessions.forEach((session) => {
      session.canJoin = isEnrolled && session.status === "scheduled" || session.status === "ongoing";
      session.isEnrolledInSession = userId && session.enrolledStudents.some(
        (student) => student.toString() === userId.toString()
      );
    });

    return res.status(200).json({
      success: true,
      data: sessions,
      count: sessions.length,
      isEnrolled,
    });
  } catch (err) {
    console.error("Get course sessions error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Get student's sessions (sessions for courses they're enrolled in)
exports.getStudentSessions = async (req, res) => {
  try {
    const student = req.user;

    // Get all courses student is enrolled in
    const enrollments = await Enrollment.find({ student: student._id }).lean();
    const courseIds = enrollments.map((e) => e.course);

    // Get sessions for these courses
    const sessions = await Session.find({
      course: { $in: courseIds },
      status: { $in: ["scheduled", "ongoing"] },
    })
      .populate("course", "title instructorName thumbnailUrl")
      .populate("mentor", "name email photoFileName")
      .sort({ scheduledDate: 1 })
      .lean();

    // Mark sessions student is enrolled in
    sessions.forEach((session) => {
      session.isEnrolledInSession = session.enrolledStudents.some(
        (studentId) => studentId.toString() === student._id.toString()
      );
    });

    return res.status(200).json({
      success: true,
      data: sessions,
      count: sessions.length,
    });
  } catch (err) {
    console.error("Get student sessions error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Join session (student)
exports.joinSession = async (req, res) => {
  try {
    const student = req.user;
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required",
      });
    }

    const session = await Session.findById(sessionId)
      .populate("course");

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    // Check if student is enrolled in the course
    const enrollment = await Enrollment.findOne({
      student: student._id,
      course: session.course._id,
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "You must be enrolled in the course to join sessions",
      });
    }

    // Check if session is available
    if (session.status !== "scheduled" && session.status !== "ongoing") {
      return res.status(400).json({
        success: false,
        message: "Session is not available",
      });
    }

    // Check if session has space
    if (session.enrolledStudents.length >= session.maxStudents) {
      return res.status(400).json({
        success: false,
        message: "Session is full",
      });
    }

    // Check if already enrolled in session
    const isAlreadyEnrolled = session.enrolledStudents.some(
      (studentId) => studentId.toString() === student._id.toString()
    );

    if (!isAlreadyEnrolled) {
      session.enrolledStudents.push(student._id);
      await session.save();
    }

    // Return session with meeting link (for embedded view)
    return res.status(200).json({
      success: true,
      message: "Successfully joined session",
      data: {
        session: {
          _id: session._id,
          title: session.title,
          description: session.description,
          scheduledDate: session.scheduledDate,
          duration: session.duration,
          meetingLink: session.meetingLink, // Return link for embedded view
          status: session.status,
        },
        course: session.course,
      },
    });
  } catch (err) {
    console.error("Join session error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Update session (mentor only)
exports.updateSession = async (req, res) => {
  try {
    const mentor = req.user;
    const { sessionId } = req.params;
    const { title, description, scheduledDate, duration, meetingLink, maxStudents, status } = req.body;

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    // Check if mentor owns this session
    if (session.mentor.toString() !== mentor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own sessions",
      });
    }

    // Update fields
    if (title !== undefined) session.title = title.trim();
    if (description !== undefined) session.description = description.trim();
    if (scheduledDate !== undefined) {
      const scheduledDateTime = new Date(scheduledDate);
      if (scheduledDateTime <= new Date() && session.status === "scheduled") {
        return res.status(400).json({
          success: false,
          message: "Scheduled date must be in the future",
        });
      }
      session.scheduledDate = scheduledDateTime;
    }
    if (duration !== undefined) session.duration = duration;
    if (meetingLink !== undefined) session.meetingLink = meetingLink.trim();
    if (maxStudents !== undefined) session.maxStudents = maxStudents;
    if (status !== undefined) session.status = status;

    await session.save();

    await session.populate("course", "title instructorName");
    await session.populate("mentor", "name email photoFileName");

    return res.status(200).json({
      success: true,
      message: "Session updated successfully",
      data: session,
    });
  } catch (err) {
    console.error("Update session error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Delete session (mentor only)
exports.deleteSession = async (req, res) => {
  try {
    const mentor = req.user;
    const { sessionId } = req.params;

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    // Check if mentor owns this session
    if (session.mentor.toString() !== mentor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own sessions",
      });
    }

    await Session.findByIdAndDelete(sessionId);

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


