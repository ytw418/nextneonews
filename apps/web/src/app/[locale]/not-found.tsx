import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/Button";

export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <section className="px-gutter py-16 text-center">
      <h1 className="text-st2 font-bold text-ink-900">{t("title")}</h1>
      <Button href="/" size="m" variant="neutral" className="mt-6">
        {t("back")}
      </Button>
    </section>
  );
}
