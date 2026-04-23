# Amazon Playwright Case Study

Automation project built with **Playwright** + **TypeScript** + **Cucumber (BDD)**.

This project demonstrates a real-world UI automation approach for Amazon. The main goal is not only to automate clicks, but to validate meaningful business behavior:

- Searching for products
- Selecting the cheapest product from search results
- Adding products to cart
- Validating that correct items were added
- Validating that subtotal is calculated correctly
- Keeping test state clean between runs

---

## Table of Contents

- [Project Goal](#project-goal)
- [Covered Scenario](#covered-scenario)
- [Tech Stack](#tech-stack)
- [Why This Architecture](#why-this-architecture)
- [Project Structure](#project-structure)
- [Detailed Class Documentation](#detailed-class-documentation)
- [Environment Variables](#environment-variables)
- [Installation](#installation)
- [Running Tests](#running-tests)
- [Cross-Platform Support](#cross-platform-support)
- [Reports](#reports)
- [How the Main Flow Works](#how-the-main-flow-works)
- [Design Decisions](#design-decisions)
- [Cleanup Strategy](#cleanup-strategy)
- [Known Limitations](#known-limitations)
- [How to Extend the Project](#how-to-extend-the-project)
- [Summary](#summary)
- [Author](#author)

---

## Project Goal

The purpose of this project is to provide a clear, scalable, and maintainable automation solution for a case study based on Amazon.

The project is intentionally structured to show:
- Readable automation code
- Proper separation of concerns
- Reusable Page Object Model
- Reusable service layer
- Stable test flow for dynamic UI
- Realistic handling of unstable real-world pages

This is **not** a toy demo that clicks a static page. Amazon is highly dynamic, so the project is designed with fallbacks, parsing logic, and cleanup logic to handle real UI complexity.

---

## Covered Scenario

### Main Scenario

> As a new Amazon user, I want to search for the cheapest products, add them to the cart, and verify that the cart subtotal is calculated correctly.

### Automated Flow

In practice, the automated flow does the following:

1. Open Amazon homepage
2. Accept cookie banner if it appears
3. Search for a product
4. Wait for search results
5. Apply brand filter if available
6. Sort by Price: Low to High
7. Parse product cards from the search results page
8. Extract product names, prices, and URLs
9. Select the cheapest valid product
10. Open product page
11. Add the product to cart
12. Handle fallback flow through Buying Options if direct add-to-cart is unavailable
13. Repeat for multiple products
14. Open cart
15. Verify:
    - Only expected products are present
    - Subtotal equals the sum of selected product prices
16. Clean the cart after test execution

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **Playwright** | Browser automation |
| **TypeScript** | Static typing and maintainability |
| **Cucumber** | BDD layer and human-readable scenarios |
| **Node.js** | Runtime |
| **dotenv** | Environment variable management |

---

## Why This Architecture

This project is structured to keep responsibilities separated. Instead of writing one large test with all logic inside step definitions, the project is split into clear layers:

- **Pages** – Handle page-specific UI actions
- **Components** – Handle reusable UI fragments
- **Services** – Handle business logic and reusable algorithms
- **Models** – Define shared data structures
- **Steps** – Orchestrate the scenario
- **Hooks** – Manage lifecycle and cleanup
- **World** – Store scenario state

This makes the code easier to:
- Read
- Debug
- Extend
- Maintain
- Explain during interview or code review

---

## Project Structure

```
src/
  components/      # Reusable UI pieces (Header, SearchBar, CookieBanner)
  models/          # Shared data models (Product, CartItem)
  pages/           # Page Objects for Amazon pages
  services/        # Business logic helpers
  utils/           # Environment/config helpers

features/          # Cucumber feature files
steps/             # Step definitions
support/           # Hooks and CustomWorld
reports/           # JSON/HTML reports
```

---

## Detailed Class Documentation

### Pages

#### `BasePage`

**Purpose:**  
Common base class for page objects.

**Responsibilities:**
- Navigation helper
- Generic click helper
- Generic fill helper
- Generic text extraction
- Generic visibility checks

**Important Note:**  
`BasePage` does not contain business logic. It only provides shared low-level helpers.

---

#### `HomePage`

**Purpose:**  
Represents Amazon homepage.

**Responsibilities:**
- Open Amazon homepage
- Initialize the page
- Accept cookies through `CookieBanner`
- Expose the `Header` component

**Key Behavior:**
- Opens the configured base URL
- Ensures home page is ready for interaction

---

#### `SearchResultsPage`

**Purpose:**  
Represents Amazon search results page.

**Responsibilities:**
- Wait for search result cards
- Apply brand filter if available
- Sort products by price
- Parse product cards from DOM
- Build structured `Product` objects
- Open a selected product

**Key Methods:**
- `waitForResults()`
- `applyBrandFilter(brand)`
- `sortByPriceLowToHigh()`
- `getFirstValidProducts(limit)`
- `openProduct(product)`

**Why It Matters:**  
This class turns raw Amazon UI into structured product data.

---

#### `ProductPage`

**Purpose:**  
Represents product details page.

**Responsibilities:**
- Add product to cart
- Handle primary and fallback add-to-cart paths
- Navigate to Buying Options if necessary

**Key Methods:**
- `addToCart()`
- `waitForAddToCartConfirmation()` (optional helper)

**Important Design Note:**  
The main scenario does not depend on confirmation popups like "Added to Cart" because those UI messages are unstable. The actual validation happens later in the cart.

---

#### `BuyingOptionsPage`

**Purpose:**  
Handles Amazon fallback flow when direct add-to-cart is unavailable.

**Responsibilities:**
- Wait for Buying Options UI
- Find available add-to-cart buttons
- Click the first usable offer

**Key Method:**
- `addFirstAvailableOfferToCart()`

**Important Design Note:**  
This class is intentionally isolated so that fallback behavior does not pollute `ProductPage` or step definitions.

---

#### `CartPage`

**Purpose:**  
Represents Amazon cart and performs final validation.

**Responsibilities:**
- Read subtotal values
- Collect item names from cart
- Verify only expected products are present
- Verify subtotal matches expected total
- Remove cart items after test
- Verify cart is empty after cleanup

**Key Methods:**
- `getCombinedSubtotal()`
- `getRegularCartItemNames()`
- `getFreshCollapsedItemNames()`
- `getAllCartItemNames()`
- `verifyCartContainsOnlyExpectedItems(expectedNames)`
- `clearCart()`
- `verifyCartIsEmpty()`

**Why It Matters:**  
Final business validation happens here, not through unstable intermediate UI messages.

---

#### `AuthPage`

**Purpose:**  
Represents Amazon authentication page and login flow.

**Responsibilities:**
- Open sign-in flow
- Enter email
- Enter password
- Submit login
- Verify if user is logged in
- Read greeting text from header

**Key Methods:**
- `openSignIn()`
- `login(email, password)`
- `isLoggedIn()`
- `getGreetingText()`

**Important Note:**  
Main cart/subtotal scenario does not require authentication, but session reuse is supported.

---

#### `SignInPage`

**Purpose:**  
Auxiliary page object for detecting sign-in screen.

**Key Method:**
- `isOpened()`

---

### Components

#### `Header`

**Purpose:**  
Reusable representation of Amazon top header.

**Responsibilities:**
- Expose `SearchBar`
- Open cart

**Key Method:**
- `openCart()`

**Why It Exists:**  
The header is reused across multiple pages, so it makes sense as a component rather than duplicating header selectors in each page object.

---

#### `SearchBar`

**Purpose:**  
Reusable search input component inside header.

**Responsibilities:**
- Wait for search bar readiness
- Search for products

**Key Methods:**
- `waitUntilReady()`
- `searchFor(searchTerm)`

**Why It Exists:**  
Search functionality is reusable and should not be hardcoded directly into page objects or step definitions.

---

#### `CookieBanner`

**Purpose:**  
Handles cookie consent popup.

**Responsibilities:**
- Accept cookies if the banner is visible

**Key Method:**
- `acceptIfPresent()`

**Why It Exists:**  
Cookie banners are a common source of instability. This keeps that logic isolated.

---

### Services

#### `ProductSelectionService`

**Purpose:**  
Business logic for selecting the cheapest product.

**Responsibilities:**
- Validate parsed products
- Filter invalid items
- Return cheapest valid product

**Key Method:**
- `getCheapestProduct(products)`

**Why It Exists:**  
The logic of "find the cheapest valid product" is business logic, not UI logic. That is why it belongs in a service, not in step definitions or page objects.

---

#### `PriceParser`

**Purpose:**  
Converts raw UI text into numeric price values.

**Responsibilities:**
- Parse dollar strings
- Normalize price text
- Extract numeric values from UI text

**Key Method:**
- `parseCombinedPrice(rawText)`

**Why It Exists:**  
Amazon displays price data in multiple DOM shapes, and raw UI strings need parsing before business validation.

---

#### `AuthSessionService`

**Purpose:**  
Manages storage state and optional session reuse.

**Responsibilities:**
- Check if storage state exists
- Validate whether stored session is still active
- Log in if needed
- Save fresh storage state

**Key Methods:**
- `storageStateExists()`
- `createContext(browser)`
- `ensureLoggedIn(browser)`
- `isStoredSessionValid(browser)`

**Why It Exists:**  
This keeps authentication/session orchestration outside page objects and hooks.

---

### Models

#### `Product`

Represents a product used during search and selection flow.

```typescript
export interface Product {
  name: string;
  searchTerm: string;
  price?: number;
  productUrl?: string;
}
```

**Fields:**
- `name` – Logical or parsed product title
- `searchTerm` – Search query used in flow
- `price` – Parsed numeric price
- `productUrl` – URL of selected product page

---

#### `CartItem`

Represents a product entry in cart.

```typescript
export interface CartItem {
  name: string;
  price: number;
  quantity: number;
}
```

**Fields:**
- `name` – Cart product title
- `price` – Single item price
- `quantity` – Item quantity

---

### BDD Layer

#### Feature Files (`features/`)

Contain human-readable scenarios written in Gherkin.

**Example Flow:**
1. Initialize framework
2. Search for product
3. Open cheapest product
4. Add product to cart
5. Open cart
6. Verify subtotal

This makes the test readable even for non-developers.

---

#### Step Definitions (`steps/amazon.steps.ts`)

**Purpose:**  
Connect Gherkin text to actual code.

**Responsibilities:**
- Orchestrate page objects and services
- Keep steps readable
- Avoid direct DOM work

**Why It Matters:**  
Step definitions should describe the flow, not contain all technical details.

---

### Support Layer

#### `CustomWorld`

**Purpose:**  
Stores scenario-specific runtime state.

**Responsibilities:**
- Hold browser
- Hold context
- Hold page
- Store selected products
- Store current search term

**Why It Exists:**  
Scenario state should live in one place and be shared across step definitions.

---

#### `hooks.ts`

**Purpose:**  
Manage test lifecycle.

**Responsibilities:**
- Set global timeout
- Validate/login session in `BeforeAll`
- Reset scenario state in `Before`
- Launch browser/page
- Capture screenshot on failure
- Clean cart in `After`
- Close browser/context/page

**Why It Matters:**  
This ensures:
- Test isolation
- Reliable cleanup
- Repeatable runs

---

## Environment Variables

Create a `.env` file in project root.

### Example

```env
BASE_URL=https://www.amazon.com
HEADED=false

AMAZON_EMAIL=
AMAZON_PASSWORD=

STORAGE_STATE_PATH=storageState.json
```

### Variables Explained

| Variable | Purpose | Default |
|---|---|---|
| `BASE_URL` | Base URL of tested application | `https://www.amazon.com` |
| `HEADED` | If `true`, browser opens visibly; if `false`, tests run headless | `false` |
| `AMAZON_EMAIL` | Optional login email for session reuse | - |
| `AMAZON_PASSWORD` | Optional login password for session reuse | - |
| `STORAGE_STATE_PATH` | Path to saved Playwright storage state file | `storageState.json` |

**Important:**  
Authentication is optional for the main scenario.

---

## Installation

### Install Dependencies

```bash
npm install
```

**Example of individual dependencies:**

```bash
npm install -D typescript ts-node @types/node
npm install -D playwright @playwright/test
npm install -D @cucumber/cucumber
npm install -D dotenv
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier eslint-config-prettier eslint-plugin-prettier
npm install -D rimraf cross-env
```

### Install Playwright Browsers

```bash
npx playwright install
```

This command downloads browser binaries required by Playwright.

---

### CI Pipeline

The project can be executed in CI using GitHub Actions.

**Recommended Pipeline Steps:**
1. Checkout repository
2. Install Node.js
3. Install npm dependencies
4. Install Playwright browsers
5. Run type check
6. Run lint
7. Run BDD tests
8. Upload reports and artifacts

**Example Workflow File:**  
`.github/workflows/ci.yml`

The CI pipeline is designed to:
- Validate code quality
- Validate TypeScript correctness
- Execute automated scenarios
- Preserve reports and artifacts for debugging

---

## Running Tests

### Run BDD Tests (Headless)

```bash
npm run test:bdd
```

### Run BDD Tests with Browser UI

```bash
npm run test:bdd:headed
```

### Run BDD Tests in Debug Mode

```bash
npm run test:bdd:debug
```

### Type Check

```bash
npm run typecheck
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

### Format

```bash
npm run format
```

---

## Cross-Platform Support

This project supports execution on:
- Windows
- Linux
- macOS

### Why This Works

Playwright automatically manages browser binaries for the current operating system. That means there is no need to manually download and maintain:
- ChromeDriver
- GeckoDriver
- Safari/WebKit driver binaries

This is one of the key advantages over older Selenium-style setups.

### Browser Installation

```bash
npx playwright install
```

This command downloads the required browser binaries for the current OS.

### Playwright Browser Configuration

The project includes Playwright configuration with browser definitions for:
- Chromium
- Firefox
- WebKit

This demonstrates that the project is designed with cross-browser and cross-platform compatibility in mind.

---

## Reports

After test execution, reports are generated in the `reports/` folder.

### Available Reports

- `reports/cucumber-report.json`
- `reports/cucumber-report.html`

These reports can be used for:
- Local debugging
- Sharing results
- Reviewing failures

Additionally, Playwright artifacts such as screenshots, trace files, and videos are retained on failure where configured.

---

## How the Main Flow Works

Here is the exact logic of the main scenario:

1. `HomePage` opens Amazon
2. `CookieBanner` accepts cookies if needed
3. `SearchBar` searches a product
4. `SearchResultsPage` waits for results
5. `SearchResultsPage` tries to apply brand filter
6. `SearchResultsPage` sorts by low-to-high price
7. `SearchResultsPage` parses first valid result cards
8. `PriceParser` parses raw prices
9. `ProductSelectionService` selects the cheapest product
10. `SearchResultsPage` opens the selected product
11. `ProductPage` adds the product to cart
12. If direct cart add is unavailable, `BuyingOptionsPage` handles fallback flow
13. After all products are added, `Header` opens cart
14. `CartPage` verifies:
    - Expected items are present
    - Subtotal is correct
15. `CartPage` clears cart after test
16. `CartPage` verifies cart is empty

---

## Design Decisions

### 1. Page Object Model

UI interactions are isolated in page objects.

**Why:**
- Cleaner test steps
- Less duplicated locator code
- Easier maintenance if UI changes

---

### 2. Service Layer for Business Logic

Cheapest-product selection and price parsing are not part of page objects.

**Why:**
- Keeps business logic separate from UI interaction
- Improves reusability
- Easier to unit-test if needed later

---

### 3. No Reliance on Unstable Confirmation Popups

The project does not use cart confirmation popups as the main business validation.

**Why:**
- Amazon confirmation UI is inconsistent
- Popups may appear differently or not appear at all
- Cart content is a more reliable final validation point

So the project validates the final state in cart instead of trusting transient popups.

---

### 4. Resilient Selector Strategy

Amazon UI is dynamic, so the project uses:
- Primary selectors
- Fallback selectors
- Optional flows such as Buying Options

**Why:**
- Reduce flakiness
- Support real DOM variations
- Make the solution more realistic

---

### 5. Scenario Cleanup

After each scenario:
- Cart is opened
- Products are removed
- Cart is verified empty

**Why:**
- Avoid test pollution
- Keep runs repeatable
- Support multi-run stability

---

## Cleanup Strategy

Cleanup is handled in `After` hooks.

### What Happens

1. If scenario fails, a screenshot is captured
2. Cart is opened
3. All products are removed
4. Empty cart state is verified
5. Browser is closed

### Why It Matters

This keeps the environment stable across runs.

**Without cleanup:**
- Later tests may fail
- Subtotal may include old products
- Product verification becomes unreliable

---

## Known Limitations

Because Amazon is a live external website, some limitations are unavoidable:

- UI can change at any time
- Product availability can change
- Some products may appear without direct add-to-cart
- Brand filters may not always be present
- Dynamic rendering may occasionally require fallback waits

**The project handles this with:**
- Flexible parsing
- Fallback locators
- Buying options support
- Cart-based validation instead of popup-based validation

---

## How to Extend the Project

### Add More Products

Product list is data-driven.

**Example:**

```typescript
export const targetProducts: Product[] = [
  { name: 'Snickers', searchTerm: 'Snickers' },
  { name: 'Skittles', searchTerm: 'Skittles' },
  { name: 'Twix', searchTerm: 'Twix' },
  { name: 'Kit Kat', searchTerm: 'Kit Kat' }
];
```

Add another entry and reuse the same flow.

---

### Add More Scenarios

You can add more feature files for:
- Cart cleanup validation
- Unauthenticated checkout redirect
- Product availability checks
- Different product categories

The architecture already supports extension because page logic, state, and business logic are separated.

---

### Add More Browsers

Playwright config already supports browser setup. The project can be expanded to run broader browser coverage if needed.

---

## Summary

This project demonstrates:

- ✅ Real-world UI automation against a dynamic public website
- ✅ Playwright + TypeScript + Cucumber stack
- ✅ Scalable Page Object Model
- ✅ Separation of concerns
- ✅ Resilient product parsing
- ✅ Cheapest-product selection logic
- ✅ Final business validation in cart
- ✅ Cleanup and session handling
- ✅ Cross-platform support for Windows, Linux, and macOS

The focus of the project is not only "making the test pass", but building a structure that is **readable**, **maintainable**, and **extensible**.

---

## Author

**Serghei Patrasco**