import { DEFAULT_AVATAR_URL } from "@/lib/shared/constants";

/** True when the user uploaded a photo (the default placeholder URL does not count). */
export const hasCustomAvatar = (photourl) => Boolean(photourl) && photourl !== DEFAULT_AVATAR_URL;

/** ImageKit can resize on the fly; a 5 MB original should never be downloaded for a 40px circle. Other URLs pass through. */
export function avatarSrc(photourl, px = 160) {
  if (!hasCustomAvatar(photourl)) return null;
  return photourl.startsWith("https://") ? `${photourl}${photourl.includes("?") ? "&" : "?"}tr=w-${px},h-${px},fo-auto` : photourl;
}
