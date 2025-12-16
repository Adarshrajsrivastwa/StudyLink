import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen, Bell, Search, Menu, X, Home, GraduationCap,
  MessageSquare, Users, LogOut, ChevronRight,
  Play, Clock, Star, Award, Target, Zap, DollarSign,
  Video, FileText, CheckCircle, Circle, ArrowUpRight, User,
  Edit, Save, XCircle, Mail, Phone, MapPin, Shield, CheckCircle2,
  Upload, Trash2, Image as ImageIcon, Plus, TrendingUp, BarChart3,
  Calendar, Eye, Send, MoreVertical, Power, PowerOff, ExternalLink,
  Settings, Database, Activity, UserCog
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
import { authApi, tokenManager, ApiError, adminApi, Course, Resource, Session, User as UserType, Community, AdminStats } from "@/lib/api";
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


const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeView, setActiveView] = useState<"dashboard" | "mentors" | "courses" | "resources" | "sessions" | "communities" | "users">("dashboard");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    address: "",
    role: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Data states
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [mentors, setMentors] = useState<UserType[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  
  // Loading states
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingMentors, setIsLoadingMentors] = useState(false);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  // Dialog states
  const [createCommunityOpen, setCreateCommunityOpen] = useState(false);
  const [editCommunityOpen, setEditCommunityOpen] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [communityFormData, setCommunityFormData] = useState({
    name: "",
    description: "",
    category: "",
    isPublic: true,
    rules: [] as string[],
    discordLink: "",
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkRoleAndLoad();
  }, []);

  useEffect(() => {
    if (showProfile && !profile) {
      checkRoleAndLoad();
    }
  }, [showProfile]);

  useEffect(() => {
    if (activeView === "dashboard") {
      fetchStats();
    } else if (activeView === "mentors") {
      fetchMentors();
    } else if (activeView === "courses") {
      fetchCourses();
    } else if (activeView === "resources") {
      fetchResources();
    } else if (activeView === "sessions") {
      fetchSessions();
    } else if (activeView === "communities") {
      fetchCommunities();
    } else if (activeView === "users") {
      fetchUsers();
    }
  }, [activeView]);

  const checkRoleAndLoad = async () => {
    try {
      const response = await authApi.getProfile();
      if (response.user) {
        const userRole = response.user.role;
        // Only allow admin and superadmin, redirect others (including students/users)
        if (userRole !== "admin" && userRole !== "superadmin") {
          // If user is student/user, redirect to student dashboard
          if (userRole === "student" || userRole === "user") {
            navigate("/dashboard");
            return;
          }
          // If user is teacher/mentor, redirect to mentor dashboard
          if (userRole === "teacher" || userRole === "mentor") {
            navigate("/mentor-dashboard");
            return;
          }
          // Default redirect to dashboard
          navigate("/dashboard");
          return;
        }
        setProfile(response.user);
        setFormData({
          name: response.user.name || "",
          mobile: response.user.mobile || "",
          address: response.user.address || "",
          role: response.user.role || "admin",
        });
      }
    } catch (error) {
      console.error("Error checking role:", error);
      // If error, redirect to dashboard
      navigate("/dashboard");
    }
  };

  const fetchStats = async () => {
    try {
      setIsLoadingStats(true);
      const response = await adminApi.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchMentors = async () => {
    try {
      setIsLoadingMentors(true);
      const response = await adminApi.getAllMentors();
      if (response.success) {
        setMentors(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch mentors:", error);
    } finally {
      setIsLoadingMentors(false);
    }
  };

  const fetchCourses = async () => {
    try {
      setIsLoadingCourses(true);
      const response = await adminApi.getAllCourses();
      if (response.success) {
        setCourses(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const fetchResources = async () => {
    try {
      setIsLoadingResources(true);
      const response = await adminApi.getAllResources();
      if (response.success) {
        setResources(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch resources:", error);
    } finally {
      setIsLoadingResources(false);
    }
  };

  const fetchSessions = async () => {
    try {
      setIsLoadingSessions(true);
      const response = await adminApi.getAllSessions();
      if (response.success) {
        setSessions(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const fetchCommunities = async () => {
    try {
      setIsLoadingCommunities(true);
      const response = await adminApi.getAllCommunities();
      if (response.success) {
        setCommunities(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch communities:", error);
    } finally {
      setIsLoadingCommunities(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const response = await adminApi.getAllUsers();
      if (response.success) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      const response = await adminApi.deleteCourse(id);
      if (response.success) {
        toast({ title: "Success", description: "Course deleted successfully" });
        fetchCourses();
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof ApiError ? error.message : "Failed to delete course", variant: "destructive" });
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;
    try {
      const response = await adminApi.deleteResource(id);
      if (response.success) {
        toast({ title: "Success", description: "Resource deleted successfully" });
        fetchResources();
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof ApiError ? error.message : "Failed to delete resource", variant: "destructive" });
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm("Are you sure you want to delete this session?")) return;
    try {
      const response = await adminApi.deleteSession(id);
      if (response.success) {
        toast({ title: "Success", description: "Session deleted successfully" });
        fetchSessions();
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof ApiError ? error.message : "Failed to delete session", variant: "destructive" });
    }
  };

  const handleDeleteCommunity = async (id: string) => {
    if (!confirm("Are you sure you want to delete this community?")) return;
    try {
      const response = await adminApi.deleteCommunity(id);
      if (response.success) {
        toast({ title: "Success", description: "Community deleted successfully" });
        fetchCommunities();
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof ApiError ? error.message : "Failed to delete community", variant: "destructive" });
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const response = await adminApi.deleteUser(id);
      if (response.success) {
        toast({ title: "Success", description: "User deleted successfully" });
        fetchUsers();
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof ApiError ? error.message : "Failed to delete user", variant: "destructive" });
    }
  };

  const handleUpdateUserRole = async (id: string, role: string) => {
    try {
      const response = await adminApi.updateUserRole(id, role);
      if (response.success) {
        toast({ title: "Success", description: "User role updated successfully" });
        fetchUsers();
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof ApiError ? error.message : "Failed to update user role", variant: "destructive" });
    }
  };

  const handleCreateCommunity = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.createCommunity({
        name: communityFormData.name,
        description: communityFormData.description,
        category: communityFormData.category,
        isPublic: communityFormData.isPublic,
        rules: communityFormData.rules,
        discordLink: communityFormData.discordLink,
      });
      if (response.success) {
        toast({ title: "Success", description: "Community created successfully" });
        setCreateCommunityOpen(false);
        setCommunityFormData({ name: "", description: "", category: "", isPublic: true, rules: [], discordLink: "" });
        fetchCommunities();
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof ApiError ? error.message : "Failed to create community", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCommunity = async () => {
    if (!selectedCommunity) return;
    try {
      setIsLoading(true);
      const response = await adminApi.updateCommunity(selectedCommunity._id, {
        name: communityFormData.name,
        description: communityFormData.description,
        category: communityFormData.category,
        isPublic: communityFormData.isPublic,
        rules: communityFormData.rules,
        discordLink: communityFormData.discordLink,
      });
      if (response.success) {
        toast({ title: "Success", description: "Community updated successfully" });
        setEditCommunityOpen(false);
        setSelectedCommunity(null);
        setCommunityFormData({ name: "", description: "", category: "", isPublic: true, rules: [], discordLink: "" });
        fetchCommunities();
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof ApiError ? error.message : "Failed to update community", variant: "destructive" });
    } finally {
      setIsLoading(false);
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
        role: profile.role || "admin",
      });
    }
    setIsEditing(false);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      setSelectedFile(file);
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

  const getInitials = (name: string | null) => {
    if (!name) return "A";
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

  const handleLogout = () => {
    tokenManager.removeToken();
    navigate("/auth");
  };

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
        <div className="p-6 h-full flex flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-white">Admin Panel</span>
          </div>

          {/* Navigation */}
          <nav className="space-y-2 flex-1">
            {[
              { icon: Home, label: "Dashboard", view: "dashboard" as const },
              { icon: UserCog, label: "Profile", onClick: () => setShowProfile(true) },
              { icon: Users, label: "All Mentors", view: "mentors" as const },
              { icon: GraduationCap, label: "All Courses", view: "courses" as const },
              { icon: FileText, label: "All Resources", view: "resources" as const },
              { icon: Video, label: "All Sessions", view: "sessions" as const },
              { icon: MessageSquare, label: "Communities", view: "communities" as const },
              { icon: Database, label: "All Users", view: "users" as const },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  if (item.view) {
                    setActiveView(item.view);
                    setShowProfile(false);
                  } else if (item.onClick) {
                    item.onClick();
                    setSidebarOpen(false);
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  (item.view && activeView === item.view) || (item.label === "Profile" && showProfile)
                    ? "gradient-primary text-primary-foreground shadow-soft"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-red-500/20 hover:text-red-400 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
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
                  {showProfile ? "Profile" :
                   activeView === "dashboard" ? "Admin Dashboard" :
                   activeView === "mentors" ? "All Mentors" :
                   activeView === "courses" ? "All Courses" :
                   activeView === "resources" ? "All Resources" :
                   activeView === "sessions" ? "All Sessions" :
                   activeView === "communities" ? "Communities" :
                   activeView === "users" ? "All Users" : "Admin Dashboard"}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {showProfile ? "Manage your profile settings" :
                   activeView === "dashboard" ? "Overview of all system statistics" :
                   activeView === "mentors" ? "View and manage all mentors" :
                   activeView === "courses" ? "Manage all courses" :
                   activeView === "resources" ? "Manage all resources" :
                   activeView === "sessions" ? "Manage all sessions" :
                   activeView === "communities" ? "Create and manage communities" :
                   activeView === "users" ? "Manage all users" : "Admin Panel"}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 lg:p-8">
          {showProfile ? (
            /* Profile View */
            <div className="max-w-6xl mx-auto space-y-6">
              {profile ? (
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Profile Card */}
                  <Card>
                    <CardHeader className="text-center">
                      <div className="flex flex-col items-center">
                        <div className="relative group mb-4">
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
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Account Details</CardTitle>
                          <CardDescription>Your complete account information</CardDescription>
                        </div>
                        {!isEditing ? (
                          <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Profile
                          </Button>
                        ) : (
                          <div className="flex gap-2">
                            <Button onClick={handleSave} disabled={isLoading} size="sm">
                              <Save className="w-4 h-4 mr-2" />
                              Save
                            </Button>
                            <Button onClick={handleCancel} variant="outline" size="sm" disabled={isLoading}>
                              <XCircle className="w-4 h-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
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
          ) : activeView === "dashboard" ? (
            /* Dashboard Stats */
            <div className="space-y-6">
              {isLoadingStats ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading statistics...</p>
                  </div>
                </div>
              ) : stats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalUsers}</div>
                      <p className="text-xs text-muted-foreground">Students: {stats.totalStudents} | Mentors: {stats.totalMentors}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalCourses}</div>
                      <p className="text-xs text-muted-foreground">{stats.totalEnrollments} enrollments</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalResources}</div>
                      <p className="text-xs text-muted-foreground">{stats.totalPurchases} purchases</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                      <Video className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalSessions}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Communities</CardTitle>
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalCommunities}</div>
                    </CardContent>
                  </Card>
                </div>
              ) : null}
            </div>
          ) : activeView === "mentors" ? (
            /* All Mentors View */
            <div className="space-y-6">
              {isLoadingMentors ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading mentors...</p>
                  </div>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mentors.map((mentor) => (
                    <Card key={mentor._id}>
                      <CardHeader>
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src={mentor.photoFileName || undefined} />
                            <AvatarFallback>{mentor.name?.charAt(0).toUpperCase() || "M"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle>{mentor.name}</CardTitle>
                            <CardDescription>{mentor.email}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Badge>{mentor.role}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : activeView === "courses" ? (
            /* All Courses View */
            <div className="space-y-6">
              {isLoadingCourses ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading courses...</p>
                  </div>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <Card key={course._id} className="overflow-hidden hover-lift">
                      <CardHeader className="p-0">
                        <div className="relative w-full h-48 bg-gradient-to-br from-primary/20 to-primary/5">
                          {course.thumbnailUrl ? (
                            <img
                              src={course.thumbnailUrl}
                              alt={course.title}
                              className="w-full h-full object-cover rounded-t-lg"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x200?text=Course+Image";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center rounded-t-lg">
                              <GraduationCap className="w-16 h-16 text-primary/50" />
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <CardTitle className="line-clamp-2 mb-2">{course.title}</CardTitle>
                        <CardDescription className="line-clamp-2 mb-4">{course.description}</CardDescription>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge variant="outline">{course.category}</Badge>
                          <Badge variant="outline">{course.level || "beginner"}</Badge>
                          <Badge variant={course.isPublished ? "default" : "secondary"}>
                            {course.isPublished ? "Published" : "Draft"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-1">
                            <Video className="w-4 h-4" />
                            <span>{course.lessons?.length || 0} lessons</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{course.duration || 0}h</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="w-full"
                            onClick={() => handleDeleteCourse(course._id)}
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
          ) : activeView === "resources" ? (
            /* All Resources View */
            <div className="space-y-6">
              {isLoadingResources ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading resources...</p>
                  </div>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {resources.map((resource) => (
                    <Card key={resource._id} className="overflow-hidden hover-lift">
                      <CardHeader className="p-0">
                        <div className="relative w-full h-48 bg-gradient-to-br from-primary/20 to-primary/5">
                          {resource.thumbnailUrl ? (
                            <img
                              src={resource.thumbnailUrl}
                              alt={resource.title}
                              className="w-full h-full object-cover rounded-t-lg"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x200?text=Resource+Image";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center rounded-t-lg">
                              <FileText className="w-16 h-16 text-primary/50" />
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <CardTitle className="line-clamp-2 mb-2">{resource.title}</CardTitle>
                        <CardDescription className="line-clamp-2 mb-4">{resource.description}</CardDescription>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge variant="outline">{resource.category}</Badge>
                          {resource.isFree ? (
                            <Badge className="bg-green-500/10 text-green-500">Free</Badge>
                          ) : (
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium text-primary">₹{resource.price}</span>
                            </div>
                          )}
                          <Badge variant={resource.isActive ? "default" : "secondary"}>
                            {resource.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        {resource.author && typeof resource.author === 'object' && (
                          <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                            <User className="w-4 h-4" />
                            <span>{resource.author.name || resource.authorName || "Unknown"}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="w-full"
                            onClick={() => handleDeleteResource(resource._id)}
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
          ) : activeView === "sessions" ? (
            /* All Sessions View */
            <div className="space-y-6">
              {isLoadingSessions ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading sessions...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => {
                    const course = session.course as any;
                    const mentor = session.mentor as any;
                    return (
                      <Card key={session._id}>
                        <CardHeader>
                          <CardTitle>{session.title}</CardTitle>
                          <CardDescription>{session.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Course: {course?.title || "N/A"}</p>
                              <p className="text-sm text-muted-foreground">Mentor: {mentor?.name || "N/A"}</p>
                              <p className="text-sm text-muted-foreground">
                                Date: {new Date(session.scheduledDate).toLocaleString()}
                              </p>
                            </div>
                            <Badge>{session.status}</Badge>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="mt-4"
                            onClick={() => handleDeleteSession(session._id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          ) : activeView === "communities" ? (
            /* Communities View */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Communities</h2>
                <Dialog open={createCommunityOpen} onOpenChange={setCreateCommunityOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Community
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Community</DialogTitle>
                      <DialogDescription>Create a new community for users to join</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={communityFormData.name}
                          onChange={(e) => setCommunityFormData({ ...communityFormData, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={communityFormData.description}
                          onChange={(e) => setCommunityFormData({ ...communityFormData, description: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Select
                          value={communityFormData.category}
                          onValueChange={(value) => setCommunityFormData({ ...communityFormData, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="programming">Programming</SelectItem>
                            <SelectItem value="mathematics">Mathematics</SelectItem>
                            <SelectItem value="science">Science</SelectItem>
                            <SelectItem value="language">Language</SelectItem>
                            <SelectItem value="business">Business</SelectItem>
                            <SelectItem value="design">Design</SelectItem>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Discord Link (Optional)</Label>
                        <Input
                          type="url"
                          placeholder="https://discord.gg/..."
                          value={communityFormData.discordLink}
                          onChange={(e) => setCommunityFormData({ ...communityFormData, discordLink: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={communityFormData.isPublic}
                          onCheckedChange={(checked) => setCommunityFormData({ ...communityFormData, isPublic: checked })}
                        />
                        <Label>Public Community</Label>
                      </div>
                      <Button onClick={handleCreateCommunity} disabled={isLoading}>
                        Create
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              {isLoadingCommunities ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading communities...</p>
                  </div>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {communities.map((community) => (
                    <Card key={community._id}>
                      <CardHeader>
                        <CardTitle>{community.name}</CardTitle>
                        <CardDescription className="line-clamp-2">{community.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mb-4">
                          <Badge>{community.category}</Badge>
                          <Badge variant={community.isActive ? "default" : "secondary"}>
                            {community.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{community.memberCount} members</p>
                        {community.discordLink && (
                          <div className="mb-4">
                            <a
                              href={community.discordLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Join Discord
                            </a>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCommunity(community);
                              setCommunityFormData({
                                name: community.name,
                                description: community.description,
                                category: community.category,
                                isPublic: community.isPublic,
                                rules: community.rules,
                                discordLink: community.discordLink || "",
                              });
                              setEditCommunityOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteCommunity(community._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              {/* Edit Community Dialog */}
              <Dialog open={editCommunityOpen} onOpenChange={setEditCommunityOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Community</DialogTitle>
                    <DialogDescription>Update community information</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={communityFormData.name}
                        onChange={(e) => setCommunityFormData({ ...communityFormData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={communityFormData.description}
                        onChange={(e) => setCommunityFormData({ ...communityFormData, description: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Select
                        value={communityFormData.category}
                        onValueChange={(value) => setCommunityFormData({ ...communityFormData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="programming">Programming</SelectItem>
                          <SelectItem value="mathematics">Mathematics</SelectItem>
                          <SelectItem value="science">Science</SelectItem>
                          <SelectItem value="language">Language</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="design">Design</SelectItem>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Discord Link (Optional)</Label>
                      <Input
                        type="url"
                        placeholder="https://discord.gg/..."
                        value={communityFormData.discordLink}
                        onChange={(e) => setCommunityFormData({ ...communityFormData, discordLink: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={communityFormData.isPublic}
                        onCheckedChange={(checked) => setCommunityFormData({ ...communityFormData, isPublic: checked })}
                      />
                      <Label>Public Community</Label>
                    </div>
                    <Button onClick={handleUpdateCommunity} disabled={isLoading}>
                      Update
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ) : activeView === "users" ? (
            /* All Users View */
            <div className="space-y-6">
              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading users...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map((user) => (
                    <Card key={user._id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar>
                              <AvatarImage src={user.photoFileName || undefined} />
                              <AvatarFallback>{user.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle>{user.name}</CardTitle>
                              <CardDescription>{user.email}</CardDescription>
                            </div>
                          </div>
                          <Badge>{user.role}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <Select
                            value={user.role}
                            onValueChange={(role) => handleUpdateUserRole(user._id, role)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="teacher">Teacher</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(user._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;

