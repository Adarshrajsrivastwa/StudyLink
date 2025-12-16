import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen, Bell, Search, Menu, X, Home, GraduationCap,
  MessageSquare, Users, LogOut, ChevronRight,
  Play, Clock, Star, Award, Target, Zap, DollarSign,
  Video, FileText, CheckCircle, Circle, ArrowUpRight, User,
  Edit, Save, XCircle, Mail, Phone, MapPin, Shield, CheckCircle2,
  Upload, Trash2, Image as ImageIcon, Plus, TrendingUp, BarChart3,
  Calendar, Eye, Send, MoreVertical, Power, PowerOff, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { authApi, tokenManager, ApiError, mentorApi, courseApi, settingsApi, resourceApi, Resource, sessionApi, Session, communityApi, Community } from "@/lib/api";
import MentorChatFromMentor from "@/components/MentorChatFromMentor";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface UserProfile {
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
}

interface Course {
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
  }>;
  tags: string[];
  enrollmentCount: number;
  rating: number;
  isPublished: boolean;
  isActive?: boolean;
  isEnrolled?: boolean; // Added enrollment status
  enrollmentProgress?: number; // Added enrollment progress
  enrollmentStatus?: string; // Added enrollment status
  createdAt: string;
}

interface Conversation {
  _id: string;
  student: {
    _id: string;
    name: string;
    email: string;
    photoFileName?: string;
  };
  totalMessages: number;
  totalPaid: number;
  lastMessageAt: string;
  unreadCount?: number;
}

interface Earnings {
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
}

const MentorDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showProfile, setShowProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [createCourseOpen, setCreateCourseOpen] = useState(false);
  const [createResourceOpen, setCreateResourceOpen] = useState(false);
  const [editCourseOpen, setEditCourseOpen] = useState(false);
  const [editResourceOpen, setEditResourceOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [scheduleSessionOpen, setScheduleSessionOpen] = useState(false);
  const [editSessionOpen, setEditSessionOpen] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedCourseForSession, setSelectedCourseForSession] = useState<Course | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [discordInviteLink, setDiscordInviteLink] = useState<string | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    address: "",
    role: "",
  });
  
  const [courseFormData, setCourseFormData] = useState({
    title: "",
    description: "",
    category: "other",
    level: "beginner",
    price: 0,
    isFree: true,
    duration: 0,
    tags: "",
  });

  const [resourceFormData, setResourceFormData] = useState({
    title: "",
    description: "",
    category: "other",
    price: 0,
    isFree: true,
    fileUrl: "",
    tags: "",
  });
  const [resourceThumbnailFile, setResourceThumbnailFile] = useState<File | null>(null);
  const [resourceThumbnailPreview, setResourceThumbnailPreview] = useState<string | null>(null);
  const [courseThumbnailFile, setCourseThumbnailFile] = useState<File | null>(null);
  const [courseThumbnailPreview, setCourseThumbnailPreview] = useState<string | null>(null);
  
  const [sessionFormData, setSessionFormData] = useState({
    courseId: "",
    title: "",
    description: "",
    scheduledDate: "",
    scheduledTime: "",
    duration: 60,
    meetingLink: "",
    maxStudents: 50,
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check role and redirect if not a mentor
    const checkRoleAndRedirect = async () => {
      try {
        const response = await authApi.getProfile();
        if (response.user) {
          const userRole = response.user.role;
          // If user is not a mentor/teacher/admin, redirect to student dashboard
          if (userRole !== "teacher" && userRole !== "mentor" && userRole !== "admin" && userRole !== "superadmin") {
            navigate("/dashboard");
            return;
          }
          // Otherwise, continue with mentor dashboard
          setProfile(response.user);
          setFormData({
            name: response.user.name || "",
            mobile: response.user.mobile || "",
            address: response.user.address || "",
            role: response.user.role || "teacher",
          });
        }
      } catch (error) {
        if (error instanceof ApiError) {
          if (error.status === 401) {
            navigate("/auth");
          }
        }
      }
    };
    
    checkRoleAndRedirect();
    fetchDiscordInviteLink();
  }, []);

  useEffect(() => {
    if (activeTab === "courses") {
      fetchCourses();
      fetchSessions();
    } else if (activeTab === "sessions") {
      fetchSessions();
    } else if (activeTab === "resources") {
      fetchResources();
    } else if (activeTab === "chats") {
      fetchConversations();
    } else if (activeTab === "earnings") {
      fetchEarnings();
    } else if (activeTab === "communities") {
      fetchCommunities();
    }
  }, [activeTab]);

  const fetchCommunities = async () => {
    try {
      setIsLoadingCommunities(true);
      const response = await communityApi.getPublicCommunities();
      if (response.success && response.data) {
        setCommunities(response.data);
      } else {
        setCommunities([]);
      }
    } catch (error) {
      console.error("Failed to fetch communities:", error);
      setCommunities([]);
    } finally {
      setIsLoadingCommunities(false);
    }
  };

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await authApi.getProfile();
      if (response.user) {
        setProfile(response.user);
        setFormData({
          name: response.user.name || "",
          mobile: response.user.mobile || "",
          address: response.user.address || "",
          role: response.user.role || "teacher",
        });
      }
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          toast({
            title: "Session expired",
            description: "Please log in again.",
            variant: "destructive",
          });
          tokenManager.removeToken();
          navigate("/auth");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await mentorApi.getMyCourses();
      if (response.success && response.data) {
        setCourses(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch courses:", error);
      toast({
        title: "Error",
        description: "Failed to fetch courses",
        variant: "destructive",
      });
    }
  };

  const fetchResources = async () => {
    try {
      if (!profile?._id) return; // Wait for profile to load
      const response = await resourceApi.getMyResources();
      if (response.success && response.data) {
        setResources(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch resources:", error);
      toast({
        title: "Error",
        description: "Failed to fetch resources",
        variant: "destructive",
      });
    }
  };

  const handleToggleResourceStatus = async (resourceId: string, currentStatus: boolean) => {
    try {
      setIsLoading(true);
      const newStatus = !currentStatus;
      const response = await resourceApi.updateResource(resourceId, {
        isActive: newStatus,
      } as any);

      if (response.success) {
        toast({
          title: "Success",
          description: `Resource ${newStatus ? "activated" : "deactivated"} successfully!`,
        });
        fetchResources(); // Refresh the list
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update resource status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to toggle resource status:", error);
      toast({
        title: "Error",
        description: "Failed to update resource status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCourseStatus = async (courseId: string, currentStatus: boolean) => {
    try {
      setIsLoading(true);
      const newStatus = !currentStatus;
      const course = courses.find(c => c._id === courseId);
      if (!course) return;

      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const token = tokenManager.getToken();
      
      // Create FormData for update
      const formData = new FormData();
      formData.append("title", course.title);
      formData.append("description", course.description);
      formData.append("category", course.category);
      formData.append("level", course.level);
      formData.append("price", (course.isFree ? 0 : course.price).toString());
      formData.append("isFree", course.isFree.toString());
      formData.append("duration", course.duration.toString());
      formData.append("isActive", newStatus.toString());
      if (course.lessons && Array.isArray(course.lessons) && course.lessons.length > 0) {
        formData.append("lessons", JSON.stringify(course.lessons));
      }
      if (course.tags && course.tags.length > 0) {
        formData.append("tags", JSON.stringify(course.tags));
      }

      const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: `Course ${newStatus ? "activated" : "deactivated"} successfully!`,
        });
        fetchCourses(); // Refresh the list
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update course status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to toggle course status:", error);
      toast({
        title: "Error",
        description: "Failed to update course status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await mentorApi.getMyConversations();
      if (response.success && response.data) {
        setConversations(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      toast({
        title: "Error",
        description: "Failed to fetch conversations",
        variant: "destructive",
      });
    }
  };

  const fetchEarnings = async () => {
    try {
      const response = await mentorApi.getMyEarnings();
      if (response.success && response.data) {
        setEarnings(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch earnings:", error);
      toast({
        title: "Error",
        description: "Failed to fetch earnings",
        variant: "destructive",
      });
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await sessionApi.getMySessions();
      if (response.success && response.data) {
        setSessions(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    }
  };

  const handleScheduleSession = (course: Course) => {
    setSelectedCourseForSession(course);
    setSessionFormData({
      courseId: course._id,
      title: `${course.title} - Session`,
      description: "",
      scheduledDate: "",
      scheduledTime: "",
      duration: 60,
      meetingLink: "",
      maxStudents: 50,
    });
    setScheduleSessionOpen(true);
  };

  const handleCreateSession = async () => {
    try {
      if (!sessionFormData.courseId || !sessionFormData.title || !sessionFormData.scheduledDate || !sessionFormData.scheduledTime || !sessionFormData.meetingLink) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      // Combine date and time
      const scheduledDateTime = new Date(`${sessionFormData.scheduledDate}T${sessionFormData.scheduledTime}`);

      setIsLoading(true);
      const response = await sessionApi.createSession({
        courseId: sessionFormData.courseId,
        title: sessionFormData.title,
        description: sessionFormData.description,
        scheduledDate: scheduledDateTime.toISOString(),
        duration: sessionFormData.duration,
        meetingLink: sessionFormData.meetingLink,
        maxStudents: sessionFormData.maxStudents,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Session scheduled successfully!",
        });
        setScheduleSessionOpen(false);
        setSelectedCourseForSession(null);
        fetchSessions();
      }
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSession = (session: Session) => {
    setSelectedSession(session);
    const sessionDate = new Date(session.scheduledDate);
    setSessionFormData({
      courseId: (session.course as any)?._id || "",
      title: session.title,
      description: session.description || "",
      scheduledDate: sessionDate.toISOString().split('T')[0],
      scheduledTime: sessionDate.toTimeString().slice(0, 5),
      duration: session.duration || 60,
      meetingLink: session.meetingLink,
      maxStudents: session.maxStudents || 50,
    });
    setEditSessionOpen(true);
  };

  const handleUpdateSession = async () => {
    try {
      if (!selectedSession || !sessionFormData.courseId || !sessionFormData.title || !sessionFormData.scheduledDate || !sessionFormData.scheduledTime || !sessionFormData.meetingLink) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      // Combine date and time
      const scheduledDateTime = new Date(`${sessionFormData.scheduledDate}T${sessionFormData.scheduledTime}`);

      setIsLoading(true);
      const response = await sessionApi.updateSession(selectedSession._id, {
        title: sessionFormData.title,
        description: sessionFormData.description,
        scheduledDate: scheduledDateTime.toISOString(),
        duration: sessionFormData.duration,
        meetingLink: sessionFormData.meetingLink,
        maxStudents: sessionFormData.maxStudents,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Session updated successfully!",
        });
        setEditSessionOpen(false);
        setSelectedSession(null);
        fetchSessions();
      }
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this session? This action cannot be undone.")) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await sessionApi.deleteSession(sessionId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Session deleted successfully!",
        });
        fetchSessions();
      }
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinSession = (meetingLink: string) => {
    window.open(meetingLink, "_blank");
  };

  const fetchDiscordInviteLink = async () => {
    try {
      const response = await settingsApi.getDiscordInviteLink();
      if (response.success && response.data) {
        setDiscordInviteLink(response.data.inviteLink);
      }
    } catch (error) {
      console.error("Failed to fetch Discord invite link:", error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);
      const response = await authApi.updateProfile({
        name: formData.name,
        mobile: formData.mobile || null,
        address: formData.address || null,
        role: formData.role,
        photo: selectedFile || undefined,
      });

      if (response.user) {
        setProfile(response.user);
        setIsEditing(false);
        setSelectedFile(null);
        setPreviewUrl(null);
        toast({
          title: "Success",
          description: "Profile updated successfully!",
        });
      }
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCourse = async () => {
    try {
      setIsLoading(true);
      const tags = courseFormData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const token = tokenManager.getToken();
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("title", courseFormData.title);
      formData.append("description", courseFormData.description);
      formData.append("category", courseFormData.category);
      formData.append("level", courseFormData.level);
      formData.append("price", (courseFormData.isFree ? 0 : courseFormData.price).toString());
      formData.append("isFree", courseFormData.isFree.toString());
      formData.append("duration", courseFormData.duration.toString());
      formData.append("lessons", JSON.stringify([]));
      if (tags.length > 0) {
        formData.append("tags", JSON.stringify(tags));
      }
      if (courseThumbnailFile) {
        formData.append("thumbnail", courseThumbnailFile);
      }

      const response = await fetch(`${API_BASE_URL}/courses`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Course created successfully!",
        });
        setCreateCourseOpen(false);
        setCourseFormData({
          title: "",
          description: "",
          category: "other",
          level: "beginner",
          price: 0,
          isFree: true,
          duration: 0,
          tags: "",
        });
        setCourseThumbnailFile(null);
        setCourseThumbnailPreview(null);
        fetchCourses();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create course",
          variant: "destructive",
        });
      }
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to create course",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setCourseFormData({
      title: course.title,
      description: course.description,
      category: course.category,
      level: course.level,
      price: course.price || 0,
      isFree: course.isFree || false,
      duration: course.duration || 0,
      tags: course.tags ? course.tags.join(", ") : "",
    });
    setCourseThumbnailPreview(course.thumbnailUrl || null);
    setCourseThumbnailFile(null);
    setEditCourseOpen(true);
  };

  const handleUpdateCourse = async () => {
    try {
      if (!selectedCourse) return;
      
      setIsLoading(true);
      const tags = courseFormData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const token = tokenManager.getToken();
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("title", courseFormData.title);
      formData.append("description", courseFormData.description);
      formData.append("category", courseFormData.category);
      formData.append("level", courseFormData.level);
      formData.append("price", (courseFormData.isFree ? 0 : courseFormData.price).toString());
      formData.append("isFree", courseFormData.isFree.toString());
      formData.append("duration", courseFormData.duration.toString());
      // Only append lessons if they exist and are not empty
      if (selectedCourse.lessons && Array.isArray(selectedCourse.lessons) && selectedCourse.lessons.length > 0) {
        formData.append("lessons", JSON.stringify(selectedCourse.lessons));
      }
      if (tags.length > 0) {
        formData.append("tags", JSON.stringify(tags));
      }
      if (courseThumbnailFile) {
        formData.append("thumbnail", courseThumbnailFile);
      }

      const response = await fetch(`${API_BASE_URL}/courses/${selectedCourse._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Course updated successfully!",
        });
        setEditCourseOpen(false);
        setSelectedCourse(null);
        setCourseThumbnailFile(null);
        setCourseThumbnailPreview(null);
        fetchCourses();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update course",
          variant: "destructive",
        });
      }
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update course",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await courseApi.deleteCourse(courseId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Course deleted successfully!",
        });
        fetchCourses();
      }
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickThumbnailUpload = (course: Course) => {
    setSelectedCourse(course);
    setCourseThumbnailPreview(course.thumbnailUrl || null);
    setCourseThumbnailFile(null);
    setEditCourseOpen(true);
  };

  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>, course: Course) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select a JPEG, PNG, or WebP image.",
          variant: "destructive",
        });
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      // Set the file and preview
      setCourseThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCourseThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Immediately update the course with the new thumbnail
      handleUpdateCourseThumbnail(course._id, file);
    }
  };

  const handleUpdateCourseThumbnail = async (courseId: string, thumbnailFile: File) => {
    try {
      setIsLoading(true);
      const course = courses.find(c => c._id === courseId);
      if (!course) return;

      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const token = tokenManager.getToken();
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("title", course.title);
      formData.append("description", course.description);
      formData.append("category", course.category);
      formData.append("level", course.level);
      formData.append("price", (course.isFree ? 0 : course.price).toString());
      formData.append("isFree", course.isFree.toString());
      formData.append("duration", course.duration.toString());
      // Only append lessons if they exist and are not empty
      if (course.lessons && Array.isArray(course.lessons) && course.lessons.length > 0) {
        formData.append("lessons", JSON.stringify(course.lessons));
      }
      if (course.tags && course.tags.length > 0) {
        formData.append("tags", JSON.stringify(course.tags));
      }
      formData.append("thumbnail", thumbnailFile);

      const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Course thumbnail updated successfully!",
        });
        setCourseThumbnailFile(null);
        setCourseThumbnailPreview(null);
        fetchCourses();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update thumbnail",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update thumbnail",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditResource = (resource: Resource) => {
    setSelectedResource(resource);
    setResourceFormData({
      title: resource.title,
      description: resource.description,
      category: resource.category,
      price: resource.price || 0,
      isFree: resource.isFree || false,
      fileUrl: resource.fileUrl || "",
      tags: resource.tags.join(", "),
    });
    setResourceThumbnailPreview(resource.thumbnailUrl || null);
    setEditResourceOpen(true);
  };

  const handleUpdateResource = async () => {
    try {
      if (!selectedResource) return;
      
      setIsLoading(true);
      const tags = resourceFormData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const token = tokenManager.getToken();
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("title", resourceFormData.title);
      formData.append("description", resourceFormData.description);
      formData.append("category", resourceFormData.category);
      const priceToSend = resourceFormData.isFree ? 0 : (resourceFormData.price || 0);
      formData.append("price", priceToSend.toString());
      formData.append("isFree", resourceFormData.isFree.toString());
      if (resourceFormData.fileUrl) {
        formData.append("fileUrl", resourceFormData.fileUrl);
      }
      if (tags.length > 0) {
        formData.append("tags", JSON.stringify(tags));
      }
      if (resourceThumbnailFile) {
        formData.append("thumbnail", resourceThumbnailFile);
      }

      const response = await fetch(`${API_BASE_URL}/resources/${selectedResource._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Resource updated successfully!",
        });
        setEditResourceOpen(false);
        setSelectedResource(null);
        setResourceThumbnailFile(null);
        setResourceThumbnailPreview(null);
        fetchResources();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update resource",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to update resource:", error);
      toast({
        title: "Error",
        description: "Failed to update resource",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!confirm("Are you sure you want to delete this resource? This action cannot be undone.")) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await resourceApi.deleteResource(resourceId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Resource deleted successfully!",
        });
        fetchResources();
      }
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateResource = async () => {
    try {
      setIsLoading(true);
      const tags = resourceFormData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const token = tokenManager.getToken();
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("title", resourceFormData.title);
      formData.append("description", resourceFormData.description);
      formData.append("category", resourceFormData.category);
      const priceToSend = resourceFormData.isFree ? 0 : (resourceFormData.price || 0);
      formData.append("price", priceToSend.toString());
      formData.append("isFree", resourceFormData.isFree.toString());
      if (resourceFormData.fileUrl) {
        formData.append("fileUrl", resourceFormData.fileUrl);
      }
      if (tags.length > 0) {
        formData.append("tags", JSON.stringify(tags));
      }
      if (resourceThumbnailFile) {
        formData.append("thumbnail", resourceThumbnailFile);
      }

      const response = await fetch(`${API_BASE_URL}/resources`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Resource created successfully!",
        });
        setCreateResourceOpen(false);
        setResourceFormData({
          title: "",
          description: "",
          category: "other",
          price: 0,
          isFree: true,
          fileUrl: "",
          tags: "",
        });
        setResourceThumbnailFile(null);
        setResourceThumbnailPreview(null);
        fetchResources();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create resource",
          variant: "destructive",
        });
      }
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to create resource",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChat = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setChatOpen(true);
  };

  const handleLogout = () => {
    tokenManager.removeToken();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/auth");
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      programming: "bg-blue-500/10 text-blue-500",
      mathematics: "bg-green-500/10 text-green-500",
      science: "bg-purple-500/10 text-purple-500",
      language: "bg-orange-500/10 text-orange-500",
      business: "bg-pink-500/10 text-pink-500",
      design: "bg-yellow-500/10 text-yellow-500",
      other: "bg-gray-500/10 text-gray-500",
    };
    return colors[category] || colors.other;
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      beginner: "bg-green-500/10 text-green-500",
      intermediate: "bg-yellow-500/10 text-yellow-500",
      advanced: "bg-red-500/10 text-red-500",
    };
    return colors[level] || colors.beginner;
  };

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is a mentor
  if (profile.role !== "teacher" && profile.role !== "mentor" && profile.role !== "admin" && profile.role !== "superadmin") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>This dashboard is only for mentors.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/dashboard")} className="w-full">
              Go to Student Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 glass-dark z-50 transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-white">Study Link</span>
          </Link>

          {/* Navigation */}
          <nav className="space-y-2">
            {[
              { icon: Home, label: "Overview", tab: "overview" },
              { icon: User, label: "Profile", tab: "profile" },
              { icon: GraduationCap, label: "My Courses", tab: "courses" },
              { icon: Calendar, label: "Sessions", tab: "sessions" },
              { icon: FileText, label: "Resources", tab: "resources" },
              { icon: MessageSquare, label: "Chats", tab: "chats" },
              { icon: MessageSquare, label: "Communities", tab: "communities" },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  if (item.tab) {
                    setActiveTab(item.tab);
                    setShowProfile(item.tab === "profile");
                  } else if (item.onClick) {
                    item.onClick();
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  (item.tab === activeTab && !showProfile) || (item.tab === "profile" && showProfile)
                    ? "gradient-primary text-primary-foreground shadow-soft"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* User Profile */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/10">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 ring-2 ring-primary">
              <AvatarImage src={profile?.photoFileName || ""} />
              <AvatarFallback className="gradient-primary text-primary-foreground font-bold">
                {getInitials(profile?.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-white font-medium text-sm">{profile?.name || "User"}</p>
              <p className="text-white/50 text-xs">{profile?.email || "Loading..."}</p>
            </div>
            <Button variant="ghost" size="icon" className="text-white/50 hover:text-white hover:bg-white/10" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72">
        {/* Header */}
        <header className="sticky top-0 z-30 glass border-b border-border/50">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-muted rounded-lg"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="font-display text-xl lg:text-2xl font-bold">
                  {showProfile ? "My Profile" : `Welcome, ${profile?.name || "Mentor"}! 👋`}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {showProfile ? "Manage your profile" : "Manage your courses and connect with students"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!showProfile && activeTab === "resources" && (
                <Dialog open={createResourceOpen} onOpenChange={setCreateResourceOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Resource
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Resource</DialogTitle>
                      <DialogDescription>Fill in the details to create a new resource</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="resource-title">Resource Title *</Label>
                        <Input
                          id="resource-title"
                          value={resourceFormData.title}
                          onChange={(e) => setResourceFormData({ ...resourceFormData, title: e.target.value })}
                          placeholder="Enter resource title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="resource-description">Description *</Label>
                        <Textarea
                          id="resource-description"
                          value={resourceFormData.description}
                          onChange={(e) => setResourceFormData({ ...resourceFormData, description: e.target.value })}
                          placeholder="Enter resource description"
                          rows={4}
                        />
                      </div>
                      <div>
                        <Label htmlFor="resource-category">Category *</Label>
                        <Select
                          value={resourceFormData.category}
                          onValueChange={(value) => setResourceFormData({ ...resourceFormData, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="course">Course</SelectItem>
                            <SelectItem value="ebook">E-Book</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="document">Document</SelectItem>
                            <SelectItem value="software">Software</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="resource-tags">Tags (comma separated)</Label>
                        <Input
                          id="resource-tags"
                          value={resourceFormData.tags}
                          onChange={(e) => setResourceFormData({ ...resourceFormData, tags: e.target.value })}
                          placeholder="tag1, tag2, tag3"
                        />
                      </div>
                      <div>
                        <Label htmlFor="resource-file-url">File URL</Label>
                        <Input
                          id="resource-file-url"
                          value={resourceFormData.fileUrl}
                          onChange={(e) => setResourceFormData({ ...resourceFormData, fileUrl: e.target.value })}
                          placeholder="https://example.com/resource.pdf"
                        />
                        <p className="text-xs text-muted-foreground mt-1">URL to the resource file (e.g., PDF, video, etc.)</p>
                      </div>
                      <div>
                        <Label htmlFor="resource-thumbnail">Thumbnail Image</Label>
                        <div className="space-y-2">
                          {resourceThumbnailPreview && (
                            <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                              <img
                                src={resourceThumbnailPreview}
                                alt="Thumbnail preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <Input
                            id="resource-thumbnail"
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                // Validate file type
                                const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
                                if (!validTypes.includes(file.type)) {
                                  toast({
                                    title: "Invalid file type",
                                    description: "Please select a JPEG, PNG, or WebP image.",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                // Validate file size (max 5MB)
                                if (file.size > 5 * 1024 * 1024) {
                                  toast({
                                    title: "File too large",
                                    description: "Please select an image smaller than 5MB.",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                setResourceThumbnailFile(file);
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setResourceThumbnailPreview(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <p className="text-xs text-muted-foreground">Upload thumbnail image (optional - default will be used if not provided)</p>
                        </div>
                      </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="resource-isFree-2"
                              checked={resourceFormData.isFree}
                              onChange={(e) => {
                                const isFree = e.target.checked;
                                setResourceFormData({ 
                                  ...resourceFormData, 
                                  isFree: isFree, 
                                  price: isFree ? 0 : (resourceFormData.price || 0)
                                });
                              }}
                              className="w-4 h-4"
                            />
                            <Label htmlFor="resource-isFree-2" className="cursor-pointer">Free Resource</Label>
                          </div>
                          {!resourceFormData.isFree && (
                            <div>
                              <Label htmlFor="resource-price-2">Price (INR) *</Label>
                              <Input
                                id="resource-price-2"
                                type="number"
                                value={resourceFormData.price || ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setResourceFormData({ 
                                    ...resourceFormData, 
                                    price: value === "" ? 0 : parseFloat(value) || 0 
                                  });
                                }}
                                placeholder="Enter price"
                                min="0"
                                step="0.01"
                              />
                              <p className="text-xs text-muted-foreground mt-1">Amount students need to pay to purchase this resource</p>
                            </div>
                          )}
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setCreateResourceOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateResource} disabled={isLoading || !resourceFormData.title || !resourceFormData.description}>
                          {isLoading ? "Creating..." : "Create Resource"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              {!showProfile && activeTab === "courses" && (
                <Dialog open={createCourseOpen} onOpenChange={setCreateCourseOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Course
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Course</DialogTitle>
                      <DialogDescription>Fill in the details to create a new course</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Course Title *</Label>
                        <Input
                          id="title"
                          value={courseFormData.title}
                          onChange={(e) => setCourseFormData({ ...courseFormData, title: e.target.value })}
                          placeholder="Enter course title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                          id="description"
                          value={courseFormData.description}
                          onChange={(e) => setCourseFormData({ ...courseFormData, description: e.target.value })}
                          placeholder="Enter course description"
                          rows={4}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="category">Category *</Label>
                          <Select
                            value={courseFormData.category}
                            onValueChange={(value) => setCourseFormData({ ...courseFormData, category: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="programming">Programming</SelectItem>
                              <SelectItem value="mathematics">Mathematics</SelectItem>
                              <SelectItem value="science">Science</SelectItem>
                              <SelectItem value="language">Language</SelectItem>
                              <SelectItem value="business">Business</SelectItem>
                              <SelectItem value="design">Design</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="level">Level *</Label>
                          <Select
                            value={courseFormData.level}
                            onValueChange={(value) => setCourseFormData({ ...courseFormData, level: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="duration">Duration (hours)</Label>
                          <Input
                            id="duration"
                            type="number"
                            value={courseFormData.duration}
                            onChange={(e) => setCourseFormData({ ...courseFormData, duration: parseInt(e.target.value) || 0 })}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor="tags">Tags (comma separated)</Label>
                          <Input
                            id="tags"
                            value={courseFormData.tags}
                            onChange={(e) => setCourseFormData({ ...courseFormData, tags: e.target.value })}
                            placeholder="tag1, tag2, tag3"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isFree"
                          checked={courseFormData.isFree}
                          onChange={(e) => setCourseFormData({ ...courseFormData, isFree: e.target.checked, price: e.target.checked ? 0 : courseFormData.price })}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="isFree" className="cursor-pointer">Free Course</Label>
                      </div>
                      {!courseFormData.isFree && (
                        <div>
                          <Label htmlFor="price">Price (INR) *</Label>
                          <Input
                            id="price"
                            type="number"
                            value={courseFormData.price}
                            onChange={(e) => setCourseFormData({ ...courseFormData, price: parseFloat(e.target.value) || 0 })}
                            placeholder="0"
                          />
                        </div>
                      )}
                      <div>
                        <Label htmlFor="course-thumbnail-header">Thumbnail Image</Label>
                        <div className="space-y-2">
                          {courseThumbnailPreview && (
                            <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                              <img
                                src={courseThumbnailPreview}
                                alt="Thumbnail preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <Input
                            id="course-thumbnail-header"
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                // Validate file type
                                const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
                                if (!validTypes.includes(file.type)) {
                                  toast({
                                    title: "Invalid file type",
                                    description: "Please select a JPEG, PNG, or WebP image.",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                // Validate file size (max 5MB)
                                if (file.size > 5 * 1024 * 1024) {
                                  toast({
                                    title: "File too large",
                                    description: "Please select an image smaller than 5MB.",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                setCourseThumbnailFile(file);
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setCourseThumbnailPreview(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <p className="text-xs text-muted-foreground">Upload thumbnail image (optional - default will be used if not provided)</p>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => {
                          setCreateCourseOpen(false);
                          setCourseThumbnailFile(null);
                          setCourseThumbnailPreview(null);
                        }}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateCourse} disabled={isLoading || !courseFormData.title || !courseFormData.description}>
                          {isLoading ? "Creating..." : "Create Course"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 lg:p-8">
          {showProfile ? (
            /* Profile Section - Similar to student dashboard */
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Profile Settings</CardTitle>
                      <CardDescription>Manage your account information</CardDescription>
                    </div>
                    {!isEditing && (
                      <Button onClick={() => setIsEditing(true)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Picture */}
                  <div className="flex items-center gap-6">
                    <Avatar className="w-24 h-24 ring-4 ring-primary/20">
                      <AvatarImage src={previewUrl || profile.photoFileName || ""} />
                      <AvatarFallback className="gradient-primary text-primary-foreground text-2xl font-bold">
                        {getInitials(profile.name)}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <div className="space-y-2">
                        <input
                          type="file"
                          id="profile-picture"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setSelectedFile(file);
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setPreviewUrl(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById("profile-picture")?.click()}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {selectedFile ? "Change" : "Upload"} Photo
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <div>
                    <Label>Full Name</Label>
                    {isEditing ? (
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm font-medium mt-1">{profile.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <Label>Email</Label>
                    <Input value={profile.email} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                  </div>

                  {/* Mobile */}
                  <div>
                    <Label>Mobile Number</Label>
                    {isEditing ? (
                      <Input
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm font-medium mt-1">{profile.mobile || "Not set"}</p>
                    )}
                  </div>

                  {/* Address */}
                  <div>
                    <Label>Address</Label>
                    {isEditing ? (
                      <Input
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm font-medium mt-1">{profile.address || "Not set"}</p>
                    )}
                  </div>

                  {isEditing && (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => {
                        setIsEditing(false);
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        fetchProfile();
                      }}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveProfile} disabled={isLoading}>
                        {isLoading ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Dashboard Content */
            <div className="space-y-6">
              {activeTab === "overview" && (
                <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "Total Courses", value: courses.length, icon: GraduationCap, color: "primary" },
                      { label: "Total Students", value: conversations.length, icon: Users, color: "secondary" },
                      { label: "Total Earnings", value: `₹${earnings?.totalEarnings.toFixed(2) || "0.00"}`, icon: DollarSign, color: "accent" },
                      { label: "Unread Messages", value: conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0), icon: MessageSquare, color: "primary" },
                    ].map((stat, i) => (
                      <Card key={stat.label} className="hover-lift">
                        <CardContent className="p-5">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                            stat.color === "primary" ? "gradient-primary" :
                            stat.color === "secondary" ? "gradient-secondary" : "bg-accent"
                          }`}>
                            <stat.icon className="w-6 h-6 text-white" />
                          </div>
                          <p className="text-muted-foreground text-sm">{stat.label}</p>
                          <p className="font-display text-2xl font-bold">{stat.value}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Earnings Summary */}
                  {earnings && (
                    <div className="grid lg:grid-cols-3 gap-6 mb-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-primary" />
                            Total Earnings
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-3xl font-bold text-primary">₹{earnings.totalEarnings.toFixed(2)}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-green-500" />
                            Course Earnings
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-3xl font-bold text-green-500">₹{earnings.courseEarnings.toFixed(2)}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-blue-500" />
                            Chat Earnings
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-3xl font-bold text-blue-500">₹{earnings.chatEarnings.toFixed(2)}</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Recent Activity */}
                  <div className="grid lg:grid-cols-2 gap-6 mb-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Courses</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {courses.length === 0 ? (
                          <p className="text-muted-foreground text-sm">No courses yet. Create your first course!</p>
                        ) : (
                          <div className="space-y-3">
                            {courses.slice(0, 5).map((course) => (
                              <div key={course._id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <div>
                                  <p className="font-medium">{course.title}</p>
                                  <p className="text-sm text-muted-foreground">{course.enrollmentCount} students</p>
                                </div>
                                <Badge className={course.isPublished ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"}>
                                  {course.isPublished ? "Published" : "Draft"}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Conversations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {conversations.length === 0 ? (
                          <p className="text-muted-foreground text-sm">No conversations yet.</p>
                        ) : (
                          <div className="space-y-3">
                            {conversations.slice(0, 5).map((conv) => (
                              <div
                                key={conv._id}
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                                onClick={() => handleOpenChat(conv)}
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-10 h-10">
                                    <AvatarFallback>{getInitials(conv.student.name)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{conv.student.name}</p>
                                    <p className="text-sm text-muted-foreground">{conv.totalMessages} messages</p>
                                  </div>
                                </div>
                                {conv.unreadCount && conv.unreadCount > 0 && (
                                  <Badge className="bg-primary">{conv.unreadCount}</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Monthly Earnings Chart */}
                  {earnings && earnings.monthlyEarnings.length > 0 && (
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle>Monthly Earnings (Last 6 Months)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {earnings.monthlyEarnings.map((month, i) => (
                            <div key={i} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{month.month}</span>
                                <span className="font-bold">₹{month.total.toFixed(2)}</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full transition-all"
                                  style={{ width: `${(month.total / Math.max(...earnings.monthlyEarnings.map(m => m.total))) * 100}%` }}
                                />
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>Courses: ₹{month.courseEarnings.toFixed(2)}</span>
                                <span>Chats: ₹{month.chatEarnings.toFixed(2)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Recent Earnings */}
                  {earnings && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Earnings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {earnings.recentEarnings.length === 0 ? (
                          <p className="text-muted-foreground text-sm">No earnings yet</p>
                        ) : (
                          <div className="space-y-3">
                            {earnings.recentEarnings.map((earning, i) => (
                              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <div>
                                  <p className="font-medium">
                                    {earning.type === "course" ? earning.courseTitle : `Chat with ${earning.studentName}`}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(earning.date).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-primary">₹{earning.amount.toFixed(2)}</p>
                                  <Badge variant="outline" className="text-xs">
                                    {earning.type}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {activeTab === "courses" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-display text-2xl font-bold">My Courses</h2>
                    <Dialog open={createCourseOpen} onOpenChange={setCreateCourseOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Course
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Create New Course</DialogTitle>
                          <DialogDescription>Fill in the details to create a new course</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="title">Course Title *</Label>
                            <Input
                              id="title"
                              value={courseFormData.title}
                              onChange={(e) => setCourseFormData({ ...courseFormData, title: e.target.value })}
                              placeholder="Enter course title"
                            />
                          </div>
                          <div>
                            <Label htmlFor="description">Description *</Label>
                            <Textarea
                              id="description"
                              value={courseFormData.description}
                              onChange={(e) => setCourseFormData({ ...courseFormData, description: e.target.value })}
                              placeholder="Enter course description"
                              rows={4}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="category">Category *</Label>
                              <Select
                                value={courseFormData.category}
                                onValueChange={(value) => setCourseFormData({ ...courseFormData, category: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="programming">Programming</SelectItem>
                                  <SelectItem value="mathematics">Mathematics</SelectItem>
                                  <SelectItem value="science">Science</SelectItem>
                                  <SelectItem value="language">Language</SelectItem>
                                  <SelectItem value="business">Business</SelectItem>
                                  <SelectItem value="design">Design</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="level">Level *</Label>
                              <Select
                                value={courseFormData.level}
                                onValueChange={(value) => setCourseFormData({ ...courseFormData, level: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="beginner">Beginner</SelectItem>
                                  <SelectItem value="intermediate">Intermediate</SelectItem>
                                  <SelectItem value="advanced">Advanced</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="duration">Duration (hours)</Label>
                              <Input
                                id="duration"
                                type="number"
                                value={courseFormData.duration}
                                onChange={(e) => setCourseFormData({ ...courseFormData, duration: parseInt(e.target.value) || 0 })}
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <Label htmlFor="tags">Tags (comma separated)</Label>
                              <Input
                                id="tags"
                                value={courseFormData.tags}
                                onChange={(e) => setCourseFormData({ ...courseFormData, tags: e.target.value })}
                                placeholder="tag1, tag2, tag3"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="isFree"
                              checked={courseFormData.isFree}
                              onChange={(e) => setCourseFormData({ ...courseFormData, isFree: e.target.checked, price: e.target.checked ? 0 : courseFormData.price })}
                              className="w-4 h-4"
                            />
                            <Label htmlFor="isFree" className="cursor-pointer">Free Course</Label>
                          </div>
                          {!courseFormData.isFree && (
                            <div>
                              <Label htmlFor="price">Price (INR) *</Label>
                              <Input
                                id="price"
                                type="number"
                                value={courseFormData.price}
                                onChange={(e) => setCourseFormData({ ...courseFormData, price: parseFloat(e.target.value) || 0 })}
                                placeholder="0"
                              />
                            </div>
                          )}
                          <div>
                            <Label htmlFor="course-thumbnail">Thumbnail Image</Label>
                            <div className="space-y-2">
                              {courseThumbnailPreview && (
                                <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                                  <img
                                    src={courseThumbnailPreview}
                                    alt="Thumbnail preview"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <Input
                                id="course-thumbnail"
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    // Validate file type
                                    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
                                    if (!validTypes.includes(file.type)) {
                                      toast({
                                        title: "Invalid file type",
                                        description: "Please select a JPEG, PNG, or WebP image.",
                                        variant: "destructive",
                                      });
                                      return;
                                    }
                                    // Validate file size (max 5MB)
                                    if (file.size > 5 * 1024 * 1024) {
                                      toast({
                                        title: "File too large",
                                        description: "Please select an image smaller than 5MB.",
                                        variant: "destructive",
                                      });
                                      return;
                                    }
                                    setCourseThumbnailFile(file);
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setCourseThumbnailPreview(reader.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                              <p className="text-xs text-muted-foreground">Upload thumbnail image (optional - default will be used if not provided)</p>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => {
                              setCreateCourseOpen(false);
                              setCourseThumbnailFile(null);
                              setCourseThumbnailPreview(null);
                            }}>
                              Cancel
                            </Button>
                            <Button onClick={handleCreateCourse} disabled={isLoading || !courseFormData.title || !courseFormData.description}>
                              {isLoading ? "Creating..." : "Create Course"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {courses.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
                        <p className="text-muted-foreground mb-4">Create your first course to get started</p>
                        <Button onClick={() => setCreateCourseOpen(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Course
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {courses.map((course) => (
                        <Card key={course._id} className="hover-lift">
                          <CardHeader>
                            <div className="flex items-start justify-between mb-2">
                              <CardTitle className="line-clamp-2 flex-1">{course.title}</CardTitle>
                              <div className="flex flex-col items-end gap-2 ml-2">
                                <Badge className={course.isFree ? "bg-green-500/10 text-green-500" : "bg-primary/10 text-primary"}>
                                  {course.isFree ? "Free" : `₹${course.price ?? 0}`}
                                </Badge>
                                <Badge className={course.isPublished ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"}>
                                  {course.isPublished ? "Published" : "Draft"}
                                </Badge>
                                <Badge 
                                  className={course.isActive !== false ? "bg-green-500/10 text-green-500" : "bg-gray-500/10 text-gray-500"}
                                  variant="outline"
                                >
                                  {course.isActive !== false ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                            </div>
                            <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="mb-4 relative group">
                              {course.thumbnailUrl ? (
                                <>
                                  <img 
                                    src={course.thumbnailUrl} 
                                    alt={course.title}
                                    className="w-full h-32 object-cover rounded-lg"
                                    onError={(e) => {
                                      // Fallback to default image if thumbnail fails to load
                                      (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x200?text=Course+Image";
                                    }}
                                  />
                                  {!course.isEnrolled && (
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                      <label className="cursor-pointer">
                                        <input
                                          type="file"
                                          accept="image/jpeg,image/jpg,image/png,image/webp"
                                          className="hidden"
                                          onChange={(e) => handleThumbnailFileChange(e, course)}
                                          disabled={isLoading}
                                        />
                                        <Button
                                          variant="secondary"
                                          size="sm"
                                          className="pointer-events-none"
                                          disabled={isLoading}
                                        >
                                          <ImageIcon className="w-4 h-4 mr-2" />
                                          Change Photo
                                        </Button>
                                      </label>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="w-full h-32 border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center bg-muted/30 relative overflow-hidden">
                                  <img 
                                    src="https://via.placeholder.com/400x200?text=Course+Image"
                                    alt="Default course image"
                                    className="w-full h-full object-cover opacity-50"
                                  />
                                  {!course.isEnrolled && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                      <label className="cursor-pointer flex flex-col items-center gap-2 z-10">
                                        <input
                                          type="file"
                                          accept="image/jpeg,image/jpg,image/png,image/webp"
                                          className="hidden"
                                          onChange={(e) => handleThumbnailFileChange(e, course)}
                                          disabled={isLoading}
                                        />
                                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">Add Photo</span>
                                      </label>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 mb-4">
                              <Badge className={getCategoryColor(course.category)}>{course.category}</Badge>
                              <Badge className={getLevelColor(course.level)}>{course.level}</Badge>
                              {course.tags && Array.isArray(course.tags) && course.tags.length > 0 && course.tags.slice(0, 2).map((tag, i) => (
                                <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                              ))}
                            </div>
                            <div className="space-y-2 mb-4">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Students</span>
                                <span className="font-medium">{course.enrollmentCount ?? 0}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Price</span>
                                <span className="font-medium">
                                  {course.isFree ? "Free" : `₹${course.price ?? 0}`}
                                </span>
                              </div>
                              {course.duration && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Duration</span>
                                  <span className="font-medium">{course.duration} hours</span>
                                </div>
                              )}
                              {course.tags && Array.isArray(course.tags) && course.tags.length > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Tags</span>
                                  <span className="font-medium text-xs">
                                    {course.tags.slice(0, 3).join(", ")}
                                    {course.tags.length > 3 && ` +${course.tags.length - 3}`}
                                  </span>
                                </div>
                              )}
                              {course.isEnrolled && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Your Status</span>
                                  <Badge className="bg-green-500/10 text-green-500">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Enrolled
                                  </Badge>
                                </div>
                              )}
                              {course.isEnrolled && course.enrollmentProgress !== undefined && (
                                <div className="mt-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-muted-foreground">Progress</span>
                                    <span className="text-xs font-medium">{course.enrollmentProgress}%</span>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-1.5">
                                    <div
                                      className="bg-primary h-1.5 rounded-full transition-all"
                                      style={{ width: `${course.enrollmentProgress}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                            {!course.isEnrolled && (
                              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg mb-4">
                                <div className="flex items-center gap-2">
                                  {course.isActive !== false ? (
                                    <Power className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <PowerOff className="w-4 h-4 text-gray-500" />
                                  )}
                                  <span className="text-sm font-medium">
                                    {course.isActive !== false ? "Active" : "Inactive"}
                                  </span>
                                </div>
                                <Switch
                                  checked={course.isActive !== false}
                                  onCheckedChange={() => handleToggleCourseStatus(course._id, course.isActive !== false)}
                                  disabled={isLoading}
                                />
                              </div>
                            )}
                            <div className="space-y-2">
                              <Button 
                                variant="outline" 
                                className="w-full" 
                                onClick={() => handleScheduleSession(course)}
                              >
                                <Calendar className="w-4 h-4 mr-2" />
                                Schedule Session
                              </Button>
                              {!course.isEnrolled && (
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    className="flex-1" 
                                    onClick={() => handleEditCourse(course)}
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    className="flex-1" 
                                    onClick={() => handleDeleteCourse(course._id)}
                                    disabled={isLoading}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "resources" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-display text-2xl font-bold">My Resources</h2>
                    <Dialog open={createResourceOpen} onOpenChange={setCreateResourceOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Resource
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Create New Resource</DialogTitle>
                          <DialogDescription>Fill in the details to create a new resource</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="resource-title">Resource Title *</Label>
                            <Input
                              id="resource-title"
                              value={resourceFormData.title}
                              onChange={(e) => setResourceFormData({ ...resourceFormData, title: e.target.value })}
                              placeholder="Enter resource title"
                            />
                          </div>
                          <div>
                            <Label htmlFor="resource-description">Description *</Label>
                            <Textarea
                              id="resource-description"
                              value={resourceFormData.description}
                              onChange={(e) => setResourceFormData({ ...resourceFormData, description: e.target.value })}
                              placeholder="Enter resource description"
                              rows={4}
                            />
                          </div>
                          <div>
                            <Label htmlFor="resource-category">Category *</Label>
                            <Select
                              value={resourceFormData.category}
                              onValueChange={(value) => setResourceFormData({ ...resourceFormData, category: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="course">Course</SelectItem>
                                <SelectItem value="ebook">E-Book</SelectItem>
                                <SelectItem value="video">Video</SelectItem>
                                <SelectItem value="document">Document</SelectItem>
                                <SelectItem value="software">Software</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="resource-tags">Tags (comma separated)</Label>
                            <Input
                              id="resource-tags"
                              value={resourceFormData.tags}
                              onChange={(e) => setResourceFormData({ ...resourceFormData, tags: e.target.value })}
                              placeholder="tag1, tag2, tag3"
                            />
                          </div>
                          <div>
                            <Label htmlFor="resource-file-url">File URL</Label>
                            <Input
                              id="resource-file-url"
                              value={resourceFormData.fileUrl}
                              onChange={(e) => setResourceFormData({ ...resourceFormData, fileUrl: e.target.value })}
                              placeholder="https://example.com/resource.pdf"
                            />
                            <p className="text-xs text-muted-foreground mt-1">URL to the resource file (e.g., PDF, video, etc.)</p>
                          </div>
                          <div>
                            <Label htmlFor="resource-thumbnail">Thumbnail Image</Label>
                            <div className="space-y-2">
                              {resourceThumbnailPreview && (
                                <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                                  <img
                                    src={resourceThumbnailPreview}
                                    alt="Thumbnail preview"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <Input
                                id="resource-thumbnail"
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    // Validate file type
                                    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
                                    if (!validTypes.includes(file.type)) {
                                      toast({
                                        title: "Invalid file type",
                                        description: "Please select a JPEG, PNG, or WebP image.",
                                        variant: "destructive",
                                      });
                                      return;
                                    }
                                    // Validate file size (max 5MB)
                                    if (file.size > 5 * 1024 * 1024) {
                                      toast({
                                        title: "File too large",
                                        description: "Please select an image smaller than 5MB.",
                                        variant: "destructive",
                                      });
                                      return;
                                    }
                                    setResourceThumbnailFile(file);
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setResourceThumbnailPreview(reader.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                              <p className="text-xs text-muted-foreground">Upload thumbnail image (optional - default will be used if not provided)</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="resource-isFree"
                              checked={resourceFormData.isFree}
                              onChange={(e) => {
                                const isFree = e.target.checked;
                                setResourceFormData({ 
                                  ...resourceFormData, 
                                  isFree: isFree, 
                                  price: isFree ? 0 : (resourceFormData.price || 0)
                                });
                              }}
                              className="w-4 h-4"
                            />
                            <Label htmlFor="resource-isFree" className="cursor-pointer">Free Resource</Label>
                          </div>
                          {!resourceFormData.isFree && (
                            <div>
                              <Label htmlFor="resource-price">Price (INR) *</Label>
                              <Input
                                id="resource-price"
                                type="number"
                                value={resourceFormData.price || ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setResourceFormData({ 
                                    ...resourceFormData, 
                                    price: value === "" ? 0 : parseFloat(value) || 0 
                                  });
                                }}
                                placeholder="Enter price"
                                min="0"
                                step="0.01"
                              />
                              <p className="text-xs text-muted-foreground mt-1">Amount students need to pay to purchase this resource</p>
                            </div>
                          )}
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setCreateResourceOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleCreateResource} disabled={isLoading || !resourceFormData.title || !resourceFormData.description}>
                              {isLoading ? "Creating..." : "Create Resource"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {isLoading ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading resources...</p>
                      </CardContent>
                    </Card>
                  ) : resources.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No resources yet</h3>
                        <p className="text-muted-foreground mb-4">Create your first resource to get started</p>
                        <Button onClick={() => setCreateResourceOpen(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Resource
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {resources.map((resource) => (
                        <Card key={resource._id} className="hover-lift">
                          <CardHeader>
                            <div className="flex items-start justify-between mb-2">
                              <CardTitle className="line-clamp-2 flex-1">{resource.title}</CardTitle>
                              <div className="flex flex-col items-end gap-2 ml-2">
                                <Badge className={resource.isFree ? "bg-green-500/10 text-green-500" : "bg-primary/10 text-primary"}>
                                  {resource.isFree ? "Free" : `₹${resource.price ?? 0}`}
                                </Badge>
                                <Badge 
                                  className={resource.isActive !== false ? "bg-green-500/10 text-green-500" : "bg-gray-500/10 text-gray-500"}
                                  variant="outline"
                                >
                                  {resource.isActive !== false ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                            </div>
                            <CardDescription className="line-clamp-2">{resource.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            {resource.thumbnailUrl && (
                              <div className="mb-4">
                                <img 
                                  src={resource.thumbnailUrl} 
                                  alt={resource.title}
                                  className="w-full h-32 object-cover rounded-lg"
                                />
                              </div>
                            )}
                            <div className="flex flex-wrap gap-2 mb-4">
                              <Badge variant="outline">{resource.category}</Badge>
                              {resource.tags && Array.isArray(resource.tags) && resource.tags.length > 0 && resource.tags.slice(0, 2).map((tag, i) => (
                                <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                              ))}
                            </div>
                            <div className="space-y-2 mb-4">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Purchases</span>
                                <span className="font-medium">{resource.purchaseCount ?? 0}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Downloads</span>
                                <span className="font-medium">{resource.downloadCount ?? 0}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Price</span>
                                <span className="font-medium">
                                  {resource.isFree ? "Free" : `₹${resource.price ?? 0}`}
                                </span>
                              </div>
                              {resource.tags && Array.isArray(resource.tags) && resource.tags.length > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Tags</span>
                                  <span className="font-medium text-xs">
                                    {resource.tags.slice(0, 3).join(", ")}
                                    {resource.tags.length > 3 && ` +${resource.tags.length - 3}`}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg mb-4">
                              <div className="flex items-center gap-2">
                                {resource.isActive !== false ? (
                                  <Power className="w-4 h-4 text-green-500" />
                                ) : (
                                  <PowerOff className="w-4 h-4 text-gray-500" />
                                )}
                                <span className="text-sm font-medium">
                                  {resource.isActive !== false ? "Active" : "Inactive"}
                                </span>
                              </div>
                              <Switch
                                checked={resource.isActive !== false}
                                onCheckedChange={() => handleToggleResourceStatus(resource._id, resource.isActive !== false)}
                                disabled={isLoading}
                              />
                            </div>
                            <div className="flex gap-2 items-stretch">
                              <Button 
                                variant="outline" 
                                className="flex-1" 
                                onClick={() => handleEditResource(resource)}
                                disabled={isLoading}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                className="flex-1" 
                                onClick={() => handleDeleteResource(resource._id)}
                                disabled={isLoading}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "sessions" && (
                <div>
                  <h2 className="font-display text-2xl font-bold mb-6">My Sessions</h2>
                  {sessions.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No sessions scheduled yet</h3>
                        <p className="text-muted-foreground mb-4">Schedule your first session from a course</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {sessions.map((session) => {
                        const sessionDate = new Date(session.scheduledDate);
                        const course = session.course as any;
                        const isPast = sessionDate < new Date();
                        const statusColors: Record<string, string> = {
                          scheduled: "bg-blue-500/10 text-blue-500",
                          ongoing: "bg-green-500/10 text-green-500",
                          completed: "bg-gray-500/10 text-gray-500",
                          cancelled: "bg-red-500/10 text-red-500",
                        };
                        return (
                          <Card key={session._id} className="hover-lift">
                            <CardHeader>
                              <div className="flex items-start justify-between mb-2">
                                <CardTitle className="line-clamp-2 flex-1">{session.title}</CardTitle>
                                <Badge className={statusColors[session.status] || statusColors.scheduled}>
                                  {session.status}
                                </Badge>
                              </div>
                              <CardDescription className="line-clamp-2">
                                {session.description || "No description"}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3 mb-4">
                                <div className="flex items-center gap-2 text-sm">
                                  <GraduationCap className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">Course:</span>
                                  <span className="font-medium">{course?.title || "Unknown"}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Calendar className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">Date:</span>
                                  <span className="font-medium">
                                    {sessionDate.toLocaleDateString()} {sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">Duration:</span>
                                  <span className="font-medium">{session.duration} minutes</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Users className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">Students:</span>
                                  <span className="font-medium">
                                    {session.enrolledStudents?.length || 0} / {session.maxStudents || 50}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => handleJoinSession(session.meetingLink)}
                                  disabled={isPast && session.status !== "ongoing"}
                                >
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  Join
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleEditSession(session)}
                                  disabled={isLoading}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleDeleteSession(session._id)}
                                  disabled={isLoading}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "chats" && (
                <div>
                  <h2 className="font-display text-2xl font-bold mb-6">Chats with Students</h2>
                  {conversations.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
                        <p className="text-muted-foreground">Students will appear here when they start chatting with you</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {conversations.map((conv) => (
                        <Card
                          key={conv._id}
                          className="hover-lift cursor-pointer"
                          onClick={() => handleOpenChat(conv)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <Avatar className="w-12 h-12">
                                  {conv.student.photoFileName ? (
                                    <AvatarImage src={conv.student.photoFileName} />
                                  ) : null}
                                  <AvatarFallback>{getInitials(conv.student.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{conv.student.name}</p>
                                  <p className="text-sm text-muted-foreground">{conv.student.email}</p>
                                  <div className="flex items-center gap-4 mt-1">
                                    <span className="text-xs text-muted-foreground">{conv.totalMessages} messages</span>
                                    <span className="text-xs text-muted-foreground">₹{conv.totalPaid.toFixed(2)} earned</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {conv.unreadCount && conv.unreadCount > 0 && (
                                  <Badge className="bg-primary">{conv.unreadCount} new</Badge>
                                )}
                                <Button variant="ghost" size="icon">
                                  <ChevronRight className="w-5 h-5" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "communities" && (
                <div>
                  <h2 className="font-display text-2xl font-bold mb-6">Communities</h2>
                  {isLoadingCommunities ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="text-center">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading communities...</p>
                      </div>
                    </div>
                  ) : communities.length === 0 ? (
                    <Card>
                      <CardContent className="py-20 text-center">
                        <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No communities available</h3>
                        <p className="text-muted-foreground">Check back later for new communities to join!</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {communities.map((community) => (
                        <Card key={community._id} className="overflow-hidden hover-lift">
                          <CardHeader className="p-0">
                            <div className="relative w-full h-48 bg-gradient-to-br from-primary/20 to-primary/5">
                              {community.thumbnailUrl ? (
                                <img
                                  src={community.thumbnailUrl}
                                  alt={community.name}
                                  className="w-full h-full object-cover rounded-t-lg"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x200?text=Community";
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center rounded-t-lg">
                                  <MessageSquare className="w-16 h-16 text-primary/50" />
                                </div>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="pt-4">
                            <CardTitle className="line-clamp-2 mb-2">{community.name}</CardTitle>
                            <CardDescription className="line-clamp-2 mb-4">{community.description}</CardDescription>
                            <div className="flex flex-wrap gap-2 mb-4">
                              <Badge variant="outline">{community.category}</Badge>
                              <Badge className="bg-blue-500/10 text-blue-500">
                                <Users className="w-3 h-3 mr-1" />
                                {community.memberCount} members
                              </Badge>
                            </div>
                            {community.createdBy && typeof community.createdBy === 'object' && (
                              <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                                <User className="w-4 h-4" />
                                <span>Created by {community.createdBy.name || community.creatorName}</span>
                              </div>
                            )}
                            {community.discordLink && (
                              <Button
                                className="w-full"
                                onClick={() => window.open(community.discordLink || "", "_blank")}
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Join Discord
                              </Button>
                            )}
                            {!community.discordLink && (
                              <Button
                                className="w-full"
                                variant="outline"
                                disabled
                              >
                                No Discord Link Available
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>
      </main>

      {/* Chat Modal - For mentor, we need to use conversationId directly */}
      {chatOpen && selectedConversation && (
        <MentorChatFromMentor
          conversationId={selectedConversation._id}
          studentName={selectedConversation.student.name}
          studentAvatar={selectedConversation.student.photoFileName || getInitials(selectedConversation.student.name)}
          isOpen={chatOpen}
          onClose={() => {
            setChatOpen(false);
            setSelectedConversation(null);
            fetchConversations();
          }}
        />
      )}

      {/* Schedule Session Dialog */}
      <Dialog open={scheduleSessionOpen} onOpenChange={(open) => {
        setScheduleSessionOpen(open);
        if (!open) {
          // Reset form when dialog closes
          setSelectedCourseForSession(null);
          setSessionFormData({
            courseId: "",
            title: "",
            description: "",
            scheduledDate: "",
            scheduledTime: "",
            duration: 60,
            meetingLink: "",
            maxStudents: 50,
          });
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule Session</DialogTitle>
            <DialogDescription>
              Schedule a live session for {selectedCourseForSession?.title || "this course"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="session-course">Course *</Label>
              {selectedCourseForSession ? (
                <div className="p-3 bg-muted rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{selectedCourseForSession.title}</p>
                      <p className="text-sm text-muted-foreground">{selectedCourseForSession.category} • {selectedCourseForSession.level}</p>
                    </div>
                    <Badge variant="outline">Selected</Badge>
                  </div>
                </div>
              ) : (
                <Select 
                  value={sessionFormData.courseId} 
                  onValueChange={(value) => {
                    const course = courses.find(c => c._id === value);
                    setSelectedCourseForSession(course || null);
                    setSessionFormData({ ...sessionFormData, courseId: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course._id} value={course._id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <Label htmlFor="session-title">Session Title *</Label>
              <Input
                id="session-title"
                value={sessionFormData.title}
                onChange={(e) => setSessionFormData({ ...sessionFormData, title: e.target.value })}
                placeholder="e.g., Introduction to JavaScript"
              />
            </div>
            <div>
              <Label htmlFor="session-description">Description</Label>
              <Textarea
                id="session-description"
                value={sessionFormData.description}
                onChange={(e) => setSessionFormData({ ...sessionFormData, description: e.target.value })}
                placeholder="Brief description of the session"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="session-date">Date *</Label>
                <Input
                  id="session-date"
                  type="date"
                  value={sessionFormData.scheduledDate}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, scheduledDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label htmlFor="session-time">Time *</Label>
                <Input
                  id="session-time"
                  type="time"
                  value={sessionFormData.scheduledTime}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, scheduledTime: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="session-duration">Duration (minutes) *</Label>
                <Input
                  id="session-duration"
                  type="number"
                  value={sessionFormData.duration}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, duration: parseInt(e.target.value) || 60 })}
                  min={15}
                  step={15}
                />
              </div>
              <div>
                <Label htmlFor="session-max-students">Max Students</Label>
                <Input
                  id="session-max-students"
                  type="number"
                  value={sessionFormData.maxStudents}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, maxStudents: parseInt(e.target.value) || 50 })}
                  min={1}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="session-meeting-link">Meeting Link (Zoom) *</Label>
              <Input
                id="session-meeting-link"
                value={sessionFormData.meetingLink}
                onChange={(e) => setSessionFormData({ ...sessionFormData, meetingLink: e.target.value })}
                placeholder="https://zoom.us/j/1234567890"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter the Zoom meeting link. Students will join through an embedded view.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setScheduleSessionOpen(false);
                setSelectedCourseForSession(null);
                setSessionFormData({
                  courseId: "",
                  title: "",
                  description: "",
                  scheduledDate: "",
                  scheduledTime: "",
                  duration: 60,
                  meetingLink: "",
                  maxStudents: 50,
                });
              }}>
                Cancel
              </Button>
              <Button onClick={handleCreateSession} disabled={isLoading || !sessionFormData.courseId}>
                {isLoading ? "Scheduling..." : "Schedule Session"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Course Dialog */}
      <Dialog open={editCourseOpen} onOpenChange={setEditCourseOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>Update course details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-course-title">Course Title *</Label>
              <Input
                id="edit-course-title"
                value={courseFormData.title}
                onChange={(e) => setCourseFormData({ ...courseFormData, title: e.target.value })}
                placeholder="Enter course title"
              />
            </div>
            <div>
              <Label htmlFor="edit-course-description">Description *</Label>
              <Textarea
                id="edit-course-description"
                value={courseFormData.description}
                onChange={(e) => setCourseFormData({ ...courseFormData, description: e.target.value })}
                placeholder="Enter course description"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-course-category">Category *</Label>
                <Select
                  value={courseFormData.category}
                  onValueChange={(value) => setCourseFormData({ ...courseFormData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="programming">Programming</SelectItem>
                    <SelectItem value="mathematics">Mathematics</SelectItem>
                    <SelectItem value="science">Science</SelectItem>
                    <SelectItem value="language">Language</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-course-level">Level *</Label>
                <Select
                  value={courseFormData.level}
                  onValueChange={(value) => setCourseFormData({ ...courseFormData, level: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-course-tags">Tags (comma separated)</Label>
              <Input
                id="edit-course-tags"
                value={courseFormData.tags}
                onChange={(e) => setCourseFormData({ ...courseFormData, tags: e.target.value })}
                placeholder="tag1, tag2, tag3"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-course-isFree"
                checked={courseFormData.isFree}
                onChange={(e) => setCourseFormData({ ...courseFormData, isFree: e.target.checked, price: e.target.checked ? 0 : courseFormData.price })}
                className="w-4 h-4"
              />
              <Label htmlFor="edit-course-isFree" className="cursor-pointer">Free Course</Label>
            </div>
            {!courseFormData.isFree && (
              <div>
                <Label htmlFor="edit-course-price">Price (INR) *</Label>
                <Input
                  id="edit-course-price"
                  type="number"
                  value={courseFormData.price}
                  onChange={(e) => setCourseFormData({ ...courseFormData, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
            )}
            <div>
              <Label htmlFor="edit-course-duration">Duration (hours) *</Label>
              <Input
                id="edit-course-duration"
                type="number"
                value={courseFormData.duration}
                onChange={(e) => setCourseFormData({ ...courseFormData, duration: parseInt(e.target.value) || 0 })}
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="edit-course-thumbnail">Thumbnail Image</Label>
              <div className="space-y-2">
                {courseThumbnailPreview && (
                  <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                    <img
                      src={courseThumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <Input
                  id="edit-course-thumbnail"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
                      if (!validTypes.includes(file.type)) {
                        toast({
                          title: "Invalid file type",
                          description: "Please select a JPEG, PNG, or WebP image.",
                          variant: "destructive",
                        });
                        return;
                      }
                      if (file.size > 5 * 1024 * 1024) {
                        toast({
                          title: "File too large",
                          description: "Please select an image smaller than 5MB.",
                          variant: "destructive",
                        });
                        return;
                      }
                      setCourseThumbnailFile(file);
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setCourseThumbnailPreview(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">Upload thumbnail image (optional - leave empty to keep current thumbnail)</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setEditCourseOpen(false);
                setSelectedCourse(null);
                setCourseThumbnailFile(null);
                setCourseThumbnailPreview(null);
              }}>
                Cancel
              </Button>
              <Button onClick={handleUpdateCourse} disabled={isLoading || !courseFormData.title || !courseFormData.description}>
                {isLoading ? "Updating..." : "Update Course"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Session Dialog */}
      <Dialog open={editSessionOpen} onOpenChange={(open) => {
        setEditSessionOpen(open);
        if (!open) {
          setSelectedSession(null);
          setSessionFormData({
            courseId: "",
            title: "",
            description: "",
            scheduledDate: "",
            scheduledTime: "",
            duration: 60,
            meetingLink: "",
            maxStudents: 50,
          });
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Session</DialogTitle>
            <DialogDescription>
              Update session details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-session-title">Session Title *</Label>
              <Input
                id="edit-session-title"
                value={sessionFormData.title}
                onChange={(e) => setSessionFormData({ ...sessionFormData, title: e.target.value })}
                placeholder="e.g., Introduction to JavaScript"
              />
            </div>
            <div>
              <Label htmlFor="edit-session-description">Description</Label>
              <Textarea
                id="edit-session-description"
                value={sessionFormData.description}
                onChange={(e) => setSessionFormData({ ...sessionFormData, description: e.target.value })}
                placeholder="Brief description of the session"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-session-date">Date *</Label>
                <Input
                  id="edit-session-date"
                  type="date"
                  value={sessionFormData.scheduledDate}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, scheduledDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label htmlFor="edit-session-time">Time *</Label>
                <Input
                  id="edit-session-time"
                  type="time"
                  value={sessionFormData.scheduledTime}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, scheduledTime: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-session-duration">Duration (minutes) *</Label>
                <Input
                  id="edit-session-duration"
                  type="number"
                  value={sessionFormData.duration}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, duration: parseInt(e.target.value) || 60 })}
                  min={15}
                  step={15}
                />
              </div>
              <div>
                <Label htmlFor="edit-session-max-students">Max Students</Label>
                <Input
                  id="edit-session-max-students"
                  type="number"
                  value={sessionFormData.maxStudents}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, maxStudents: parseInt(e.target.value) || 50 })}
                  min={1}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-session-meeting-link">Meeting Link (Zoom) *</Label>
              <Input
                id="edit-session-meeting-link"
                value={sessionFormData.meetingLink}
                onChange={(e) => setSessionFormData({ ...sessionFormData, meetingLink: e.target.value })}
                placeholder="https://zoom.us/j/1234567890"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter the Zoom meeting link. Students will join through an embedded view.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setEditSessionOpen(false);
                setSelectedSession(null);
                setSessionFormData({
                  courseId: "",
                  title: "",
                  description: "",
                  scheduledDate: "",
                  scheduledTime: "",
                  duration: 60,
                  meetingLink: "",
                  maxStudents: 50,
                });
              }}>
                Cancel
              </Button>
              <Button onClick={handleUpdateSession} disabled={isLoading || !sessionFormData.title || !sessionFormData.meetingLink}>
                {isLoading ? "Updating..." : "Update Session"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Resource Dialog */}
      <Dialog open={editResourceOpen} onOpenChange={setEditResourceOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
            <DialogDescription>Update resource details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-resource-title">Resource Title *</Label>
              <Input
                id="edit-resource-title"
                value={resourceFormData.title}
                onChange={(e) => setResourceFormData({ ...resourceFormData, title: e.target.value })}
                placeholder="Enter resource title"
              />
            </div>
            <div>
              <Label htmlFor="edit-resource-description">Description *</Label>
              <Textarea
                id="edit-resource-description"
                value={resourceFormData.description}
                onChange={(e) => setResourceFormData({ ...resourceFormData, description: e.target.value })}
                placeholder="Enter resource description"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="edit-resource-category">Category *</Label>
              <Select
                value={resourceFormData.category}
                onValueChange={(value) => setResourceFormData({ ...resourceFormData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="course">Course</SelectItem>
                  <SelectItem value="ebook">E-Book</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="software">Software</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-resource-tags">Tags (comma separated)</Label>
              <Input
                id="edit-resource-tags"
                value={resourceFormData.tags}
                onChange={(e) => setResourceFormData({ ...resourceFormData, tags: e.target.value })}
                placeholder="tag1, tag2, tag3"
              />
            </div>
            <div>
              <Label htmlFor="edit-resource-file-url">File URL</Label>
              <Input
                id="edit-resource-file-url"
                value={resourceFormData.fileUrl}
                onChange={(e) => setResourceFormData({ ...resourceFormData, fileUrl: e.target.value })}
                placeholder="https://example.com/resource.pdf"
              />
            </div>
            <div>
              <Label htmlFor="edit-resource-thumbnail">Thumbnail Image</Label>
              <div className="space-y-2">
                {resourceThumbnailPreview && (
                  <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                    <img
                      src={resourceThumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <Input
                  id="edit-resource-thumbnail"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
                      if (!validTypes.includes(file.type)) {
                        toast({
                          title: "Invalid file type",
                          description: "Please select a JPEG, PNG, or WebP image.",
                          variant: "destructive",
                        });
                        return;
                      }
                      if (file.size > 5 * 1024 * 1024) {
                        toast({
                          title: "File too large",
                          description: "Please select an image smaller than 5MB.",
                          variant: "destructive",
                        });
                        return;
                      }
                      setResourceThumbnailFile(file);
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setResourceThumbnailPreview(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-resource-isFree"
                checked={resourceFormData.isFree}
                onChange={(e) => {
                  const isFree = e.target.checked;
                  setResourceFormData({ 
                    ...resourceFormData, 
                    isFree: isFree, 
                    price: isFree ? 0 : (resourceFormData.price || 0)
                  });
                }}
                className="w-4 h-4"
              />
              <Label htmlFor="edit-resource-isFree" className="cursor-pointer">Free Resource</Label>
            </div>
            {!resourceFormData.isFree && (
              <div>
                <Label htmlFor="edit-resource-price">Price (INR) *</Label>
                <Input
                  id="edit-resource-price"
                  type="number"
                  value={resourceFormData.price || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setResourceFormData({ 
                      ...resourceFormData, 
                      price: value === "" ? 0 : parseFloat(value) || 0 
                    });
                  }}
                  placeholder="Enter price"
                  min="0"
                  step="0.01"
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setEditResourceOpen(false);
                setSelectedResource(null);
                setResourceThumbnailFile(null);
                setResourceThumbnailPreview(null);
              }}>
                Cancel
              </Button>
              <Button onClick={handleUpdateResource} disabled={isLoading || !resourceFormData.title || !resourceFormData.description}>
                {isLoading ? "Updating..." : "Update Resource"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MentorDashboard;

