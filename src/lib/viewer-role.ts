import { getSessionHandle } from "@/lib/data/local-store";

export type ViewerRole = "loggedOut" | "member" | "owner";

/** Resolve whether the current local session owns a profile/garage handle. */
export function viewerRoleForHandle(handle: string, sessionHandle?: string | null): ViewerRole {
  const me = sessionHandle ?? getSessionHandle();
  if (!me) return "loggedOut";
  if (me === handle) return "owner";
  return "member";
}

export function isOwnerView(handle: string, sessionHandle?: string | null) {
  return viewerRoleForHandle(handle, sessionHandle) === "owner";
}
