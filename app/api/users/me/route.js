import { clearSessionCookie, publicUser, requireUser, revokeSessionToken } from "@/lib/server/auth";
import { readMultipart } from "@/lib/server/form";
import { HttpError, ok, parseBody, withErrors } from "@/lib/server/http";
import { deleteAccount } from "@/lib/server/services/account";
import { setAvatar } from "@/lib/server/services/avatar";
import { HOUR, withRateLimit } from "@/lib/server/services/rate-limit";
import { validateImageFile } from "@/lib/server/validators/image";
import { deleteAccountSchema, updateNameSchema } from "@/lib/server/validators/user";
import { User } from "@/models/user";

export const runtime = "nodejs";

export const PATCH = withRateLimit([{ name: "update-profile", limit: 30, windowMs: HOUR, by: "user" }], async (req) => {
  const user = await requireUser(req);

  if (req.headers.get("content-type")?.includes("multipart/form-data")) {
    const { fields, file } = await readMultipart(req, "avatar");
    if (!file && fields.name === undefined) throw new HttpError(400, "Send a name, an avatar, or both");
    const name = fields.name === undefined ? undefined : updateNameSchema.parse({ name: fields.name }).name;
    const image = file ? await validateImageFile(file) : null; // validate everything before changing anything
    if (name !== undefined) user.name = name;
    if (image) await setAvatar(user, image);
    else await user.save();
    return ok({ user: publicUser(user) });
  }

  const { name } = await parseBody(updateNameSchema, req);
  user.name = name;
  await user.save();
  return ok({ user: publicUser(user) });
});

export const DELETE = withRateLimit([{ name: "delete-account", limit: 3, windowMs: HOUR, by: "user" }], async (req) => {
  const session = await requireUser(req);
  if (session.role === "admin") throw new HttpError(403, "Admin accounts can’t be deleted here");
  const { password } = await parseBody(deleteAccountSchema, req);

  const user = await User.findById(session._id).select("+password");
  if (!(await user.comparePassword(password))) {
    throw new HttpError(400, "Password is incorrect", { password: ["Password is incorrect"] });
  }

  await deleteAccount(user);
  await revokeSessionToken(req);
  await clearSessionCookie();
  return ok({ message: "Account deleted" });
});
