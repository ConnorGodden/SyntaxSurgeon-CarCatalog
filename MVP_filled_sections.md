# Syntax Surgeons MVP — Filled Sections

> Copy the sections below into your existing document to complete it.

---

## Functionality & Overview

### Summary of Iteration 1

During Iteration 1, we built a functional car catalogue web application using Next.js, TypeScript, and Tailwind CSS. We delivered the core browsing and listing experience: users can view a catalogue of 159 car listings, search by keyword, filter by multiple attributes (make, year, body type, transmission, condition, colour, deal rating), and submit new listings through a validated form. The application is deployed and accessible via a live Vercel link.

We organized the project using feature branches and pull requests merged into `main`. All P0 user stories have either been completed or moved into review.

---

### Implemented User Stories (Priorities Included)

| Story | Priority | Status |
|---|---|---|
| Standardize car attributes (consistent data structure across all listings) | P0 | Done |
| Keyword search (search bar filtering by make, model, year, body, deal rating) | P0 | Done |
| Filter listings (sidebar filters for make, year, body, transmission, condition, colour, deal rating) | P0 | Done |
| Create a listing (modal form with validation, image upload, appends to data file) | P0 | Done |
| Updated UI — moved filters to the sidebar | P0 | Done |
| Listing Details Page (expanded view of a single car listing) | P0 | In Review |
| View listing details | P0 | In Review |
| Catalogue Page | P0 | In Progress |
| Sort results | P0 | In Progress |
| Log out | P0 | In Progress |
| Home Page | P1 | Ready |
| Edit a listing | P1 | Ready |

---

### Major Known Gaps / Limitations

- **No persistent database:** We are currently storing car data in a CSV file (`public/cars.csv`). Adding a listing writes directly to this file, which does not scale and is not suitable for a multi-user production environment.
- **No authentication:** We have not yet implemented a login system. Any user can add a listing. Role-based access (P2) has not been started.
- **Listing Details Page incomplete:** The individual listing detail view is still in review and not yet accessible from the catalogue grid.
- **Sorting not yet functional:** We have the Sort results feature in progress but it is not available in the current MVP.
- **No duplicate detection:** Users can submit duplicate listings without any warning.
- **Image storage:** Uploaded images are stored as base64 data URLs in the CSV, which inflates file size and is not a long-term solution.
- **No test suite:** We have not yet implemented automated tests.
- **Limited dataset:** Our catalogue currently contains 159 cars; real-world use would require a larger, maintained dataset.

---

## Challenges & Next Steps

### Challenges Encountered

#### Major Technical

- **Data standardization:** Our raw dataset contained inconsistencies in casing, missing fields, and mixed formatting across attributes (e.g., condition values, body types, odometer formatting). We spent significant effort cleaning and normalizing the CSV so that filters and search behaved predictably.
- **CSV as a data layer:** Using a flat CSV file instead of a database created complications when implementing the Add Listing feature. Writing new rows to the file from a Next.js API route required us to implement careful CSV escaping to handle commas, quotes, and newlines in field values.
- **Filter state management:** Coordinating multiple simultaneous filters (seven categories) alongside a keyword search in a performant way required us to refactor the filter logic into a dedicated utility and use `useMemo` to avoid unnecessary re-renders.
- **Image handling:** Supporting both external image URLs and user-uploaded images (base64 data URLs) in the same component required conditional rendering logic and adjustments to the Next.js `Image` component configuration.
- **CI pipeline:** A missing `npm test` script caused CI failures early in the iteration, which we had to fix before the pipeline would pass on pull requests.

#### Process Related

- **Branch coordination:** With multiple team members working on overlapping features (catalogue display, filters, data cleaning), we ran into merge conflicts when changes touched the same files. We resolved these through pull request reviews and rebasing.
- **Scope creep in review:** The Listing Details Page depends on work from other stories (catalogue card layout, data structure), which caused it to remain in review longer than we anticipated rather than reaching Done by the end of the iteration.
- **Task estimation:** Some tasks took longer than we estimated — particularly data cleaning and the Add Listing form validation — which pushed Sort results and the Home Page into the next iteration.

---

### Next Iteration Goals

Based on our current project board and outstanding work from Iteration 1, our goals for Iteration 2 (P1) are:

1. **Complete Listing Details Page** — Finish the review and ship the full individual car detail view, accessible by clicking any card in the catalogue.
2. **Sort results** — Implement sorting controls (e.g., price low–high, year, deal rating) on the catalogue view.
3. **Home Page** — Build a landing/home page that introduces the catalogue and provides entry points for browsing or adding a listing.
4. **Edit a listing** — Allow users to modify an existing listing's details through an edit form.
5. **Log out** — Complete the log out flow in preparation for the authentication system.
6. **Begin user authentication** — Start work on login/sign-up and role-based access so that listing management can be restricted to authorized users.
7. **Add test coverage** — Introduce unit or integration tests for the filter logic, CSV parser, and form validation.
