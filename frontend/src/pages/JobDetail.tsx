import { useParams, useNavigate } from 'react-router-dom';
import { useJobs } from '@/contexts/JobsContext';
import { useAuth, API_BASE, getAccessToken } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { resolveWorkFormatLabel, resolveJobTypeLabel, badgeColorForKey } from '@/lib/badge';
import { Separator } from '@/components/ui/separator';
import {
  MapPin, DollarSign, Briefcase, Clock, Building2,
  CheckCircle2, ArrowLeft, FileText, Upload, Loader2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface JobForm {
  id: number;
  title: string;
  verified_company?: string;
  display_verified_company?: string;
  verified_company_other?: string;
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
  display_work_format?: string;
  job_type?: string;
  display_job_type?: string;
  description?: string;
  responsibilities?: string;
  requirements?: string;
  required_experience?: string;
  benefits?: string;
  contact_email?: string;
  application_email?: string;
  application_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  is_active: boolean;
  created_at: string;
  created_by?: string;
}

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { applyToJob, applications } = useJobs();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [useDefaultCV, setUseDefaultCV] = useState(true);
  const [customCV, setCustomCV] = useState<File | null>(null);
  const [uploadingCV, setUploadingCV] = useState(false);
  const [applying, setApplying] = useState(false);
  const [job, setJob] = useState<JobForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasApplied, setHasApplied] = useState(false);

  // Check if user has already applied to this job
  useEffect(() => {
    if (user && id) {
      const alreadyApplied = applications.some(
        (app) => app.jobId === id && app.userId === user.id
      );
      setHasApplied(alreadyApplied);
    }
  }, [user, id, applications]);

  // Fetch job from API
  useEffect(() => {
    const fetchJob = async () => {
      try {
        let token = await getAccessToken();
        let headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        let res = await fetch(`${API_BASE}/api/jobfinder/forms/${id}/`, { headers });
        
        // If 401, try to get fresh token and retry
        if (res.status === 401 && token) {
          token = await getAccessToken();
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            res = await fetch(`${API_BASE}/api/jobfinder/forms/${id}/`, { headers });
          }
        }
        
        if (res.ok) {
          const data = await res.json();
          setJob(data);
        } else if (res.status === 404) {
          setError('Không tìm thấy công việc');
        } else {
          setError('Có lỗi xảy ra');
        }
      } catch (e) {
        setError('Không thể tải thông tin công việc');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchJob();
    }
  }, [id]);

  // Helper functions
  const getCompanyName = () => {
    if (job?.verified_company === 'other' && job?.verified_company_other) {
      return job.verified_company_other;
    }
    return job?.display_verified_company || job?.verified_company || 'Chưa có công ty';
  };

  const getLocation = () => {
    const parts = [job?.address, job?.ward_name, job?.district_name, job?.province_name].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Chưa có địa chỉ';
  };

  const getSalary = () => {
    if (!job?.salary_from) return 'Thương lượng';
    const symbol = job.salary_currency_symbol || job.display_salary_currency || job.salary_currency || '₫';
    if (job.salary_to) {
      return `Từ ${job.salary_from.toLocaleString()} đến ${job.salary_to.toLocaleString()} ${symbol}`;
    }
    return `Từ ${job.salary_from.toLocaleString()} ${symbol}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Split text by newlines into array
  const textToList = (text?: string) => {
    if (!text) return [];
    return text.split('\n').map(s => s.trim()).filter(Boolean);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">{error || 'Không tìm thấy công việc'}</h2>
            <Button onClick={() => navigate('/jobs')}>Quay lại danh sách</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleApply = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'user') {
      toast({
        title: "Lỗi",
        description: "Chỉ users mới có thể ứng tuyển",
        variant: "destructive",
      });
      return;
    }
    setShowApplyDialog(true);
  };

  const submitApplication = async () => {
    if (!user || !job) return;

    setUploadingCV(true);
    setApplying(true);
    try {
      // Determine which CV to use
      let cvUrl = user.cv;
      
      // If user selected custom CV, upload it first (regardless of useDefaultCV)
      if (customCV) {
        const token = await getAccessToken();
        const formData = new FormData();
        formData.append('cv', customCV);

        const uploadRes = await fetch(`${API_BASE}/api/users/cv/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (uploadRes.ok) {
          const data = await uploadRes.json();
          cvUrl = data.cv;
        } else {
          const errData = await uploadRes.json().catch(() => ({}));
          toast({
            title: 'Lỗi',
            description: errData.detail || 'Không thể tải lên CV',
            variant: 'destructive',
          });
          setUploadingCV(false);
          return;
        }
      } else if (!user.cv) {
        // No default CV and no custom CV selected
        toast({
          title: 'Lỗi',
          description: 'Vui lòng tải lên CV để ứng tuyển',
          variant: 'destructive',
        });
        setUploadingCV(false);
        return;
      }

      const success = await applyToJob(String(job.id), {
        jobId: String(job.id),
        userId: user.id,
        userName: user.name || user.username || '',
        userEmail: user.email,
        cvUrl: cvUrl,
        coverLetter: '',
      });

      if (success) {
        toast({
          title: "Ứng tuyển thành công!",
          description: "Hồ sơ của bạn đã được gửi đến nhà tuyển dụng",
        });
        setHasApplied(true);
      } else {
        toast({
          title: 'Lỗi',
          description: 'Không thể gửi đơn ứng tuyển. Vui lòng thử lại.',
          variant: 'destructive',
        });
      }

      setShowApplyDialog(false);
      setCustomCV(null);
      setUseDefaultCV(true);
    } catch (err) {
      toast({
        title: 'Lỗi',
        description: 'Không thể gửi đơn ứng tuyển',
        variant: 'destructive',
      });
    } finally {
      setUploadingCV(false);
      setApplying(false);
    }
  };

  const companyName = getCompanyName();
  const requirementsList = textToList(job.requirements);
  const benefitsList = textToList(job.benefits);
  const responsibilitiesList = textToList(job.responsibilities);

  // Check if current user is the owner of this job (created_by returns username)
  const isOwner = isAuthenticated && user && user.username === job.created_by;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-5xl">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>

          <Card>
            <CardContent className="p-8">
              {/* Header */}
              <div className="flex items-start gap-6 mb-6">
                <Avatar className="h-20 w-20 border">
                  <AvatarFallback>{companyName.charAt(0)}</AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
                  <div className="flex items-center gap-2 text-lg text-muted-foreground mb-4">
                    <Building2 className="h-5 w-5" />
                    <span>{companyName}</span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{getLocation()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold text-primary">{getSalary()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Đăng ngày {formatDate(job.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {(() => {
                      const wfLabel = resolveWorkFormatLabel(job);
                      const jtLabel = resolveJobTypeLabel(job);
                      const colorKey = job.work_format || job.job_type || '';
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

                {!isOwner && user?.role !== 'admin' && (
                  (() => {
                    const isAccountRestricted = user?.status === 'PENDING_VERIFICATION' || user?.status === 'INACTIVE' || user?.status === 'LOCKED';
                    const getRestrictionMessage = () => {
                      if (user?.status === 'PENDING_VERIFICATION') return 'Tài khoản chưa được xác minh';
                      if (user?.status === 'INACTIVE') return 'Tài khoản đang vô hiệu hóa';
                      if (user?.status === 'LOCKED') return 'Tài khoản đang khóa';
                      return '';
                    };
                    
                    // Already applied - show disabled button with different text
                    if (hasApplied) {
                      return (
                        <Button size="lg" disabled variant="secondary">
                          Đã ứng tuyển
                        </Button>
                      );
                    }
                    
                    if (isAccountRestricted) {
                      return (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span tabIndex={0}>
                                <Button size="lg" disabled>
                                  Ứng tuyển ngay
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{getRestrictionMessage()}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    }
                    
                    return (
                      <Button size="lg" onClick={handleApply}>
                        Ứng tuyển ngay
                      </Button>
                    );
                  })()
                )}
              </div>

              <Separator className="my-6" />

              {/* Description */}
              {job.description && (
                <section className="mb-6">
                  <h2 className="text-xl font-semibold mb-3">Mô tả công việc</h2>
                  <p className="text-muted-foreground whitespace-pre-line break-words leading-relaxed">{job.description}</p>
                </section>
              )}

              {/* Responsibilities */}
              {responsibilitiesList.length > 0 && (
                <section className="mb-6">
                  <h2 className="text-xl font-semibold mb-3">Trách nhiệm công việc</h2>
                  <ul className="space-y-2">
                    {responsibilitiesList.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Requirements */}
              {requirementsList.length > 0 && (
                <section className="mb-6">
                  <h2 className="text-xl font-semibold mb-3">Yêu cầu ứng viên</h2>
                  <ul className="space-y-2">
                    {requirementsList.map((req, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0 break-words" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Required Experience */}
              {job.required_experience && (
                <section className="mb-6">
                  <h2 className="text-xl font-semibold mb-3">Kinh nghiệm yêu cầu</h2>
                  <p className="text-muted-foreground">{job.required_experience}</p>
                </section>
              )}

              {/* Benefits */}
              {benefitsList.length > 0 && (
                <section className="mb-6">
                  <h2 className="text-xl font-semibold mb-3 break-words">Quyền lợi</h2>
                  <ul className="space-y-2">
                    {benefitsList.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Contact Email */}
              {(job.contact_email || job.application_email) && (
                <>
                  <Separator className="my-6" />
                  <section className="mb-2">
                    <h2 className="text-xl font-semibold mb-3">Email liên hệ</h2>
                    <a
                      href={`mailto:${job.application_email || job.contact_email}`}
                      className="text-primary underline underline-offset-4 break-words"
                    >
                      {job.application_email || job.contact_email}
                    </a>
                  </section>
                </>
              )}

              {/* Application URL */}
              {job.application_url && (
                <>
                  <Separator className="my-6" />
                  <section className="mb-2">
                    <h2 className="text-xl font-semibold mb-3">Link ứng tuyển</h2>
                    <a
                      href={job.application_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-4 break-words"
                    >
                      {job.application_url}
                    </a>
                  </section>
                </>
              )}

              <div className="text-center mt-8">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate(-1)}
                  className="min-w-[200px]"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Quay lại
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      </main>

      {/* Apply Dialog */}
      <Dialog open={showApplyDialog} onOpenChange={(open) => {
        setShowApplyDialog(open);
        if (!open) {
          setUseDefaultCV(!!user?.cv);
          setCustomCV(null);
        } else {
          // When opening, auto-select custom CV mode if no default CV
          setUseDefaultCV(!!user?.cv);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ứng tuyển vào vị trí {job.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* CV Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Chọn CV để ứng tuyển</Label>
              
              {/* Only show default CV option if user has one */}
              {user?.cv && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">Sử dụng CV mặc định</p>
                      <p className="text-xs text-muted-foreground">{user?.cv_filename}</p>
                    </div>
                  </div>
                  <Switch
                    checked={useDefaultCV}
                    onCheckedChange={(checked) => {
                      setUseDefaultCV(checked);
                      if (checked) setCustomCV(null);
                    }}
                  />
                </div>
              )}

              {/* Show upload area if no default CV or user chose custom */}
              {(!user?.cv || !useDefaultCV) && (
                <div className="p-3 border rounded-lg border-dashed">
                  <input
                    type="file"
                    id="custom-cv-upload"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Validate
                        const allowedExtensions = ['.pdf', '.doc', '.docx'];
                        const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
                        if (!allowedExtensions.includes(fileExt)) {
                          toast({
                            title: 'Lỗi',
                            description: 'Chỉ chấp nhận file PDF, DOC, DOCX',
                            variant: 'destructive',
                          });
                          return;
                        }
                        if (file.size > 10 * 1024 * 1024) {
                          toast({
                            title: 'Lỗi',
                            description: 'File quá lớn. Tối đa 10MB.',
                            variant: 'destructive',
                          });
                          return;
                        }
                        setCustomCV(file);
                      }
                    }}
                    className="hidden"
                  />
                  {customCV ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-green-600" />
                        <span className="text-sm truncate max-w-[200px]">{customCV.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setCustomCV(null)}
                      >
                        Xóa
                      </Button>
                    </div>
                  ) : (
                    <label
                      htmlFor="custom-cv-upload"
                      className="flex flex-col items-center gap-2 cursor-pointer py-4"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {user?.cv ? 'Tải lên CV khác cho công việc này' : 'Tải lên CV để ứng tuyển'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        PDF, DOC, DOCX (Tối đa 10MB)
                      </span>
                    </label>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={submitApplication} 
                className="flex-1"
                disabled={uploadingCV || (!user?.cv && !customCV)}
              >
                {uploadingCV ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  'Gửi ứng tuyển'
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowApplyDialog(false)}>
                Hủy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default JobDetail;
