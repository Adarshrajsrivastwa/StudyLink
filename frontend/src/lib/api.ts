const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  user?: T;
  token?: string;
  requiresVerification?: boolean;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.message || "An error occurred",
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      "Network error. Please check your connection.",
      0,
      error
    );
  }
}

// Auth API
export const authApi = {
  register: async (data: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }) => {
    return fetchApi<{
      _id: string;
      email: string;
      name: string;
      role: string;
      isEmailVerified: boolean;
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  login: async (data: { email: string; password: string }) => {
    return fetchApi<{
      _id: string;
      email: string;
      name: string;
      role: string;
      isEmailVerified: boolean;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getProfile: async () => {
    return fetchApi<{
      _id: string;
      name: string;
      email: string;
      mobile: string | null;
      address: string | null;
      role: string;
      photoFileName: string | null;
      isEmailVerified: boolean;
      lastLogin: string | null;
      createdAt: string;
      updatedAt: string;
    }>("/auth/profile", {
      method: "GET",
    });
  },

  updateProfile: async (data: {
    name?: string;
    mobile?: string;
    address?: string;
    role?: string;
    photo?: File;
  }) => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const formData = new FormData();
    
    if (data.name !== undefined) formData.append("name", data.name);
    if (data.mobile !== undefined) formData.append("mobile", data.mobile || "");
    if (data.address !== undefined) formData.append("address", data.address || "");
    if (data.role !== undefined) formData.append("role", data.role);
    if (data.photo) formData.append("photo", data.photo);

    const token = tokenManager.getToken();
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new ApiError(
        result.message || "An error occurred",
        response.status,
        result
      );
    }

    return result;
  },

  deleteProfilePicture: async () => {
    return fetchApi<{
      _id: string;
      name: string;
      email: string;
      mobile: string | null;
      address: string | null;
      role: string;
      photoFileName: string | null;
      isEmailVerified: boolean;
      lastLogin: string | null;
      createdAt: string;
      updatedAt: string;
    }>("/auth/profile/picture", {
      method: "DELETE",
    });
  },
};

// OTP API
export const otpApi = {
  sendOtp: async (email: string) => {
    return fetchApi("/otp/send-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  verifyOtp: async (email: string, otp: string) => {
    return fetchApi<{
      _id: string;
      email: string;
      name: string;
      isEmailVerified: boolean;
    }>("/otp/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });
  },
};

// Course API
export interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  price: number;
  isFree: boolean;
  thumbnailUrl: string | null;
  duration: number;
  lessons: Array<{
    _id?: string;
    title: string;
    description?: string;
    videoUrl?: string;
    duration?: number;
    order?: number;
  }>;
  tags: string[];
  enrollmentCount: number;
  rating: number;
  totalRatings?: number;
  instructor?: {
    _id: string;
    name: string;
    email: string;
    photoFileName?: string;
  };
  instructorName?: string;
  isEnrolled?: boolean;
  enrollmentProgress?: number;
  enrollmentStatus?: string;
  isPublished?: boolean;
  createdAt: string;
}

export interface CourseCreateUpdate {
  title: string;
  description: string;
  category: string;
  level: string;
  price: number;
  isFree: boolean;
  duration: number;
  lessons: Array<{
    title: string;
    description?: string;
    videoUrl?: string;
    duration?: number;
    order?: number;
  }>;
  tags: string[];
  thumbnailUrl?: string;
  startDate?: string;
  endDate?: string;
}

export const courseApi = {
  getAllCourses: async (filters?: { category?: string; level?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (filters?.category && filters.category !== "all") query.append("category", filters.category);
    if (filters?.level && filters.level !== "all") query.append("level", filters.level);
    if (filters?.search) query.append("search", filters.search);
    return fetchApi<Course[]>(`/courses?${query.toString()}`);
  },
  getCourseById: async (id: string) => {
    return fetchApi<Course>(`/courses/${id}`);
  },
  createCourse: async (data: CourseCreateUpdate) => {
    return fetchApi<Course>("/courses", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  updateCourse: async (id: string, data: CourseCreateUpdate) => {
    return fetchApi<Course>(`/courses/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  deleteCourse: async (id: string) => {
    return fetchApi(`/courses/${id}`, { method: "DELETE" });
  },
  enrollInCourse: async (courseId: string) => {
    return fetchApi<{ success: boolean; data: any; message?: string }>("/courses/enroll", {
      method: "POST",
      body: JSON.stringify({ courseId }),
    });
  },
  getMyEnrollments: async () => {
    return fetchApi<Array<{
      _id: string;
      student: string;
      course: Course;
      status: string;
      progress: number;
      completedLessons: string[];
      createdAt: string;
    }>>("/courses/my/enrollments");
  },
  updateLessonProgress: async (enrollmentId: string, lessonId: string, completed: boolean) => {
    return fetchApi<Course>("/courses/progress", {
      method: "POST",
      body: JSON.stringify({ enrollmentId, lessonId, completed }),
    });
  },
};

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  mobile?: string | null;
  address?: string | null;
  role: string;
  photoFileName?: string | null;
  isEmailVerified?: boolean;
  lastLogin?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Mentor API
export interface Mentor {
  _id: string;
  id: string;
  name: string;
  avatar: string;
  specialty: string[];
  rating: number;
  totalReviews: number;
  totalSessions: number;
  pricePerHour: number;
  bio: string;
  experience: number;
  languages: string[];
  availability: "available" | "busy" | "away";
  isOnline: boolean;
  subjects: string[];
  achievements: string[];
}

export const mentorApi = {
  getAllMentors: async () => {
    return fetchApi<Mentor[]>("/mentors");
  },
  getMyCourses: async () => {
    return fetchApi<Course[]>("/mentors/my/courses");
  },
  getMyConversations: async () => {
    return fetchApi<any[]>("/mentors/my/conversations");
  },
  getMyEarnings: async () => {
    return fetchApi<{
      totalEarnings: number;
      courseEarnings: number;
      chatEarnings: number;
      monthlyEarnings: Array<{
        month: string;
        courseEarnings: number;
        chatEarnings: number;
        total: number;
      }>;
      recentEarnings: Array<{
        amount: number;
        date: string;
        type: "course" | "chat";
        courseTitle?: string;
        studentName?: string;
      }>;
    }>("/mentors/my/earnings");
  },
  getMyStudents: async () => {
    return fetchApi<Array<{
      student: UserProfile;
      courses: Array<{
        courseId: string;
        courseTitle: string;
        enrollmentDate: string;
        progress: number;
        status: string;
      }>;
      totalCourses: number;
    }>>("/mentors/my/students");
  },
};

// Resource API
export interface Resource {
  _id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  isFree: boolean;
  fileUrl: string | null;
  thumbnailUrl: string | null;
  author: {
    _id: string;
    name: string;
    email: string;
  };
  authorName: string;
  tags: string[];
  downloadCount: number;
  purchaseCount: number;
  rating: number;
  totalRatings: number;
  isPurchased?: boolean;
  isActive?: boolean;
  createdAt: string;
}

export interface ResourceCreateUpdate {
  title: string;
  description: string;
  category: string;
  price: number;
  isFree: boolean;
  fileUrl?: string;
  thumbnailUrl?: string;
  tags: string[];
}

export const resourceApi = {
  getAllResources: async (filters?: { category?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (filters?.category && filters.category !== "all") query.append("category", filters.category);
    if (filters?.search) query.append("search", filters.search);
    return fetchApi<Resource[]>(`/resources?${query.toString()}`);
  },
  getResourceById: async (id: string) => {
    return fetchApi<Resource>(`/resources/${id}`);
  },
  createResource: async (data: ResourceCreateUpdate) => {
    return fetchApi<Resource>("/resources", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  updateResource: async (id: string, data: ResourceCreateUpdate & { isActive?: boolean }) => {
    return fetchApi<Resource>(`/resources/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  deleteResource: async (id: string) => {
    return fetchApi(`/resources/${id}`, { method: "DELETE" });
  },
  getMyResources: async () => {
    return fetchApi<Resource[]>("/resources/my");
  },
  getMyPurchases: async () => {
    return fetchApi<Resource[]>("/resources/my/purchases");
  },
};

// Settings API
export const settingsApi = {
  getDiscordInviteLink: async () => {
    return fetchApi<{ inviteLink: string | null; updatedAt?: string }>("/settings/discord-invite");
  },
  updateDiscordInviteLink: async (inviteLink: string) => {
    return fetchApi<{ inviteLink: string; updatedAt: string }>("/settings/discord-invite", {
      method: "PUT",
      body: JSON.stringify({ inviteLink }),
    });
  },
};

// Session API
export interface Session {
  _id: string;
  course: Course | string;
  mentor: {
    _id: string;
    name: string;
    email: string;
    photoFileName?: string;
  };
  title: string;
  description?: string;
  scheduledDate: string;
  duration: number;
  meetingLink: string;
  status: "scheduled" | "ongoing" | "completed" | "cancelled";
  enrolledStudents: string[];
  maxStudents: number;
  canJoin?: boolean;
  isEnrolledInSession?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const sessionApi = {
  createSession: async (data: {
    courseId: string;
    title: string;
    description?: string;
    scheduledDate: string;
    duration?: number;
    meetingLink: string;
    maxStudents?: number;
  }) => {
    return fetchApi<Session>("/sessions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  getMySessions: async () => {
    return fetchApi<Session[]>("/sessions/my");
  },
  getCourseSessions: async (courseId: string) => {
    return fetchApi<{ data: Session[]; isEnrolled: boolean }>(`/sessions/course/${courseId}`);
  },
  getStudentSessions: async () => {
    return fetchApi<Session[]>("/sessions/student/my");
  },
  joinSession: async (sessionId: string) => {
    return fetchApi<{ session: Session; course: Course }>("/sessions/join", {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    });
  },
  updateSession: async (sessionId: string, data: Partial<Session>) => {
    return fetchApi<Session>(`/sessions/${sessionId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  deleteSession: async (sessionId: string) => {
    return fetchApi(`/sessions/${sessionId}`, { method: "DELETE" });
  },
};

// Community API
export const communityApi = {
  getPublicCommunities: async () => {
    return fetchApi<Community[]>("/communities");
  },
};

// Admin API
export interface Community {
  _id: string;
  name: string;
  description: string;
  category: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
    photoFileName?: string;
  };
  creatorName: string;
  members: string[];
  memberCount: number;
  thumbnailUrl?: string;
  isActive: boolean;
  isPublic: boolean;
  rules: string[];
  discordLink?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalMentors: number;
  totalStudents: number;
  totalCourses: number;
  totalResources: number;
  totalSessions: number;
  totalCommunities: number;
  totalEnrollments: number;
  totalPurchases: number;
}

export const adminApi = {
  getStats: async () => {
    return fetchApi<AdminStats>("/admin/stats");
  },
  getAllUsers: async (filters?: { role?: string; search?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (filters?.role) query.append("role", filters.role);
    if (filters?.search) query.append("search", filters.search);
    if (filters?.page) query.append("page", filters.page.toString());
    if (filters?.limit) query.append("limit", filters.limit.toString());
    return fetchApi<User[]>(`/admin/users?${query.toString()}`);
  },
  getAllMentors: async () => {
    return fetchApi<User[]>("/admin/mentors");
  },
  getAllCourses: async () => {
    return fetchApi<Course[]>("/admin/courses");
  },
  getAllResources: async () => {
    return fetchApi<Resource[]>("/admin/resources");
  },
  getAllSessions: async () => {
    return fetchApi<Session[]>("/admin/sessions");
  },
  getAllCommunities: async () => {
    return fetchApi<Community[]>("/admin/communities");
  },
  createCommunity: async (data: {
    name: string;
    description: string;
    category: string;
    isPublic?: boolean;
    rules?: string[];
    discordLink?: string;
    thumbnail?: File;
  }) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("category", data.category);
    if (data.isPublic !== undefined) formData.append("isPublic", data.isPublic.toString());
    if (data.rules) formData.append("rules", JSON.stringify(data.rules));
    if (data.discordLink) formData.append("discordLink", data.discordLink);
    if (data.thumbnail) formData.append("thumbnail", data.thumbnail);

    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/admin/communities`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    return response.json();
  },
  updateCommunity: async (id: string, data: {
    name?: string;
    description?: string;
    category?: string;
    isPublic?: boolean;
    rules?: string[];
    isActive?: boolean;
    discordLink?: string;
    thumbnail?: File;
  }) => {
    const formData = new FormData();
    if (data.name) formData.append("name", data.name);
    if (data.description) formData.append("description", data.description);
    if (data.category) formData.append("category", data.category);
    if (data.isPublic !== undefined) formData.append("isPublic", data.isPublic.toString());
    if (data.isActive !== undefined) formData.append("isActive", data.isActive.toString());
    if (data.rules) formData.append("rules", JSON.stringify(data.rules));
    if (data.discordLink !== undefined) formData.append("discordLink", data.discordLink || "");
    if (data.thumbnail) formData.append("thumbnail", data.thumbnail);

    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/admin/communities/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    return response.json();
  },
  deleteCommunity: async (id: string) => {
    return fetchApi(`/admin/communities/${id}`, { method: "DELETE" });
  },
  deleteUser: async (id: string) => {
    return fetchApi(`/admin/users/${id}`, { method: "DELETE" });
  },
  updateUserRole: async (id: string, role: string) => {
    return fetchApi<User>(`/admin/users/${id}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    });
  },
  deleteCourse: async (id: string) => {
    return fetchApi(`/admin/courses/${id}`, { method: "DELETE" });
  },
  updateCourse: async (id: string, data: {
    title?: string;
    description?: string;
    category?: string;
    level?: string;
    price?: number;
    isFree?: boolean;
    isPublished?: boolean;
    isActive?: boolean;
    thumbnail?: File;
  }) => {
    const formData = new FormData();
    if (data.title) formData.append("title", data.title);
    if (data.description) formData.append("description", data.description);
    if (data.category) formData.append("category", data.category);
    if (data.level) formData.append("level", data.level);
    if (data.price !== undefined) formData.append("price", data.price.toString());
    if (data.isFree !== undefined) formData.append("isFree", data.isFree.toString());
    if (data.isPublished !== undefined) formData.append("isPublished", data.isPublished.toString());
    if (data.isActive !== undefined) formData.append("isActive", data.isActive.toString());
    if (data.thumbnail) formData.append("thumbnail", data.thumbnail);

    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/admin/courses/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    return response.json();
  },
  deleteResource: async (id: string) => {
    return fetchApi(`/admin/resources/${id}`, { method: "DELETE" });
  },
  updateResource: async (id: string, data: {
    title?: string;
    description?: string;
    category?: string;
    price?: number;
    isFree?: boolean;
    isActive?: boolean;
    thumbnail?: File;
  }) => {
    const formData = new FormData();
    if (data.title) formData.append("title", data.title);
    if (data.description) formData.append("description", data.description);
    if (data.category) formData.append("category", data.category);
    if (data.price !== undefined) formData.append("price", data.price.toString());
    if (data.isFree !== undefined) formData.append("isFree", data.isFree.toString());
    if (data.isActive !== undefined) formData.append("isActive", data.isActive.toString());
    if (data.thumbnail) formData.append("thumbnail", data.thumbnail);

    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/admin/resources/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    return response.json();
  },
  deleteSession: async (id: string) => {
    return fetchApi(`/admin/sessions/${id}`, { method: "DELETE" });
  },
};

// Token management
export const tokenManager = {
  setToken: (token: string) => {
    localStorage.setItem("token", token);
  },
  
  getToken: () => {
    return localStorage.getItem("token");
  },
  
  removeToken: () => {
    localStorage.removeItem("token");
  },
};

export { ApiError };

