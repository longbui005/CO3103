import { useAuth, API_BASE, getAccessToken } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserRound, CheckCircle, Clock, Ban, MoreVertical, ShieldX, Lock, AlertCircle, Eye, CircleHelp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from "react";

interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  status?: string;
  is_active: boolean;
  date_joined?: string;
}

interface StatusLookup {
  code: string;
  name: string;
  icon?: string;
  color?: string;
  is_active?: boolean;
  order?: number;
}

// Map icon name to component
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'CheckCircle': CheckCircle,
  'ShieldX': ShieldX,
  'Clock': Clock,
  'Lock': Lock,
  'AlertCircle': AlertCircle,
  'Ban': Ban,
};

// Default fallback colors
const DEFAULT_BADGE_COLOR = 'bg-gray-100 text-gray-600';

// Map badge color to icon color
const BADGE_TO_ICON_COLOR: Record<string, string> = {
  'text-green-800': 'text-green-600',
  'text-gray-800': 'text-gray-600',
  'text-yellow-800': 'text-yellow-600',
  'text-orange-800': 'text-orange-600',
  'text-red-800': 'text-red-500',
  'text-red-900': 'text-red-700',
  'text-blue-800': 'text-blue-600',
  'text-purple-800': 'text-purple-600',
};

const AdminUsers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Lấy tab từ URL, mặc định là 'pending'
  const currentTab = searchParams.get('tab') || 'pending';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [statuses, setStatuses] = useState<StatusLookup[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper: lấy tên status từ code
  const getStatusName = (code: string) => {
    const s = statuses.find(s => s.code === code);
    return s?.name || code;
  };

  const fetchUsers = async () => {
    try {
      const token = await getAccessToken();
      const res = await fetch(`${API_BASE}/api/users/users/`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setAllUsers(Array.isArray(data) ? data : (data.results || []));
      } else {
        console.error('Failed to fetch users:', res.status);
      }
    } catch (e) {
      console.error('Failed to fetch users', e);
    }
  };

  const fetchStatuses = async () => {
    try {
      const token = await getAccessToken();
      const res = await fetch(`${API_BASE}/api/users/statuses/`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setStatuses(data.filter((s: StatusLookup) => s.is_active !== false));
      }
    } catch (e) {
      console.error('Failed to fetch statuses', e);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchUsers(), fetchStatuses()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const adminAccounts = allUsers.filter(u => u.role?.toUpperCase() === 'ADMIN');
  const pendingVerification = allUsers.filter(u => u.status?.toUpperCase() === 'PENDING_VERIFICATION');
  const activeAccounts = allUsers.filter(u => u.status?.toUpperCase() === 'ACTIVE' && u.role?.toUpperCase() !== 'ADMIN');
  const otherAccounts = allUsers.filter(u => 
    u.role?.toUpperCase() !== 'ADMIN' && 
    u.status?.toUpperCase() !== 'PENDING_VERIFICATION' &&
    u.status?.toUpperCase() !== 'ACTIVE'
  );

  // Helper: get icon component from status
  const getStatusIcon = (statusCode: string, size: 'sm' | 'md' = 'sm') => {
    const status = statuses.find(s => s.code === statusCode);
    const iconName = status?.icon || '';
    const IconComponent = ICON_MAP[iconName] || CircleHelp;
    const sizeClass = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
    return <IconComponent className={sizeClass} />;
  };

  // Helper: get color from status
  const getStatusColor = (statusCode: string) => {
    const status = statuses.find(s => s.code === statusCode);
    return status?.color || DEFAULT_BADGE_COLOR;
  };

  // Helper: get icon color from status (for dropdown actions)
  const getIconColor = (statusCode: string) => {
    const status = statuses.find(s => s.code === statusCode);
    if (!status?.color) return 'text-gray-600';
    // Extract text color from badge color class
    const textColorMatch = status.color.match(/text-\w+-\d+/);
    if (textColorMatch) {
      return BADGE_TO_ICON_COLOR[textColorMatch[0]] || textColorMatch[0];
    }
    return 'text-gray-600';
  };

  // Render dropdown items with rules:
  // 1. Hide current status
  // 2. Hide PENDING_VERIFICATION if user is already verified (not pending)
  // 3. ACTIVE always on top
  const renderStatusActions = (currentStatus: string | undefined, userId: number) => {
    const currentCode = currentStatus?.toUpperCase() || '';
    const isAlreadyVerified = currentCode !== 'PENDING_VERIFICATION';
    
    // Filter statuses
    let availableStatuses = statuses.filter(s => {
      // Hide current status
      if (s.code === currentCode) return false;
      // Hide PENDING_VERIFICATION if already verified
      if (s.code === 'PENDING_VERIFICATION' && isAlreadyVerified) return false;
      return true;
    });

    // Sort: ACTIVE first, then by order
    availableStatuses = availableStatuses.sort((a, b) => {
      if (a.code === 'ACTIVE') return -1;
      if (b.code === 'ACTIVE') return 1;
      return (a.order ?? 0) - (b.order ?? 0);
    });

    return availableStatuses.map(s => {
      const IconComponent = ICON_MAP[s.icon || ''] || CircleHelp;
      const iconColor = getIconColor(s.code);
      return (
        <DropdownMenuItem key={s.code} onClick={() => handleSetStatus(userId, s.code)}>
          <IconComponent className={`h-4 w-4 mr-2 ${iconColor}`} />
          {s.name}
        </DropdownMenuItem>
      );
    });
  };

  const getUserName = (u: User) => {
    const name = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
    return name || u.username || u.email;
  };

  const getStatusBadge = (status?: string) => {
    const code = status?.toUpperCase() || '';
    const colorClass = getStatusColor(code);
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {getStatusIcon(code, 'sm')}
        {getStatusName(code)}
      </span>
    );
  };

  const handleSetStatus = async (userId: number, statusCode: string) => {
    try {
      const token = await getAccessToken();
      const res = await fetch(`${API_BASE}/api/users/users/${userId}/set-status/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: statusCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast({ title: 'Thành công', description: data.detail || 'Đã cập nhật trạng thái' });
        fetchUsers();
      } else {
        toast({ title: 'Lỗi', description: data.detail || 'Không thể cập nhật', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Lỗi', description: 'Không thể cập nhật', variant: 'destructive' });
    }
  };

  const handleApproveAllUsers = async () => {
    if (pendingVerification.length === 0) return;
    try {
      const token = await getAccessToken();
      let successCount = 0;
      for (const u of pendingVerification) {
        const res = await fetch(`${API_BASE}/api/users/users/${u.id}/set-status/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ status: 'ACTIVE' }),
        });
        if (res.ok) successCount++;
      }
      toast({ title: "Đã duyệt toàn bộ", description: `Đã duyệt ${successCount}/${pendingVerification.length} người dùng` });
      fetchUsers();
    } catch (e) {
      toast({ title: "Lỗi", description: "Không thể duyệt toàn bộ người dùng", variant: "destructive" });
    }
  };

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
          <h1 className="text-3xl font-bold mb-8">Quản lý tài khoản</h1>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-muted-foreground">Tổng tài khoản</div>
                <div className="text-2xl font-bold">{allUsers.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-muted-foreground">Chờ xác minh</div>
                <div className="text-2xl font-bold text-yellow-600">{pendingVerification.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-muted-foreground">Đang hoạt động</div>
                <div className="text-2xl font-bold text-green-600">{activeAccounts.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-muted-foreground">Quản trị viên</div>
                <div className="text-2xl font-bold text-blue-600">{adminAccounts.length}</div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="pending">Chờ xác minh ({pendingVerification.length})</TabsTrigger>
                <TabsTrigger value="active">Hoạt động ({activeAccounts.length})</TabsTrigger>
                <TabsTrigger value="other">Khác ({otherAccounts.length})</TabsTrigger>
                <TabsTrigger value="admin">Admin ({adminAccounts.length})</TabsTrigger>
              </TabsList>
              {currentTab === 'pending' && pendingVerification.length > 0 && (
                <Button
                  onClick={handleApproveAllUsers}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Duyệt toàn bộ ({pendingVerification.length})
                </Button>
              )}
            </div>

            {/* Pending Verification */}
            <TabsContent value="pending" className="space-y-4">
              {pendingVerification.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Không có tài khoản nào chờ xác minh</div>
              ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {pendingVerification.map((u) => (
                    <Card key={u.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-yellow-50 flex items-center justify-center">
                              <Clock className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div>
                              <div className="font-semibold">{getUserName(u)}</div>
                              <div className="text-sm text-muted-foreground">{u.email}</div>
                              <div className="mt-1">{getStatusBadge(u.status)}</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => navigate(`/profile?id=${u.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleSetStatus(u.id, 'ACTIVE')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Xác minh
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {renderStatusActions(u.status, u.id)}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    ))}
                  </div>
              )}
            </TabsContent>

            {/* Active Accounts */}
            <TabsContent value="active" className="space-y-4">
              {activeAccounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Không có tài khoản hoạt động</div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {activeAccounts.map((u) => (
                    <Card key={u.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <div className="font-semibold">{getUserName(u)}</div>
                              <div className="text-sm text-muted-foreground">{u.email}</div>
                              <div className="mt-1">{getStatusBadge(u.status)}</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => navigate(`/profile?id=${u.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {renderStatusActions(u.status, u.id)}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Other status accounts */}
            <TabsContent value="other" className="space-y-4">
              {otherAccounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Không có tài khoản nào</div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {otherAccounts.map((u) => (
                    <Card key={u.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                              <UserRound className="h-5 w-5 text-gray-500" />
                            </div>
                            <div>
                              <div className="font-semibold">{getUserName(u)}</div>
                              <div className="text-sm text-muted-foreground">{u.email}</div>
                              <div className="mt-1">{getStatusBadge(u.status)}</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => navigate(`/profile?id=${u.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {renderStatusActions(u.status, u.id)}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Admin accounts */}
            <TabsContent value="admin" className="space-y-4">
              {adminAccounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Chưa có quản trị viên</div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {adminAccounts.map((u) => (
                    <Card key={u.id}>
                      <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
                          <UserRound className="h-6 w-6 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">{getUserName(u)}</div>
                          <div className="text-sm text-muted-foreground">{u.email}</div>
                          <div className="mt-2 flex gap-2">
                            <Badge variant="default">Admin</Badge>
                            {getStatusBadge(u.status)}
                          </div>
                        </div>
                        <Button variant="outline" size="icon" onClick={() => navigate(`/profile?id=${u.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
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

export default AdminUsers;
