import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  BookOpen, Bell, Search, Menu, X, Home, GraduationCap, 
  MessageSquare, Users, LogOut, ChevronRight,
  Play, Clock, Star, Award, Target, Zap,
  Video, FileText, CheckCircle, Circle, ArrowUpRight, User,
  Edit, Save, XCircle, Mail, Phone, MapPin, Shield, CheckCircle2,
  Upload, Trash2, Image as ImageIcon, Calendar, ExternalLink, DollarSign
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { authApi, tokenManager, ApiError, settingsApi, courseApi, Course, sessionApi, Session, resourceApi, Resource, communityApi, Community } from "@/lib/api";

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

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeView, setActiveView] = useState<"dashboard" | "courses" | "resources" | "communities">("dashboard");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [discordInviteLink, setDiscordInviteLink] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    address: "",
    role: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [purchasedResources, setPurchasedResources] = useState<Resource[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [joinSessionOpen, setJoinSessionOpen] = useState(false);
  const [courseSessionsDialogOpen, setCourseSessionsDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseSessions, setCourseSessions] = useState<Session[]>([]);
  const [isLoadingCourseSessions, setIsLoadingCourseSessions] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is a mentor/admin and redirect
    const checkRoleAndRedirect = async () => {
      try {
        const response = await authApi.getProfile();
        if (response.user) {
          const userRole = response.user.role;
          // If user is admin/superadmin, redirect to admin dashboard
          if (userRole === "admin" || userRole === "superadmin") {
            navigate("/admin-dashboard");
            return;
          }
          // If user is a mentor/teacher, redirect to mentor dashboard
          if (userRole === "teacher" || userRole === "mentor") {
            navigate("/mentor-dashboard");
            return;
          }
          // Otherwise, continue with student dashboard
          setProfile(response.user);
          setFormData({
            name: response.user.name || "",
            mobile: response.user.mobile || "",
            address: response.user.address || "",
            role: response.user.role || "student",
          });
        }
      } catch (error) {
        // If error, continue with normal flow
        console.error("Error checking role:", error);
      }
    };
    
    checkRoleAndRedirect();
    fetchEnrolledCourses(); // Fetch courses on mount
  }, []);

  useEffect(() => {
    if (showProfile && !profile) {
      fetchProfile();
    }
  }, [showProfile]);

  // Only fetch data once on mount, not on every showProfile change
  useEffect(() => {
    fetchDiscordInviteLink();
    fetchEnrolledCourses();
    fetchStudentSessions();
    fetchPurchasedResources();
  }, []); // Empty dependency array - only run on mount

  // Fetch communities when communities view is active
  useEffect(() => {
    if (activeView === "communities") {
      fetchCommunities();
    }
  }, [activeView]);

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
          role: response.user.role || "student",
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
        } else {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDiscordInviteLink = async () => {
    try {
      const response = await settingsApi.getDiscordInviteLink();
      if (response.success && response.data) {
        setDiscordInviteLink(response.data.inviteLink);
      }
    } catch (error) {
      console.error("Failed to fetch Discord invite link:", error);
      // Silently fail - don't show error to user
    }
  };

  const fetchEnrolledCourses = async () => {
    // Only fetch if user is logged in
    if (!tokenManager.getToken()) {
      setEnrolledCourses([]);
      return;
    }

    try {
      setIsLoadingCourses(true);
      const response = await courseApi.getMyEnrollments();
      console.log("Enrollments response:", response); // Debug log
      
      if (response && response.success && response.data) {
        // Map enrollments to courses, filter out any null courses (deleted courses)
        const courses = response.data
          .filter((enrollment: any) => enrollment && enrollment.course) // Filter out enrollments with deleted courses
          .map((enrollment: any) => ({
            ...enrollment.course,
            isEnrolled: true,
            enrollmentProgress: enrollment.progress || 0,
            enrollmentStatus: enrollment.status || "enrolled",
          }));
        console.log("Mapped courses:", courses); // Debug log
        setEnrolledCourses(courses);
      } else {
        console.warn("Unexpected response format:", response);
        setEnrolledCourses([]);
      }
    } catch (error) {
      console.error("Failed to fetch enrolled courses:", error);
      // Show error to user if logged in
      if (tokenManager.getToken()) {
        toast({
          title: "Error",
          description: "Failed to load your enrolled courses. Please try again later.",
          variant: "destructive",
        });
      }
      setEnrolledCourses([]); // Set empty array on error
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const fetchStudentSessions = async () => {
    if (!tokenManager.getToken()) {
      setSessions([]);
      return;
    }

    try {
      const response = await sessionApi.getStudentSessions();
      if (response.success && response.data) {
        setSessions(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    }
  };

  const handleJoinSession = async (session: Session) => {
    try {
      setIsLoading(true);
      const response = await sessionApi.joinSession(session._id);
      if (response.success) {
        // Open meeting link in new tab
        window.open(session.meetingLink, "_blank");
        toast({
          title: "Success",
          description: "Joining session...",
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

  const handleCourseClick = async (course: Course) => {
    setSelectedCourse(course);
    setIsLoadingCourseSessions(true);
    setCourseSessionsDialogOpen(true);
    
    try {
      const response = await sessionApi.getCourseSessions(course._id);
      if (response.success && response.data) {
        // Response structure: { success, data: Session[], count, isEnrolled }
        setCourseSessions(Array.isArray(response.data) ? response.data : []);
      } else {
        setCourseSessions([]);
      }
    } catch (error) {
      console.error("Failed to fetch course sessions:", error);
      setCourseSessions([]);
      toast({
        title: "Error",
        description: "Failed to load sessions for this course",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCourseSessions(false);
    }
  };

  const fetchPurchasedResources = async () => {
    if (!tokenManager.getToken()) {
      setPurchasedResources([]);
      return;
    }

    try {
      setIsLoadingResources(true);
      // Fetch purchased resources directly (similar to enrolled courses)
      const response = await resourceApi.getMyPurchases();
      if (response.success && response.data) {
        setPurchasedResources(response.data);
      } else {
        setPurchasedResources([]);
      }
    } catch (error) {
      console.error("Failed to fetch purchased resources:", error);
      setPurchasedResources([]);
    } finally {
      setIsLoadingResources(false);
    }
  };

  const handleResourceClick = (resource: Resource) => {
    if (resource.fileUrl) {
      window.open(resource.fileUrl, "_blank");
    } else {
      toast({
        title: "No File Available",
        description: "This resource doesn't have a file URL yet",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
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

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        mobile: profile.mobile || "",
        address: profile.address || "",
        role: profile.role || "student",
      });
    }
    setIsEditing(false);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      setSelectedFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeletePicture = async () => {
    if (!profile?.photoFileName) return;

    try {
      setIsLoading(true);
      const response = await authApi.deleteProfilePicture();
      
      if (response.user) {
        setProfile(response.user);
        setSelectedFile(null);
        setPreviewUrl(null);
        toast({
          title: "Success",
          description: "Profile picture deleted successfully!",
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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "superadmin":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "teacher":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-green-500/10 text-green-500 border-green-500/20";
    }
  };

  const upcomingSessions = [
    { id: 1, mentor: "Dr. Sarah Chen", subject: "Advanced Mathematics", time: "Today, 3:00 PM", avatar: "SC", status: "upcoming" },
    { id: 2, mentor: "Prof. James Wilson", subject: "Physics Lab", time: "Tomorrow, 10:00 AM", avatar: "JW", status: "upcoming" },
    { id: 3, mentor: "Maria Garcia", subject: "Spanish Literature", time: "Wed, 2:00 PM", avatar: "MG", status: "scheduled" },
  ];


  const recentActivities = [
    { id: 1, type: "course", title: "Completed Calculus course lesson", time: "2 hours ago", icon: Video },
    { id: 2, type: "assignment", title: "Submitted Physics homework", time: "5 hours ago", icon: FileText },
    { id: 3, type: "achievement", title: "Earned 'Quick Learner' badge", time: "Yesterday", icon: Award },
    { id: 4, type: "course", title: "Enrolled in new course", time: "Yesterday", icon: GraduationCap },
  ];

  const recommendedMentors = [
    { id: 1, name: "Dr. Emily Parker", specialty: "Data Science", rating: 4.9, sessions: 234, avatar: "EP" },
    { id: 2, name: "Michael Brown", specialty: "Web Development", rating: 4.8, sessions: 189, avatar: "MB" },
    { id: 3, name: "Lisa Zhang", specialty: "Machine Learning", rating: 4.9, sessions: 312, avatar: "LZ" },
  ];

  const weeklyGoals = [
    { id: 1, title: "Complete 5 sessions", current: 3, target: 5, completed: false },
    { id: 2, title: "Study for 20 hours", current: 14, target: 20, completed: false },
    { id: 3, title: "Submit all assignments", current: 4, target: 4, completed: true },
  ];

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
      <aside className={`fixed top-0 left-0 h-full w-72 glass-dark z-50 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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
              { icon: Home, label: "Dashboard", active: !showProfile && activeView === "dashboard", onClick: () => {
                setShowProfile(false);
                setActiveView("dashboard");
                setSidebarOpen(false); // Close sidebar on mobile
              }},
              { icon: User, label: "My Profile", active: showProfile, onClick: () => {
                setShowProfile(true);
                setActiveView("dashboard");
                setSidebarOpen(false); // Close sidebar on mobile
              }},
              { icon: GraduationCap, label: "Enrolled Courses", active: !showProfile && activeView === "courses", onClick: () => {
                setShowProfile(false);
                setActiveView("courses");
                setSidebarOpen(false); // Close sidebar on mobile
              }},
              { icon: FileText, label: "My Resources", active: !showProfile && activeView === "resources", onClick: () => {
                setShowProfile(false);
                setActiveView("resources");
                setSidebarOpen(false); // Close sidebar on mobile
              }},
              { icon: GraduationCap, label: "Browse Courses", onClick: () => {
                setSidebarOpen(false); // Close sidebar on mobile
                navigate("/courses");
              }},
              { icon: MessageSquare, label: "Communities", active: !showProfile && activeView === "communities", onClick: () => {
                setSidebarOpen(false);
                setShowProfile(false);
                setActiveView("communities");
              }},
              { icon: Users, label: "Mentors", onClick: () => {
                setSidebarOpen(false); // Close sidebar on mobile
                navigate("/mentors");
              }},
              { icon: FileText, label: "Resources", onClick: () => {
                setSidebarOpen(false); // Close sidebar on mobile
                navigate("/resources");
              }},
            ].map((item) => (
              <button
                key={item.label}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  item.onClick();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  item.active 
                    ? "gradient-primary text-primary-foreground shadow-soft" 
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto bg-secondary text-secondary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
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
                {profile ? getInitials(profile.name) : "U"}
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
                  {showProfile ? "My Profile" : 
                   activeView === "courses" ? "Enrolled Courses" :
                   activeView === "resources" ? "My Resources" :
                   `Welcome back, ${profile?.name || "User"}! 👋`}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {showProfile ? "View and manage your account details" : 
                   activeView === "courses" ? "View all your enrolled courses" :
                   activeView === "resources" ? "View all your purchased resources" :
                   "Ready to continue your learning journey?"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              {!showProfile && (
              <div className="hidden md:flex relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search..." 
                  className="pl-10 w-64 bg-muted/50 border-0 focus:ring-2 focus:ring-primary/20"
                />
              </div>
              )}
              
              {/* Notifications */}
              {!showProfile && (
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-secondary rounded-full" />
              </Button>
              )}

              {/* User Avatar */}
              {profile && !showProfile && (
                <Avatar className="w-10 h-10 ring-2 ring-primary/20 cursor-pointer hover:ring-primary/40 transition-all">
                  {profile.photoFileName ? (
                    <AvatarImage src={profile.photoFileName} alt={profile.name} />
                  ) : null}
                  <AvatarFallback className="gradient-primary text-primary-foreground font-bold">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
              )}

              {/* Edit/Save buttons for profile */}
              {showProfile && (
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button onClick={handleSave} disabled={isLoading}>
                        <Save className="w-4 h-4 mr-2" />
                        {isLoading ? "Saving..." : "Save"}
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsEditing(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 lg:p-8">
          {showProfile ? (
            /* Profile Section */
            <div className="max-w-4xl mx-auto">
              {isLoading && !profile ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading profile...</p>
                  </div>
                </div>
              ) : profile ? (
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Profile Card */}
                  <Card className="lg:col-span-1">
                    <CardHeader className="text-center">
                      <div className="flex flex-col items-center mb-4">
                        <div className="relative group">
                          <Avatar 
                            className="w-24 h-24 ring-4 ring-primary/20 cursor-pointer hover:ring-primary/40 transition-all"
                            onClick={() => {
                              if (isEditing) {
                                document.getElementById("profile-picture")?.click();
                              }
                            }}
                          >
                            <AvatarImage src={previewUrl || profile.photoFileName || ""} />
                            <AvatarFallback className="gradient-primary text-primary-foreground text-2xl font-bold">
                              {getInitials(profile.name)}
                            </AvatarFallback>
                          </Avatar>
                          {isEditing && (
                            <div 
                              className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              onClick={() => document.getElementById("profile-picture")?.click()}
                            >
                              <div className="text-center">
                                <ImageIcon className="w-6 h-6 text-white mx-auto mb-1" />
                                <span className="text-xs text-white">Click to edit</span>
                              </div>
                            </div>
                          )}
                          {!isEditing && profile.photoFileName && (
                            <div 
                              className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              onClick={() => setIsEditing(true)}
                            >
                              <div className="text-center">
                                <Edit className="w-5 h-5 text-white mx-auto mb-1" />
                                <span className="text-xs text-white">Edit</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="mt-4 space-y-2 w-full">
                          {isEditing ? (
                            <>
                              <input
                                type="file"
                                id="profile-picture"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                onChange={handleFileSelect}
                                className="hidden"
                              />
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => document.getElementById("profile-picture")?.click()}
                                >
                                  <Upload className="w-4 h-4 mr-2" />
                                  {selectedFile ? "Change" : "Upload"}
                                </Button>
                                {(profile.photoFileName || selectedFile) && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDeletePicture}
                                    disabled={isLoading}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                              {selectedFile && (
                                <p className="text-xs text-muted-foreground">
                                  {selectedFile.name}
                                </p>
                              )}
                            </>
                          ) : (
                            profile.photoFileName && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleDeletePicture}
                                disabled={isLoading}
                                className="w-full text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Picture
                              </Button>
                            )
                          )}
                        </div>
                      </div>
                      <CardTitle className="text-xl">{profile.name || "No Name"}</CardTitle>
                      <CardDescription className="flex items-center justify-center gap-2 mt-2">
                        {profile.isEmailVerified ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span className="text-green-500">Verified</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-red-500" />
                            <span className="text-red-500">Not Verified</span>
                          </>
                        )}
                      </CardDescription>
                      <div className="mt-4">
                        <Badge className={getRoleBadgeColor(profile.role)}>
                          {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Details Card */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Account Details</CardTitle>
                      <CardDescription>Your complete account information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Name */}
                      <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Full Name
                        </Label>
                        {isEditing ? (
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Enter your name"
                          />
                        ) : (
                          <p className="text-sm font-medium">{profile.name || "Not set"}</p>
                        )}
                      </div>

                      {/* Email (Read-only) */}
                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email Address
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="email"
                            value={profile.email}
                            disabled
                            className="bg-muted"
                          />
                          {profile.isEmailVerified && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                      </div>

                      {/* Mobile */}
                      <div className="space-y-2">
                        <Label htmlFor="mobile" className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Mobile Number
                        </Label>
                        {isEditing ? (
                          <Input
                            id="mobile"
                            value={formData.mobile}
                            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                            placeholder="Enter mobile number"
                          />
                        ) : (
                          <p className="text-sm font-medium">{profile.mobile || "Not set"}</p>
                        )}
                      </div>

                      {/* Address */}
                      <div className="space-y-2">
                        <Label htmlFor="address" className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Address
                        </Label>
                        {isEditing ? (
                          <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Enter your address"
                          />
                        ) : (
                          <p className="text-sm font-medium">{profile.address || "Not set"}</p>
                        )}
                      </div>

                      {/* Role */}
                      <div className="space-y-2">
                        <Label htmlFor="role" className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Role
                        </Label>
                        {isEditing ? (
                          <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="teacher">Teacher</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="superadmin">Super Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={getRoleBadgeColor(profile.role)}>
                            {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="py-10 text-center">
                    <p className="text-muted-foreground">Unable to load profile information.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : activeView === "courses" ? (
            /* Enrolled Courses View */
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-2xl font-bold">Enrolled Courses</h2>
                  {enrolledCourses.length > 0 && (
                    <Badge variant="outline" className="text-sm">
                      {enrolledCourses.length} {enrolledCourses.length === 1 ? 'course' : 'courses'}
                    </Badge>
                  )}
                </div>
                <Button variant="outline" onClick={() => navigate("/courses")}>
                  Browse More Courses <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              {isLoadingCourses ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading courses...</p>
                  </div>
                </div>
              ) : enrolledCourses.length === 0 ? (
                <Card>
                  <CardContent className="py-20 text-center">
                    <GraduationCap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No courses enrolled yet</h3>
                    <p className="text-muted-foreground mb-6">Start exploring and enroll in courses to begin learning!</p>
                    <Button onClick={() => navigate("/courses")} size="lg">
                      Browse Courses
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {enrolledCourses.map((course) => (
                    <Card key={course._id} className="hover-lift cursor-pointer" onClick={() => handleCourseClick(course)}>
                      <CardHeader>
                        <div className="mb-4">
                          {course.thumbnailUrl ? (
                            <img
                              src={course.thumbnailUrl}
                              alt={course.title}
                              className="w-full h-48 object-cover rounded-lg"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x200?text=Course+Image";
                              }}
                            />
                          ) : (
                            <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center">
                              <GraduationCap className="w-16 h-16 text-primary/50" />
                            </div>
                          )}
                        </div>
                        <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                        <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge variant="outline">{course.category}</Badge>
                          <Badge variant="outline">{course.level}</Badge>
                          <Badge className="bg-green-500/10 text-green-500">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Enrolled
                          </Badge>
                        </div>
                        {course.enrollmentProgress !== undefined && (
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Progress</span>
                              <span className="text-sm text-muted-foreground">{course.enrollmentProgress}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${course.enrollmentProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Video className="w-4 h-4" />
                            <span>{course.lessons?.length || 0} lessons</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{course.duration}h</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : activeView === "resources" ? (
            /* My Resources View */
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-2xl font-bold">My Resources</h2>
                  {purchasedResources.length > 0 && (
                    <Badge variant="outline" className="text-sm">
                      {purchasedResources.length} {purchasedResources.length === 1 ? 'resource' : 'resources'}
                    </Badge>
                  )}
                </div>
                <Button variant="outline" onClick={() => navigate("/resources")}>
                  Resources <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              {isLoadingResources ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading resources...</p>
                  </div>
                </div>
              ) : purchasedResources.length === 0 ? (
                <Card>
                  <CardContent className="py-20 text-center">
                    <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No resources purchased yet</h3>
                    <p className="text-muted-foreground mb-6">Browse and purchase resources to add them to your library!</p>
                    <Button onClick={() => navigate("/resources")} size="lg">
                      Browse Resources
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {purchasedResources.map((resource) => (
                    <Card key={resource._id} className="hover-lift cursor-pointer" onClick={() => handleResourceClick(resource)}>
                      <CardHeader>
                        <div className="mb-4">
                          {resource.thumbnailUrl ? (
                            <img
                              src={resource.thumbnailUrl}
                              alt={resource.title}
                              className="w-full h-48 object-cover rounded-lg"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x200?text=Resource+Image";
                              }}
                            />
                          ) : (
                            <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center">
                              <FileText className="w-16 h-16 text-primary/50" />
                            </div>
                          )}
                        </div>
                        <CardTitle className="line-clamp-2">{resource.title}</CardTitle>
                        <CardDescription className="line-clamp-2">{resource.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge variant="outline">{resource.category}</Badge>
                          <Badge className="bg-green-500/10 text-green-500">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Purchased
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          {resource.isFree ? (
                            <Badge className="bg-green-500/10 text-green-500">
                              Free
                            </Badge>
                          ) : (
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4 text-primary" />
                              <span className="font-medium text-primary">₹{resource.price}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : activeView === "communities" ? (
            /* Communities View */
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-2xl font-bold">Communities</h2>
                  {communities.length > 0 && (
                    <Badge variant="outline" className="text-sm">
                      {communities.length} {communities.length === 1 ? 'community' : 'communities'}
                    </Badge>
                  )}
                </div>
              </div>

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
          ) : (
            /* Dashboard Content */
            <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Sessions", value: "48", change: "+12%", icon: Video, color: "primary" },
              { label: "Study Hours", value: "156", change: "+8%", icon: Clock, color: "secondary" },
              { label: "Avg. Rating", value: "4.8", change: "+0.3", icon: Star, color: "accent" },
              { label: "Achievements", value: "12", change: "+2", icon: Award, color: "primary" },
            ].map((stat, i) => (
              <div 
                key={stat.label}
                className="glass rounded-2xl p-5 hover-lift animate-slide-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                  stat.color === "primary" ? "gradient-primary" : 
                  stat.color === "secondary" ? "gradient-secondary" : "bg-accent"
                }`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-muted-foreground text-sm">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-2xl font-bold">{stat.value}</span>
                  <span className="text-xs text-primary font-medium">{stat.change}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
                {/* My Courses */}
            <div className="lg:col-span-2 glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-lg font-bold">My Courses</h2>
                      {enrolledCourses.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {enrolledCourses.length} {enrolledCourses.length === 1 ? 'course' : 'courses'}
                        </Badge>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary" onClick={() => navigate("/courses")}>
                      View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
                  {isLoadingCourses ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Loading courses...</p>
                      </div>
                    </div>
                  ) : enrolledCourses.length === 0 ? (
                    <div className="text-center py-8">
                      <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No courses enrolled yet</h3>
                      <p className="text-muted-foreground mb-4">Start exploring and enroll in courses to begin learning!</p>
                      <Button onClick={() => navigate("/courses")}>
                        Browse Courses
                </Button>
              </div>
                  ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                      {enrolledCourses.map((course) => (
                        <div 
                          key={course._id}
                          className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                          onClick={() => handleCourseClick(course)}
                        >
                          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                            {course.thumbnailUrl ? (
                              <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <GraduationCap className="w-8 h-8 text-primary/50" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="font-medium truncate">{course.title}</p>
                              <Badge className="bg-green-500/10 text-green-500 border-green-500/20 flex-shrink-0">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Already Enrolled
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{course.description}</p>
                            {course.enrollmentProgress !== undefined && (
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
                        </div>
                      ))}
                    </div>
                  )}
            </div>

            {/* Weekly Goals */}
            <div className="glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-lg font-bold">Weekly Goals</h2>
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-4">
                {weeklyGoals.map((goal) => (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      {goal.completed ? (
                        <CheckCircle className="w-5 h-5 text-primary" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground" />
                      )}
                      <span className={`text-sm ${goal.completed ? "line-through text-muted-foreground" : ""}`}>
                        {goal.title}
                      </span>
                    </div>
                    <div className="ml-7">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${(goal.current / goal.target) * 100}%` }}
                            />
                          </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {goal.current}/{goal.target} completed
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
              {/* My Resources - Same layout as My Courses */}
              <div className="lg:col-span-2 glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: "0.4s" }}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg font-bold">My Resources</h2>
                    {purchasedResources.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {purchasedResources.length} {purchasedResources.length === 1 ? 'resource' : 'resources'}
                      </Badge>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary" onClick={() => {
                    setActiveView("resources");
                    setSidebarOpen(false);
                  }}>
                    View All <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                {isLoadingResources ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Loading resources...</p>
                    </div>
                  </div>
                ) : purchasedResources.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No resources purchased yet</h3>
                    <p className="text-muted-foreground mb-4">Browse and purchase resources to add them to your library!</p>
                    <Button onClick={() => navigate("/resources")} variant="outline">
                      Browse Resources
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {purchasedResources.map((resource) => (
                      <div 
                        key={resource._id}
                        className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                        onClick={() => handleResourceClick(resource)}
                      >
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                          {resource.thumbnailUrl ? (
                            <img src={resource.thumbnailUrl} alt={resource.title} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <FileText className="w-8 h-8 text-primary/50" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="font-medium truncate">{resource.title}</p>
                            <Badge className="bg-green-500/10 text-green-500 border-green-500/20 flex-shrink-0">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Purchased
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{resource.description}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {resource.category}
                            </Badge>
                            {resource.isFree ? (
                              <Badge className="bg-green-500/10 text-green-500 text-xs">
                                Free
                              </Badge>
                            ) : (
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3 text-primary" />
                                <span className="text-xs font-medium text-primary">
                                  ₹{resource.price}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
          </div>

              {/* Scheduled Sessions */}
              {sessions.length > 0 && (
            <div className="glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: "0.5s" }}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-display text-lg font-bold">Scheduled Sessions</h2>
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div className="space-y-4">
                    {sessions.slice(0, 5).map((session) => {
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
                        <div
                          key={session._id}
                          className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors border border-border/50"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-medium mb-1">{session.title}</h3>
                              <p className="text-sm text-muted-foreground mb-2">
                                {course?.title || "Unknown Course"}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>
                                    {sessionDate.toLocaleDateString()} {sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{session.duration} min</span>
                                </div>
                              </div>
                            </div>
                            <Badge className={statusColors[session.status] || statusColors.scheduled}>
                              {session.status}
                            </Badge>
                          </div>
                          {session.description && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {session.description}
                            </p>
                          )}
                          {(session.status === "scheduled" || session.status === "ongoing") && !isPast && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleJoinSession(session)}
                              disabled={isLoading}
                              className="w-full"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Join Session
                            </Button>
                          )}
                        </div>
                      );
                    })}
              </div>
            </div>
              )}

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <div className="glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: "0.6s" }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-lg font-bold">Recent Activity</h2>
                <Zap className="w-5 h-5 text-secondary" />
              </div>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <activity.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommended Mentors */}
              <div className="glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: "0.7s" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-lg font-bold">Recommended Mentors</h2>
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                Explore all <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedMentors.map((mentor) => (
                <div 
                  key={mentor.id}
                  className="p-4 rounded-xl border border-border/50 hover:border-primary/50 hover:shadow-soft transition-all group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="w-12 h-12 ring-2 ring-primary/20">
                      <AvatarFallback className="gradient-secondary text-secondary-foreground font-bold">
                        {mentor.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{mentor.name}</p>
                      <p className="text-sm text-muted-foreground">{mentor.specialty}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-secondary fill-secondary" />
                      <span className="font-medium">{mentor.rating}</span>
                    </div>
                    <span className="text-muted-foreground">{mentor.sessions} sessions</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    Book Session
                  </Button>
                </div>
              ))}
            </div>
          </div>
            </div>
          )}
        </div>
      </main>

      {/* Course Sessions Dialog */}
      <Dialog open={courseSessionsDialogOpen} onOpenChange={setCourseSessionsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCourse ? `Scheduled Sessions - ${selectedCourse.title}` : "Scheduled Sessions"}
            </DialogTitle>
            <DialogDescription>
              View and join scheduled sessions for this course
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingCourseSessions ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading sessions...</p>
              </div>
            </div>
          ) : courseSessions.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No sessions scheduled</h3>
              <p className="text-muted-foreground">There are no scheduled sessions for this course yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {courseSessions.map((session) => {
                const sessionDate = new Date(session.scheduledDate);
                const now = new Date();
                const isFuture = sessionDate > now;
                const isPast = sessionDate < now;
                const statusColors: Record<string, string> = {
                  scheduled: "bg-blue-500/10 text-blue-500 border-blue-500/20",
                  ongoing: "bg-green-500/10 text-green-500 border-green-500/20",
                  completed: "bg-gray-500/10 text-gray-500 border-gray-500/20",
                  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
                };

                return (
                  <Card key={session._id} className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{session.title}</h3>
                            <Badge className={statusColors[session.status] || statusColors.scheduled}>
                              {session.status}
                            </Badge>
                          </div>
                          {session.description && (
                            <p className="text-sm text-muted-foreground mb-3">{session.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {sessionDate.toLocaleDateString()} {sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{session.duration} min</span>
                            </div>
                            {session.mentor && typeof session.mentor === 'object' && (
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                <span>{session.mentor.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {isFuture && (session.status === "scheduled" || session.status === "ongoing") && (
                          <Button
                            onClick={() => {
                              handleJoinSession(session);
                              setCourseSessionsDialogOpen(false);
                            }}
                            variant="default"
                            className="flex-shrink-0"
                          >
                            <Video className="w-4 h-4 mr-2" />
                            Join Session
                          </Button>
                        )}
                        {isPast && session.status === "completed" && (
                          <Badge variant="outline" className="flex-shrink-0">
                            Completed
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
