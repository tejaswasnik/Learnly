import { connectDb } from "@/lib/server/db";
import { deleteFile, uploadImage } from "@/lib/server/services/imagekit";
import { DEFAULT_AVATAR_URL } from "@/lib/shared/constants";

/** Stores a validated image as the user's avatar. The old file is deleted only after the new one is saved. */
export async function setAvatar(user, image) {
  const uploaded = await uploadImage(image, "avatars");
  const oldFileId = user.avatarFileId;
  user.photourl = uploaded.url;
  user.avatarFileId = uploaded.fileId;
  try {
    await connectDb();
    await user.save();
  } catch (err) {
    await deleteFile(uploaded.fileId); // do not leave an orphaned upload behind
    throw err;
  }
  await deleteFile(oldFileId);
}

/** Back to the default avatar (initials in the UI). */
export async function removeAvatar(user) {
  const oldFileId = user.avatarFileId;
  user.photourl = DEFAULT_AVATAR_URL;
  user.avatarFileId = undefined;
  await connectDb();
  await user.save();
  await deleteFile(oldFileId);
}
