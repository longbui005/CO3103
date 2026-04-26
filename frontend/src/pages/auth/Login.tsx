import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Briefcase, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(username, password);

    if (result.success) {
      toast({
        title: "Đăng nhập thành công!",
        description: "Chào mừng bạn quay trở lại",
      });
      navigate('/');
    } else {
      toast({
        title: "Đăng nhập thất bại",
        description: result.error || "Email hoặc mật khẩu không chính xác",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Link
              to="/"
              aria-label="Về trang chủ JobFinder"
              className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-hero
               shadow-md hover:shadow-lg focus-visible:outline-none
               focus-visible:ring-2 focus-visible:ring-blue-600/40 focus-visible:ring-offset-2"
            >
              <Briefcase className="h-7 w-7 text-white" aria-hidden="true" />
            </Link>
          </div>
          <CardTitle className="text-2xl">Đăng nhập</CardTitle>
          <CardDescription>
            Chào mừng bạn trở lại với JobFinder
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Tên đăng nhập</Label>
              <Input
                id="username"
                type="text"
                placeholder="Tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute inset-y-0 right-2 flex items-center text-slate-500 hover:text-slate-700"
                  aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </form>

          {/*
          <div className="mt-6 space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              Tài khoản demo:
            </div>
            <div className="space-y-2 text-xs bg-muted p-3 rounded">
              <div><strong>Ứng viên:</strong> jobseeker@demo.com / demo123</div>
              <div><strong>Nhà tuyển dụng:</strong> employer@demo.com / demo123</div>
              <div><strong>Admin:</strong> admin@demo.com / admin123</div>
            </div>
          </div>
*/}
          <div className="mt-6 text-center text-sm">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Đăng ký ngay
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
