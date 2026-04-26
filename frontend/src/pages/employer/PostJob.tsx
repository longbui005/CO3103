import { useState, useEffect } from 'react';
import { useAuth, authFetch, API_BASE as AUTH_API_BASE } from '@/contexts/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ChevronDown } from 'lucide-react';

const API_BASE = AUTH_API_BASE;

async function fetchJSON(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Network error');
  return res.json();
}

// postJSON with auto-refresh - needs logout callback
async function postJSONWithAuth(url: string, body: any, onLogout: () => void) {
  const res = await authFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, onLogout);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}

interface LookupItem {
  code: string;
  name: string;
}

interface LocationItem {
  id: string;  // ULID string from backend
  code: string;
  name: string;
  english_name?: string;
  full_name?: string;
}

const PostJob = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Lookup data from backend
  const [workFormats, setWorkFormats] = useState<LookupItem[]>([]);
  const [jobTypes, setJobTypes] = useState<LookupItem[]>([]);
  const [currencies, setCurrencies] = useState<LookupItem[]>([]);
  const [verifiedCompanies, setVerifiedCompanies] = useState<LookupItem[]>([]);

  // Location cascading data (Vietnam administrative hierarchy)
  const [provinces, setProvinces] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [wards, setWards] = useState<LocationItem[]>([]);

  // Form state — matches backend Form model
  const [formData, setFormData] = useState({
    title: '',
    verified_company: '',
    verified_company_other: '',
    contact_email: '',
    application_email: '',
    application_url: '',
    province: '',
    district: '',
    ward: '',
    address: '',
    salary_from: '',
    salary_to: '',
    salary_currency: '',
    salary_currency_other: '',
    number_of_positions: '1',
    work_format: '',
    work_format_other: '',
    job_type: '',
    job_type_other: '',
    description: '',
    responsibilities: '',
    requirements: '',
    required_experience: '',
    benefits: '',
  });

  const [submitting, setSubmitting] = useState(false);

  // Fetch lookup data on mount
  useEffect(() => {
    (async () => {
      try {
        const [wf, jt, cur, vc] = await Promise.all([
          fetchJSON(`${API_BASE}/api/jobfinder/work-formats/`),
          fetchJSON(`${API_BASE}/api/jobfinder/job-types/`),
          fetchJSON(`${API_BASE}/api/jobfinder/currencies/`),
          fetchJSON(`${API_BASE}/api/jobfinder/verified-companies/`),
        ]);
        setWorkFormats(wf || []);
        setJobTypes(jt || []);
        setCurrencies(cur || []);
        setVerifiedCompanies(vc || []);
      } catch (e) {
        console.error('Failed to load lookups', e);
      }
    })();
  }, []);

  // Fetch provinces on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchJSON(`${API_BASE}/api/jobfinder/provinces/`);
        setProvinces(data || []);
      } catch {
        console.error('Failed to load provinces');
      }
    })();
  }, []);

  // When province changes, fetch districts
  useEffect(() => {
    if (!formData.province) {
      setDistricts([]);
      return;
    }
    (async () => {
      try {
        const data = await fetchJSON(`${API_BASE}/api/jobfinder/provinces/${formData.province}/districts/`);
        setDistricts(data || []);
      } catch {
        setDistricts([]);
      }
    })();
    // Reset downstream
    setFormData((f) => ({ ...f, district: '', ward: '' }));
    setWards([]);
  }, [formData.province]);

  // When district changes, fetch wards
  useEffect(() => {
    if (!formData.district) {
      setWards([]);
      return;
    }
    (async () => {
      try {
        const data = await fetchJSON(`${API_BASE}/api/jobfinder/districts/${formData.district}/wards/`);
        setWards(data || []);
      } catch {
        setWards([]);
      }
    })();
    setFormData((f) => ({ ...f, ward: '' }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.district]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Basic validation
    if (!formData.title.trim()) {
      toast({ title: 'Thiếu tiêu đề', description: 'Vui lòng nhập tiêu đề công việc.', variant: 'destructive' });
      return;
    }
    if (!formData.verified_company) {
      toast({ title: 'Thiếu công ty', description: 'Vui lòng chọn công ty.', variant: 'destructive' });
      return;
    }
    if (formData.verified_company === 'other' && !formData.verified_company_other.trim()) {
      toast({ title: 'Thiếu tên công ty', description: 'Vui lòng nhập tên công ty khi chọn "Khác".', variant: 'destructive' });
      return;
    }
    if (!formData.province) {
      toast({ title: 'Thiếu tỉnh/thành phố', description: 'Vui lòng chọn tỉnh/thành phố.', variant: 'destructive' });
      return;
    }
    if (!formData.district) {
      toast({ title: 'Thiếu quận/huyện', description: 'Vui lòng chọn quận/huyện.', variant: 'destructive' });
      return;
    }
    if (!formData.ward) {
      toast({ title: 'Thiếu phường/xã', description: 'Vui lòng chọn phường/xã.', variant: 'destructive' });
      return;
    }
    if (!formData.salary_from) {
      toast({ title: 'Thiếu lương tối thiểu', description: 'Vui lòng nhập lương tối thiểu.', variant: 'destructive' });
      return;
    }
    if (!formData.salary_currency) {
      toast({ title: 'Thiếu đơn vị tiền', description: 'Vui lòng chọn đơn vị tiền.', variant: 'destructive' });
      return;
    }
    if (formData.salary_currency === 'other' && !formData.salary_currency_other.trim()) {
      toast({ title: 'Thiếu loại tiền', description: 'Vui lòng nhập loại tiền khi chọn "Khác".', variant: 'destructive' });
      return;
    }
    if (!formData.work_format) {
      toast({ title: 'Thiếu hình thức làm việc', description: 'Vui lòng chọn hình thức làm việc.', variant: 'destructive' });
      return;
    }
    if (formData.work_format === 'other' && !formData.work_format_other.trim()) {
      toast({ title: 'Thiếu hình thức làm việc', description: 'Vui lòng nhập hình thức làm việc khi chọn "Khác".', variant: 'destructive' });
      return;
    }
    if (!formData.job_type) {
      toast({ title: 'Thiếu loại công việc', description: 'Vui lòng chọn loại công việc.', variant: 'destructive' });
      return;
    }
    if (formData.job_type === 'other' && !formData.job_type_other.trim()) {
      toast({ title: 'Thiếu loại công việc', description: 'Vui lòng nhập loại công việc khi chọn "Khác".', variant: 'destructive' });
      return;
    }
    if (!formData.description.trim()) {
      toast({ title: 'Thiếu mô tả công việc', description: 'Vui lòng nhập mô tả công việc.', variant: 'destructive' });
      return;
    }
    if (!formData.responsibilities.trim()) {
      toast({ title: 'Thiếu trách nhiệm công việc', description: 'Vui lòng nhập trách nhiệm công việc.', variant: 'destructive' });
      return;
    }
    if (!formData.requirements.trim()) {
      toast({ title: 'Thiếu yêu cầu ứng viên', description: 'Vui lòng nhập yêu cầu ứng viên.', variant: 'destructive' });
      return;
    }
    if (!formData.benefits.trim()) {
      toast({ title: 'Thiếu quyền lợi', description: 'Vui lòng nhập quyền lợi.', variant: 'destructive' });
      return;
    }

    if (!formData.number_of_positions.trim()) {
      toast({ title: 'Thiếu số lượng tuyển', description: 'Vui lòng nhập số lượng tuyển.', variant: 'destructive' });
      return;
    }

    // Validate salary range
    if (formData.salary_from && formData.salary_to) {
      const salaryFrom = parseFloat(formData.salary_from);
      const salaryTo = parseFloat(formData.salary_to);
      if (salaryFrom >= salaryTo) {
        toast({ title: 'Lương không hợp lệ', description: 'Lương tối thiểu phải nhỏ hơn lương tối đa.', variant: 'destructive' });
        return;
      }
    }

    setSubmitting(true);

    // Build payload matching backend serializer
    const payload: any = {
      title: formData.title,
      verified_company: formData.verified_company,
      contact_email: formData.contact_email || undefined,
      application_email: formData.application_email || undefined,
      application_url: formData.application_url || undefined,
      address: formData.address || undefined,
      description: formData.description || undefined,
      responsibilities: formData.responsibilities || undefined,
      requirements: formData.requirements || undefined,
      required_experience: formData.required_experience || undefined,
      benefits: formData.benefits || undefined,
      number_of_positions: parseInt(formData.number_of_positions, 10) || 1,
    };

    // Location FKs (send ULID string IDs)
    if (formData.province) payload.province = formData.province;
    if (formData.district) payload.district = formData.district;
    if (formData.ward) payload.ward = formData.ward;

    // Salary
    if (formData.salary_from) payload.salary_from = parseFloat(formData.salary_from);
    if (formData.salary_to) payload.salary_to = parseFloat(formData.salary_to);
    if (formData.salary_currency) payload.salary_currency = formData.salary_currency;
    if (formData.salary_currency === 'other' && formData.salary_currency_other) {
      payload.salary_currency_other = formData.salary_currency_other;
    }

    // Work format
    if (formData.work_format) payload.work_format = formData.work_format;
    if (formData.work_format === 'other' && formData.work_format_other) {
      payload.work_format_other = formData.work_format_other;
    }

    // Job type
    if (formData.job_type) payload.job_type = formData.job_type;
    if (formData.job_type === 'other' && formData.job_type_other) {
      payload.job_type_other = formData.job_type_other;
    }

    // Verified company other
    if (formData.verified_company === 'other' && formData.verified_company_other) {
      payload.verified_company_other = formData.verified_company_other;
    }

    try {
      await postJSONWithAuth(`${API_BASE}/api/jobfinder/forms/`, payload, () => {
        // On token refresh failure, logout and redirect
        logout();
        toast({ title: 'Phiên đăng nhập hết hạn', description: 'Vui lòng đăng nhập lại.', variant: 'destructive' });
        navigate('/auth/login');
      });
      toast({ title: 'Đăng tin thành công!', description: 'Tin tuyển dụng của bạn đang chờ duyệt.' });
      navigate('/employer/dashboard');
    } catch (err: any) {
      console.error(err);
      const msg = typeof err === 'object' ? JSON.stringify(err) : String(err);
      toast({ title: 'Lỗi', description: msg, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || !['user', 'admin'].includes(user.role ?? '')) {
    return <Navigate to="/" replace />;
  }

  // Kiểm tra trạng thái tài khoản
  const isAccountRestricted = user.status === 'PENDING_VERIFICATION' || user.status === 'LOCKED';

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>

          {isAccountRestricted ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Đăng tin tuyển dụng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    {user.status === 'PENDING_VERIFICATION' 
                      ? 'Tài khoản của bạn chưa được xác minh. Vui lòng xác minh tài khoản để đăng tin tuyển dụng.'
                      : 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.'}
                  </p>
                  <Button variant="outline" onClick={() => navigate('/profile')}>
                    Đi đến hồ sơ
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Đăng tin tuyển dụng</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Verified Company */}
                <div className="space-y-2">
                  <Label>Công ty / Tổ chức *</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {formData.verified_company ? verifiedCompanies.find(c => c.code === formData.verified_company)?.name || 'Chọn công ty' : 'Chọn công ty'}
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width] max-h-60 overflow-y-auto">
                      {verifiedCompanies.map((c) => (
                        <DropdownMenuItem key={c.code} onClick={() => handleChange('verified_company', c.code)}>
                          {c.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {formData.verified_company === 'other' && (
                    <Input
                      className="mt-2"
                      placeholder="Nhập tên công ty"
                      value={formData.verified_company_other}
                      onChange={(e) => handleChange('verified_company_other', e.target.value)}
                    />
                  )}
                </div>

                {/* Contact & Application Emails */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Email liên lạc</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      placeholder="hr@company.com"
                      value={formData.contact_email}
                      onChange={(e) => handleChange('contact_email', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="application_email">Email nhận hồ sơ</Label>
                    <Input
                      id="application_email"
                      type="email"
                      placeholder="apply@company.com"
                      value={formData.application_email}
                      onChange={(e) => handleChange('application_email', e.target.value)}
                    />
                  </div>
                </div>

                {/* Application URL */}
                <div className="space-y-2">
                  <Label htmlFor="application_url">Link ứng tuyển (nếu có)</Label>
                  <Input
                    id="application_url"
                    type="url"
                    placeholder="https://company.com/careers/apply"
                    value={formData.application_url}
                    onChange={(e) => handleChange('application_url', e.target.value)}
                  />
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Tiêu đề công việc *</Label>
                  <Input
                    id="title"
                    placeholder="VD: Senior Frontend Developer"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    required
                  />
                </div>

                {/* Location: Province / District / Ward (Vietnam administrative hierarchy) */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Tỉnh / Thành phố *</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          {formData.province ? provinces.find(p => p.id === formData.province)?.name || 'Chọn tỉnh/thành' : 'Chọn tỉnh/thành'}
                          <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width] max-h-60 overflow-y-auto">
                        {provinces.map((p) => (
                          <DropdownMenuItem key={p.id} onClick={() => handleChange('province', p.id)}>
                            {p.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="space-y-2">
                    <Label>Quận / Huyện *</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild disabled={!formData.province}>
                        <Button variant="outline" className="w-full justify-between" disabled={!formData.province}>
                          {formData.district ? districts.find(d => d.id === formData.district)?.name || 'Chọn quận/huyện' : 'Chọn quận/huyện'}
                          <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width] max-h-60 overflow-y-auto">
                        {districts.map((d) => (
                          <DropdownMenuItem key={d.id} onClick={() => handleChange('district', d.id)}>
                            {d.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="space-y-2">
                    <Label>Phường / Xã *</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild disabled={!formData.district}>
                        <Button variant="outline" className="w-full justify-between" disabled={!formData.district}>
                          {formData.ward ? wards.find(w => w.id === formData.ward)?.name || 'Chọn phường/xã' : 'Chọn phường/xã'}
                          <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width] max-h-60 overflow-y-auto">
                        {wards.map((w) => (
                          <DropdownMenuItem key={w.id} onClick={() => handleChange('ward', w.id)}>
                            {w.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address">Địa chỉ cụ thể</Label>
                  <Input
                    id="address"
                    placeholder="Số nhà, tên đường..."
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                  />
                </div>

                {/* Salary */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="salary_from">Lương tối thiểu *</Label>
                    <Input
                      id="salary_from"
                      type="number"
                      min="0"
                      placeholder="10000000"
                      value={formData.salary_from}
                      onChange={(e) => handleChange('salary_from', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salary_to">Lương tối đa</Label>
                    <Input
                      id="salary_to"
                      type="number"
                      min="0"
                      placeholder="20000000"
                      value={formData.salary_to}
                      onChange={(e) => handleChange('salary_to', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Đơn vị tiền *</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          {formData.salary_currency ? currencies.find(c => c.code === formData.salary_currency)?.name || 'Chọn đơn vị tiền' : 'Chọn đơn vị tiền'}
                          <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width]">
                        {currencies.map((c) => (
                          <DropdownMenuItem key={c.code} onClick={() => handleChange('salary_currency', c.code)}>
                            {c.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {formData.salary_currency === 'other' && (
                      <Input
                        className="mt-2"
                        placeholder="Nhập loại tiền"
                        value={formData.salary_currency_other}
                        onChange={(e) => handleChange('salary_currency_other', e.target.value)}
                      />
                    )}
                  </div>
                </div>

                {/* Number of positions */}
                <div className="space-y-2">
                  <Label htmlFor="number_of_positions">Số lượng tuyển *</Label>
                  <Input
                    id="number_of_positions"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min="1"
                    value={formData.number_of_positions}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow digits
                      if (value === '' || /^[0-9]+$/.test(value)) {
                        handleChange('number_of_positions', value);
                      }
                    }}
                    onKeyDown={(e) => {
                      // Block e, E, +, -, . characters
                      if (['e', 'E', '+', '-', '.', ','].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>

                {/* Work Format + Job Type */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Hình thức làm việc *</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          {formData.work_format ? workFormats.find(w => w.code === formData.work_format)?.name || 'Chọn hình thức' : 'Chọn hình thức'}
                          <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width]">
                        {workFormats.map((w) => (
                          <DropdownMenuItem key={w.code} onClick={() => handleChange('work_format', w.code)}>
                            {w.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {formData.work_format === 'other' && (
                      <Input
                        className="mt-2"
                        placeholder="Nhập hình thức khác"
                        value={formData.work_format_other}
                        onChange={(e) => handleChange('work_format_other', e.target.value)}
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Loại công việc *</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          {formData.job_type ? jobTypes.find(j => j.code === formData.job_type)?.name || 'Chọn loại công việc' : 'Chọn loại công việc'}
                          <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width]">
                        {jobTypes.map((j) => (
                          <DropdownMenuItem key={j.code} onClick={() => handleChange('job_type', j.code)}>
                            {j.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {formData.job_type === 'other' && (
                      <Input
                        className="mt-2"
                        placeholder="Nhập loại công việc khác"
                        value={formData.job_type_other}
                        onChange={(e) => handleChange('job_type_other', e.target.value)}
                      />
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Mô tả công việc *</Label>
                  <Textarea
                    id="description"
                    placeholder="Mô tả chi tiết về công việc"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={4}
                  />
                </div>

                {/* Responsibilities */}
                <div className="space-y-2">
                  <Label htmlFor="responsibilities">Trách nhiệm công việc *</Label>
                  <Textarea
                    id="responsibilities"
                    placeholder="Mỗi trách nhiệm một dòng"
                    value={formData.responsibilities}
                    onChange={(e) => handleChange('responsibilities', e.target.value)}
                    rows={4}
                  />
                </div>

                {/* Requirements */}
                <div className="space-y-2">
                  <Label htmlFor="requirements">Yêu cầu ứng viên *</Label>
                  <Textarea
                    id="requirements"
                    placeholder="Mỗi yêu cầu một dòng"
                    value={formData.requirements}
                    onChange={(e) => handleChange('requirements', e.target.value)}
                    rows={4}
                  />
                </div>

                {/* Required Experience */}
                <div className="space-y-2">
                  <Label htmlFor="required_experience">Kinh nghiệm yêu cầu</Label>
                  <Input
                    id="required_experience"
                    placeholder="VD: 3+ năm kinh nghiệm React"
                    value={formData.required_experience}
                    onChange={(e) => handleChange('required_experience', e.target.value)}
                  />
                </div>

                {/* Benefits */}
                <div className="space-y-2">
                  <Label htmlFor="benefits">Quyền lợi *</Label>
                  <Textarea
                    id="benefits"
                    placeholder="Mỗi quyền lợi một dòng"
                    value={formData.benefits}
                    onChange={(e) => handleChange('benefits', e.target.value)}
                    rows={4}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <Button type="submit" className="flex-1" disabled={submitting}>
                    {submitting ? 'Đang gửi...' : 'Đăng tin'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                    Hủy
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PostJob;
