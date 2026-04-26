import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Briefcase, Facebook, Linkedin, Twitter } from 'lucide-react';

/** Thay các URL dưới đây bằng link mạng xã hội của bạn */
const SOCIAL_LINKS = {
  facebook: 'https://www.facebook.com/VietnamWorksFanpage',
  linkedin: 'https://uk.linkedin.com/in/job-finder-179111153?trk=people-guest_people_search-card',
  twitter: 'https://x.com/jobsminusf?t=HY99XXZ3UXds6-ofzwxLrQ&s=09'
};

const Footer = () => {
  const { user } = useAuth();
  
  const isAdmin = () => {
    if (!user) return false;
    const role = (user.role || '').toString().toLowerCase();
    return role === 'admin';
  };

  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            {/* Bọc logo và chữ JobFinder bằng Link để về trang chủ */}
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-hero">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-primary">JobFinder</span>
            </Link>

            <p className="text-sm text-muted-foreground">
              Nền tảng tìm kiếm việc làm hàng đầu Việt Nam
            </p>

            {/* Khu vực mạng xã hội: thay SOCIAL_LINKS ở trên */}
            <div className="flex space-x-4">
              <a
                href={SOCIAL_LINKS.facebook || '#'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                title="Facebook"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href={SOCIAL_LINKS.linkedin || '#'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                title="LinkedIn"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href={SOCIAL_LINKS.twitter || '#'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                title="Twitter"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Dành cho ứng viên</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/jobs" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Tìm việc làm
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Quản lý hồ sơ
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Đăng ký tài khoản
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Dành cho nhà tuyển dụng</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/employer/post-job" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Đăng tin tuyển dụng
                </Link>
              </li>
              <li>
                <Link to="/employer/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Quản lý tin đăng
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Đăng ký tài khoản
                </Link>
              </li>
            </ul>
          </div>

          {/* Hiển thị cột Admin nếu là admin */}
          {isAdmin() ? (
            <div>
              <h3 className="font-semibold mb-4">Quản trị</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/admin/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Bảng điều khiển
                  </Link>
                </li>
                <li>
                  <Link to="/admin/jobs" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Quản lý tin đăng
                  </Link>
                </li>
                <li>
                  <Link to="/admin/users" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Quản lý tài khoản
                  </Link>
                </li>
                <li>
                  <Link to="/admin/lookups" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Quản lý danh mục
                  </Link>
                </li>
              </ul>
            </div>
          ) : (
            <div>
              <h3 className="font-semibold mb-4">Hỗ trợ</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Về JobFinder
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Liên hệ
                  </Link>
                </li>
                <li>
                  <Link to="/policy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Điều khoản sử dụng
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} JobFinder. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
