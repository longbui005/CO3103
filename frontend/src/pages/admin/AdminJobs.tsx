import { useAuth, API_BASE, getAccessToken } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Inbox, Trash2, CheckCircle2, XCircle, Eye, Briefcase, Users as UsersIcon, EyeOff, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from "react";

interface JobForm {
  id: number;
  title: string;
  verified_company?: string;
  display_verified_company?: string;
  verified_company_other?: string;
  province_name?: string;
  district_name?: string;
  ward_name?: string;
  salary_from?: number;
  salary_to?: number;
  salary_currency?: string;
  display_salary_currency?: string;
  salary_currency_symbol?: string;
  work_format?: string;
  display_work_format?: string;
  job_type?: string;
  display_job_type?: string;
  status: 'pending' | 'approved' | 'rejected';
  is_active: boolean;
  created_at: string;
  created_by?: string;
}

const AdminJobs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Lấy tab từ URL, mặc định là 'pending'
  const currentTab = searchParams.get('tab') || 'pending';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  const [jobs, setJobs] = useState<JobForm[]>([]);
  const [hiddenJobs, setHiddenJobs] = useState<JobForm[]>([]);
  const [loading, setLoading] = useState(true);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<number | null>(null);

  // Fetch all jobs (admin can see all statuses)
  const fetchJobs = async () => {
    try {
      const token = await getAccessToken();
      const res = await fetch(`${API_BASE}/api/jobfinder/forms/`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(Array.isArray(data) ? data : (data.results || []));
      }
    } catch (e) {
      console.error('Failed to fetch jobs', e);
    }
  };

  // Fetch hidden jobs
  const fetchHiddenJobs = async () => {
    try {
      const token = await getAccessToken();
      const res = await fetch(`${API_BASE}/api/jobfinder/forms/hidden/`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setHiddenJobs(Array.isArray(data) ? data : (data.results || []));
      }
    } catch (e) {
      console.error('Failed to fetch hidden jobs', e);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchJobs(), fetchHiddenJobs()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const pendingJobs = jobs.filter(j => j.status === 'pending');
  const approvedJobs = jobs.filter(j => j.status === 'approved');
  const rejectedJobs = jobs.filter(j => j.status === 'rejected');

  // Helper functions
  const getCompanyName = (job: JobForm) => {
    if (job.display_verified_company) return job.display_verified_company;
    if (job.verified_company_other) return job.verified_company_other;
    return job.verified_company || 'Chưa có công ty';
  };

  const getLocation = (job: JobForm) => {
    const parts = [job.ward_name, job.district_name, job.province_name].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Chưa có địa chỉ';
  };

  const getSalary = (job: JobForm) => {
    if (!job.salary_from) return 'Thương lượng';
    const symbol = job.salary_currency_symbol || job.display_salary_currency || job.salary_currency || '₫';
    if (job.salary_to) {
      return `Từ ${job.salary_from.toLocaleString()} đến ${job.salary_to.toLocaleString()} ${symbol}`;
    }
    return `Từ ${job.salary_from.toLocaleString()} ${symbol}`;
  };

  const handleApproveAll = async () => {
    if (pendingJobs.length === 0) return;
    try {
      const token = await getAccessToken();
      let successCount = 0;
      for (const job of pendingJobs) {
        const res = await fetch(`${API_BASE}/api/jobfinder/forms/${job.id}/approve/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
        });
        if (res.ok) successCount++;
      }
      toast({ title: "Đã duyệt toàn bộ", description: `Đã duyệt ${successCount}/${pendingJobs.length} tin tuyển dụng` });
      fetchJobs();
    } catch (e) {
      toast({ title: "Lỗi", description: "Không thể duyệt toàn bộ tin", variant: "destructive" });
    }
  };

  const handleApprove = async (jobId: number) => {
    try {
      const token = await getAccessToken();
      const res = await fetch(`${API_BASE}/api/jobfinder/forms/${jobId}/approve/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast({ title: "Đã duyệt", description: "Tin tuyển dụng đã được phê duyệt" });
        fetchJobs();
      } else {
        toast({ title: "Lỗi", description: data.detail || "Không thể duyệt tin", variant: "destructive" });
      }
    } catch (e) {
      console.error('Error approving:', e);
      toast({ title: "Lỗi", description: "Không thể duyệt tin", variant: "destructive" });
    }
  };

  const handleReject = async (jobId: number) => {
    try {
      const token = await getAccessToken();
      const res = await fetch(`${API_BASE}/api/jobfinder/forms/${jobId}/reject/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast({ title: "Đã từ chối", description: "Tin tuyển dụng đã bị từ chối", variant: "destructive" });
        fetchJobs();
      } else {
        toast({ title: "Lỗi", description: data.detail || "Không thể từ chối tin", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Lỗi", description: "Không thể từ chối tin", variant: "destructive" });
    }
  };

  const openDeleteDialog = (jobId: number) => {
    setJobToDelete(jobId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteJob = async () => {
    if (!jobToDelete) return;
    try {
      const token = await getAccessToken();
      const res = await fetch(`${API_BASE}/api/jobfinder/forms/${jobToDelete}/`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (res.ok) {
        toast({ title: 'Đã ẩn bài đăng', description: 'Bài đăng đã bị vô hiệu hoá' });
        fetchJobs();
        fetchHiddenJobs();
      } else {
        toast({ title: "Lỗi", description: "Không thể ẩn tin", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Lỗi", description: "Không thể ẩn tin", variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setJobToDelete(null);
    }
  };

  const handleRestore = async (jobId: number) => {
    try {
      const token = await getAccessToken();
      const res = await fetch(`${API_BASE}/api/jobfinder/forms/${jobId}/restore/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        toast({ title: 'Đã khôi phục', description: 'Bài đăng đã được khôi phục' });
        fetchJobs();
        fetchHiddenJobs();
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ title: "Lỗi", description: data.detail || "Không thể khôi phục", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Lỗi", description: "Không thể khôi phục", variant: "destructive" });
    }
  };

  function EmptyState({ text }: { text: string }) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-center">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Inbox className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    );
  }

  // Check if user is admin (case-insensitive)
  const isAdmin = user && user.role?.toLowerCase() === 'admin';

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
          <h1 className="text-3xl font-bold mb-8">Quản lý tin đăng</h1>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Chờ duyệt</CardTitle>
                <Briefcase className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">{pendingJobs.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Đã duyệt</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">{approvedJobs.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Đã từ chối</CardTitle>
                <XCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{rejectedJobs.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Đã ẩn</CardTitle>
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-muted-foreground">{hiddenJobs.length}</div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="pending">Chờ duyệt</TabsTrigger>
                <TabsTrigger value="approved">Đã duyệt</TabsTrigger>
                <TabsTrigger value="rejected">Đã từ chối</TabsTrigger>
                <TabsTrigger value="hidden">Đã ẩn</TabsTrigger>
              </TabsList>
              {currentTab === 'pending' && pendingJobs.length > 0 && (
                <Button
                  onClick={handleApproveAll}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Duyệt toàn bộ ({pendingJobs.length})
                </Button>
              )}
            </div>

            <TabsContent value="pending" className="space-y-4">
              {pendingJobs.length === 0 ? (
                <EmptyState text="Không có tin nào đang chờ duyệt" />
              ) : (
                  pendingJobs.map((job) => (
                    <Card key={job.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{job.title}</h3>
                            <Badge className="bg-warning/10 text-warning">Chờ duyệt</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{getCompanyName(job)}</p>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span>{getLocation(job)}</span>
                            <span>{getSalary(job)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => navigate(`/jobs/${job.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            style={{ backgroundColor: '#16a34a', color: 'white', borderColor: '#16a34a' }}
                            onClick={() => handleApprove(job.id)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => handleReject(job.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  ))
              )}
            </TabsContent>

            <TabsContent value="approved" className="space-y-4">
              {approvedJobs.length === 0 ? (
                <EmptyState text="Không có tin nào đã duyệt" />
              ) : (
                approvedJobs.map((job) => (
                  <Card key={job.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{job.title}</h3>
                            <Badge className="bg-green-100 text-green-700">Đã duyệt</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{getCompanyName(job)}</p>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span>{getLocation(job)}</span>
                            <span>{getSalary(job)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => navigate(`/jobs/${job.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => openDeleteDialog(job.id)}
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

            {/* Rejected jobs */}
            <TabsContent value="rejected" className="space-y-4">
              {rejectedJobs.length === 0 ? (
                <EmptyState text="Không có tin nào đã từ chối" />
              ) : (
                rejectedJobs.map((job) => (
                  <Card key={job.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{job.title}</h3>
                            <Badge variant="destructive">Đã từ chối</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{getCompanyName(job)}</p>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span>{getLocation(job)}</span>
                            <span>{getSalary(job)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => navigate(`/jobs/${job.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApprove(job.id)}
                          >
                            Duyệt lại
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => openDeleteDialog(job.id)}
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

            {/* Hidden jobs */}
            <TabsContent value="hidden" className="space-y-4">
              {hiddenJobs.length === 0 ? (
                <EmptyState text="Không có tin nào đã ẩn" />
              ) : (
                hiddenJobs.map((job) => (
                  <Card key={job.id} className="opacity-75">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{job.title}</h3>
                            <Badge variant="secondary">Đã ẩn</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{getCompanyName(job)}</p>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span>{getLocation(job)}</span>
                            <span>{getSalary(job)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => navigate(`/jobs/${job.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleRestore(job.id)}
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Khôi phục
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

          </Tabs>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ẩn bài đăng?</DialogTitle>
            <DialogDescription>
              Bài đăng sẽ bị vô hiệu hoá và không còn hiển thị cho người dùng.
              Bạn có thể khôi phục sau nếu cần.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Huỷ
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteJob}
            >
              Ẩn bài đăng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default AdminJobs;
