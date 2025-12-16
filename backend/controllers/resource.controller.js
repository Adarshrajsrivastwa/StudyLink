const Resource = require("../models/resource.model");
const Purchase = require("../models/purchase.model");
const User = require("../models/auth.model");

// Get all resources
exports.getAllResources = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sortBy = "createdAt", order = "desc" } = req.query;
    const userId = req.user?._id;

    // Build query - show all active resources (isActive !== false)
    // This includes: isActive: true, isActive: undefined/null
    const query = {
      $or: [
        { isActive: true },
        { isActive: { $exists: false } },
        { isActive: null }
      ]
    };
    
    if (category && category !== "all") {
      query.category = category;
    }

    // Handle search - use regex for reliable case-insensitive search
    const searchConditions = [];
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      searchConditions.push(
        { title: searchRegex },
        { description: searchRegex },
        { tags: { $in: [searchRegex] } }
      );
    }

    // Handle price filters
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = parseFloat(minPrice);
      if (maxPrice !== undefined) query.price.$lte = parseFloat(maxPrice);
    }

    // Build final query
    let finalQuery = query;
    if (searchConditions.length > 0) {
      finalQuery = {
        $and: [
          query,
          { $or: searchConditions }
        ]
      };
    }

    // Get resources - ensure we get ALL resources when no filters are applied
    let resources = [];
    try {
      console.log("Query for resources:", JSON.stringify(finalQuery, null, 2));
      
      resources = await Resource.find(finalQuery)
        .sort({ [sortBy]: order === "desc" ? -1 : 1 })
        .populate("author", "name email photoFileName")
        .lean();
      
      console.log(`Found ${resources.length} resources`);
      
      // If no resources found with current query, try getting all resources (for debugging)
      if (resources.length === 0) {
        console.log("No resources found with query, checking total resources in database...");
        const allResources = await Resource.find({})
          .sort({ [sortBy]: order === "desc" ? -1 : 1 })
          .populate("author", "name email photoFileName")
          .lean();
        console.log(`Total resources in database: ${allResources.length}`);
        
        // If we have resources in DB but query returned none, there might be an issue with the query
        if (allResources.length > 0 && !category && !search) {
          console.log("Warning: Query returned no results but database has resources. Using all resources.");
          resources = allResources;
        }
      }
    } catch (queryError) {
      console.error("Query error:", queryError);
      console.error("Error stack:", queryError.stack);
      // Fallback: try without populate if it fails
      try {
        resources = await Resource.find(finalQuery)
          .sort({ [sortBy]: order === "desc" ? -1 : 1 })
          .lean();
        console.log(`Found ${resources.length} resources without populate`);
      } catch (fallbackError) {
        console.error("Fallback query error:", fallbackError);
        // Last resort: get all resources without any filters
        try {
          resources = await Resource.find({})
            .sort({ [sortBy]: order === "desc" ? -1 : 1 })
            .lean();
          console.log(`Found ${resources.length} resources with no filters (fallback)`);
        } catch (finalError) {
          console.error("Final fallback error:", finalError);
          resources = [];
        }
      }
    }

    // Add authorName to each resource if not already present
    resources.forEach((resource) => {
      if (resource.author && typeof resource.author === 'object') {
        resource.authorName = resource.author.name || resource.authorName || 'Unknown';
      } else if (!resource.authorName) {
        resource.authorName = 'Unknown';
      }
    });

    // Check if user has purchased each resource
    if (userId) {
      try {
        const purchases = await Purchase.find({
          user: userId,
          resource: { $in: resources.map((r) => r._id) },
          status: "completed",
        }).lean();

        const purchasedResourceIds = new Set(
          purchases.map((p) => p.resource.toString())
        );

        resources.forEach((resource) => {
          resource.isPurchased = purchasedResourceIds.has(resource._id.toString());
        });
      } catch (purchaseError) {
        console.error("Error checking purchases:", purchaseError);
        // Continue without purchase info if there's an error
        resources.forEach((resource) => {
          resource.isPurchased = false;
        });
      }
    } else {
      resources.forEach((resource) => {
        resource.isPurchased = false;
      });
    }

    return res.status(200).json({
      success: true,
      data: resources,
      count: resources.length,
    });
  } catch (err) {
    console.error("Get resources error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Get single resource
exports.getResourceById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    const resource = await Resource.findById(id)
      .populate("author", "name email photoFileName")
      .lean();

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    // Check if user has purchased
    if (userId) {
      const purchase = await Purchase.findOne({
        user: userId,
        resource: id,
        status: "completed",
      });

      resource.isPurchased = !!purchase;
    } else {
      resource.isPurchased = false;
    }

    return res.status(200).json({
      success: true,
      data: resource,
    });
  } catch (err) {
    console.error("Get resource error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Create resource (admin/teacher only)
exports.createResource = async (req, res) => {
  try {
    const user = req.user;

    // Check if user is admin or teacher
    if (user.role !== "admin" && user.role !== "superadmin" && user.role !== "teacher") {
      return res.status(403).json({
        success: false,
        message: "Only admins and teachers can create resources",
      });
    }

    const {
      title,
      description,
      category,
      price,
      isFree,
      fileUrl,
      tags,
    } = req.body;

    // Validation
    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and category are required",
      });
    }

    // Parse isFree - handle both string and boolean
    const isFreeValue = isFree === true || isFree === "true";
    
    if (!isFreeValue && (price === undefined || price === null || price === "")) {
      return res.status(400).json({
        success: false,
        message: "Price is required for paid resources",
      });
    }

    // Handle thumbnail upload - use uploaded file or default thumbnail
    let thumbnailUrl = null;
    if (req.file) {
      thumbnailUrl = req.file.path; // Cloudinary URL
    } else {
      // Default thumbnail if no upload
      thumbnailUrl = process.env.DEFAULT_THUMBNAIL_URL || "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg";
    }

    // Parse tags - handle both JSON string and array
    let parsedTags = [];
    if (tags) {
      if (typeof tags === "string") {
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

    // Parse price correctly - ensure it's a number
    const priceValue = isFreeValue ? 0 : Math.max(0, parseFloat(price) || 0);
    
    const resource = new Resource({
      title: title.trim(),
      description: description.trim(),
      category,
      price: priceValue,
      isFree: isFreeValue,
      fileUrl: fileUrl ? fileUrl.trim() : null,
      thumbnailUrl: thumbnailUrl,
      author: user._id,
      authorName: user.name,
      tags: parsedTags,
      isActive: true, // Set resources as active by default
    });

    await resource.save();

    return res.status(201).json({
      success: true,
      message: "Resource created successfully",
      data: resource,
    });
  } catch (err) {
    console.error("Create resource error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Update resource
exports.updateResource = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const resource = await Resource.findById(id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    // Check if user is author or admin
    if (
      resource.author.toString() !== user._id.toString() &&
      user.role !== "admin" &&
      user.role !== "superadmin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this resource",
      });
    }

    const {
      title,
      description,
      category,
      price,
      isFree,
      fileUrl,
      tags,
      isActive,
    } = req.body;

    // Update fields
    if (title !== undefined) resource.title = title;
    if (description !== undefined) resource.description = description;
    if (category !== undefined) resource.category = category;
    if (isFree !== undefined) {
      resource.isFree = isFree === true || isFree === "true";
      if (resource.isFree) {
        resource.price = 0;
      } else if (price !== undefined) {
        // Only update price if resource is not free
        const priceValue = parseFloat(price) || 0;
        resource.price = Math.max(0, priceValue);
      }
    } else if (price !== undefined) {
      // Update price only if isFree is not being changed and resource is not free
      if (!resource.isFree) {
        const priceValue = parseFloat(price) || 0;
        resource.price = Math.max(0, priceValue);
      }
    }
    if (fileUrl !== undefined) resource.fileUrl = fileUrl;
    // Handle thumbnail upload - use uploaded file or keep existing or use default
    if (req.file) {
      resource.thumbnailUrl = req.file.path; // Cloudinary URL
    } else if (!resource.thumbnailUrl) {
      // Set default thumbnail if no existing thumbnail
      resource.thumbnailUrl = process.env.DEFAULT_THUMBNAIL_URL || "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg";
    }
    if (tags !== undefined) resource.tags = tags;
    // Allow author (mentor) or admin to toggle isActive
    if (isActive !== undefined && (
      resource.author.toString() === user._id.toString() ||
      user.role === "admin" ||
      user.role === "superadmin"
    )) {
      resource.isActive = isActive;
    }

    await resource.save();

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

// Delete resource
exports.deleteResource = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const resource = await Resource.findById(id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    // Check if user is author or admin
    if (
      resource.author.toString() !== user._id.toString() &&
      user.role !== "admin" &&
      user.role !== "superadmin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this resource",
      });
    }

    await Resource.findByIdAndDelete(id);

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

// Get user's purchased resources (similar to enrolled courses)
exports.getMyPurchases = async (req, res) => {
  try {
    const user = req.user;

    const purchases = await Purchase.find({
      user: user._id,
      status: "completed",
    })
      .populate({
        path: "resource",
        populate: {
          path: "author",
          select: "name email photoFileName"
        }
      })
      .sort({ createdAt: -1 })
      .lean();

    // Extract resources from purchases and add purchase info
    const resources = purchases
      .filter(purchase => purchase.resource) // Filter out any null resources
      .map(purchase => {
        const resource = purchase.resource;
        // Add purchase metadata
        resource.purchaseDate = purchase.paymentDate || purchase.createdAt;
        resource.purchaseAmount = purchase.amount;
        resource.isPurchased = true;
        return resource;
      });

    return res.status(200).json({
      success: true,
      data: resources,
      count: resources.length,
    });
  } catch (err) {
    console.error("Get purchases error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Get resources created by the current user (mentor/teacher)
exports.getMyResources = async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }
    
    // Check if user is admin, teacher, or mentor
    if (user.role !== "admin" && user.role !== "superadmin" && user.role !== "teacher") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to view this page",
      });
    }

    // Ensure user._id is a valid ObjectId
    if (!user._id) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // Query resources - handle populate errors gracefully
    let resources;
    try {
      resources = await Resource.find({ author: user._id })
        .populate("author", "name email photoFileName")
        .sort({ createdAt: -1 })
        .lean();
    } catch (queryError) {
      console.error("Query error in getMyResources:", queryError);
      // Try without populate if populate fails
      resources = await Resource.find({ author: user._id })
        .sort({ createdAt: -1 })
        .lean();
      
      // Manually add author info if populate failed
      if (resources && resources.length > 0) {
        resources = resources.map(resource => ({
          ...resource,
          author: {
            _id: user._id,
            name: user.name,
            email: user.email,
            photoFileName: user.photoFileName || null,
          }
        }));
      }
    }

    // Ensure resources is always an array
    if (!Array.isArray(resources)) {
      resources = [];
    }

    return res.status(200).json({
      success: true,
      data: resources,
      count: resources.length,
    });
  } catch (err) {
    console.error("Get my resources error:", err);
    console.error("Error stack:", err.stack);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

