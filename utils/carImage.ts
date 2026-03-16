import { Car } from "../types/car";

const LOCAL_IMAGES: Record<string, string> = {
  "2004_acura_tsx":               "/cars/2004-acura-tsx.jpg",
  "2005_chevrolet_suburban":      "/cars/2005_chevrolet_suburban.webp",
  "2006_pontiac_torrent":         "/cars/2006_pontiac_torrent.webp",
  "2007_pontiac_torrent":         "/cars/2007_pontiac_torrent.webp",
  "2008_chevrolet_hhr":           "/cars/2008_chevrolet_hhr.jpg",
  "2008_ford_taurus":             "/cars/2008_ford_taurus.jpg",
  "2008_pontiac_g6":              "/cars/2008_pontiac_g6.webp",
  "2008_suzuki_forenza":          "/cars/2008_suzuki_forenza.jpg",
  "2009_kia_rio":                 "/cars/2009_kia_rio.jpg",
  "2010_bmw_3series":             "/cars/2010_bmw_3series.jpg",
  "2010_ford_escape":             "/cars/2010_ford_escape.jpg",
  "2011_ford_escape":             "/cars/2011_ford_escape.jpg",
  "2012_buick_lacrosse":          "/cars/2012_buick_lacrosse.jpg",
  "2012_buick_verano":            "/cars/2012_buick_verano.jpg",
  "2012_chevrolet_malibu":        "/cars/2012_chevrolet_malibu.webp",
  "2012_ford_edge":               "/cars/2012_ford_edge.jpg",
  "2012_ford_focus":              "/cars/2012_ford_focus.jpg",
  "2012_nissan_altima":           "/cars/2012_nissan_altima.jpg",
  "2012_nissan_sentra":           "/cars/2012_nissan_sentra.jpg",
  "2013_lincoln_mks":             "/cars/2013_lincoln_mks.jpg",
  "2013_nissan_altima":           "/cars/2013_nissan_altima.jpg",
  "2013_nissan_leaf":             "/cars/2013_nissan_leaf.jpg",
  "2014_bmw_x6":                  "/cars/2014_bmw_x6.webp",
  "2014_chrysler_townandcountry": "/cars/2014_chrysler_townandcountry.jpg",
  "2014_ford_escape":             "/cars/2014_ford_escape.jpg",
  "2014_ford_fusion":             "/cars/2014_ford_fusion.avif",
  "2014_nissan_versanote":        "/cars/2014_nissan_versanote.webp",
};

export function getCarImageSrc(car: Car): string {
  if (car.image?.trim()) return car.image.trim();
  const key = `${car.year}_${car.make.toLowerCase()}_${car.model.toLowerCase().replace(/\s+/g, "")}`;
  return LOCAL_IMAGES[key] ?? "/cars/placeholder.svg";
}
