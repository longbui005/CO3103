import { useState, useEffect, useCallback } from 'react';
import { useAuth, authFetch, API_BASE } from '@/contexts/AuthContext';
import { useJobs, Application } from '@/contexts/JobsContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, XCircle, Check, X, User as UserIcon, Plus, Briefcase, Users, Eye, Trash2, Clock, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface JobForm {
  id: number;
  title: string;
  verified_company?: string;
  display_verified_company?: string;
  province_name?: string;
  district_name?: string;
  ward_name?: string;
  address?: string;
  salary_from?: number;
  salary_to?: number;
  salary_currency?: string;
  display_salary_currency?: string;
  salary_currency_symbol?: string;
  work_format?: string;
  job_type?: string;
  status: 'pending' | 'approved' | 'rejected';
  is_active: boolean;
  created_at: string;
  created_by?: string;
}

const EmployerDashboard = () => {
  const { user, logout } = useAuth();
  const {
    getApplicationsForJob,
    approveApplication,
    rejectApplication,
  } = useJobs();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Lấy tab từ URL, mặc định là 'jobs'
  const currentTab = searchParams.get('tab') || 'jobs';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  const [jobs, setJobs] = useState<JobForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [userStatuses, setUserStatuses] = useState<Record<string, string>>({});
  const [jobApplications, setJobApplications] = useState<Application[]>([]);

  // Fetch jobs from API
  useEffect(() => {
    if (!user) return;
    
    const fetchJobs = async () => {
      try {
        const res = await authFetch(`${API_BASE}/api/jobfinder/forms/`, {}, () => {
          logout();
          navigate('/auth/login');
        });
        if (res.ok) {
          const data = await res.json();
          // Backend already filters by current user, so we get only our jobs
          // Plus any public jobs - filter to only show our own
          const myJobs = data.filter((j: JobForm) => 
            j.created_by === user.username || j.created_by === user.email
          );
          setJobs(myJobs);
          
          // Fetch applications for all jobs
          const allApps: Application[] = [];
          for (const job of myJobs) {
            const apps = await getApplicationsForJob(String(job.id));
            allApps.push(...apps);
          }
          setJobApplications(allApps);
        }
      } catch (e) {
        console.error('Failed to fetch jobs', e);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [user, logout, navigate, getApplicationsForJob]);

  // Fetch user statuses for all applicants
  useEffect(() => {
    const fetchUserStatuses = async () => {
      const userIds = [...new Set(jobApplications.map(app => app.userId))];
      const statuses: Record<string, string> = {};
      
      for (const userId of userIds) {
        try {
          const res = await authFetch(`${API_BASE}/api/users/users/${userId}/`, {}, () => {});
          if (res.ok) {
            const userData = await res.json();
            // Lấy status từ response, nếu không có thì đánh dấu là UNKNOWN để ẩn
            statuses[userId] = userData.status || 'UNKNOWN';
          } else {
            // Nếu fetch thất bại, đánh dấu là UNKNOWN để ẩn user này
            statuses[userId] = 'UNKNOWN';
          }
        } catch (e) {
          // Nếu có lỗi, đánh dấu là UNKNOWN để ẩn user này
          statuses[userId] = 'UNKNOWN';
        }
      }
      
      setUserStatuses(statuses);
    };

    if (jobApplications.length > 0) {
      fetchUserStatuses();
    }
  }, [jobApplications]);

  if (!user || !['user', 'admin'].includes(user.role ?? '')) {
    navigate('/');
    return null;
  }

  // Get job status directly from backend
  const getJobStatus = (job: JobForm): 'pending' | 'approved' | 'rejected' => {
    return job.status;
  };

  // Stats
  const pendingJobsCount = jobs.filter(j => j.status === 'pending').length;
  const approvedJobsCount = jobs.filter(j => j.status === 'approved').length;
  const rejectedJobsCount = jobs.filter(j => j.status === 'rejected').length;

  // Build location string
  const getLocation = (job: JobForm) => {
    const parts = [job.address, job.ward_name, job.district_name, job.province_name].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Chưa có địa chỉ';
  };

  // Build salary string  
  const getSalary = (job: JobForm) => {
    if (!job.salary_from) return 'Thương lượng';
    const symbol = job.salary_currency_symbol || job.display_salary_currency || job.salary_currency || '₫';
    if (job.salary_to) {
      return `Từ ${job.salary_from.toLocaleString()} đến ${job.salary_to.toLocaleString()} ${symbol}`;
    }
    return `Từ ${job.salary_from.toLocaleString()} ${symbol}`;
  };

  // Lọc ứng viên chỉ hiển thị user có trạng thái ACTIVE
  const filteredApplications = jobApplications.filter(app => {
    const userStatus = userStatuses[app.userId];
    // Chỉ hiển thị nếu đã fetch được status và status là ACTIVE
    return userStatus === 'ACTIVE';
  });

  // Badge trạng thái job
  const jobStatusBadge = (status: string) => {
    const style: Record<string, string> = {
      pending: 'bg-warning/10 text-warning',
      approved: 'bg-success/10 text-success',
      rejected: 'bg-destructive/10 text-destructive',
    };
    const text: Record<string, string> = {
      pending: 'Chờ duyệt',
      approved: 'Đã duyệt',
      rejected: 'Từ chối',
    };
    return (
      <Badge
        className={`${style[status]} pointer-events-none cursor-default hover:bg-inherit hover:text-inherit hover:opacity-100`}
      >
        {text[status]}
      </Badge>
    );
  };

  // Badge trạng thái ứng viên
  const appStatusBadge = (status: string) => {
    const style: Record<string, string> = {
      pending: 'bg-warning/10 text-warning',
      approved: 'bg-success/10 text-success',
      rejected: 'bg-destructive/10 text-destructive',
    };
    const text: Record<string, string> = {
      pending: 'Đang chờ',
      approved: 'Đã duyệt',
      rejected: 'Từ chối',
    };
    return (
      <Badge
        className={`${style[status]} pointer-events-none cursor-default hover:bg-inherit hover:text-inherit hover:opacity-100`}
      >
        {text[status]}
      </Badge>
    );
  };

  const handleDeleteJob = async (jobId: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa tin tuyển dụng này?')) {
      try {
        const res = await authFetch(`${API_BASE}/api/jobfinder/forms/${jobId}/`, {
          method: 'DELETE',
        }, () => {
          logout();
          navigate('/auth/login');
        });
        if (res.ok) {
          setJobs(prev => prev.filter(j => j.id !== jobId));
          toast({ title: 'Đã xóa', description: 'Tin tuyển dụng đã được xóa' });
        } else {
          toast({ title: 'Lỗi', description: 'Không thể xóa tin', variant: 'destructive' });
        }
      } catch (e) {
        toast({ title: 'Lỗi', description: 'Không thể xóa tin', variant: 'destructive' });
      }
    }
  };

  const getJobTitle = (jobId: string) =>
    jobs.find(j => String(j.id) === jobId)?.title || '—';

  const handleApproveApplication = async (appId: string) => {
    try {
      await approveApplication(appId);
      // Update local state
      setJobApplications(prev =>
        prev.map(a => a.id === appId ? { ...a, status: 'approved' } : a)
      );
      toast({ title: 'Thành công', description: 'Đã duyệt ứng viên' });
    } catch (e) {
      toast({ title: 'Lỗi', description: 'Không thể duyệt ứng viên', variant: 'destructive' });
    }
  };

  const handleRejectApplication = async (appId: string) => {
    try {
      await rejectApplication(appId);
      // Update local state
      setJobApplications(prev =>
        prev.map(a => a.id === appId ? { ...a, status: 'rejected' } : a)
      );
      toast({ title: 'Thành công', description: 'Đã từ chối ứng viên' });
    } catch (e) {
      toast({ title: 'Lỗi', description: 'Không thể từ chối ứng viên', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="h-16" />
        <main className="flex-1 py-8 flex items-center justify-center">
          <p className="text-muted-foreground">Đang tải...</p>
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Quản lý tin đăng</h1>
              <p className="text-muted-foreground mt-1">{user.company}</p>
            </div>
            <Button onClick={() => navigate('/employer/post-job')}>
              <Plus className="h-4 w-4 mr-2" />
              Đăng tin mới
            </Button>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-5 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Tin đã đăng</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{jobs.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Chờ duyệt</CardTitle>
                <Clock className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">{pendingJobsCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Được duyệt</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">{approvedJobsCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Bị từ chối</CardTitle>
                <XCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{rejectedJobsCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Ứng viên</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{filteredApplications.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList>
              <TabsTrigger value="jobs">Tin đã đăng</TabsTrigger>
              <TabsTrigger value="pendingJobs">Chờ duyệt</TabsTrigger>
              <TabsTrigger value="approvedJobs">Được duyệt</TabsTrigger>
              <TabsTrigger value="rejectedJobs">Bị từ chối</TabsTrigger>
              <TabsTrigger value="applications">Ứng viên</TabsTrigger>
            </TabsList>

            {/* Tin đã đăng (ALL) */}
            <TabsContent value="jobs" className="space-y-4">
              {jobs.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Chưa có tin nào. Hãy đăng tin đầu tiên!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                jobs.map(job => (
                  <Card key={job.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold">{job.title}</h3>
                            {jobStatusBadge(getJobStatus(job))}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {job.display_verified_company || 'Chưa có công ty'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {getLocation(job)} • {getSalary(job)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Đăng ngày {new Date(job.created_at).toLocaleDateString('vi-VN')}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => navigate(`/jobs/${job.id}`)}
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => handleDeleteJob(job.id)}
                            title="Xóa tin"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Tin CHỜ DUYỆT */}
            <TabsContent value="pendingJobs" className="space-y-4">
              {jobs.filter(j => getJobStatus(j) === 'pending').length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Không có tin nào đang chờ duyệt</p>
                  </CardContent>
                </Card>
              ) : (
                jobs
                  .filter(j => getJobStatus(j) === 'pending')
                  .map(job => (
                    <Card key={job.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold">{job.title}</h3>
                              {jobStatusBadge('pending')}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {job.display_verified_company || 'Chưa có công ty'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {getLocation(job)} • {getSalary(job)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Đăng ngày {new Date(job.created_at).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => navigate(`/jobs/${job.id}`)}
                              title="Xem chi tiết"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="destructive"
                              onClick={() => handleDeleteJob(job.id)}
                              title="Xóa tin"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </TabsContent>

            {/* Tin ĐƯỢC DUYỆT */}
            <TabsContent value="approvedJobs" className="space-y-4">
              {jobs.filter(j => getJobStatus(j) === 'approved').length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Không có tin nào được duyệt</p>
                  </CardContent>
                </Card>
              ) : (
                jobs
                  .filter(j => getJobStatus(j) === 'approved')
                  .map(job => (
                    <Card key={job.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold">{job.title}</h3>
                              {jobStatusBadge('approved')}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {job.display_verified_company || 'Chưa có công ty'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {getLocation(job)} • {getSalary(job)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Đăng ngày {new Date(job.created_at).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => navigate(`/jobs/${job.id}`)}
                              title="Xem chi tiết"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="destructive"
                              onClick={() => handleDeleteJob(job.id)}
                              title="Xóa tin"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </TabsContent>

            {/* Tin BỊ TỪ CHỐI */}
            <TabsContent value="rejectedJobs" className="space-y-4">
              {jobs.filter(j => getJobStatus(j) === 'rejected').length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <XCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Không có tin nào bị từ chối</p>
                  </CardContent>
                </Card>
              ) : (
                jobs
                  .filter(j => getJobStatus(j) === 'rejected')
                  .map(job => (
                    <Card key={job.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold">{job.title}</h3>
                              {jobStatusBadge('rejected')}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {job.display_verified_company || 'Chưa có công ty'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {getLocation(job)} • {getSalary(job)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Đăng ngày {new Date(job.created_at).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => navigate(`/jobs/${job.id}`)}
                              title="Xem chi tiết"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="destructive"
                              onClick={() => handleDeleteJob(job.id)}
                              title="Xóa tin"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </TabsContent>

            {/* Ứng viên */}
            <TabsContent value="applications" className="space-y-4">
              {filteredApplications.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Chưa có ứng viên nào</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {filteredApplications.map(app => (
                    <Card key={app.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              app.status === 'approved' ? 'bg-green-50' : 
                              app.status === 'rejected' ? 'bg-red-50' : 'bg-yellow-50'
                            }`}>
                              {app.status === 'approved' ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              ) : app.status === 'rejected' ? (
                                <XCircle className="h-5 w-5 text-red-600" />
                              ) : (
                                <Clock className="h-5 w-5 text-yellow-600" />
                              )}
                            </div>
                            <div>
                              <div className="font-semibold">{app.userName}</div>
                              <div className="text-sm text-muted-foreground">{app.userEmail}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Ứng tuyển: {getJobTitle(app.jobId)} • {new Date(app.appliedDate).toLocaleDateString('vi-VN')}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {appStatusBadge(app.status)}
                            <div className="flex gap-2">
                              {app.cvUrl && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  asChild
                                  title="Xem CV"
                                >
                                  <a href={app.cvUrl} target="_blank" rel="noopener noreferrer">
                                    <FileText className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => navigate(`/profile?id=${encodeURIComponent(app.userId)}`)}
                                title="Xem hồ sơ"
                              >
                                <UserIcon className="h-4 w-4" />
                              </Button>
                              {app.status !== 'approved' && (
                                <Button
                                  size="icon"
                                  style={{ backgroundColor: '#16a34a', color: 'white', borderColor: '#16a34a' }}
                                  onClick={() => handleApproveApplication(app.id)}
                                  title="Duyệt"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                              )}
                              {app.status !== 'rejected' && (
                                <Button
                                  size="icon"
                                  variant="destructive"
                                  onClick={() => handleRejectApplication(app.id)}
                                  title="Từ chối"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
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

      <Footer />
    </div>
  );
};

export default EmployerDashboard;
