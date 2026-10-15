import { redirect } from "next/navigation";

// /login is kept as a bookmarkable alias — the real gate lives at / (AuthGate).
// Keeping the redirect avoids two competing login screens.
export default function LoginRedirect() {
  redirect("/");
}
