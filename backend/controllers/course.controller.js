const Course = require("../Models/course.model");
const Enrollment = require("../Models/enrollment.model");
const Purchase = require("../Models/purchase.model");

// Get all courses
exports.getAllCourses = async (req, res) => {
  try {
    const { category, level, search, sortBy = "createdAt", order = "desc" } = req.query;
    const userId = req.user?._id;

    // Build query - only show published and active courses
    const query = { isPublished: true, isActive: true };

    if (category) {
      query.category = category;
    }

    if (level) {
      query.level = level;
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Get courses
    const courses = await Course.find(query)
      .sort({ [sortBy]: order === "desc" ? -1 : 1 })
      .populate("instructor", "name email photoFileName")
      .lean();

    // Check if user is enrolled in each course
    if (userId) {
      const enrollments = await Enrollment.find({
        student: userId,
        course: { $in: courses.map((c) => c._id) },
      }).lean();

      const enrolledCourseIds = new Set(
        enrollments.map((e) => e.course.toString())
      );

      courses.forEach((course) => {
        course.isEnrolled = enrolledCourseIds.has(course._id.toString());
        const enrollment = enrollments.find(
          (e) => e.course.toString() === course._id.toString()
        );
        if (enrollment) {
          course.enrollmentProgress = enrollment.progress;
          course.enrollmentStatus = enrollment.status;
        }
      });
    } else {
      courses.forEach((course) => {
        course.isEnrolled = false;
      });
    }

    console.log(`Found ${courses.length} published courses`);
    
    return res.status(200).json({
      success: true,
      data: courses,
      count: courses.length,
    });
  } catch (err) {
    console.error("Get courses error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Get single course
exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    const course = await Course.findById(id)
      .populate("instructor", "name email photoFileName")
      .lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check if user is enrolled
    if (userId) {
      const enrollment = await Enrollment.findOne({
        student: userId,
        course: id,
      });

      course.isEnrolled = !!enrollment;
      if (enrollment) {
        course.enrollmentProgress = enrollment.progress;
        course.enrollmentStatus = enrollment.status;
        course.completedLessons = enrollment.completedLessons;
      }
    } else {
      course.isEnrolled = false;
    }

    return res.status(200).json({
      success: true,
      data: course,
    });
  } catch (err) {
    console.error("Get course error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Create course (instructor/admin only)
exports.createCourse = async (req, res) => {
  try {
    const user = req.user;

    // Check if user is instructor, admin, or teacher
    if (
      user.role !== "admin" &&
      user.role !== "superadmin" &&
      user.role !== "teacher"
    ) {
      return res.status(403).json({
        success: false,
        message: "Only instructors and admins can create courses",
      });
    }

    const {
      title,
      description,
      category,
      level,
      price,
      isFree,
      thumbnailUrl,
      duration,
      lessons,
      tags,
      startDate,
      endDate,
    } = req.body;

    // Normalize boolean and numeric fields to handle both JSON and FormData requests
    const isFreeBool =
      typeof isFree === "string"
        ? isFree.toLowerCase() === "true"
        : !!isFree;

    const priceNumber =
      price === undefined || price === null || price === ""
        ? undefined
        : Number(price);

    const durationNumber =
      duration === undefined || duration === null || duration === ""
        ? 0
        : Number(duration);

    // Validation
    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and category are required",
      });
    }

    if (
      !isFreeBool &&
      (priceNumber === undefined || Number.isNaN(priceNumber))
    ) {
      return res.status(400).json({
        success: false,
        message: "Price is required for paid courses",
      });
    }

    // Parse JSON strings from FormData (when using multer for file uploads)
    let parsedLessons = [];
    if (lessons !== undefined && lessons !== null) {
      if (typeof lessons === 'string') {
        try {
          parsedLessons = JSON.parse(lessons);
        } catch (e) {
          console.error("Error parsing lessons:", e);
          parsedLessons = [];
        }
      } else if (Array.isArray(lessons)) {
        parsedLessons = lessons;
      }
    }

    let parsedTags = [];
    if (tags !== undefined && tags !== null) {
      if (typeof tags === 'string') {
        try {
          parsedTags = JSON.parse(tags);
        } catch (e) {
          // If not JSON, treat as comma-separated string
          parsedTags = tags.split(",").map((tag) => tag.trim()).filter((tag) => tag.length > 0);
        }
      } else if (Array.isArray(tags)) {
        parsedTags = tags;
      }
    }

    const course = new Course({
      title,
      description,
      category,
      level: level || "beginner",
      // For free courses, force price to 0. Otherwise, use the provided price (default 0)
      price: isFreeBool ? 0 : (priceNumber ?? 0),
      isFree: isFreeBool,
      thumbnailUrl: thumbnailUrl || null,
      duration: Number.isNaN(durationNumber) ? 0 : durationNumber,
      lessons: parsedLessons,
      tags: parsedTags,
      instructor: user._id,
      instructorName: user.name,
      startDate: startDate || null,
      endDate: endDate || null,
      isPublished: true, // Publish courses by default so students can see them
      isActive: true, // Set courses as active by default
    });

    await course.save();

    return res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: course,
    });
  } catch (err) {
    console.error("Create course error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Update course
exports.updateCourse = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check if user is instructor or admin
    if (
      course.instructor.toString() !== user._id.toString() &&
      user.role !== "admin" &&
      user.role !== "superadmin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this course",
      });
    }

    const {
      title,
      description,
      category,
      level,
      price,
      isFree,
      thumbnailUrl,
      duration,
      lessons,
      tags,
      isPublished,
      isActive,
      startDate,
      endDate,
    } = req.body;

    // Normalize values coming from either JSON or multipart/form-data
    const isFreeBool =
      isFree === undefined
        ? undefined
        : typeof isFree === "string"
        ? isFree.toLowerCase() === "true"
        : !!isFree;

    const priceNumber =
      price === undefined || price === null || price === ""
        ? undefined
        : Number(price);

    const durationNumber =
      duration === undefined || duration === null || duration === ""
        ? undefined
        : Number(duration);

    const isPublishedBool =
      isPublished === undefined
        ? undefined
        : typeof isPublished === "string"
        ? isPublished.toLowerCase() === "true"
        : !!isPublished;

    const isActiveBool =
      isActive === undefined
        ? undefined
        : typeof isActive === "string"
        ? isActive.toLowerCase() === "true"
        : !!isActive;

    // Handle thumbnail file upload (from multer)
    if (req.file && req.file.path) {
      course.thumbnailUrl = req.file.path;
    } else if (thumbnailUrl !== undefined) {
      course.thumbnailUrl = thumbnailUrl;
    }

    // Parse JSON strings from FormData
    let parsedLessons = lessons;
    if (lessons !== undefined) {
      if (typeof lessons === 'string') {
        try {
          parsedLessons = JSON.parse(lessons);
        } catch (e) {
          parsedLessons = [];
        }
      }
      // Only update if lessons is provided and is an array
      if (Array.isArray(parsedLessons)) {
        course.lessons = parsedLessons;
      }
    }

    let parsedTags = tags;
    if (tags !== undefined) {
      if (typeof tags === 'string') {
        try {
          parsedTags = JSON.parse(tags);
        } catch (e) {
          parsedTags = [];
        }
      }
      // Only update if tags is provided and is an array
      if (Array.isArray(parsedTags)) {
        course.tags = parsedTags;
      }
    }

    // Update fields
    if (title !== undefined) course.title = title;
    if (description !== undefined) course.description = description;
    if (category !== undefined) course.category = category;
    if (level !== undefined) course.level = level;
    if (
      priceNumber !== undefined &&
      !Number.isNaN(priceNumber)
    ) {
      course.price = priceNumber;
    }
    if (isFreeBool !== undefined) {
      course.isFree = isFreeBool;
      // When a course is marked as free, always force the price to 0
      if (isFreeBool) {
        course.price = 0;
      }
    }
    if (
      durationNumber !== undefined &&
      !Number.isNaN(durationNumber)
    ) {
      course.duration = durationNumber;
    }
    if (startDate !== undefined) course.startDate = startDate;
    if (endDate !== undefined) course.endDate = endDate;
    if (
      isPublishedBool !== undefined &&
      (user.role === "admin" || user.role === "superadmin" || course.instructor.toString() === user._id.toString())
    ) {
      course.isPublished = isPublishedBool;
    }
    if (isActiveBool !== undefined) {
      course.isActive = isActiveBool;
    }

    await course.save();

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

// Delete course
exports.deleteCourse = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check if user is instructor or admin
    if (
      course.instructor.toString() !== user._id.toString() &&
      user.role !== "admin" &&
      user.role !== "superadmin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this course",
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

// Enroll in course
exports.enrollInCourse = async (req, res) => {
  try {
    const user = req.user;
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Course ID is required",
      });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    if (!course.isPublished) {
      return res.status(400).json({
        success: false,
        message: "Course is not available for enrollment",
      });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: user._id,
      course: courseId,
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: "You are already enrolled in this course",
      });
    }

    // For paid courses, check if payment was made
    if (!course.isFree && course.price > 0) {
      const purchase = await Purchase.findOne({
        user: user._id,
        resource: courseId, // Using resource field for course payment
        status: "completed",
      });

      if (!purchase) {
        return res.status(400).json({
          success: false,
          message: "Payment required to enroll in this course",
        });
      }
    }

    // Create enrollment
    const enrollment = new Enrollment({
      student: user._id,
      course: courseId,
      status: "enrolled",
    });

    await enrollment.save();

    // Update course enrollment count
    course.enrollmentCount += 1;
    await course.save();

    return res.status(201).json({
      success: true,
      message: "Successfully enrolled in course",
      data: enrollment,
    });
  } catch (err) {
    console.error("Enroll course error:", err);
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You are already enrolled in this course",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Get user's enrolled courses
exports.getMyCourses = async (req, res) => {
  try {
    const user = req.user;

    const enrollments = await Enrollment.find({
      student: user._id,
    })
      .populate({
        path: "course",
        populate: {
          path: "instructor",
          select: "name email photoFileName"
        }
      })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: enrollments,
      count: enrollments.length,
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

// Update lesson progress
exports.updateLessonProgress = async (req, res) => {
  try {
    const user = req.user;
    const { courseId, lessonId } = req.body;

    if (!courseId || !lessonId) {
      return res.status(400).json({
        success: false,
        message: "Course ID and Lesson ID are required",
      });
    }

    const enrollment = await Enrollment.findOne({
      student: user._id,
      course: courseId,
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "You are not enrolled in this course",
      });
    }

    // Check if lesson already completed
    const alreadyCompleted = enrollment.completedLessons.some(
      (l) => l.lessonId.toString() === lessonId
    );

    if (!alreadyCompleted) {
      enrollment.completedLessons.push({
        lessonId: lessonId,
        completedAt: new Date(),
      });
    }

    // Calculate progress
    const course = await Course.findById(courseId);
    if (course) {
      const totalLessons = course.lessons.length;
      const completedCount = enrollment.completedLessons.length;
      enrollment.progress = Math.round((completedCount / totalLessons) * 100);

      if (enrollment.progress === 100) {
        enrollment.status = "completed";
      } else if (enrollment.progress > 0) {
        enrollment.status = "in-progress";
      }
    }

    await enrollment.save();

    return res.status(200).json({
      success: true,
      message: "Progress updated",
      data: enrollment,
    });
  } catch (err) {
    console.error("Update progress error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

