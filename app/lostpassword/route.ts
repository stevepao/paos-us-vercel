import { redirectToWordPressAccountPath } from "@/lib/account-redirect";

export function GET(request: Request) {
  return redirectToWordPressAccountPath(request, "/lostpassword/");
}
