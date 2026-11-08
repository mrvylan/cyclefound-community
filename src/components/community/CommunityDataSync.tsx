"use client";

import { useEffect } from "react";
import { hydrateCommunityDirectory } from "@/lib/community/directory-cache";

/** Load Supabase members + marketplace listings into the client directory cache. */
export function CommunityDataSync() {
  useEffect(() => {
    void hydrateCommunityDirectory();
  }, []);
  return null;
}
