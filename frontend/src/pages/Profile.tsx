import { useState, useEffect } from 'react';
import { useAuth, API_BASE, getAccessToken } from '@/contexts/AuthContext';
import { useJobs } from '@/contexts/JobsContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { User, FileText, Briefcase, Pencil, Save, CalendarIcon, ArrowLeft, CheckCircle, ShieldX, Lock, ChevronDown, Camera, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, parse } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Gender {
  code: string;
  name: string;
  is_active?: boolean;
}

interface StatusLookup {
  code: string;
  name: string;
  description?: string;
  is_active?: boolean;
}

const Profile = () => {
  const { user, updateProfile, refreshUser, isLoading } = useAuth();

  const [search] = useSearchParams();
  // avoid accessing user.id when user may be null during initial render
  const viewedIdParam = search.get('id');

  // State để lưu thông tin user được xem (khi xem người khác)
  const [viewedUser, setViewedUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(false);

  // Determine if viewing self
  const isSelf = Boolean(user && (!viewedIdParam || viewedIdParam === user.id));
  
  // Display user: nếu xem chính mình thì dùng user từ context, ngược lại dùng viewedUser từ API
  const displayUser = isSelf ? user : viewedUser;

  const { getUserApplications, jobs } = useJobs();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [genders, setGenders] = useState<Gender[]>([]);
  const [statuses, setStatuses] = useState<StatusLookup[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCV, setUploadingCV] = useState(false);
  
  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [status, setStatus] = useState('');

  // Fetch user data when viewing someone else's profile
  useEffect(() => {
    const fetchViewedUser = async () => {
      if (!viewedIdParam || isSelf) return;
      
      setLoadingUser(true);
      
      try {
        const token = await getAccessToken();
        const res = await fetch(`${API_BASE}/api/users/users/${viewedIdParam}/`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          // Transform data to match expected format
          setViewedUser({
            id: String(data.id),
            email: data.email,
            username: data.username,
            first_name: data.first_name,
            last_name: data.last_name,
            role: data.role?.toLowerCase(),
            phone: data.phone,
            gender: data.gender,
            dob: data.dob,
            status: data.status,
            avatar: data.avatar,
            cv: data.cv,
            cv_filename: data.cv_filename,
          });
        } else {
          toast({ title: 'Lỗi', description: 'Không thể tải thông tin người dùng', variant: 'destructive' });
          navigate(-1);
        }
      } catch (e) {
        console.error('Failed to fetch user', e);
        toast({ title: 'Lỗi', description: 'Không thể tải thông tin người dùng', variant: 'destructive' });
      } finally {
        setLoadingUser(false);
      }
    };
    fetchViewedUser();
  }, [viewedIdParam, isSelf]);

  // Refresh user data on mount to get latest status
  useEffect(() => {
    if (isSelf && refreshUser) {
      refreshUser();
    }
  }, []);

  // Initialize form when user changes
  useEffect(() => {
    if (displayUser) {
      setFirstName(displayUser.first_name || '');
      setLastName(displayUser.last_name || '');
      setPhone(displayUser.phone || '');
      setDob(displayUser.dob || '');
      setGender(displayUser.gender || '');
      setStatus(displayUser.status?.toUpperCase() || '');
    }
  }, [displayUser?.id]);

  // Fetch genders
  useEffect(() => {
    const fetchGenders = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users/genders/`);
        if (res.ok) {
          const data = await res.json();
          setGenders(data.filter((g: Gender) => g.is_active !== false));
        }
      } catch (e) {
        console.error('Failed to fetch genders', e);
      }
    };
    fetchGenders();
  }, []);

  // Fetch statuses
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const token = await getAccessToken();
        const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch(`${API_BASE}/api/users/statuses/`, { headers });
        if (res.ok) {
          const data = await res.json();
          setStatuses(data.filter((s: StatusLookup) => s.is_active !== false));
        }
      } catch (e) {
        console.error('Failed to fetch statuses', e);
      }
    };
    fetchStatuses();
  }, []);

  // Helper: lấy tên giới tính từ code
  const getGenderName = (code: string) => {
    const g = genders.find(g => g.code === code);
    return g?.name || code;
  };

  // Helper: lấy tên trạng thái từ code
  const getStatusName = (code: string) => {
    const s = statuses.find(s => s.code === code);
    return s?.name || code;
  };

  const userApplications = user ? getUserApplications(user.id) : [];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = await getAccessToken();
      
      // Build request body, only include status if it has a value
      const requestBody: any = {
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        dob: dob || null,
        gender: gender || null,
      };
      if (status) {
        requestBody.status = status;
      }
      
      const res = await fetch(`${API_BASE}/api/users/me/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });
      
      if (res.ok) {
        toast({
          title: 'Cập nhật thành công',
          description: 'Thông tin cá nhân đã được lưu.',
        });
        setIsEditing(false);
        // Refresh user data
        if (refreshUser) {
          await refreshUser();
        }
      } else {
        throw new Error('Failed to update');
      }
    } catch (err) {
      toast({
        title: 'Cập nhật thất bại',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Lỗi',
        description: 'Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Lỗi',
        description: 'File quá lớn. Tối đa 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploadingAvatar(true);
    try {
      const token = await getAccessToken();
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await fetch(`${API_BASE}/api/users/avatar/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        toast({
          title: 'Thành công',
          description: 'Đã cập nhật ảnh đại diện',
        });
        // Refresh user data
        await refreshUser();
      } else {
        const data = await res.json();
        toast({
          title: 'Lỗi',
          description: data.detail || 'Không thể tải ảnh lên',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải ảnh lên',
        variant: 'destructive',
      });
    } finally {
      setUploadingAvatar(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    if (displayUser) {
      setFirstName(displayUser.first_name || '');
      setLastName(displayUser.last_name || '');
      setPhone(displayUser.phone || '');
      setDob(displayUser.dob || '');
      setGender(displayUser.gender || '');
      setStatus(displayUser.status?.toUpperCase() || '');
    }
    setIsEditing(false);
  };

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
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

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Lỗi',
        description: 'File quá lớn. Tối đa 10MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploadingCV(true);
    try {
      const token = await getAccessToken();
      const formData = new FormData();
      formData.append('cv', file);

      const res = await fetch(`${API_BASE}/api/users/cv/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        toast({
          title: 'Thành công',
          description: 'Đã tải lên CV',
        });
        await refreshUser();
      } else {
        const data = await res.json();
        toast({
          title: 'Lỗi',
          description: data.detail || 'Không thể tải CV lên',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải CV lên',
        variant: 'destructive',
      });
    } finally {
      setUploadingCV(false);
      e.target.value = '';
    }
  };

  const handleDeleteCV = async () => {
    try {
      const token = await getAccessToken();
      const res = await fetch(`${API_BASE}/api/users/cv/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        toast({
          title: 'Thành công',
          description: 'Đã xóa CV',
        });
        await refreshUser();
      } else {
        const data = await res.json();
        toast({
          title: 'Lỗi',
          description: data.detail || 'Không thể xóa CV',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa CV',
        variant: 'destructive',
      });
    }
  };


  const getJobTitle = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    return job?.title || 'Unknown';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-warning/10 text-warning',
      approved: 'bg-success/10 text-success',
      rejected: 'bg-destructive/10 text-destructive',
    };
    const labels: Record<string, string> = {
      pending: 'Đang chờ',
      approved: 'Được duyệt',
      rejected: ' Bị từ chối',
    };
    // tắt hover/focus và trỏ chuột
    return (
      <Badge
        className={`${variants[status]} cursor-default pointer-events-none hover:bg-inherit hover:text-inherit focus:ring-0`}
      >
        {labels[status]}
      </Badge>
    );
  };

  const getAccountStatusBadge = (statusCode: string) => {
    const variants: Record<string, string> = {
      'ACTIVE': 'bg-green-100 text-green-700',
      'INACTIVE': 'bg-gray-100 text-gray-700',
      'PENDING_VERIFICATION': 'bg-yellow-100 text-yellow-700',
      'LOCKED': 'bg-orange-100 text-orange-700',
      'SUSPENDED': 'bg-red-100 text-red-700',
      'BANNED': 'bg-red-200 text-red-800',
    };
    return (
      <Badge className={`${variants[statusCode] || 'bg-gray-100 text-gray-700'} cursor-default pointer-events-none`}>
        {getStatusName(statusCode)}
      </Badge>
    );
  };

  useEffect(() => {
    // Chỉ redirect khi đã load xong và chắc chắn không có user
    if (!isLoading && !user) navigate('/auth/login');
  }, [user, isLoading, navigate]);

  // Đang load auth state - hiển thị loading
  if (isLoading) {
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

  if (!user) return null; // tránh render khi đang redirect

  // Loading state khi đang fetch user khác
  if (loadingUser) {
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

  // Nếu xem người khác nhưng không tìm thấy
  if (viewedIdParam && !isSelf && !displayUser) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="h-16" />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4 text-center">Không tìm thấy người dùng</div>
        </main>
        <Footer />
      </div>
    );
  }

  // Chỉ hiển thị tab "Đã ứng tuyển" khi xem profile của chính mình và là user
  const showApplicationsTab = isSelf && displayUser?.role === 'user';
  const tabCols = showApplicationsTab ? 'grid-cols-2' : 'grid-cols-1';

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="h-16" />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-4 mb-8">
            {viewedIdParam && (
              <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <h1 className="text-3xl font-bold">{viewedIdParam ? 'Thông tin người dùng' : 'Hồ sơ cá nhân'}</h1>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className={`grid w-full ${tabCols}`}>
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                Thông tin
              </TabsTrigger>

              {/* CHỈ hiển thị cho user khi xem profile của chính mình */}
              {showApplicationsTab && (
                <TabsTrigger value="applications">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Đã ứng tuyển ({userApplications.length})
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin cá nhân</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={displayUser?.avatar} alt={displayUser?.name || displayUser?.email} />
                        <AvatarFallback className="text-2xl">
                          {(displayUser?.first_name?.charAt(0) || displayUser?.name?.charAt(0) || displayUser?.email?.charAt(0) || '').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {isSelf && (
                        <>
                          <input
                            type="file"
                            id="avatar-upload"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleAvatarUpload}
                            className="hidden"
                            disabled={uploadingAvatar}
                          />
                          <label
                            htmlFor="avatar-upload"
                            className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            {uploadingAvatar ? (
                              <Loader2 className="h-6 w-6 text-white animate-spin" />
                            ) : (
                              <Camera className="h-6 w-6 text-white" />
                            )}
                          </label>
                        </>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-semibold">{displayUser?.name || [displayUser?.first_name, displayUser?.last_name].filter(Boolean).join(' ').trim() || displayUser?.email}</h3>
                        {displayUser?.role === 'admin' && (
                          <Badge className="bg-purple-100 text-purple-700 cursor-default pointer-events-none">
                            Quản trị viên
                          </Badge>
                        )}
                        {displayUser?.role === 'employer' && (
                          <Badge className="bg-blue-100 text-blue-700 cursor-default pointer-events-none">
                            Nhà tuyển dụng
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground">{displayUser?.email}</p>
                    </div>
                  </div>

                  <form onSubmit={handleSave} className="space-y-6">
                    {/* Trạng thái tài khoản */}
                    <div className="grid gap-2">
                      <Label>Trạng thái tài khoản</Label>
                      {isEditing && isSelf ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-[200px] justify-between">
                              <span className="flex items-center gap-2">
                                {status === 'ACTIVE' && <><CheckCircle className="h-4 w-4 text-green-600" /> Hoạt động</>}
                                {status === 'INACTIVE' && <><ShieldX className="h-4 w-4 text-gray-600" /> Vô hiệu hoá</>}
                                {status === 'LOCKED' && <><Lock className="h-4 w-4 text-orange-600" /> Khoá tài khoản</>}
                                {!status && 'Chọn trạng thái'}
                              </span>
                              <ChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width]">
                            {status !== 'ACTIVE' && (
                              <DropdownMenuItem onClick={() => setStatus('ACTIVE')}>
                                <CheckCircle className="h-4 w-4 mr-2 text-green-600" /> Hoạt động
                              </DropdownMenuItem>
                            )}
                            {status !== 'INACTIVE' && (
                              <DropdownMenuItem onClick={() => setStatus('INACTIVE')}>
                                <ShieldX className="h-4 w-4 mr-2 text-gray-600" /> Vô hiệu hoá
                              </DropdownMenuItem>
                            )}
                            {status !== 'LOCKED' && (
                              <DropdownMenuItem onClick={() => setStatus('LOCKED')}>
                                <Lock className="h-4 w-4 mr-2 text-orange-600" /> Khoá tài khoản
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <div>
                          {getAccountStatusBadge(displayUser?.status || '')}
                        </div>
                      )}
                    </div>

                    {/* Họ và tên */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label>Họ</Label>
                        {isEditing ? (
                          <Input
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="Nhập họ"
                          />
                        ) : (
                          <Input
                            value={displayUser?.first_name || ''}
                            readOnly
                            disabled
                            className="pointer-events-none bg-muted/40"
                          />
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label>Tên</Label>
                        {isEditing ? (
                          <Input
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Nhập tên"
                          />
                        ) : (
                          <Input
                            value={displayUser?.last_name || ''}
                            readOnly
                            disabled
                            className="pointer-events-none bg-muted/40"
                          />
                        )}
                      </div>
                    </div>

                    {/* Hàng 1: Ngày sinh + Giới tính */}
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Ngày sinh */}
                      <div className="grid gap-2">
                        <Label>Ngày sinh</Label>
                        {isEditing ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !dob && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dob ? format(parse(dob, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy') : 'Chọn ngày sinh'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={dob ? parse(dob, 'yyyy-MM-dd', new Date()) : undefined}
                                onSelect={(date) => setDob(date ? format(date, 'yyyy-MM-dd') : '')}
                                locale={vi}
                                defaultMonth={dob ? parse(dob, 'yyyy-MM-dd', new Date()) : new Date(2000, 0)}
                                captionLayout="dropdown-buttons"
                                fromYear={1920}
                                toYear={new Date().getFullYear()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <Input
                            value={displayUser?.dob ? format(new Date(displayUser.dob), 'dd/MM/yyyy') : ''}
                            readOnly
                            disabled
                            className="pointer-events-none bg-muted/40"
                          />
                        )}
                      </div>

                      {/* Giới tính */}
                      <div className="grid gap-2">
                        <Label>Giới tính</Label>
                        {isEditing ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="w-full justify-between">
                                <span>
                                  {gender ? getGenderName(gender) : 'Chọn giới tính'}
                                </span>
                                <ChevronDown className="h-4 w-4 opacity-50" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width]">
                              {genders.map(g => (
                                <DropdownMenuItem key={g.code} onClick={() => setGender(g.code)}>
                                  {g.name}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Input
                            value={displayUser?.gender ? getGenderName(displayUser.gender) : ''}
                            readOnly
                            disabled
                            className="pointer-events-none bg-muted/40"
                          />
                        )}
                      </div>
                    </div>

                    {/* Hàng 2: Số điện thoại + Email */}
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Số điện thoại */}
                      <div className="grid gap-2">
                        <Label>Số điện thoại</Label>
                        {isEditing ? (
                          <Input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Nhập số điện thoại"
                          />
                        ) : (
                          <Input
                            value={displayUser?.phone ?? ''}
                            readOnly
                            disabled
                            className="pointer-events-none bg-muted/40"
                          />
                        )}
                      </div>

                      {/* Email - không cho sửa */}
                      <div className="grid gap-2">
                        <Label>Email</Label>
                        <Input
                          value={displayUser?.email ?? ''}
                          readOnly
                          disabled
                          className="pointer-events-none bg-muted/40"
                        />
                      </div>
                    </div>

                    {/* CV - chỉ hiển thị cho role user */}
                    {displayUser?.role === 'user' && (
                      <div className="grid gap-2">
                        <Label>CV / Hồ sơ xin việc</Label>
                        <div className="flex items-center gap-4">
                          {displayUser?.cv ? (
                            <div className="flex items-center gap-2 flex-1">
                              <FileText className="h-5 w-5 text-blue-600" />
                              <a 
                                href={displayUser.cv} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline truncate flex-1"
                              >
                                {displayUser.cv_filename || 'CV đã tải lên'}
                              </a>
                              {isSelf && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-700"
                                  onClick={handleDeleteCV}
                                >
                                  Xóa
                                </Button>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Chưa tải lên CV</span>
                          )}
                          {isSelf && (
                            <div>
                              <input
                                type="file"
                                id="cv-upload"
                                accept=".pdf,.doc,.docx"
                                onChange={handleCVUpload}
                                className="hidden"
                                disabled={uploadingCV || displayUser?.status === 'PENDING_VERIFICATION'}
                              />
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span tabIndex={displayUser?.status === 'PENDING_VERIFICATION' ? 0 : -1}>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => document.getElementById('cv-upload')?.click()}
                                        disabled={uploadingCV || displayUser?.status === 'PENDING_VERIFICATION'}
                                      >
                                        {uploadingCV ? (
                                          <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Đang tải...
                                          </>
                                        ) : (
                                          <>
                                            <FileText className="h-4 w-4 mr-2" />
                                            {displayUser?.cv ? 'Thay đổi CV' : 'Tải lên CV'}
                                          </>
                                        )}
                                      </Button>
                                    </span>
                                  </TooltipTrigger>
                                  {displayUser?.status === 'PENDING_VERIFICATION' && (
                                    <TooltipContent>
                                      <p>Tài khoản chưa được xác minh</p>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">Chấp nhận: PDF, DOC, DOCX (Tối đa 10MB)</p>
                      </div>
                    )}

                    {/* Nút chỉnh sửa / lưu */}
                    {isSelf && (
                      <div className="flex justify-end gap-2">
                        {isEditing ? (
                          <>
                            <Button type="button" variant="outline" onClick={handleCancel}>
                              Huỷ
                            </Button>
                            <Button type="submit" disabled={saving}>
                              <Save className="h-4 w-4 mr-2" />
                              {saving ? 'Đang lưu...' : 'Lưu thông tin'}
                            </Button>
                          </>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span tabIndex={displayUser?.status === 'PENDING_VERIFICATION' ? 0 : -1}>
                                  <Button 
                                    type="button" 
                                    onClick={() => setIsEditing(true)}
                                    disabled={displayUser?.status === 'PENDING_VERIFICATION'}
                                  >
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Chỉnh sửa thông tin
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              {displayUser?.status === 'PENDING_VERIFICATION' && (
                                <TooltipContent>
                                  <p>Tài khoản chưa được xác minh</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    )}

                  </form>

                </CardContent>
              </Card>
            </TabsContent>

            {user.role === 'user' && (
              <TabsContent value="applications">
                <div className="space-y-4">
                  {userApplications.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Bạn chưa ứng tuyển công việc nào</p>
                        <Button className="mt-4" onClick={() => navigate('/jobs')}>
                          Tìm việc ngay
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    userApplications.map((app) => (
                      <Card key={app.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <h3 className="font-semibold text-lg">
                                {getJobTitle(app.jobId)}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Ứng tuyển ngày {new Date(app.appliedDate).toLocaleDateString('vi-VN')}
                              </p>
                              {app.coverLetter && (
                                <p className="text-sm mt-2">{app.coverLetter}</p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {getStatusBadge(app.status)}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/jobs/${app.jobId}`)}
                              >
                                Xem tin
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
