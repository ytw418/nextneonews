import Link from "next/link";
import CoupangAd2 from "../CoupangAds/CoupangAd2";
import CoupangAd1 from "../CoupangAds/CoupangAd1";

const footerLinks = [
  {
    title: "서비스",
    links: [
      { name: "홈", href: "/" },
      { name: "인기순위", href: "/popular" },
      { name: "최신뉴스", href: "/latest-news" },
      { name: "K-POP", href: "/kpop" },
    ],
  },
  {
    title: "회사",
    links: [
      { name: "소개", href: "/about" },
      { name: "이용약관", href: "/terms" },
      { name: "개인정보처리방침", href: "/privacy" },
    ],
  },
  {
    title: "언어",
    links: [
      { name: "한국어", href: "/ko" },
      { name: "English", href: "/en" },
      { name: "日本語", href: "/ja" },
      { name: "中文", href: "/zh" },
    ],
  },
];

export const Footer = () => {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-20">
      <CoupangAd2 />
      <CoupangAd1 />
      <div className="container-custom py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h3 className="font-semibold mb-4">NeoNews</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              실시간으로 업데이트되는 K-POP 뉴스, 아이돌 소식, 한류 콘텐츠를
              가장 빠르게 전달하는 뉴스 플랫폼
            </p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            © {new Date().getFullYear()} NeoNews. All rights reserved.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의
            수수료를 제공받습니다.
          </p>
        </div>
      </div>
    </footer>
  );
};
