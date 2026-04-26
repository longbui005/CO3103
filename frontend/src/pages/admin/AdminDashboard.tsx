import { useAuth, API_BASE, getAccessToken } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Briefcase, 
  Users, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  EyeOff,
  FileText,
  UserCheck,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useEffect, useState } from "react";

interface Stats {
  totalJobs: number;
  pendingJobs: number;
  approvedJobs: number;
  rejectedJobs: number;
  hiddenJobs: number;
  totalUsers: number;
  pendingVerification: number;
  activeUsers: number;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalJobs: 0,
    pendingJobs: 0,
    approvedJobs: 0,
    rejectedJobs: 0,
    hiddenJobs: 0,
    totalUsers: 0,
    pendingVerification: 0,
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = await getAccessToken();
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        // Fetch jobs
        const [jobsRes, hiddenRes, usersRes] = await Promise.all([
          fetch(`${API_BASE}/api/jobfinder/forms/`, { headers }),
          fetch(`${API_BASE}/api/jobfinder/forms/hidden/`, { headers }),
          fetch(`${API_BASE}/api/users/users/`, { headers }),
        ]);

        let jobs: any[] = [];
        let hiddenJobs: any[] = [];
        let users: any[] = [];

        if (jobsRes.ok) {
          const data = await jobsRes.json();
          jobs = Array.isArray(data) ? data : (data.results || []);
        }
        if (hiddenRes.ok) {
          const data = await hiddenRes.json();
          hiddenJobs = Array.isArray(data) ? data : (data.results || []);
        }
        if (usersRes.ok) {
          const data = await usersRes.json();
          users = Array.isArray(data) ? data : (data.results || []);
        }

        setStats({
          totalJobs: jobs.length + hiddenJobs.length,
          pendingJobs: jobs.filter(j => j.status === 'pending').length,
          approvedJobs: jobs.filter(j => j.status === 'approved').length,
          rejectedJobs: jobs.filter(j => j.status === 'rejected').length,
          hiddenJobs: hiddenJobs.length,
          totalUsers: users.length,
          pendingVerification: users.filter(u => u.status?.toUpperCase() === 'PENDING_VERIFICATION').length,
          activeUsers: users.filter(u => u.status?.toUpperCase() === 'ACTIVE').length,
        });
      } catch (e) {
        console.error('Failed to fetch stats', e);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const isAdmin = user && user.role?.toUpperCase() === 'ADMIN';

  if (!user || !isAdmin) {
    navigate('/');
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="h-16" />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4 text-center">Đang tải...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="h-16" />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 className="text-3xl font-bold mb-2">Trang quản trị viên</h1>
          <p className="text-muted-foreground mb-8">Xin chào, {user?.first_name || user?.username}! Đây là tổng quan hệ thống.</p>

          {/* Overview Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Tổng tin đăng</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalJobs}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.approvedJobs} đã duyệt
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Chờ duyệt</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pendingJobs}</div>
                <p className="text-xs text-muted-foreground">
                  Cần xử lý
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Tổng tài khoản</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeUsers} đang hoạt động
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Chờ xác minh</CardTitle>
                <UserCheck className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.pendingVerification}</div>
                <p className="text-xs text-muted-foreground">
                  Tài khoản mới
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <h2 className="text-xl font-semibold mb-4">Truy cập nhanh</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/jobs')}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Quản lý tin đăng</h3>
                    <p className="text-sm text-muted-foreground">Duyệt, từ chối, ẩn tin tuyển dụng</p>
                  </div>
                </div>
                {stats.pendingJobs > 0 && (
                  <div className="mt-4 flex items-center gap-2 text-yellow-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">{stats.pendingJobs} tin đang chờ duyệt</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/users')}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-green-50 flex items-center justify-center">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Quản lý tài khoản</h3>
                    <p className="text-sm text-muted-foreground">Xác minh, khoá, quản lý người dùng</p>
                  </div>
                </div>
                {stats.pendingVerification > 0 && (
                  <div className="mt-4 flex items-center gap-2 text-orange-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">{stats.pendingVerification} tài khoản chờ xác minh</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/jobs')}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-purple-50 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Xem trang việc làm</h3>
                    <p className="text-sm text-muted-foreground">Xem giao diện người dùng</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/lookups')}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-orange-50 flex items-center justify-center">
                    <Briefcase className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Quản lý danh mục</h3>
                    <p className="text-sm text-muted-foreground">Thêm, sửa, xoá danh mục hệ thống</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Job Statistics */}
          <h2 className="text-xl font-semibold mb-4">Thống kê tin đăng</h2>
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.approvedJobs}</div>
                  <div className="text-xs text-muted-foreground">Đã duyệt</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{stats.pendingJobs}</div>
                  <div className="text-xs text-muted-foreground">Chờ duyệt</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{stats.rejectedJobs}</div>
                  <div className="text-xs text-muted-foreground">Đã từ chối</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <EyeOff className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-600">{stats.hiddenJobs}</div>
                  <div className="text-xs text-muted-foreground">Đã ẩn</div>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
