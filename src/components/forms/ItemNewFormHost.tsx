"use client";

import { useState } from "react";
import { ItemNewForm } from "./ItemNewForm";

/** Fresh form instance each time you open Add — avoids leftover AI/manual notes. */
export function ItemNewFormHost() {
  const [mountId] = useState(() => `item-new-${Date.now()}`);
  return <ItemNewForm key={mountId} />;
}
