# Project Structure

A quick rundown of what's in each folder and what each file actually does.

---

## Root files

| File | What it does |
|------|-------------|
| `package.json` | Lists dependencies and defines the `dev`, `build`, `test`, and `start` scripts |
| `next.config.ts` | Next.js config — mostly just enables the app router |
| `tsconfig.json` | TypeScript settings |
| `postcss.config.mjs` | Needed for Tailwind CSS to work |
| `pnpm-workspace.yaml` | Marks this as a pnpm workspace |
| `README.md` | Setup instructions and live link |

---

## `app/`

This is where all the pages and API routes live. Next.js uses the folder structure here to figure out what URL maps to what.

### Pages

| File | URL | What it does |
|------|-----|-------------|
| `app/page.tsx` | `/` | Just redirects to `/catalog` |
| `app/layout.tsx` | (wraps everything) | Sets the page title and loads the Geist font |
| `app/globals.css` | — | Global CSS and Tailwind base styles |
| `app/catalog/page.tsx` | `/catalog` | The main car browsing page — loads all cars and renders the catalog |
| `app/car-listing/page.tsx` | `/car-listing?vin=...` | Car detail page, reads the VIN from the URL and shows that car |
| `app/car-listing/CarInfoPage.tsx` | — | The actual detail layout for a car (specs, reviews, etc.) |
| `app/car-listing/NoCarPage.tsx` | — | Shown when the VIN in the URL doesn't match any car |
| `app/login/page.tsx` | `/login` | Login and signup page — switches between modes via `?mode=signup` |
| `app/admin/page.tsx` | `/admin` | Admin-only dashboard for managing users |

### API routes (`app/api/`)

These are the backend endpoints the frontend calls.

| File | Method | What it does |
|------|--------|-------------|
| `app/api/auth/login/route.ts` | POST | Logs a user in, sets the session cookie |
| `app/api/auth/logout/route.ts` | POST | Clears the session cookie |
| `app/api/auth/signup/route.ts` | POST | Creates a new account and logs them in right away |
| `app/api/auth/session/route.ts` | GET | Returns the currently logged-in user (used on page load) |
| `app/api/listings/route.ts` | GET / POST / PUT | Get all cars, add a new listing, or update an existing one |
| `app/api/reviews/route.ts` | POST | Submit a review for a car |
| `app/api/reviews/[vin]/route.ts` | GET | Get all reviews for a specific car by VIN |
| `app/api/users/route.ts` | GET / PUT | Admin-only: list users or update a user's role/status |

### Components (`app/components/`)

Shared React components used across pages.

| File | What it does |
|------|-------------|
| `CarCatalog.tsx` | The big main component for `/catalog` — handles filtering, sorting, search, saved cars, and the compare feature |
| `CarCard.tsx` | The card shown for each car in the grid — image, price, mileage, deal badge |
| `CarDetailsModal.tsx` | Modal that pops up with full car details when you click a card |
| `CarCompareModal.tsx` | Side-by-side comparison modal for two selected cars |
| `FilterSelection.tsx` | The filter dropdowns (make, body style, year, etc.) |
| `AddListingForm.tsx` | Form for dealers/admins to add a new car listing |
| `ReviewForm.tsx` | Form for writing a review |
| `ReviewCard.tsx` | Displays a single review (rating, title, comment) |
| `ReviewsSection.tsx` | Groups all reviews for a car and includes the form if logged in |
| `AuthPage.tsx` | Handles the login/signup form UI and logic |
| `UserBox.tsx` | The user profile popup that shows when you click your avatar |

---

## `lib/`

Server-only code that reads and writes data. These files are never sent to the browser.

| File | What it does |
|------|-------------|
| `listings.ts` | Reads and writes `data/cars.csv` — handles loading all cars, creating listings, and updating them |
| `reviews.ts` | Reads and writes `data/reviews.csv` — get reviews by VIN, add a new review |
| `users.ts` | Reads and writes `data/users.csv` — look up users, create accounts, update roles |
| `session.ts` | Handles reading the session cookie from a request and returning the logged-in user |

---

## `data/`

Flat CSV files used as the database for this project.

| File | What it stores |
|------|---------------|
| `cars.csv` | All car listings |
| `users.csv` | User accounts (id, name, email, password, role) |
| `reviews.csv` | Car reviews (linked by VIN) |

---

## `types/`

TypeScript type definitions shared across the project.

| File | What it defines |
|------|----------------|
| `car.ts` | The `Car` interface and `parseCsv()` function for turning CSV rows into car objects |
| `user.ts` | `UserRecord` (full user with password), `SessionUser` (safe version without password), and `UserRole` |
| `review.ts` | The `Review` type |
| `filter.ts` | Filter state type and `cleanSelection()` — filters a car list based on active dropdown values |
| `validator.ts` | Shared validation helpers |
| `routes.d.ts` | Type-safe route helper declarations |

---

## `utils/`

Pure utility functions — no side effects, easy to test.

| File | What it does |
|------|-------------|
| `csv.ts` | Parses CSV text into rows, escapes values, and stringifies rows back to CSV. Handles quoted fields and commas correctly |
| `formatters.ts` | Small helpers: `getInitials()` for avatars, `formatRole()` to capitalize role names, `labelFromSnakeCase()` for display labels, `formatMoney()` |
| `carImage.ts` | Returns the right image for a car — checks for a local image first, falls back to an external URL |
| `sortCars.ts` | Sorts an array of cars by price, mileage, year, or sale date |
| `dedupeByVin.ts` | Removes duplicate cars by VIN, normalizes VINs (trims whitespace, drops invalid values) |
| `duplicateDetection.ts` | When adding a new listing, checks if it looks like a duplicate based on VIN match (high confidence) or same make/model/year (medium confidence) |
| `listingCompleteness.ts` | Figures out which fields are missing from a listing and generates a short summary (e.g. "Missing trim, transmission") |

---

## `__tests__/`

All tests live here. We use [Vitest](https://vitest.dev/).

| File | What it tests |
|------|--------------|
| `auth.test.ts` | Login, logout, and signup API routes |
| `car.test.ts` | CSV parsing and car image resolution |
| `compare.test.ts` | The compare toggle logic (add/remove/cap at 2 cars) |
| `csv.test.ts` | The CSV parser, escaper, and stringifier |
| `dedupeByVin.test.ts` | VIN deduplication and normalization |
| `duplicateDetection.test.ts` | Duplicate listing detection logic |
| `filter.test.ts` | The catalog filter function |
| `formatters.test.ts` | All the formatter helpers |
| `listingCompleteness.test.ts` | Missing field detection and summary formatting |
| `listings.test.ts` | The listings API (GET, POST, PUT) |
| `reviews.test.ts` | The reviews API |
| `savedListings.test.ts` | Saved listings key generation and dedup logic |
| `session.test.ts` | Session cookie handling |
| `sort.test.ts` | Car sort logic |
| `mockCar.ts` | Shared test fixture — a fake car object used across test files |

---

## `scripts/`

| File | What it does |
|------|-------------|
| `setup.sh` | macOS/Linux: installs dependencies, runs tests, and builds the project |
| `setup.bat` | Same thing but for Windows |
| `deploy.sh` | Runs setup and then deploys to Vercel production |
