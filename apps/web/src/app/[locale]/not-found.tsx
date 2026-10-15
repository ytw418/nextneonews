import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <section className="py-16 text-center">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <Link href="/" className="mt-4 inline-block underline">
        {t("back")}
      </Link>
    </section>
  );
}
