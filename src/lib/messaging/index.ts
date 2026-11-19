import { hasSupabaseConfig } from "@/lib/supabase/config";
import { garageMessagingService, type GarageActor } from "./garageMessagingService";
import { listingMessagingService } from "./listingMessagingService";
import {
  memberMessagingAvailable,
  memberMessagingService,
} from "./memberMessagingService";
import type { ThreadDetail, ThreadListItem } from "./types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isListingUuid(value: string | null | undefined) {
  return Boolean(value && UUID_RE.test(value));
}

function messagingUnavailable(error: unknown) {
  return String((error as Error)?.message || "")
    .toLowerCase()
    .includes("isn’t enabled");
}

function memberRemoteUnavailable(error: unknown) {
  const msg = String((error as Error)?.message || "").toLowerCase();
  return (
    msg.includes("not configured") ||
    msg.includes("relation") ||
    msg.includes("does not exist") ||
    msg.includes("could not")
  );
}

export type StartGarageMessageInput = {
  actor: GarageActor;
  message: string;
  itemId: string;
  itemTitle: string;
  itemHref: string;
  priceLabel?: string;
  ownerHandle: string;
  ownerName: string;
  /** When set to a bike_listings UUID, uses Cycle Found listing messaging RPCs. */
  listingId?: string | null;
};

export const messagingService = {
  async startGarageThread(input: StartGarageMessageInput) {
    if (isListingUuid(input.listingId) && hasSupabaseConfig()) {
      try {
        return await listingMessagingService.startThread({
          listingId: input.listingId!,
          message: input.message,
        });
      } catch (error) {
        if (!messagingUnavailable(error)) throw error;
        // Fall through to garage store when listing RPCs are not available.
      }
    }
    return garageMessagingService.startThread({
      actor: input.actor,
      message: input.message,
      itemId: input.itemId,
      itemTitle: input.itemTitle,
      itemHref: input.itemHref,
      priceLabel: input.priceLabel,
      ownerHandle: input.ownerHandle,
      ownerName: input.ownerName,
      kind: "garage",
    });
  },

  async startMemberThread({
    actor,
    message,
    handle,
    name,
  }: {
    actor: GarageActor;
    message: string;
    handle: string;
    name: string;
  }) {
    if (memberMessagingAvailable()) {
      try {
        return await memberMessagingService.startThread({
          actor,
          message,
          handle,
          name,
        });
      } catch (error) {
        // Fall back to local until migrations / service role are ready.
        if (!memberRemoteUnavailable(error) && actor.id.length > 20) {
          // Auth users talking to real members — surface the remote error.
          const msg = String((error as Error)?.message || "");
          if (
            msg.includes("Sign in") ||
            msg.includes("Verify") ||
            msg.includes("not found") ||
            msg.includes("yourself") ||
            msg.includes("at least") ||
            msg.includes("2000")
          ) {
            throw error;
          }
        }
        console.warn("Member messaging remote failed; using local store:", error);
      }
    }
    return garageMessagingService.startThread({
      actor,
      message,
      itemId: null,
      itemTitle: name,
      itemHref: `/u/${handle}`,
      ownerHandle: handle,
      ownerName: name,
      kind: "member",
    });
  },

  async listThreads(viewer: { id: string; handle?: string }): Promise<ThreadListItem[]> {
    const garage = await garageMessagingService.listThreads(viewer);
    let listing: ThreadListItem[] = [];
    let member: ThreadListItem[] = [];
    if (hasSupabaseConfig()) {
      try {
        listing = await listingMessagingService.listThreads();
      } catch (error) {
        if (!messagingUnavailable(error)) {
          console.warn("Could not load listing threads:", error);
        }
      }
      if (memberMessagingAvailable()) {
        try {
          member = await memberMessagingService.listThreads();
        } catch (error) {
          console.warn("Could not load member threads:", error);
        }
      }
    }
    // Prefer remote member threads; drop local member duplicates with same peer title+kind.
    const remoteMemberIds = new Set(member.map((t) => t.threadId));
    const garageFiltered = garage.filter(
      (t) => t.kind !== "member" || !remoteMemberIds.size,
    );
    return [...listing, ...member, ...garageFiltered].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  },

  async getThread(
    threadId: string,
    viewer: { id: string; handle?: string },
  ): Promise<ThreadDetail | null> {
    if (memberMessagingAvailable() && UUID_RE.test(threadId)) {
      try {
        const remote = await memberMessagingService.getThread(threadId);
        if (remote) return remote;
      } catch {
        /* try local / listing */
      }
    }
    const garage = await garageMessagingService.getThread(threadId, viewer);
    if (garage) return garage;
    if (!hasSupabaseConfig()) return null;
    try {
      return await listingMessagingService.getThread(threadId);
    } catch (error) {
      if (!messagingUnavailable(error)) throw error;
      return null;
    }
  },

  async reply({
    threadId,
    message,
    actor,
    kind,
  }: {
    threadId: string;
    message: string;
    actor: GarageActor;
    kind?: ThreadListItem["kind"] | ThreadDetail["kind"];
  }) {
    if (kind === "listing") {
      return listingMessagingService.reply({ threadId, message });
    }
    if (kind === "member" && memberMessagingAvailable() && UUID_RE.test(threadId)) {
      try {
        return await memberMessagingService.reply({ threadId, message });
      } catch (error) {
        const msg = String((error as Error)?.message || "");
        if (
          msg.includes("at least") ||
          msg.includes("2000") ||
          msg.includes("Sign in") ||
          msg.includes("Verify") ||
          msg.includes("not found")
        ) {
          throw error;
        }
        console.warn("Member reply remote failed; using local:", error);
      }
    }
    if (kind === "garage" || kind === "member") {
      return garageMessagingService.reply({ threadId, message, actor });
    }
    // Kind unknown — try member remote, then garage, then listing.
    if (memberMessagingAvailable() && UUID_RE.test(threadId)) {
      try {
        const remote = await memberMessagingService.getThread(threadId);
        if (remote) {
          return memberMessagingService.reply({ threadId, message });
        }
      } catch {
        /* continue */
      }
    }
    const garage = await garageMessagingService.getThread(threadId, actor);
    if (garage) {
      return garageMessagingService.reply({ threadId, message, actor });
    }
    return listingMessagingService.reply({ threadId, message });
  },
};

export type { ThreadDetail, ThreadListItem, ThreadMessage } from "./types";
export type { GarageActor } from "./garageMessagingService";
export { subscribeMessages } from "./garageMessagingService";
