import Link from "next/link";

const sections = [
  {
    title: "Finding cars quickly",
    points: [
      "Use the search bar to match make, model, year, body type, or deal rating.",
      "Use sidebar filters to narrow by specific attributes.",
      "Use Sort to order your current results by price, mileage, year, or newest.",
    ],
  },
  {
    title: "Saving and comparing",
    points: [
      "Open any car card to view full details.",
      "Click Save Listing in the details modal to keep cars for later.",
      "Switch to Saved mode, select two cars, then click Compare for side-by-side results.",
    ],
  },
  {
    title: "Adding or editing listings",
    points: [
      "Logged-in users can add listings with the Add New Listing button.",
      "Admins can edit an existing listing from the car details modal.",
      "If a save fails, check required fields and VIN format, then try again.",
    ],
  },
  {
    title: "Account help",
    points: [
      "Guests can use the account button in the top-right to log in or sign up.",
      "If you are logged in, click your initials to open profile and logout options.",
      "If login fails, verify email and password, then retry.",
    ],
  },
];

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-zinc-100/70 p-6 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Help Center</h1>
          <Link
            href="/catalog"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
          >
            Back to Catalog
          </Link>
        </div>

        <p className="mb-6 rounded-xl border border-zinc-200 bg-white/80 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300">
          Hover the small <strong>i</strong> icons around the app for quick explanations. Use this page when you need full
          step-by-step guidance.
        </p>

        <div className="space-y-4">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-zinc-200 bg-white/90 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70"
            >
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
                {section.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
