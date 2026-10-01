import { SiteNavClient } from "@/components/site-nav-client";
import { getSiteSettings } from "@/lib/site-settings";
export async function SiteNav(){const {site,nav}=await getSiteSettings();return <SiteNavClient items={nav} brand={site.name||"radinkacraft"} logoUrl={site.logoUrl}/>;}
