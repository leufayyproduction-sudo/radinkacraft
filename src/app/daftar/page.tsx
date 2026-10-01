import { AuthForm } from "@/components/auth-form";
import { SiteHeader } from "@/components/site-header";
import { noindexMetadata } from "@/lib/noindex";
export const metadata=noindexMetadata;

export default function SignUpPage({ searchParams }: { searchParams: { error?: string; next?: string } }) {
  return <><SiteHeader /><AuthForm mode="signup" error={searchParams.error} next={searchParams.next} /></>;
}
