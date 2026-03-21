import AuthPage from "./components/AuthPage";
import { getSessionUser } from "../lib/session";

export default async function Home() {
  const user = await getSessionUser();
  return <AuthPage initialUser={user} />;
}
