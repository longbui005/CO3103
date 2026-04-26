import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";

export default function Policy() {
    return (
        <div className="flex min-h-screen flex-col">
            <Navbar />

            <main className="flex-1">
                {/* Hero */}
                <section className="bg-gradient-hero pt-28 md:pt-32 pb-16 text-white">
                    <div className="container mx-auto px-4 text-center">
                        <h1 className="mb-4 text-4xl font-bold">Điều khoản sử dụng</h1>
                        <p className="mx-auto max-w-2xl text-lg opacity-90">
                            Vui lòng đọc kỹ trước khi sử dụng dịch vụ của JobFinder
                        </p>
                    </div>
                </section>

                {/* Nội dung */}
                <section className="py-16">
                    <div className="container mx-auto max-w-3xl px-4">
                        <Card>
                            <CardContent className="space-y-8 p-6 md:p-8">
                                {/* Cập nhật */}
                                <p className="text-sm text-muted-foreground">
                                    Cập nhật lần cuối: 11/2025
                                </p>

                                {/* 1. Giới thiệu */}
                                <section className="space-y-3">
                                    <h2 className="text-xl font-semibold">1. Giới thiệu</h2>
                                    <p>
                                        Các Điều khoản sử dụng này (“Điều khoản”) điều chỉnh việc bạn sử
                                        dụng website và các dịch vụ liên quan của <strong>JobFinder</strong>.
                                        Khi truy cập hoặc sử dụng, bạn đồng ý ràng buộc bởi Điều khoản này.
                                    </p>
                                </section>

                                {/* 2. Chấp nhận điều khoản */}
                                <section className="space-y-3">
                                    <h2 className="text-xl font-semibold">2. Chấp nhận điều khoản</h2>
                                    <p>
                                        Bằng việc tạo tài khoản hoặc tiếp tục sử dụng dịch vụ, bạn xác nhận
                                        đã đọc, hiểu và đồng ý tuân thủ Điều khoản cũng như các chính sách
                                        liên quan (ví dụ: Chính sách quyền riêng tư).
                                    </p>
                                </section>

                                {/* 3. Tài khoản & bảo mật */}
                                <section className="space-y-3">
                                    <h2 className="text-xl font-semibold">3. Tài khoản &amp; bảo mật</h2>
                                    <ul className="list-disc space-y-2 pl-6">
                                        <li>Bạn phải cung cấp thông tin chính xác, đầy đủ và cập nhật.</li>
                                        <li>Giữ bí mật thông tin đăng nhập và chịu trách nhiệm cho mọi hoạt động trên tài khoản.</li>
                                        <li>Thông báo ngay cho JobFinder nếu phát hiện truy cập trái phép.</li>
                                    </ul>
                                </section>

                                {/* 4. Quyền & trách nhiệm người dùng */}
                                <section className="space-y-3">
                                    <h2 className="text-xl font-semibold">
                                        4. Quyền và trách nhiệm của người dùng
                                    </h2>
                                    <ul className="list-disc space-y-2 pl-6">
                                        <li>Tự chịu trách nhiệm về nội dung hồ sơ, tin tuyển dụng, bình luận.</li>
                                        <li>Tuân thủ pháp luật, tôn trọng quyền của bên thứ ba và cộng đồng.</li>
                                        <li>Không mạo danh, không đăng tải thông tin sai lệch hoặc gây hiểu nhầm.</li>
                                    </ul>
                                </section>

                                {/* 5. Quyền của JobFinder */}
                                <section className="space-y-3">
                                    <h2 className="text-xl font-semibold">5. Quyền của JobFinder</h2>
                                    <ul className="list-disc space-y-2 pl-6">
                                        <li>Từ chối, gỡ bỏ nội dung vi phạm hoặc không phù hợp.</li>
                                        <li>Tạm ngưng/khóa tài khoản khi phát hiện hành vi vi phạm Điều khoản.</li>
                                        <li>Thay đổi, nâng cấp hoặc ngừng cung cấp một phần/tính năng của dịch vụ.</li>
                                    </ul>
                                </section>

                                {/* 6. Nội dung & sở hữu trí tuệ */}
                                <section className="space-y-3">
                                    <h2 className="text-xl font-semibold">6. Nội dung &amp; sở hữu trí tuệ</h2>
                                    <ul className="list-disc space-y-2 pl-6">
                                        <li>
                                            Bạn giữ quyền sở hữu nội dung mình đăng; bằng việc đăng tải, bạn cấp cho
                                            JobFinder quyền sử dụng phi độc quyền nhằm vận hành và cải thiện dịch vụ.
                                        </li>
                                        <li>
                                            Thương hiệu, giao diện, mã nguồn và tài sản trí tuệ của JobFinder thuộc quyền
                                            sở hữu của JobFinder và/hoặc các bên cấp phép.
                                        </li>
                                    </ul>
                                </section>

                                {/* 7. Hành vi bị cấm */}
                                <section className="space-y-3">
                                    <h2 className="text-xl font-semibold">7. Hành vi bị cấm</h2>
                                    <ul className="list-disc space-y-2 pl-6">
                                        <li>Phát tán mã độc, spam, thu thập dữ liệu trái phép.</li>
                                        <li>Đăng tải nội dung vi phạm pháp luật, xúc phạm, phân biệt đối xử.</li>
                                        <li>Can thiệp trái phép vào hệ thống hoặc làm gián đoạn dịch vụ.</li>
                                    </ul>
                                </section>

                                {/* 8. Quyền riêng tư */}
                                <section className="space-y-3">
                                    <h2 className="text-xl font-semibold">8. Quyền riêng tư</h2>
                                    <p>
                                        Việc thu thập và xử lý dữ liệu cá nhân tuân thủ theo Chính sách quyền
                                        riêng tư của JobFinder. Bằng việc sử dụng dịch vụ, bạn đồng ý với các
                                        nội dung tại chính sách này.
                                    </p>
                                </section>

                                {/* 9. Miễn trừ & giới hạn trách nhiệm */}
                                <section className="space-y-3">
                                    <h2 className="text-xl font-semibold">9. Miễn trừ &amp; giới hạn trách nhiệm</h2>
                                    <ul className="list-disc space-y-2 pl-6">
                                        <li>
                                            Dịch vụ được cung cấp “như hiện có”. JobFinder không bảo đảm tuyệt đối
                                            về độ chính xác của mọi nội dung do người dùng đăng tải.
                                        </li>
                                        <li>
                                            Trong mọi trường hợp, trách nhiệm của JobFinder (nếu có) sẽ được giới hạn
                                            theo mức tối đa cho phép bởi pháp luật hiện hành.
                                        </li>
                                    </ul>
                                </section>

                                {/* 10. Thay đổi điều khoản */}
                                <section className="space-y-3">
                                    <h2 className="text-xl font-semibold">10. Thay đổi điều khoản</h2>
                                    <p>
                                        JobFinder có thể cập nhật Điều khoản theo thời gian. Phiên bản mới sẽ có hiệu lực
                                        ngay khi được đăng tải. Việc bạn tiếp tục sử dụng dịch vụ đồng nghĩa chấp nhận các
                                        thay đổi đó.
                                    </p>
                                </section>

                                {/* 11. Liên hệ */}
                                <section className="space-y-3">
                                    <h2 className="text-xl font-semibold">11. Liên hệ</h2>
                                    <p>
                                        Mọi thắc mắc liên quan đến Điều khoản, vui lòng liên hệ trang{" "}
                                        <a href="/contact" className="text-primary underline underline-offset-4">
                                            Liên hệ
                                        </a>{" "}
                                        của JobFinder.
                                    </p>
                                </section>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
