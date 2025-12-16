const User = require("../models/auth.model");
const Course = require("../models/course.model");
const Enrollment = require("../models/enrollment.model");
const ChatConversation = require("../models/conversation.model");
const Chat = require("../models/message.model");
const Purchase = require("../models/purchase.model");

// Get all mentors (already exists, but adding for completeness)
exports.getAllMentors = async (req, res) => {
  try {
    const { specialty, availability, search } = req.query;
    let query = {
      $or: [{ role: "teacher" }, { role: "mentor" }, { role: "admin" }, { role: "superadmin" }],
    };

    if (specialty && specialty !== "all") {
      query.specialty = specialty;
    }

    if (availability && availability !== "all") {
      query.availability = availability;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { specialty: { $regex: search, $options: "i" } },
        { subjects: { $regex: search, $options: "i" } },
      ];
    }

    const mentors = await User.find(query)
      .select("-password -otp -otpExpires -__v")
      .lean();

    const formattedMentors = mentors.map((mentor) => ({
      ...mentor,
      id: mentor._id.toString(),
      avatar: mentor.photoFileName || mentor.name.charAt(0).toUpperCase(),
      rating: mentor.rating || 4.5,
      totalReviews: mentor.totalReviews || Math.floor(Math.random() * 300) + 50,
      totalSessions: mentor.totalSessions || Math.floor(Math.random() * 1500) + 100,
      pricePerHour: mentor.pricePerHour || Math.floor(Math.random() * 30) + 30,
      bio: mentor.bio || "Experienced mentor dedicated to student success.",
      experience: mentor.experience || Math.floor(Math.random() * 10) + 3,
      languages: mentor.languages || ["English"],
      availability: mentor.availability || (Math.random() > 0.7 ? "busy" : "available"),
      isOnline: mentor.isOnline || Math.random() > 0.5,
      subjects: mentor.subjects || ["Mathematics", "Science"],
      achievements: mentor.achievements || ["Great Communicator"],
    }));

    return res.status(200).json({
      success: true,
      data: formattedMentors,
      count: formattedMentors.length,
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

// Get mentor's courses
exports.getMyCourses = async (req, res) => {
  try {
    const mentor = req.user;

    if (mentor.role !== "teacher" && mentor.role !== "mentor" && mentor.role !== "admin" && mentor.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Only mentors can access this endpoint",
      });
    }

    const courses = await Course.find({ instructor: mentor._id })
      .populate("instructor", "name email photoFileName")
      .sort({ createdAt: -1 })
      .lean();

    // Get enrollment counts and check if mentor is enrolled in each course
    const courseIds = courses.map((c) => c._id);
    
    // Get enrollment counts for each course
    const enrollmentCounts = await Enrollment.aggregate([
      { $match: { course: { $in: courseIds } } },
      { $group: { _id: "$course", count: { $sum: 1 } } },
    ]);
    
    const enrollmentCountMap = new Map(
      enrollmentCounts.map((item) => [item._id.toString(), item.count])
    );

    // Check if mentor is enrolled in any courses (as a student)
    const mentorEnrollments = await Enrollment.find({
      student: mentor._id,
      course: { $in: courseIds },
    }).lean();

    const enrolledCourseIds = new Set(
      mentorEnrollments.map((e) => e.course.toString())
    );

    // Add enrollment count and enrollment status to each course
    for (const course of courses) {
      course.enrollmentCount = enrollmentCountMap.get(course._id.toString()) || 0;
      course.isEnrolled = enrolledCourseIds.has(course._id.toString());
      
      // If enrolled, add enrollment details
      if (course.isEnrolled) {
        const enrollment = mentorEnrollments.find(
          (e) => e.course.toString() === course._id.toString()
        );
        if (enrollment) {
          course.enrollmentProgress = enrollment.progress || 0;
          course.enrollmentStatus = enrollment.status || "enrolled";
        }
      }
    }

    return res.status(200).json({
      success: true,
      data: courses,
      count: courses.length,
    });
  } catch (err) {
    console.error("Get my courses error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Get mentor's conversations
exports.getMyConversations = async (req, res) => {
  try {
    const mentor = req.user;

    const conversations = await ChatConversation.find({ mentor: mentor._id })
      .populate("student", "name email photoFileName")
      .sort({ lastMessageAt: -1 })
      .lean();

    // Get unread message counts
    for (const conversation of conversations) {
      const unreadCount = await Chat.countDocuments({
        conversation: conversation._id,
        receiver: mentor._id,
        readAt: null,
      });
      conversation.unreadCount = unreadCount;
    }

    return res.status(200).json({
      success: true,
      data: conversations,
      count: conversations.length,
    });
  } catch (err) {
    console.error("Get my conversations error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Get mentor's earnings
exports.getMyEarnings = async (req, res) => {
  try {
    const mentor = req.user;

    // Get earnings from course enrollments
    const courses = await Course.find({ instructor: mentor._id }).select("_id price");
    const courseIds = courses.map((c) => c._id);

    const enrollments = await Enrollment.find({ course: { $in: courseIds } })
      .populate("course", "title price")
      .lean();

    let courseEarnings = 0;
    const courseEarningsDetails = [];

    for (const enrollment of enrollments) {
      if (enrollment.paymentId) {
        const purchase = await Purchase.findById(enrollment.paymentId);
        if (purchase && purchase.status === "completed") {
          courseEarnings += purchase.amount;
          courseEarningsDetails.push({
            courseId: enrollment.course._id,
            courseTitle: enrollment.course.title,
            amount: purchase.amount,
            date: purchase.paymentDate || purchase.createdAt,
            type: "course",
          });
        }
      }
    }

    // Get earnings from chat payments
    const conversations = await ChatConversation.find({ mentor: mentor._id });
    let chatEarnings = 0;
    const chatEarningsDetails = [];

    for (const conversation of conversations) {
      const paidChats = await Chat.find({
        conversation: conversation._id,
        receiver: mentor._id,
        isPaid: true,
      })
        .populate("sender", "name email")
        .lean();

      for (const chat of paidChats) {
        chatEarnings += chat.paymentAmount || 0;
        chatEarningsDetails.push({
          studentId: chat.sender._id,
          studentName: chat.sender.name,
          amount: chat.paymentAmount || 0,
          date: chat.createdAt,
          type: "chat",
        });
      }
    }

    const totalEarnings = courseEarnings + chatEarnings;

    // Get monthly earnings (last 6 months)
    const monthlyEarnings = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      let monthCourseEarnings = 0;
      let monthChatEarnings = 0;

      // Course earnings for this month
      for (const detail of courseEarningsDetails) {
        const detailDate = new Date(detail.date);
        if (detailDate >= monthStart && detailDate <= monthEnd) {
          monthCourseEarnings += detail.amount;
        }
      }

      // Chat earnings for this month
      for (const detail of chatEarningsDetails) {
        const detailDate = new Date(detail.date);
        if (detailDate >= monthStart && detailDate <= monthEnd) {
          monthChatEarnings += detail.amount;
        }
      }

      monthlyEarnings.push({
        month: monthStart.toLocaleString("default", { month: "short", year: "numeric" }),
        courseEarnings: monthCourseEarnings,
        chatEarnings: monthChatEarnings,
        total: monthCourseEarnings + monthChatEarnings,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        totalEarnings,
        courseEarnings,
        chatEarnings,
        monthlyEarnings,
        recentEarnings: [...courseEarningsDetails, ...chatEarningsDetails]
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 10),
      },
    });
  } catch (err) {
    console.error("Get my earnings error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Get mentor's enrolled students
exports.getMyStudents = async (req, res) => {
  try {
    const mentor = req.user;

    const courses = await Course.find({ instructor: mentor._id }).select("_id");
    const courseIds = courses.map((c) => c._id);

    const enrollments = await Enrollment.find({ course: { $in: courseIds } })
      .populate("student", "name email photoFileName")
      .populate("course", "title")
      .sort({ createdAt: -1 })
      .lean();

    // Group by student
    const studentsMap = new Map();

    for (const enrollment of enrollments) {
      const studentId = enrollment.student._id.toString();
      if (!studentsMap.has(studentId)) {
        studentsMap.set(studentId, {
          student: enrollment.student,
          courses: [],
          totalCourses: 0,
        });
      }
      studentsMap.get(studentId).courses.push({
        courseId: enrollment.course._id,
        courseTitle: enrollment.course.title,
        enrollmentDate: enrollment.enrollmentDate,
        progress: enrollment.progress,
        status: enrollment.status,
      });
      studentsMap.get(studentId).totalCourses += 1;
    }

    const students = Array.from(studentsMap.values());

    return res.status(200).json({
      success: true,
      data: students,
      count: students.length,
    });
  } catch (err) {
    console.error("Get my students error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};
