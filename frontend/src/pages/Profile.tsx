import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  User, Mail, Phone, MapPin, Shield, Calendar, 
  ArrowLeft, Edit, CheckCircle, XCircle, Clock,
  BookOpen, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { authApi, tokenManager, ApiError } from "@/lib/api";

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

const Profile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await authApi.getProfile();
      if (response.user) {
        setProfile(response.user);
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
      } else {
        toast({
          title: "Error",
          description: "Failed to load profile. Please try again.",
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>Unable to load your profile information.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/dashboard")} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 glass border-b border-border/50">
        <div className="flex items-center justify-between px-4 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-display text-xl lg:text-2xl font-bold">My Profile</h1>
              <p className="text-muted-foreground text-sm">View and manage your account details</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 lg:p-8 max-w-4xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="lg:col-span-1">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="w-24 h-24 ring-4 ring-primary/20">
                  <AvatarImage src={profile.photoFileName || ""} />
                  <AvatarFallback className="gradient-primary text-primary-foreground text-2xl font-bold">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-xl">{profile.name || "No Name"}</CardTitle>
              <CardDescription className="flex items-center justify-center gap-2 mt-2">
                {profile.isEmailVerified ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
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
            <CardContent>
              <Button variant="outline" className="w-full">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>Your complete account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Personal Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="font-medium">{profile.name || "Not set"}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Email Address</p>
                      <p className="font-medium">{profile.email}</p>
                      {profile.isEmailVerified && (
                        <Badge variant="outline" className="mt-1 text-green-600 border-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {profile.mobile && (
                    <>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Phone className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Mobile Number</p>
                          <p className="font-medium">{profile.mobile}</p>
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {profile.address && (
                    <>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Address</p>
                          <p className="font-medium">{profile.address}</p>
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}
                </div>
              </div>

              {/* Account Information */}
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Account Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Role</p>
                      <Badge className={getRoleBadgeColor(profile.role)}>
                        {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Last Login</p>
                      <p className="font-medium">{formatDate(profile.lastLogin)}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Member Since</p>
                      <p className="font-medium">{formatDate(profile.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;


