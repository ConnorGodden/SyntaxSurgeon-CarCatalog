import { redirect } from "next/navigation";
import CarCatalog from "../components/CarCatalog";
import { getSessionUser } from "../../lib/session";

export default async function CatalogPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/");
  }

  return <CarCatalog currentUser={user} />;
}
