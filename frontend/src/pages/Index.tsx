import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Search, MapPin, Briefcase, Users, Building2, DollarSign, Clock } from 'lucide-react';
import { useAuth, API_BASE } from '@/contexts/AuthContext';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { resolveWorkFormatLabel, resolveJobTypeLabel, badgeColorForKey } from '@/lib/badge';

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
  job_type?: string;
  status: 'pending' | 'approved' | 'rejected';
  is_active: boolean;
  created_at: string;
}

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobForm[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect admin to dashboard
  useEffect(() => {
    if (user && user.role?.toUpperCase() === 'ADMIN') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Fetch approved jobs from API
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/jobfinder/forms/`);
        if (res.ok) {
          const data = await res.json();
          // Only show approved jobs, limit to 6
          const approvedJobs = data
            .filter((j: JobForm) => j.status === 'approved')
            .slice(0, 6);
          setJobs(approvedJobs);
        }
      } catch (e) {
        console.error('Failed to fetch jobs', e);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

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

  const formatDate = (date: string) => {
    const now = new Date();
    const posted = new Date(date);
    const diffTime = Math.abs(now.getTime() - posted.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    return posted.toLocaleDateString('vi-VN');
  };

  const getWorkFormatColor = (format?: string) => badgeColorForKey(format || '');

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-hero pt-28 md:pt-36 pb-20">
          <div className="absolute inset-0 bg-grid-white/10" />
          <div className="container relative mx-auto px-4">
            <div className="mx-auto max-w-3xl lg:max-w-5xl text-center text-white">
              <h1 className="mb-6 text-4xl font-bold md:text-5xl lg:text-6xl lg:whitespace-nowrap tracking-tight">
                Tìm công việc mơ ước của bạn
              </h1>
              <p className="mb-8 text-lg md:text-xl opacity-90">
                Hàng ngàn cơ hội việc làm đang chờ đón bạn!
              </p>

              {/* Search Box - Click to navigate to search page */}
              <div className="mx-auto max-w-2xl">
                <button
                  onClick={() => navigate('/jobs')}
                  className="w-full flex items-center gap-3 bg-white rounded-lg p-4 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer text-left"
                >
                  <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                  <span className="flex-1 text-slate-400">Tìm kiếm vị trí, công ty, địa điểm...</span>
                  <div className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium">
                    Tìm kiếm
                  </div>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-b bg-muted/30 py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-primary">2K+</div>
                <div className="text-sm text-muted-foreground">Việc làm</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Công ty</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-primary">10K+</div>
                <div className="text-sm text-muted-foreground">Ứng viên</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-primary">5K+</div>
                <div className="text-sm text-muted-foreground">Đã tuyển dụng</div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Jobs */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold mb-2">Việc làm nổi bật</h2>
              <p className="text-muted-foreground">Khám phá các cơ hội việc làm hấp dẫn</p>
            </div>

            {loading ? (
              <div className="text-center text-muted-foreground py-8">Đang tải...</div>
            ) : jobs.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">Chưa có tin tuyển dụng nào</div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                {jobs.map((job) => (
                  <Card key={job.id} className="hover:shadow-lg transition-all duration-300 cursor-pointer group border-border/50">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12 border">
                          <AvatarFallback>{getCompanyName(job).charAt(0)}</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 space-y-3">
                          <div>
                            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                              {job.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">{getCompanyName(job)}</p>
                          </div>

                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{getLocation(job)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              <span>{getSalary(job)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{formatDate(job.created_at)}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {(() => {
                              const wfLabel = resolveWorkFormatLabel(job);
                              const jtLabel = resolveJobTypeLabel(job);
                              const colorKey = job.work_format || job.job_type || job.type || '';
                              return (
                                <>
                                  {wfLabel && (
                                    <Badge className={badgeColorForKey(colorKey)}>
                                      <Briefcase className="h-3 w-3 mr-1" />
                                      {wfLabel}
                                    </Badge>
                                  )}
                                  {jtLabel && (
                                    <Badge variant="outline">{jtLabel}</Badge>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="p-6 pt-0">
                      <Button 
                        className="w-full" 
                        onClick={() => navigate(`/jobs/${job.id}`)}
                      >
                        Xem chi tiết
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}

            <div className="text-center">
              <Button size="lg" onClick={() => navigate('/jobs')}>
                Xem tất cả việc làm
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-hero py-16">
          <div className="container mx-auto px-4 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Bạn là nhà tuyển dụng?</h2>
            <p className="text-lg mb-8 opacity-90">
              Đăng tin tuyển dụng và tìm kiếm ứng viên phù hợp
            </p>
            <Button
              size="lg"
              variant="outline"
              className="bg-white text-primary border-primary hover:bg-muted"
              onClick={() => navigate(user ? '/employer/post-job' : '/register')}
            >
              Đăng tin ngay
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
