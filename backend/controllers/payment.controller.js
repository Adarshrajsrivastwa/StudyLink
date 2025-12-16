const Razorpay = require("razorpay");
const crypto = require("crypto");
const Resource = require("../models/resource.model");
const Purchase = require("../models/purchase.model");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create order for resource
exports.createOrder = async (req, res) => {
  try {
    const user = req.user;
    const { resourceId } = req.body;

    if (!resourceId) {
      return res.status(400).json({
        success: false,
        message: "Resource ID is required",
      });
    }

    // Get resource
    const resource = await Resource.findById(resourceId);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    if (!resource.isActive) {
      return res.status(400).json({
        success: false,
        message: "Resource is not available",
      });
    }

    // Check if resource is free
    if (resource.isFree || resource.price === 0) {
      // Create free purchase directly
      const purchase = new Purchase({
        user: user._id,
        resource: resourceId,
        amount: 0,
        razorpayOrderId: `free_${Date.now()}_${user._id}`,
        status: "completed",
        paymentDate: new Date(),
      });

      await purchase.save();

      // Update resource purchase count
      resource.purchaseCount += 1;
      await resource.save();

      return res.status(200).json({
        success: true,
        message: "Resource added to your library",
        data: {
          purchase,
          isFree: true,
        },
      });
    }

    // Check if already purchased
    const existingPurchase = await Purchase.findOne({
      user: user._id,
      resource: resourceId,
      status: "completed",
    });

    if (existingPurchase) {
      return res.status(400).json({
        success: false,
        message: "You have already purchased this resource",
      });
    }

    // CRITICAL: Use resource price from database, not from request body
    // This ensures no one can manipulate the amount
    const resourcePrice = resource.price;
    
    // Validate price is valid
    if (!resourcePrice || resourcePrice < 0 || isNaN(resourcePrice)) {
      return res.status(400).json({
        success: false,
        message: "Invalid resource price",
      });
    }

    // Create Razorpay order - amount is ALWAYS from database
    // Generate receipt ID (max 40 chars for Razorpay)
    const receiptId = `R${Date.now().toString().slice(-10)}${user._id.toString().slice(-8)}`.slice(0, 40);
    
    const options = {
      amount: Math.round(resourcePrice * 100), // Convert to paise, ensure integer
      currency: "INR",
      receipt: receiptId, // Max 40 characters
      notes: {
        userId: user._id.toString(),
        resourceId: resourceId.toString(),
        resourceTitle: resource.title,
        type: "resource",
      },
    };

    const order = await razorpay.orders.create(options);

    // Create purchase record
    // Store the EXACT amount from database
    const purchase = new Purchase({
      user: user._id,
      resource: resourceId,
      amount: resourcePrice, // Always use database price
      razorpayOrderId: order.id,
      status: "pending",
    });

    await purchase.save();

    return res.status(200).json({
      success: true,
      message: "Order created successfully",
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        purchaseId: purchase._id,
      },
    });
  } catch (err) {
    console.error("Create order error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Create order for course
exports.createCourseOrder = async (req, res) => {
  try {
    const user = req.user;
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Course ID is required",
      });
    }

    const Course = require("../models/course.model");
    const Enrollment = require("../models/enrollment.model");

    // Get course
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
        message: "Course is not available",
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

    // Check if course is free
    if (course.isFree || course.price === 0) {
      // Enroll directly
      const enrollment = new Enrollment({
        student: user._id,
        course: courseId,
        status: "enrolled",
      });

      await enrollment.save();

      // Update course enrollment count
      course.enrollmentCount += 1;
      await course.save();

      return res.status(200).json({
        success: true,
        message: "Successfully enrolled in course",
        data: {
          enrollment,
          isFree: true,
        },
      });
    }

    // CRITICAL: Use course price from database, not from request body
    // This ensures no one can manipulate the amount
    const coursePrice = course.price;
    
    // Validate price is valid
    if (!coursePrice || coursePrice < 0 || isNaN(coursePrice)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course price",
      });
    }

    // Create Razorpay order - amount is ALWAYS from database
    // Generate receipt ID (max 40 chars for Razorpay)
    const receiptId = `C${Date.now().toString().slice(-10)}${user._id.toString().slice(-8)}`.slice(0, 40);
    
    const options = {
      amount: Math.round(coursePrice * 100), // Convert to paise, ensure integer
      currency: "INR",
      receipt: receiptId, // Max 40 characters
      notes: {
        userId: user._id.toString(),
        courseId: courseId.toString(),
        courseTitle: course.title,
        type: "course",
      },
    };

    const order = await razorpay.orders.create(options);

    // Create purchase record for course (using Purchase model)
    // Store the EXACT amount from database
    const purchase = new Purchase({
      user: user._id,
      resource: courseId, // Using resource field to store courseId
      amount: coursePrice, // Always use database price
      razorpayOrderId: order.id,
      status: "pending",
    });

    await purchase.save();

    return res.status(200).json({
      success: true,
      message: "Order created successfully",
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        purchaseId: purchase._id,
        courseId: courseId,
      },
    });
  } catch (err) {
    console.error("Create course order error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Verify payment
exports.verifyPayment = async (req, res) => {
  try {
    const user = req.user;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, purchaseId, type } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !purchaseId) {
      return res.status(400).json({
        success: false,
        message: "Payment details are required",
      });
    }

    // Get purchase record
    const purchase = await Purchase.findById(purchaseId);

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase record not found",
      });
    }

    // Verify user owns this purchase
    if (purchase.user.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // CRITICAL: Verify order ID matches purchase record
    if (purchase.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: "Order ID mismatch",
      });
    }

    // CRITICAL: Verify amount from Razorpay order (server-side verification)
    try {
      const order = await razorpay.orders.fetch(razorpay_order_id);
      
      // Verify the order amount matches the purchase amount (in paise)
      const expectedAmount = Math.round(purchase.amount * 100); // Convert to paise
      if (order.amount !== expectedAmount) {
        console.error(`Amount mismatch: Order amount ${order.amount} != Expected ${expectedAmount}`);
        return res.status(400).json({
          success: false,
          message: "Payment amount verification failed. Amount mismatch detected.",
        });
      }

      // Additional verification: If it's a course, verify course price matches
      if (type === "course") {
        const Course = require("../models/course.model");
        const course = await Course.findById(purchase.resource);
        if (course && course.price !== purchase.amount) {
          console.error(`Course price mismatch: Course price ${course.price} != Purchase amount ${purchase.amount}`);
          return res.status(400).json({
            success: false,
            message: "Course price verification failed",
          });
        }
      }
    } catch (razorpayError) {
      console.error("Razorpay order fetch error:", razorpayError);
      return res.status(400).json({
        success: false,
        message: "Failed to verify order with Razorpay",
      });
    }

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment signature verification failed",
      });
    }

    // Update purchase record
    purchase.razorpayPaymentId = razorpay_payment_id;
    purchase.razorpaySignature = razorpay_signature;
    purchase.status = "completed";
    purchase.paymentDate = new Date();
    await purchase.save();

    // Handle based on type (resource or course)
    if (type === "course") {
      const Course = require("../models/course.model");
      const Enrollment = require("../models/enrollment.model");

      const course = await Course.findById(purchase.resource);
      if (course) {
        // Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({
          student: user._id,
          course: purchase.resource,
        });

        if (!existingEnrollment) {
          // Create enrollment
          const enrollment = new Enrollment({
            student: user._id,
            course: purchase.resource,
            status: "enrolled",
            paymentId: purchase._id,
          });

          await enrollment.save();

          // Update course enrollment count
          course.enrollmentCount += 1;
          await course.save();

          return res.status(200).json({
            success: true,
            message: "Payment verified and enrolled successfully",
            data: {
              purchase,
              enrollment,
            },
          });
        } else {
          // Already enrolled, just update payment reference
          existingEnrollment.paymentId = purchase._id;
          await existingEnrollment.save();
        }
      }
    } else {
      // Handle resource purchase
      const resource = await Resource.findById(purchase.resource);
      if (resource) {
        resource.purchaseCount += 1;
        await resource.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: purchase,
    });
  } catch (err) {
    console.error("Verify payment error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

