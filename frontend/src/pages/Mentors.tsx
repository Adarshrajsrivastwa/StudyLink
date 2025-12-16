import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen, Search, Filter, Star, Users, GraduationCap,
  Award, Clock, MapPin, Video, MessageSquare,
  ChevronRight, Menu, X, TrendingUp, Languages, BookMarked, User
} from "lucide-react";
import MentorChat from "@/components/MentorChat";
import { tokenManager, mentorApi, Mentor } from "@/lib/api";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const Mentors = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSpecialty, setFilterSpecialty] = useState<string>("all");
  const [filterAvailability, setFilterAvailability] = useState<string>("all");
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMentorId, setChatMentorId] = useState<string>("");
  const [chatMentorName, setChatMentorName] = useState<string>("");
  const [chatMentorAvatar, setChatMentorAvatar] = useState<string>("");
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Setup Socket.IO connection for real-time mentor profile updates
  useEffect(() => {
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    // Listen for mentor profile updates
    socket.on("mentor-profile-updated", async (data: { mentorId: string; mentor: any }) => {
      // Refresh mentors list
      try {
        const response = await mentorApi.getAllMentors();
        if (response.success && response.data) {
          setMentors(response.data);
          
          // Update selected mentor if it's the one that was updated
          if (selectedMentor && selectedMentor._id === data.mentorId) {
            const updatedMentor = response.data.find((m: Mentor) => m._id === data.mentorId);
            if (updatedMentor) {
              setSelectedMentor(updatedMentor);
            }
          }
        }
      } catch (error) {
        console.error("Failed to refresh mentors after update:", error);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [selectedMentor]);

  // Fetch mentors from API
  useEffect(() => {
    const fetchMentors = async () => {
      try {
        setIsLoading(true);
        const response = await mentorApi.getAllMentors();
        if (response.success && response.data) {
          setMentors(response.data);
        } else {
          toast({
            title: "Error",
            description: response.message || "Failed to load mentors",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Fetch mentors error:", error);
        toast({
          title: "Error",
          description: "Failed to load mentors. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMentors();
  }, [toast]);

  // Fallback mock data (will be replaced by API data)
  const mockMentors: Mentor[] = [
    {
      id: "1",
      name: "Dr. Sarah Chen",
      avatar: "SC",
      specialty: ["Mathematics", "Calculus", "Statistics"],
      rating: 4.9,
      totalReviews: 234,
      totalSessions: 1247,
      pricePerHour: 50,
      bio: "PhD in Mathematics with 10+ years of teaching experience. Specialized in advanced calculus and statistics.",
      experience: 10,
      languages: ["English", "Mandarin"],
      availability: "available",
      isOnline: true,
      subjects: ["Calculus", "Linear Algebra", "Statistics", "Differential Equations"],
      achievements: ["Top Rated Mentor", "1000+ Sessions", "PhD Mathematics"],
    },
    {
      id: "2",
      name: "Prof. James Wilson",
      avatar: "JW",
      specialty: ["Physics", "Quantum Mechanics", "Thermodynamics"],
      rating: 4.8,
      totalReviews: 189,
      totalSessions: 892,
      pricePerHour: 55,
      bio: "Professor of Physics with expertise in quantum mechanics and theoretical physics. Published researcher.",
      experience: 15,
      languages: ["English"],
      availability: "available",
      isOnline: true,
      subjects: ["Quantum Mechanics", "Thermodynamics", "Electromagnetism"],
      achievements: ["Published Researcher", "Professor", "Expert Mentor"],
    },
    {
      id: "3",
      name: "Maria Garcia",
      avatar: "MG",
      specialty: ["Spanish Literature", "Language", "Writing"],
      rating: 4.7,
      totalReviews: 156,
      totalSessions: 678,
      pricePerHour: 40,
      bio: "Native Spanish speaker and literature expert. Helps students master Spanish language and literature.",
      experience: 8,
      languages: ["Spanish", "English"],
      availability: "busy",
      isOnline: false,
      subjects: ["Spanish Literature", "Language Learning", "Creative Writing"],
      achievements: ["Native Speaker", "Literature Expert"],
    },
    {
      id: "4",
      name: "Dr. Emily Parker",
      avatar: "EP",
      specialty: ["Data Science", "Machine Learning", "Python"],
      rating: 4.9,
      totalReviews: 312,
      totalSessions: 1456,
      pricePerHour: 60,
      bio: "Data scientist and ML engineer with industry experience. Teaches practical data science skills.",
      experience: 12,
      languages: ["English"],
      availability: "available",
      isOnline: true,
      subjects: ["Python", "Machine Learning", "Data Analysis", "Deep Learning"],
      achievements: ["Industry Expert", "Top Rated", "1500+ Sessions"],
    },
    {
      id: "5",
      name: "Michael Brown",
      avatar: "MB",
      specialty: ["Web Development", "React", "JavaScript"],
      rating: 4.8,
      totalReviews: 267,
      totalSessions: 1123,
      pricePerHour: 45,
      bio: "Full-stack developer with 8 years of experience. Expert in modern web technologies.",
      experience: 8,
      languages: ["English"],
      availability: "available",
      isOnline: true,
      subjects: ["React", "JavaScript", "Node.js", "TypeScript"],
      achievements: ["Senior Developer", "Industry Expert"],
    },
    {
      id: "6",
      name: "Lisa Zhang",
      avatar: "LZ",
      specialty: ["Computer Science", "Algorithms", "Data Structures"],
      rating: 4.9,
      totalReviews: 298,
      totalSessions: 1345,
      pricePerHour: 55,
      bio: "Computer science professor specializing in algorithms and data structures. Helps students excel in coding interviews.",
      experience: 11,
      languages: ["English", "Mandarin"],
      availability: "away",
      isOnline: false,
      subjects: ["Algorithms", "Data Structures", "C++", "Java"],
      achievements: ["CS Professor", "Interview Expert", "Top Mentor"],
    },
  ];

  // Use API mentors if available, otherwise fallback to mock data
  const displayMentors = mentors.length > 0 ? mentors : mockMentors;

  const specialties = Array.from(
    new Set(displayMentors.flatMap((m) => m.specialty || []))
  );

  const filteredMentors = displayMentors.filter((mentor) => {
    const matchesSearch =
      mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (mentor.specialty || []).some((s) =>
        s.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      (mentor.subjects || []).some((s) =>
        s.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesSpecialty =
      filterSpecialty === "all" ||
      (mentor.specialty || []).includes(filterSpecialty);

    const matchesAvailability =
      filterAvailability === "all" ||
      mentor.availability === filterAvailability;

    return matchesSearch && matchesSpecialty && matchesAvailability;
  });

  const availableMentors = filteredMentors.filter(
    (m) => m.availability === "available"
  );
  const allMentors = filteredMentors;

  const getAvailabilityBadge = (availability: Mentor["availability"]) => {
    switch (availability) {
      case "available":
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
            Available
          </Badge>
        );
      case "busy":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2" />
            Busy
          </Badge>
        );
      case "away":
        return (
          <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">
            <div className="w-2 h-2 bg-gray-500 rounded-full mr-2" />
            Away
          </Badge>
        );
    }
  };

  const handleBookSession = (mentor: Mentor) => {
    toast({
      title: "Book Session",
      description: `Booking session with ${mentor.name}...`,
    });
    // Navigate to booking page or open booking modal
  };

  const handleViewProfile = (mentor: Mentor) => {
    setSelectedMentor(mentor);
  };

  const handleOpenChat = (mentor: Mentor) => {
    if (!tokenManager.getToken()) {
      toast({
        title: "Login Required",
        description: "Please login to chat with mentors",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    // Use _id (MongoDB ObjectId) instead of id for chat
    setChatMentorId(mentor._id || mentor.id);
    setChatMentorName(mentor.name);
    setChatMentorAvatar(mentor.avatar || mentor.name?.charAt(0).toUpperCase() || "M");
    setChatOpen(true);
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
          <Link to="/" className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-white">
              Study Link
            </span>
          </Link>

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
                onClick: () => navigate("/courses"),
              },
              {
                icon: Users,
                label: "Mentors",
                active: true,
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
                  Find Your Mentor
                </h1>
                <p className="text-muted-foreground text-sm">
                  Connect with expert mentors to accelerate your learning
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
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
          {/* Search and Filter Bar */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search mentors by name, specialty, or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Specialty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="all-specialties" value="all">All Specialties</SelectItem>
                {specialties.map((specialty) => (
                  <SelectItem key={specialty} value={specialty}>
                    {specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filterAvailability}
              onValueChange={setFilterAvailability}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="all-status" value="all">All Status</SelectItem>
                <SelectItem key="available-status" value="available">Available</SelectItem>
                <SelectItem key="busy-status" value="busy">Busy</SelectItem>
                <SelectItem key="away-status" value="away">Away</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              {
                label: "Total Mentors",
                value: displayMentors.length,
                icon: Users,
                color: "bg-primary/10 text-primary",
              },
              {
                label: "Available Now",
                value: displayMentors.filter((m) => m.availability === "available")
                  .length,
                icon: Clock,
                color: "bg-green-500/10 text-green-500",
              },
              {
                label: "Online",
                value: displayMentors.filter((m) => m.isOnline).length,
                icon: Video,
                color: "bg-blue-500/10 text-blue-500",
              },
              {
                label: "Avg. Rating",
                value: displayMentors.length > 0
                  ? (
                      displayMentors.reduce((sum, m) => sum + m.rating, 0) / displayMentors.length
                    ).toFixed(1)
                  : "0.0",
                icon: Star,
                color: "bg-yellow-500/10 text-yellow-500",
              },
            ].map((stat) => (
              <Card key={stat.label} className="hover-lift">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}
                    >
                      <stat.icon className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Mentors Tabs */}
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all">
                All Mentors ({allMentors.length})
              </TabsTrigger>
              <TabsTrigger value="available">
                Available Now ({availableMentors.length})
              </TabsTrigger>
            </TabsList>

            {/* All Mentors */}
            <TabsContent value="all" className="space-y-4">
              {isLoading ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading mentors...</p>
                  </CardContent>
                </Card>
              ) : allMentors.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No mentors found
                    </h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search or filters
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allMentors.map((mentor) => (
                    <Card
                      key={mentor._id || mentor.id}
                      className="hover-lift transition-all cursor-pointer group"
                      onClick={() => handleViewProfile(mentor)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="w-16 h-16 ring-2 ring-primary/20">
                                <AvatarFallback className="gradient-primary text-primary-foreground font-bold text-lg">
                                  {mentor.avatar || mentor.name?.charAt(0).toUpperCase() || "M"}
                                </AvatarFallback>
                              </Avatar>
                              {mentor.isOnline && (
                                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-background rounded-full" />
                              )}
                            </div>
                            <div>
                              <CardTitle className="text-lg">
                                {mentor.name}
                              </CardTitle>
                              <CardDescription className="flex items-center gap-1 mt-1">
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                <span className="font-medium">
                                  {mentor.rating || 0}
                                </span>
                                <span className="text-muted-foreground">
                                  ({mentor.totalReviews || 0})
                                </span>
                              </CardDescription>
                            </div>
                          </div>
                          {getAvailabilityBadge(mentor.availability)}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(mentor.specialty || []).slice(0, 2).map((spec) => (
                            <Badge
                              key={spec}
                              variant="outline"
                              className="text-xs"
                            >
                              {spec}
                            </Badge>
                          ))}
                          {(mentor.specialty || []).length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{(mentor.specialty || []).length - 2}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {mentor.bio || "No bio available"}
                        </p>
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Experience
                            </span>
                            <span className="font-medium">
                              {mentor.experience || 0} years
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Sessions
                            </span>
                            <span className="font-medium">
                              {(mentor.totalSessions || 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Price
                            </span>
                            <span className="font-medium text-primary">
                              ${mentor.pricePerHour || 0}/hr
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenChat(mentor);
                            }}
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Chat
                          </Button>
                          <Button
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewProfile(mentor);
                            }}
                          >
                            <BookOpen className="w-4 h-4 mr-2" />
                            View Profile
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Available Mentors */}
            <TabsContent value="available" className="space-y-4">
              {isLoading ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading mentors...</p>
                  </CardContent>
                </Card>
              ) : availableMentors.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No available mentors
                    </h3>
                    <p className="text-muted-foreground">
                      Check back later or view all mentors
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableMentors.map((mentor) => (
                    <Card
                      key={mentor._id || mentor.id}
                      className="hover-lift transition-all cursor-pointer group"
                      onClick={() => handleViewProfile(mentor)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="w-16 h-16 ring-2 ring-primary/20">
                                <AvatarFallback className="gradient-primary text-primary-foreground font-bold text-lg">
                                  {mentor.avatar || mentor.name?.charAt(0).toUpperCase() || "M"}
                                </AvatarFallback>
                              </Avatar>
                              {mentor.isOnline && (
                                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-background rounded-full" />
                              )}
                            </div>
                            <div>
                              <CardTitle className="text-lg">
                                {mentor.name}
                              </CardTitle>
                              <CardDescription className="flex items-center gap-1 mt-1">
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                <span className="font-medium">
                                  {mentor.rating || 0}
                                </span>
                                <span className="text-muted-foreground">
                                  ({mentor.totalReviews || 0})
                                </span>
                              </CardDescription>
                            </div>
                          </div>
                          {getAvailabilityBadge(mentor.availability)}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(mentor.specialty || []).slice(0, 2).map((spec) => (
                            <Badge
                              key={spec}
                              variant="outline"
                              className="text-xs"
                            >
                              {spec}
                            </Badge>
                          ))}
                          {(mentor.specialty || []).length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{(mentor.specialty || []).length - 2}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {mentor.bio || "No bio available"}
                        </p>
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Experience
                            </span>
                            <span className="font-medium">
                              {mentor.experience || 0} years
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Sessions
                            </span>
                            <span className="font-medium">
                              {(mentor.totalSessions || 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Price
                            </span>
                            <span className="font-medium text-primary">
                              ${mentor.pricePerHour || 0}/hr
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenChat(mentor);
                            }}
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Chat
                          </Button>
                          <Button
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewProfile(mentor);
                            }}
                          >
                            <BookOpen className="w-4 h-4 mr-2" />
                            View Profile
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Chat Modal */}
      {chatOpen && (
        <MentorChat
          mentorId={chatMentorId}
          mentorName={chatMentorName}
          mentorAvatar={chatMentorAvatar}
          isOpen={chatOpen}
          onClose={() => {
            setChatOpen(false);
          }}
        />
      )}

      {/* Mentor Profile Modal/Dialog */}
      {selectedMentor && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedMentor(null)}
        >
          <Card
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20 ring-4 ring-primary/20">
                    {selectedMentor.photoFileName ? (
                      <AvatarImage src={selectedMentor.photoFileName} alt={selectedMentor.name || "Mentor"} />
                    ) : null}
                    <AvatarFallback className="gradient-primary text-primary-foreground font-bold text-2xl">
                      {selectedMentor.avatar || selectedMentor.name?.charAt(0).toUpperCase() || "M"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl">
                      {selectedMentor.name || "Unknown Mentor"}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium text-base">
                        {selectedMentor.rating || 0}
                      </span>
                      <span className="text-muted-foreground">
                        ({selectedMentor.totalReviews || 0} reviews)
                      </span>
                    </CardDescription>
                    {getAvailabilityBadge(selectedMentor.availability || "away")}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedMentor(null)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Bio */}
              <div>
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedMentor.bio || "No bio available"}
                </p>
              </div>

              {/* Specialties */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Specialties
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(selectedMentor.specialty || []).map((spec) => (
                    <Badge key={spec} variant="outline">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Subjects */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <BookMarked className="w-5 h-5" />
                  Subjects Taught
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(selectedMentor.subjects || []).map((subject) => (
                    <Badge key={subject} className="bg-primary/10 text-primary">
                      {subject}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{selectedMentor.experience || 0}</p>
                  <p className="text-xs text-muted-foreground">Years Experience</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">
                    {(selectedMentor.totalSessions || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Sessions</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-primary">
                    ${selectedMentor.pricePerHour || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Per Hour</p>
                </div>
              </div>

              {/* Languages */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Languages className="w-5 h-5" />
                  Languages
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(selectedMentor.languages || []).map((lang) => (
                    <Badge key={lang} variant="outline">
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Achievements */}
              {(selectedMentor.achievements || []).length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Achievements
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(selectedMentor.achievements || []).map((achievement) => (
                      <Badge
                        key={achievement}
                        className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                      >
                        <Award className="w-3 h-3 mr-1" />
                        {achievement}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setSelectedMentor(null);
                    handleViewProfile(selectedMentor);
                  }}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  View Details
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    setSelectedMentor(null);
                    handleOpenChat(selectedMentor);
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Mentors;

