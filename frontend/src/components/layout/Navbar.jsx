import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Briefcase, User as UserIcon, LogOut, LayoutDashboard, FileText, Users, Settings } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    // Normalize role: backend may return codes like 'USER' or 'ADMIN'
    const role = (user.role || '').toString().toLowerCase();
    if (role === 'admin') return '/admin/dashboard';
    // Default: navigate to homepage (product expects Dashboard => home)
    return '/';
  };

  const isAdmin = () => {
    if (!user) return false;
    const role = (user.role || '').toString().toLowerCase();
    return role === 'admin';
  };

  return (
    <nav className="fixed top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-hero">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-primary">JobFinder</span>
          </Link>

          <div className="flex-1" />
          <div className="ml-auto flex items-center gap-3 shrink-0">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 ring-2 ring-primary ring-offset-2 ring-offset-white">
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback>{(user?.name && user.name.charAt(0)) || (user?.email && user.email.charAt(0)) || ''}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  {/* show Admin Dashboard for admin users */}
                  {isAdmin() && location.pathname !== '/admin/dashboard' && (
                    <DropdownMenuItem onClick={() => navigate('/admin/dashboard')}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}

                  {/* show Quản lý tin đăng for admin users */}
                  {isAdmin() && location.pathname !== '/admin/jobs' && (
                    <DropdownMenuItem onClick={() => navigate('/admin/jobs')}>
                      <FileText className="mr-2 h-4 w-4" />
                      Quản lý tin đăng
                    </DropdownMenuItem>
                  )}

                  {/* show Quản lý tài khoản for admin users */}
                  {isAdmin() && location.pathname !== '/admin/users' && (
                    <DropdownMenuItem onClick={() => navigate('/admin/users')}>
                      <Users className="mr-2 h-4 w-4" />
                      Quản lý tài khoản
                    </DropdownMenuItem>
                  )}

                  {/* show Quản lý danh mục for admin users */}
                  {isAdmin() && location.pathname !== '/admin/lookups' && (
                    <DropdownMenuItem onClick={() => navigate('/admin/lookups')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Quản lý danh mục
                    </DropdownMenuItem>
                  )}

                  {/* show Quản lý tin đăng for non-admin users */}
                  {!isAdmin() && location.pathname !== '/employer/dashboard' && (
                    <DropdownMenuItem onClick={() => navigate('/employer/dashboard')}>
                      <FileText className="mr-2 h-4 w-4" />
                      Quản lý tin đăng
                    </DropdownMenuItem>
                  )}

                  {/* show Profile only if not on /profile */}
                  {location.pathname !== '/profile' && (
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <UserIcon className="mr-2 h-4 w-4" />
                      Hồ sơ
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/login')}
                >
                  Đăng nhập
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                >
                  Đăng ký
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
