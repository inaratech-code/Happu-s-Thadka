import type { Metadata } from "next";
import { COMPANY_NAME, PRODUCT_NAME, PRODUCT_TAGLINE } from "@/lib/product-brand";

export const metadata: Metadata = {
  title: `Sign in — ${PRODUCT_NAME}`,
  description: `${PRODUCT_NAME} — ${PRODUCT_TAGLINE} by ${COMPANY_NAME}`,
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
