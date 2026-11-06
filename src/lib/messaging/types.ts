export type ThreadKind = "listing" | "garage" | "member";

export type ThreadListItem = {
  kind: ThreadKind;
  threadId: string;
  itemId: string | null;
  listingId?: string;
  role: "buyer" | "seller";
  status: string;
  updatedAt: string;
  title: string;
  lastBody: string;
  otherDisplayName: string;
  priceLabel: string;
  coverUrl: string;
  unread: boolean;
};

export type ThreadMessage = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type ThreadDetail = {
  kind: ThreadKind;
  thread: {
    id: string;
    status: string;
    viewer_role: "buyer" | "seller";
    item_id?: string | null;
    listing_id?: string;
    owner_handle?: string;
  };
  subject: {
    title: string;
    href: string;
    priceLabel: string;
    coverUrl: string;
    meta?: string;
  };
  messages: ThreadMessage[];
  viewerId: string;
};
