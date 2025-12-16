import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  BookOpen, Search, Filter, Plus, Play, Star, Tag,
  Clock, Users, GraduationCap, Award, Menu, X,
  CheckCircle, Lock, DollarSign, Video, FileText, User, Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { tokenManager } from "@/lib/api";

// Razorpay TypeScript declaration
declare global {
  interface Window {
    Razorpay: any;
  }
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
    order: number;
  }>;
  tags: string[];
  enrollmentCount: number;
  rating: number;
  totalRatings: number;
  instructor: {
    _id: string;
    name: string;
    email: string;
    photoFileName?: string;
  };
  instructorName?: string;
  isEnrolled?: boolean;
  enrollmentProgress?: number;
  enrollmentStatus?: string;
  createdAt: string;
}

const Courses = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "programming", label: "Programming" },
    { value: "mathematics", label: "Mathematics" },
    { value: "science", label: "Science" },
    { value: "language", label: "Language" },
    { value: "business", label: "Business" },
    { value: "design", label: "Design" },
    { value: "other", label: "Other" },
  ];

  const levels = [
    { value: "all", label: "All Levels" },
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
  ];

  // Fetch courses
  useEffect(() => {
    fetchCourses();
  }, []);

  // Filter courses
  useEffect(() => {
    let filtered = courses;

    if (filterCategory !== "all") {
      filtered = filtered.filter((c) => c.category === filterCategory);
    }

    if (filterLevel !== "all") {
      filtered = filtered.filter((c) => c.level === filterLevel);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query) ||
          c.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          (c.instructor?.name || c.instructorName || "").toLowerCase().includes(query)
      );
    }

    setFilteredCourses(filtered);
  }, [courses, filterCategory, filterLevel, searchQuery]);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const token = tokenManager.getToken();
      const response = await fetch("http://localhost:5000/api/courses", {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      const data = await response.json();
      if (data.success) {
        // Map instructor object to instructorName for compatibility
        const coursesWithInstructorName = (data.data || []).map((course: any) => ({
          ...course,
          instructorName: course.instructor?.name || "Unknown Instructor",
        }));
        setCourses(coursesWithInstructorName);
        
        // Log for debugging
        console.log(`Loaded ${coursesWithInstructorName.length} courses`);
      } else {
        console.error("Failed to load courses:", data);
        toast({
          title: "Error",
          description: data.message || "Failed to load courses",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Fetch courses error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load courses. Please check your connection.",
        variant: "destructive",
      });
      // Set empty array on error to show empty state
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  const handleEnroll = async (course: Course) => {
    if (!tokenManager.getToken()) {
      toast({
        title: "Login Required",
        description: "Please login to enroll in courses",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    // Free course - enroll directly
    if (course.isFree || course.price === 0) {
      try {
        setIsLoading(true);
        const token = tokenManager.getToken();
        const response = await fetch(
          "http://localhost:5000/api/courses/enroll",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ courseId: course._id }),
          }
        );

        const data = await response.json();
        if (data.success) {
          toast({
            title: "Success",
            description: "Successfully enrolled in course!",
          });
          // Refresh courses to update enrollment status
          await fetchCourses();
        } else {
          toast({
            title: "Error",
            description: data.message || "Failed to enroll",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Enroll error:", error);
        toast({
          title: "Error",
          description: "Failed to enroll in course",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Paid course - initiate Razorpay payment
    try {
      setIsLoading(true);
      const token = tokenManager.getToken();
      const response = await fetch(
        "http://localhost:5000/api/resources/course/create-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ courseId: course._id }),
        }
      );

      const data = await response.json();
      if (data.success && data.data) {
        const { orderId, amount, keyId, purchaseId } = data.data;

        // Initialize Razorpay
        const options = {
          key: keyId,
          amount: amount,
          currency: "INR",
          name: "Study Link",
          description: `Enroll in: ${course.title}`,
          order_id: orderId,
          handler: async function (response: any) {
            // Verify payment
            try {
              const verifyResponse = await fetch(
                "http://localhost:5000/api/resources/purchase/verify",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    purchaseId: purchaseId,
                    type: "course",
                  }),
                }
              );

              const verifyData = await verifyResponse.json();
              if (verifyData.success) {
                toast({
                  title: "Payment Successful",
                  description: "Successfully enrolled in course!",
                });
                // Refresh courses to update enrollment status
                await fetchCourses();
              } else {
                toast({
                  title: "Payment Verification Failed",
                  description: verifyData.message || "Please contact support",
                  variant: "destructive",
                });
              }
            } catch (error) {
              console.error("Verify payment error:", error);
              toast({
                title: "Error",
                description: "Failed to verify payment",
                variant: "destructive",
              });
            }
          },
          prefill: {
            name: "",
            email: "",
            contact: "",
          },
          theme: {
            color: "#6366f1",
          },
          modal: {
            ondismiss: function () {
              setIsLoading(false);
            },
          },
        };

        if (window.Razorpay) {
          const razorpay = new window.Razorpay(options);
          razorpay.open();
        } else {
          toast({
            title: "Error",
            description: "Payment gateway not loaded. Please refresh the page.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create order",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Create order error:", error);
      toast({
        title: "Error",
        description: "Failed to initiate payment",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-white">
              Study Link
            </span>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {[
              {
                icon: BookOpen,
                label: "Dashboard",
                onClick: () => navigate("/dashboard"),
              },
              {
                icon: GraduationCap,
                label: "Courses",
                active: true,
              },
              {
                icon: Users,
                label: "Mentors",
                onClick: () => navigate("/mentors"),
              },
              {
                icon: FileText,
                label: "Resources",
                onClick: () => navigate("/resources"),
              },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  item.active
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
                  Courses
                </h1>
                <p className="text-muted-foreground text-sm">
                  Enroll in courses and start learning
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-secondary rounded-full" />
              </Button>
              {tokenManager.getToken() && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/dashboard">
                    <User className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 lg:p-8">
          {/* Search and Filter */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                {levels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Courses Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading courses...</p>
              </div>
            </div>
          ) : filteredCourses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No courses found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || filterCategory !== "all" || filterLevel !== "all"
                    ? "Try adjusting your search or filters"
                    : "No courses available yet"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <Card
                  key={course._id}
                  className="hover-lift transition-all cursor-pointer group"
                  onClick={() => {
                    if (course.isEnrolled) {
                      // Navigate to course details/lessons
                      toast({
                        title: "Course Details",
                        description: "Course detail page coming soon!",
                      });
                    }
                  }}
                >
                  <div className="relative">
                    <img
                      src={course.thumbnailUrl || "https://via.placeholder.com/400x200?text=Course+Image"}
                      alt={course.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                      onError={(e) => {
                        // Fallback to default image if thumbnail fails to load
                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x200?text=Course+Image";
                      }}
                    />
                    {course.isEnrolled && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-green-500/90 text-white">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Already Enrolled
                        </Badge>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 flex flex-col gap-2">
                      <Badge className={getCategoryColor(course.category)}>
                        {course.category}
                      </Badge>
                      <Badge className={getLevelColor(course.level)}>
                        {course.level}
                      </Badge>
                    </div>
                  </div>

                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CardTitle className="line-clamp-2 flex-1">{course.title}</CardTitle>
                      {course.isEnrolled && (
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20 flex-shrink-0">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Already Enrolled
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="line-clamp-2">
                      {course.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          {course.instructor?.photoFileName ? (
                            <AvatarImage src={course.instructor.photoFileName} alt={course.instructor.name} />
                          ) : null}
                          <AvatarFallback className="text-xs">
                            {(course.instructor?.name || course.instructorName || "U").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">
                          {course.instructor?.name || course.instructorName || "Unknown Instructor"}
                        </span>
                      </div>
                      {course.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-medium">
                            {course.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Video className="w-4 h-4" />
                        <span>{course.lessons.length} lessons</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{course.duration}h</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{course.enrollmentCount}</span>
                      </div>
                    </div>

                    {course.isEnrolled && course.enrollmentProgress !== undefined && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Progress</span>
                          <span className="text-sm text-muted-foreground">
                            {course.enrollmentProgress}%
                          </span>
                        </div>
                        <Progress value={course.enrollmentProgress} className="h-2" />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        {course.isFree ? (
                          <Badge className="bg-green-500/10 text-green-500">
                            Free
                          </Badge>
                        ) : (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-primary" />
                            <span className="text-lg font-bold text-primary">
                              {course.price}
                            </span>
                            <span className="text-sm text-muted-foreground">INR</span>
                          </div>
                        )}
                      </div>
                      {course.isEnrolled ? (
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20 px-4 py-2">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Already Enrolled
                        </Badge>
                      ) : (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEnroll(course);
                          }}
                          disabled={isLoading}
                          variant="default"
                        >
                          <GraduationCap className="w-4 h-4 mr-2" />
                          {course.isFree ? "Enroll Free" : "Enroll Now"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Courses;

