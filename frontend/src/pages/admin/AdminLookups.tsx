import { useState, useEffect } from 'react';
import { useAuth, authFetch, API_BASE } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Building2, Briefcase, Clock, DollarSign, Users, Shield, Activity, Loader2, Check, X, GripVertical, CheckCircle, ShieldX, Lock, AlertCircle, Ban, CircleHelp, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Types for lookup items
interface BaseLookup {
  code: string;
  name: string;
  is_active: boolean;
  order?: number;
}

interface LookupWithDescription extends BaseLookup {
  description?: string;
}

interface VerifiedCompany extends LookupWithDescription {
  website?: string;
}

interface Currency extends BaseLookup {
  symbol?: string;
}

interface StatusItem extends LookupWithDescription {
  icon?: string;
  color?: string;
}

type LookupItem = BaseLookup | LookupWithDescription | VerifiedCompany | Currency | StatusItem;

// Available icons for status
const AVAILABLE_ICONS = [
  { value: 'CheckCircle', label: 'Tích xanh' },
  { value: 'ShieldX', label: 'Vô hiệu hoá' },
  { value: 'Clock', label: 'Đồng hồ' },
  { value: 'Lock', label: 'Khoá' },
  { value: 'AlertCircle', label: 'Cảnh báo' },
  { value: 'Ban', label: 'Cấm' },
  { value: 'CircleHelp', label: 'Trợ giúp' },
];

// Available colors for status with hex preview color
const AVAILABLE_COLORS = [
  { value: 'bg-green-100 text-green-800', label: 'Xanh lá', preview: '#22c55e' },
  { value: 'bg-gray-100 text-gray-800', label: 'Xám', preview: '#6b7280' },
  { value: 'bg-yellow-100 text-yellow-800', label: 'Vàng', preview: '#eab308' },
  { value: 'bg-orange-100 text-orange-800', label: 'Cam', preview: '#f97316' },
  { value: 'bg-red-100 text-red-800', label: 'Đỏ nhạt', preview: '#f87171' },
  { value: 'bg-red-200 text-red-900', label: 'Đỏ đậm', preview: '#dc2626' },
  { value: 'bg-blue-100 text-blue-800', label: 'Xanh dương', preview: '#3b82f6' },
  { value: 'bg-purple-100 text-purple-800', label: 'Tím', preview: '#a855f7' },
];

// Helper to get preview color
const getColorPreview = (colorValue: string) => {
  const color = AVAILABLE_COLORS.find(c => c.value === colorValue);
  return color?.preview || '#9ca3af';
};

// Lookup category configuration
interface LookupCategory {
  key: string;
  label: string;
  icon: React.ReactNode;
  apiPath: string;
  fields: {
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'url' | 'select';
    required?: boolean;
    options?: { value: string; label: string }[];
  }[];
}

const LOOKUP_CATEGORIES: LookupCategory[] = [
  {
    key: 'verified-companies',
    label: 'Công ty xác minh',
    icon: <Building2 className="h-4 w-4" />,
    apiPath: '/api/jobfinder/verified-companies/',
    fields: [
      { name: 'code', label: 'Mã', type: 'text', required: true },
      { name: 'name', label: 'Tên công ty', type: 'text', required: true },
      { name: 'website', label: 'Website', type: 'url' },
      { name: 'description', label: 'Mô tả', type: 'textarea' },
    ],
  },
  {
    key: 'work-formats',
    label: 'Hình thức làm việc',
    icon: <Clock className="h-4 w-4" />,
    apiPath: '/api/jobfinder/work-formats/',
    fields: [
      { name: 'code', label: 'Mã', type: 'text', required: true },
      { name: 'name', label: 'Tên', type: 'text', required: true },
      { name: 'description', label: 'Mô tả', type: 'textarea' },
    ],
  },
  {
    key: 'job-types',
    label: 'Loại công việc',
    icon: <Briefcase className="h-4 w-4" />,
    apiPath: '/api/jobfinder/job-types/',
    fields: [
      { name: 'code', label: 'Mã', type: 'text', required: true },
      { name: 'name', label: 'Tên', type: 'text', required: true },
      { name: 'description', label: 'Mô tả', type: 'textarea' },
    ],
  },
  {
    key: 'currencies',
    label: 'Loại tiền tệ',
    icon: <DollarSign className="h-4 w-4" />,
    apiPath: '/api/jobfinder/currencies/',
    fields: [
      { name: 'code', label: 'Mã', type: 'text', required: true },
      { name: 'name', label: 'Tên', type: 'text', required: true },
      { name: 'symbol', label: 'Ký hiệu', type: 'text' },
    ],
  },
  {
    key: 'roles',
    label: 'Vai trò',
    icon: <Shield className="h-4 w-4" />,
    apiPath: '/api/users/roles/',
    fields: [
      { name: 'code', label: 'Mã', type: 'text', required: true },
      { name: 'name', label: 'Tên', type: 'text', required: true },
      { name: 'description', label: 'Mô tả', type: 'textarea' },
    ],
  },
  {
    key: 'genders',
    label: 'Giới tính',
    icon: <Users className="h-4 w-4" />,
    apiPath: '/api/users/genders/',
    fields: [
      { name: 'code', label: 'Mã', type: 'text', required: true },
      { name: 'name', label: 'Tên', type: 'text', required: true },
    ],
  },
  {
    key: 'statuses',
    label: 'Trạng thái tài khoản',
    icon: <Activity className="h-4 w-4" />,
    apiPath: '/api/users/statuses/',
    fields: [
      { name: 'code', label: 'Mã', type: 'text', required: true },
      { name: 'name', label: 'Tên', type: 'text', required: true },
      { name: 'icon', label: 'Icon', type: 'select', options: AVAILABLE_ICONS },
      { name: 'color', label: 'Màu sắc', type: 'select', options: AVAILABLE_COLORS },
      { name: 'description', label: 'Mô tả', type: 'textarea' },
    ],
  },
];

const AdminLookups = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState(LOOKUP_CATEGORIES[0].key);
  const [lookupData, setLookupData] = useState<Record<string, LookupItem[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LookupItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<LookupItem | null>(null);
  const [formData, setFormData] = useState<Record<string, string | boolean | number>>({});
  const [saving, setSaving] = useState(false);

  // Drag and drop states
  const [draggedItem, setDraggedItem] = useState<LookupItem | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const isAdmin = user && user.role?.toUpperCase() === 'ADMIN';

  // Icon map for rendering
  const ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
    'CheckCircle': CheckCircle,
    'ShieldX': ShieldX,
    'Clock': Clock,
    'Lock': Lock,
    'AlertCircle': AlertCircle,
    'Ban': Ban,
    'CircleHelp': CircleHelp,
  };

  // Render icon preview
  const renderIconPreview = (iconName: string) => {
    const IconComponent = ICON_COMPONENTS[iconName];
    if (!IconComponent) return null;
    return <IconComponent className="h-4 w-4" />;
  };

  // Fetch data for a category
  const fetchCategory = async (category: LookupCategory) => {
    setLoading(prev => ({ ...prev, [category.key]: true }));
    try {
      const res = await authFetch(`${API_BASE}${category.apiPath}`, {}, () => {
        logout();
        navigate('/auth/login');
      });
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.results || [];
        // Sort by order field
        items.sort((a: LookupItem, b: LookupItem) => (a.order ?? 0) - (b.order ?? 0));
        setLookupData(prev => ({ ...prev, [category.key]: items }));
      }
    } catch (e) {
      console.error(`Failed to fetch ${category.key}`, e);
    } finally {
      setLoading(prev => ({ ...prev, [category.key]: false }));
    }
  };

  // Fetch all categories on mount
  useEffect(() => {
    if (!user || !isAdmin) return;
    LOOKUP_CATEGORIES.forEach(cat => fetchCategory(cat));
  }, [user]);

  if (!user || !isAdmin) {
    navigate('/');
    return null;
  }

  const activeCategory = LOOKUP_CATEGORIES.find(c => c.key === activeTab)!;
  const activeData = lookupData[activeTab] || [];
  const isLoading = loading[activeTab];

  // Open dialog for add/edit
  const openDialog = (item?: LookupItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({ ...item });
    } else {
      setEditingItem(null);
      setFormData({ is_active: true });
    }
    setIsDialogOpen(true);
  };

  // Handle form field change
  const handleFieldChange = (name: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Save item (create or update)
  const handleSave = async () => {
    setSaving(true);
    try {
      const isEditing = !!editingItem;
      const url = isEditing
        ? `${API_BASE}${activeCategory.apiPath}${editingItem.code}/`
        : `${API_BASE}${activeCategory.apiPath}`;
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      }, () => {
        logout();
        navigate('/auth/login');
      });

      if (res.ok) {
        toast({
          title: isEditing ? 'Cập nhật thành công' : 'Thêm mới thành công',
          description: `Danh mục "${formData.name}" đã được ${isEditing ? 'cập nhật' : 'thêm'}.`,
        });
        setIsDialogOpen(false);
        fetchCategory(activeCategory);
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: errorData.detail || 'Có lỗi xảy ra khi lưu.',
        });
      }
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Có lỗi xảy ra khi lưu.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete item
  const handleDelete = async () => {
    if (!deletingItem) return;
    
    setSaving(true);
    try {
      const res = await authFetch(
        `${API_BASE}${activeCategory.apiPath}${deletingItem.code}/`,
        { method: 'DELETE' },
        () => {
          logout();
          navigate('/auth/login');
        }
      );

      if (res.ok || res.status === 204) {
        toast({
          title: 'Xoá thành công',
          description: `Danh mục "${deletingItem.name}" đã được xoá.`,
        });
        setIsDeleteDialogOpen(false);
        setDeletingItem(null);
        fetchCategory(activeCategory);
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: errorData.detail || 'Không thể xoá danh mục này. Có thể đang được sử dụng.',
        });
      }
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Có lỗi xảy ra khi xoá.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Open delete confirmation
  const openDeleteDialog = (item: LookupItem) => {
    setDeletingItem(item);
    setIsDeleteDialogOpen(true);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, item: LookupItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.code);
    // Add a slight delay to set the dragging class
    setTimeout(() => {
      (e.target as HTMLElement).classList.add('opacity-50');
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).classList.remove('opacity-50');
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    const items = [...(lookupData[activeTab] || [])];
    const draggedIndex = items.findIndex(item => item.code === draggedItem.code);
    
    if (draggedIndex === -1 || draggedIndex === targetIndex) {
      setDragOverIndex(null);
      return;
    }

    // Reorder items
    const [removed] = items.splice(draggedIndex, 1);
    items.splice(targetIndex, 0, removed);

    // Update order values
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index + 1
    }));

    // Update state immediately for smooth UX
    setLookupData(prev => ({
      ...prev,
      [activeTab]: updatedItems
    }));

    setDragOverIndex(null);

    // Save to backend
    try {
      const activeCategory = LOOKUP_CATEGORIES.find(c => c.key === activeTab);
      if (!activeCategory) return;

      const orderData = updatedItems.map((item, index) => ({
        code: item.code,
        order: index + 1
      }));

      const res = await authFetch(`${API_BASE}${activeCategory.apiPath}update-order/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: orderData }),
      }, () => {
        logout();
        navigate('/auth/login');
      });

      if (res.ok) {
        toast({
          title: 'Đã lưu thứ tự',
          description: 'Thứ tự đã được cập nhật thành công.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: 'Không thể lưu thứ tự. Vui lòng thử lại.',
        });
        // Revert on error
        fetchCategory(activeCategory);
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Có lỗi xảy ra khi lưu thứ tự.',
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Quản lý danh mục</h1>
            <p className="text-muted-foreground">Thêm, sửa, xoá các danh mục hệ thống</p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 flex flex-wrap h-auto gap-1">
              {LOOKUP_CATEGORIES.map(cat => (
                <TabsTrigger key={cat.key} value={cat.key} className="flex items-center gap-2">
                  {cat.icon}
                  <span className="hidden sm:inline">{cat.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {LOOKUP_CATEGORIES.map(cat => (
              <TabsContent key={cat.key} value={cat.key}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {cat.icon}
                      {cat.label}
                      <Badge variant="secondary" className="ml-2">
                        {(lookupData[cat.key] || []).length}
                      </Badge>
                    </CardTitle>
                    <Button onClick={() => openDialog()} size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Thêm mới
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {loading[cat.key] ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[50px]"></TableHead>
                              <TableHead className="w-[120px]">Mã</TableHead>
                              <TableHead>Tên</TableHead>
                              {cat.fields.some(f => f.name === 'description') && (
                                <TableHead className="hidden md:table-cell">Mô tả</TableHead>
                              )}
                              {cat.fields.some(f => f.name === 'website') && (
                                <TableHead className="hidden md:table-cell">Website</TableHead>
                              )}
                              {cat.fields.some(f => f.name === 'symbol') && (
                                <TableHead className="w-[80px]">Ký hiệu</TableHead>
                              )}
                              <TableHead className="w-[100px]">Trạng thái</TableHead>
                              <TableHead className="w-[100px] text-right">Thao tác</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(lookupData[cat.key] || []).length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                  Chưa có dữ liệu
                                </TableCell>
                              </TableRow>
                            ) : (
                              (lookupData[cat.key] || []).map((item, index) => (
                                <TableRow 
                                  key={item.code}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, item)}
                                  onDragEnd={handleDragEnd}
                                  onDragOver={(e) => handleDragOver(e, index)}
                                  onDragLeave={handleDragLeave}
                                  onDrop={(e) => handleDrop(e, index)}
                                  className={`transition-all ${
                                    dragOverIndex === index ? 'bg-primary/10 border-primary border-t-2' : ''
                                  } ${draggedItem?.code === item.code ? 'opacity-50' : ''}`}
                                >
                                  <TableCell className="cursor-grab active:cursor-grabbing">
                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                  </TableCell>
                                  <TableCell className="font-mono text-sm">{item.code}</TableCell>
                                  <TableCell className="font-medium">{item.name}</TableCell>
                                  {cat.fields.some(f => f.name === 'description') && (
                                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-[300px] truncate">
                                      {(item as LookupWithDescription).description || '-'}
                                    </TableCell>
                                  )}
                                  {cat.fields.some(f => f.name === 'website') && (
                                    <TableCell className="hidden md:table-cell">
                                      {(item as VerifiedCompany).website ? (
                                        <a
                                          href={(item as VerifiedCompany).website}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-primary hover:underline text-sm"
                                        >
                                          {(item as VerifiedCompany).website}
                                        </a>
                                      ) : '-'}
                                    </TableCell>
                                  )}
                                  {cat.fields.some(f => f.name === 'symbol') && (
                                    <TableCell className="font-mono">
                                      {(item as Currency).symbol || '-'}
                                    </TableCell>
                                  )}
                                  <TableCell>
                                    {item.is_active ? (
                                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
                                        <Check className="h-4 w-4 text-green-600" />
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100">
                                        <X className="h-4 w-4 text-gray-400" />
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openDialog(item)}
                                        title="Sửa"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openDeleteDialog(item)}
                                        title="Xoá"
                                        className="text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>
      <Footer />

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Chỉnh sửa' : 'Thêm mới'} {activeCategory.label.toLowerCase()}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? 'Cập nhật thông tin danh mục'
                : 'Điền thông tin để thêm danh mục mới'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {activeCategory.fields.map(field => (
              <div key={field.name} className="grid gap-2">
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {field.type === 'textarea' ? (
                  <Textarea
                    id={field.name}
                    value={(formData[field.name] as string) || ''}
                    onChange={e => handleFieldChange(field.name, e.target.value)}
                    placeholder={`Nhập ${field.label.toLowerCase()}`}
                    rows={3}
                  />
                ) : field.type === 'select' && field.options ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        <span className="flex items-center gap-2">
                          {field.name === 'icon' && formData[field.name] && renderIconPreview(formData[field.name] as string)}
                          {field.name === 'color' && formData[field.name] && (
                            <span 
                              className="inline-block w-4 h-4 rounded"
                              style={{ backgroundColor: getColorPreview(formData[field.name] as string) }}
                            ></span>
                          )}
                          {field.options.find(o => o.value === formData[field.name])?.label || `Chọn ${field.label.toLowerCase()}`}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width]">
                      {field.options.map(option => (
                        <DropdownMenuItem 
                          key={option.value} 
                          onClick={() => handleFieldChange(field.name, option.value)}
                        >
                          <span className="flex items-center gap-2">
                            {field.name === 'icon' && renderIconPreview(option.value)}
                            {field.name === 'color' && (
                              <span 
                                className="inline-block w-4 h-4 rounded"
                                style={{ backgroundColor: getColorPreview(option.value) }}
                              ></span>
                            )}
                            {option.label}
                          </span>
                          {formData[field.name] === option.value && <Check className="h-4 w-4 ml-auto" />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Input
                    id={field.name}
                    type={field.type === 'url' ? 'url' : 'text'}
                    value={(formData[field.name] as string) || ''}
                    onChange={e => handleFieldChange(field.name, e.target.value)}
                    placeholder={`Nhập ${field.label.toLowerCase()}`}
                    disabled={field.name === 'code' && !!editingItem}
                  />
                )}
              </div>
            ))}
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Trạng thái hoạt động</Label>
              <Switch
                id="is_active"
                checked={formData.is_active as boolean}
                onCheckedChange={checked => handleFieldChange('is_active', checked)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
              Huỷ
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingItem ? 'Cập nhật' : 'Thêm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Xác nhận xoá</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xoá danh mục "{deletingItem?.name}"?
              <br />
              <span className="text-destructive font-medium">
                Hành động này không thể hoàn tác. Nếu danh mục đang được sử dụng, việc xoá có thể thất bại.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={saving}>
              Huỷ
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Xoá
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLookups;
