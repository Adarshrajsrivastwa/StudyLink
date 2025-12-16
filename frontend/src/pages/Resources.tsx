import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen, Search, Filter, Plus, Download, ShoppingCart,
  Star, Tag, FileText, Video, Book, Code, Package,
  Menu, X, Edit, Trash2, CheckCircle, Lock, DollarSign
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { tokenManager, ApiError, resourceApi } from "@/lib/api";

interface Resource {
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
  createdAt: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const Resources = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const categories = [
    { value: "all", label: "All Categories", icon: Package },
    { value: "course", label: "Courses", icon: BookOpen },
    { value: "ebook", label: "E-Books", icon: Book },
    { value: "video", label: "Videos", icon: Video },
    { value: "document", label: "Documents", icon: FileText },
    { value: "software", label: "Software", icon: Code },
    { value: "other", label: "Other", icon: Package },
  ];

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Fetch resources and reset filters on mount
  useEffect(() => {
    fetchResources();
    // Reset filters to show all resources
    setSearchQuery("");
    setFilterCategory("all");
  }, []);

  // Filter resources
  useEffect(() => {
    let filtered = resources;

    if (filterCategory !== "all") {
      filtered = filtered.filter((r) => r.category === filterCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.description.toLowerCase().includes(query) ||
          r.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    setFilteredResources(filtered);
  }, [resources, filterCategory, searchQuery]);

  const fetchResources = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching resources...");
      // Fetch ALL resources from ALL mentors without any filters
      const response = await resourceApi.getAllResources();
      console.log("API Response:", response);
      
      if (response && response.success && response.data) {
        // Ensure we have an array of resources
        const resourcesList = Array.isArray(response.data) ? response.data : [];
        console.log(`Loaded ${resourcesList.length} resources:`, resourcesList);
        setResources(resourcesList);
        // Ensure all resources are shown initially
        setFilteredResources(resourcesList);
        
        if (resourcesList.length === 0) {
          console.warn("No resources found in response");
          toast({
            title: "No Resources",
            description: "No resources are available at the moment.",
          });
        }
      } else {
        // If no data but success is false, set empty array
        console.error("Invalid response format:", response);
        setResources([]);
        setFilteredResources([]);
        toast({
          title: "Error",
          description: response?.message || "Failed to load resources. Invalid response format.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Fetch resources error:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Set empty arrays on error
      setResources([]);
      setFilteredResources([]);
      toast({
        title: "Error",
        description: error instanceof ApiError ? error.message : "Failed to load resources. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (resource: Resource) => {
    if (!tokenManager.getToken()) {
      toast({
        title: "Login Required",
        description: "Please login to purchase resources",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    // Free resource
    if (resource.isFree || resource.price === 0) {
      try {
        setIsLoading(true);
        const token = tokenManager.getToken();
        const response = await fetch(
          "http://localhost:5000/api/resources/purchase/create-order",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ resourceId: resource._id }),
          }
        );

        const data = await response.json();
        if (data.success) {
          toast({
            title: "Success",
            description: "Resource added to your library!",
          });
          fetchResources();
        } else {
          toast({
            title: "Error",
            description: data.message || "Failed to add resource",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Purchase error:", error);
        toast({
          title: "Error",
          description: "Failed to process purchase",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Paid resource - initiate Razorpay payment
    setSelectedResource(resource);
    setIsPaymentDialogOpen(true);

    try {
      setIsLoading(true);
      const token = tokenManager.getToken();
      const response = await fetch(
        "http://localhost:5000/api/resources/purchase/create-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ resourceId: resource._id }),
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
          description: `Purchase: ${resource.title}`,
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
                  }),
                }
              );

              const verifyData = await verifyResponse.json();
              if (verifyData.success) {
                toast({
                  title: "Payment Successful",
                  description: "Resource added to your library!",
                });
                setIsPaymentDialogOpen(false);
                setSelectedResource(null);
                fetchResources();
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
              setIsPaymentDialogOpen(false);
              setSelectedResource(null);
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
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

  const getCategoryIcon = (category: string) => {
    const cat = categories.find((c) => c.value === category);
    return cat ? cat.icon : Package;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      course: "bg-blue-500/10 text-blue-500",
      ebook: "bg-green-500/10 text-green-500",
      video: "bg-purple-500/10 text-purple-500",
      document: "bg-orange-500/10 text-orange-500",
      software: "bg-pink-500/10 text-pink-500",
      other: "bg-gray-500/10 text-gray-500",
    };
    return colors[category] || colors.other;
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
                icon: BookOpen,
                label: "Resources",
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
                  Resources
                </h1>
                <p className="text-muted-foreground text-sm">
                  Discover and purchase learning resources
                </p>
              </div>
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
                placeholder="Search resources..."
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
                    <div className="flex items-center gap-2">
                      <category.icon className="w-4 h-4" />
                      {category.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Resources Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading resources...</p>
              </div>
            </div>
          ) : filteredResources.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No resources found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || filterCategory !== "all"
                    ? "Try adjusting your search or filters"
                    : "No resources available yet"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((resource) => {
                const CategoryIcon = getCategoryIcon(resource.category);
                return (
                  <Card
                    key={resource._id}
                    className="hover-lift transition-all cursor-pointer group"
                  >
                    <div className="relative">
                      {resource.thumbnailUrl ? (
                        <img
                          src={resource.thumbnailUrl}
                          alt={resource.title}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-primary/5 rounded-t-lg flex items-center justify-center">
                          <CategoryIcon className="w-16 h-16 text-primary/50" />
                        </div>
                      )}
                      {resource.isPurchased && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-green-500/90 text-white">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Purchased
                          </Badge>
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <Badge className={getCategoryColor(resource.category)}>
                          <CategoryIcon className="w-3 h-3 mr-1" />
                          {resource.category}
                        </Badge>
                      </div>
                    </div>

                    <CardHeader>
                      <CardTitle className="line-clamp-2">{resource.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {resource.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs">
                              {resource.authorName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">
                            {resource.authorName}
                          </span>
                        </div>
                        {resource.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-medium">
                              {resource.rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {resource.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {resource.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{resource.tags.length - 3}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          {resource.isFree ? (
                            <Badge className="bg-green-500/10 text-green-500">
                              Free
                            </Badge>
                          ) : (
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4 text-primary" />
                              <span className="text-lg font-bold text-primary">
                                {resource.price}
                              </span>
                              <span className="text-sm text-muted-foreground">INR</span>
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (resource.isPurchased) {
                              // Download or view resource
                              if (resource.fileUrl) {
                                window.open(resource.fileUrl, "_blank");
                              } else {
                                toast({
                                  title: "No File Available",
                                  description: "This resource doesn't have a file yet",
                                });
                              }
                            } else {
                              handlePurchase(resource);
                            }
                          }}
                          disabled={isLoading}
                          variant={resource.isPurchased ? "outline" : "default"}
                        >
                          {resource.isPurchased ? (
                            <>
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </>
                          ) : resource.isFree ? (
                            <>
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Get Free
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Buy Now
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Resources;


