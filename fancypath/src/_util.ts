// Copyright © 2022 Andrew Neitsch. All rights reserved.

export function isEnoent(e: unknown) {
  if (!(e instanceof Error)) {
    return false;
  }
  if (!("code" in e)) {
    return false;
  }
  return (e as Error & { code: unknown }).code === "ENOENT";
}
