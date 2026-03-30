import CarCatalog from "../components/CarCatalog";
import { getSessionUser } from "../../lib/session";

export default async function CatalogPage() {
  const user = await getSessionUser();
  return <CarCatalog currentUser={user} />;
}
