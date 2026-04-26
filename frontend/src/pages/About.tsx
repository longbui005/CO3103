import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Briefcase, Users, Target, Award } from 'lucide-react';

const About = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="bg-gradient-hero pt-28 md:pt-32 pb-16 text-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">Về JobFinder</h1>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Nền tảng tìm kiếm việc làm và tuyển dụng hàng đầu tại Việt Nam
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="grid gap-8 md:grid-cols-2 mb-16">
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Target className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Sứ mệnh</h3>
                  <p className="text-muted-foreground">
                    Kết nối người tìm việc với cơ hội nghề nghiệp lý tưởng và giúp doanh nghiệp tìm kiếm nhân tài phù hợp
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-8 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Award className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Tầm nhìn</h3>
                  <p className="text-muted-foreground">
                    Trở thành nền tảng tuyển dụng số 1 Việt Nam, tạo ra giá trị bền vững cho cộng đồng
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="prose max-w-none">
              <h2 className="text-2xl font-bold mb-4">Về chúng tôi</h2>
              <p className="text-muted-foreground mb-4">
                JobFinder là nền tảng tuyển dụng trực tuyến hàng đầu tại Việt Nam, kết nối hàng ngàn ứng viên với các cơ hội việc làm từ các doanh nghiệp uy tín.
              </p>
              <p className="text-muted-foreground mb-4">
                Với công nghệ hiện đại và giao diện thân thiện, chúng tôi cam kết mang đến trải nghiệm tốt nhất cho cả người tìm việc và nhà tuyển dụng.
              </p>

              <h2 className="text-2xl font-bold mb-4 mt-8">Giá trị cốt lõi</h2>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <Briefcase className="h-12 w-12 mx-auto text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Chuyên nghiệp</h3>
                  <p className="text-sm text-muted-foreground">
                    Đảm bảo chất lượng dịch vụ cao nhất
                  </p>
                </div>
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Tận tâm</h3>
                  <p className="text-sm text-muted-foreground">
                    Luôn lắng nghe và hỗ trợ người dùng
                  </p>
                </div>
                <div className="text-center">
                  <Award className="h-12 w-12 mx-auto text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Uy tín</h3>
                  <p className="text-sm text-muted-foreground">
                    Xây dựng niềm tin qua từng dịch vụ
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
