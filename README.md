This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## How to run it

In order to run the app you must have `TypeScript` installed at minimum. This will also include `npm`.

1. Clone the repo. This can be accomplished by opening a command prompt, navigating to a directory for the app. In the terminal run:

```git clone https://github.com/ConnorGodden/SyntaxSurgeon-CarCatalog.git CarCatalog```


2. Navigate to the code, `cd CarCatalog`

3. In the main directory you should see an `app `folder along with `.yaml` and `.json` files. From here you can start the server.
```bash
npm run dev 
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Build Scripts

Three scripts live in the `scripts/` directory. All of them install dependencies, run the test suite, and produce a production build. Any step that fails will stop the script early.

### `scripts/setup.sh` — macOS / Linux

Installs dependencies, runs tests, and builds the project.

```bash
# Make the script executable (first time only)
chmod +x scripts/setup.sh

# Run it
./scripts/setup.sh
```

The script prefers `pnpm` if it is available and falls back to `npm`. Node.js 18+ is required.

### `scripts/setup.bat` — Windows

Equivalent setup script for Windows Command Prompt or PowerShell.

```bat
scripts\setup.bat
```

### `scripts/deploy.sh` — Deploy to Vercel (macOS / Linux)

Runs the same pre-flight checks (tests + build) and then pushes to Vercel production. Must be run from a clean working tree.

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

The script will warn you if you are not on the `main` branch and will install the Vercel CLI automatically if it is not already present.

## Live Link

The app is deployed to the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js. The link to the live application is [cars.connor12858.ca](https://cars.connor12858.ca).

