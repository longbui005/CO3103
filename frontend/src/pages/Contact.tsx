import { useState } from "react";
import { Mail, Copy, Check, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

type Contact = { name: string; email: string };

const CONTACTS: Contact[] = [
    { name: "Trương Minh Khuê", email: "khue.truongminh@hcmut.edu.vn" },
    { name: "Đinh Trần Anh Khoa", email: "khoa.dinhkaris222@hcmut.edu.vn" },
    { name: "Từ Bá Lộc", email: "loc.tutuloc2706@hcmut.edu.vn" },
    { name: "Nguyễn Anh Tài", email: "tai.nguyenanhtainat@hcmut.edu.vn" },
    { name: "Nguyễn Tăng Trung", email: "trung.nguyentrung0601@hcmut.edu.vn" },
];

export default function Contact() {
    const [copied, setCopied] = useState<string | null>(null);

    const copyEmail = async (email: string) => {
        try {
            await navigator.clipboard.writeText(email);
            setCopied(email);
            setTimeout(() => setCopied(null), 1500);
        } catch {
            // no-op
        }
    };

    return (
        <div className="flex min-h-screen flex-col">
            {/* Navbar giống About */}
            <Navbar />

            <main className="flex-1">
                {/* Hero giống About */}
                <section className="bg-gradient-hero pt-28 md:pt-32 pb-16 text-white">
                    <div className="container mx-auto px-4 text-center">
                        <h1 className="mb-4 text-4xl font-bold">Liên hệ</h1>
                        <p className="mx-auto max-w-2xl text-lg opacity-90">
                            Danh sách email thành viên nhóm JobFinder
                        </p>
                    </div>
                </section>

                {/* Nội dung */}
                <section className="py-16">
                    <div className="container mx-auto max-w-3xl px-4">
                        <Card className="border-muted">
                            <CardContent className="p-0">
                                {CONTACTS.map((c, idx) => (
                                    <div key={c.email}>
                                        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <div className="text-base font-medium">{c.name}</div>
                                                <a
                                                    href={`mailto:${c.email}`}
                                                    className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                                                >
                                                    <Mail className="h-4 w-4" />
                                                    <span className="break-all">{c.email}</span>
                                                </a>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <a href={`mailto:${c.email}`}>
                                                    <Button variant="outline" className="px-3">
                                                        Gửi mail
                                                    </Button>
                                                </a>
                                                <Button
                                                    variant="ghost"
                                                    className="px-3"
                                                    onClick={() => copyEmail(c.email)}
                                                >
                                                    {copied === c.email ? (
                                                        <>
                                                            <Check className="mr-2 h-4 w-4" /> Đã copy
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="mr-2 h-4 w-4" /> Copy
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>

                                        {idx < CONTACTS.length - 1 && <Separator />}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </section>
            </main>

            {/* Footer giống About */}
            <Footer />
        </div>
    );
}
