import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, GraduationCap, User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { tokenManager, authApi } from '@/lib/api';

const navLinks = [
  { name: 'Home', href: '#home' },
  { name: 'Features', href: '#features' },
  { name: 'How it Works', href: '#how-it-works' },
  { name: 'Mentors', href: '#mentors' },
  { name: 'Contact', href: '#contact' },
];

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  photoFileName: string | null;
  role: string;
}

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    checkAuthStatus();
    
    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = () => checkAuthStatus();
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for custom auth change event (when user logs in/out in same tab)
    const handleAuthChange = () => checkAuthStatus();
    window.addEventListener('authChange', handleAuthChange);
    
    // Also check on focus (when user returns to tab)
    window.addEventListener('focus', checkAuthStatus);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('focus', checkAuthStatus);
    };
  }, []);

  const checkAuthStatus = async () => {
    const token = tokenManager.getToken();
    if (token) {
      setIsLoggedIn(true);
      try {
        const response = await authApi.getProfile();
        if (response.user) {
          setUser(response.user);
        }
      } catch (error) {
        // Token might be invalid, clear it
        tokenManager.removeToken();
        setIsLoggedIn(false);
        setUser(null);
      }
    } else {
      setIsLoggedIn(false);
      setUser(null);
    }
  };

  const handleLogout = () => {
    tokenManager.removeToken();
    setIsLoggedIn(false);
    setUser(null);
    // Dispatch custom event to update navbar
    window.dispatchEvent(new Event('authChange'));
    navigate('/');
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'glass shadow-card py-3' 
          : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <a href="#home" className="flex items-center gap-3 group">
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-soft group-hover:shadow-glow transition-all duration-300">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl text-foreground">
            Study<span className="gradient-text">Link</span>
          </span>
        </a>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-muted-foreground hover:text-primary font-medium transition-colors duration-300 link-underline"
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* CTA Buttons / User Menu */}
        <div className="hidden md:flex items-center gap-4">
          {isLoggedIn && user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-3">
                    <Avatar className="w-8 h-8">
                      {user.photoFileName ? (
                        <AvatarImage 
                          src={user.photoFileName} 
                          alt={user.name}
                        />
                      ) : null}
                      <AvatarFallback className="gradient-primary text-primary-foreground text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.name}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer">
                      <User className="w-4 h-4 mr-2" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/courses" className="cursor-pointer">
                      <GraduationCap className="w-4 h-4 mr-2" />
                      Courses
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/mentors" className="cursor-pointer">
                      <User className="w-4 h-4 mr-2" />
                      Mentors
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">Login</Link>
              </Button>
              <Button variant="hero" size="sm" asChild>
                <Link to="/auth">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden absolute top-full left-0 right-0 glass shadow-elevated transition-all duration-300 ${
          isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        <div className="container mx-auto px-6 py-6 flex flex-col gap-4">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-foreground hover:text-primary font-medium py-2 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.name}
            </a>
          ))}
          <div className="flex flex-col gap-3 pt-4 border-t border-border">
            {isLoggedIn && user ? (
              <>
                <div className="flex items-center gap-3 px-2 py-2">
                  <Avatar className="w-10 h-10">
                    {user.photoFileName ? (
                      <AvatarImage 
                        src={user.photoFileName} 
                        alt={user.name}
                      />
                    ) : null}
                    <AvatarFallback className="gradient-primary text-primary-foreground">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
                <Button variant="outline" className="w-full" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/auth">Login</Link>
                </Button>
                <Button variant="hero" className="w-full" asChild>
                  <Link to="/auth">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
