import { MarketingFooter } from "@/components/marketing/layout/footer";
import { MarketingHeader } from "@/components/marketing/layout/header";

export function MarketingLayout({
  children,
  isSignedIn,
}: {
  children: React.ReactNode;
  isSignedIn: boolean;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <MarketingHeader isSignedIn={isSignedIn} />
      {children}
      <MarketingFooter />
    </div>
  );
}
