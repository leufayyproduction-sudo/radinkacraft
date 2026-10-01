import { AuthForm } from "@/components/auth-form";
import { SiteHeader } from "@/components/site-header";
import { noindexMetadata } from "@/lib/noindex";
export const metadata=noindexMetadata;

export default function SignInPage({ searchParams }: { searchParams: { error?: string; message?: string; next?: string } }) {
  return <><SiteHeader /><AuthForm mode="signin" error={searchParams.error} message={searchParams.message} next={searchParams.next} /></>;
}
