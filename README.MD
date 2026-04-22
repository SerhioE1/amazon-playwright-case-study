Amazon Playwright Case Study
Automation project built with Playwright + TypeScript + Cucumber (BDD).
This project demonstrates a real-world UI automation approach for Amazon.  
The main goal is not only to automate clicks, but to validate meaningful business behavior:
searching for products
selecting the cheapest product from search results
adding products to cart
validating that correct items were added
validating that subtotal is calculated correctly
keeping test state clean between runs
---
Table of Contents
Project Goal
Covered Scenario
Tech Stack
Why This Architecture
Project Structure
Detailed Class Documentation
Pages
Components
Services
Models
BDD Layer
Support Layer
Environment Variables
Installation
Running Tests
Cross-Platform Support
Reports
How the Main Flow Works
Design Decisions
Cleanup Strategy
Known Limitations
How to Extend the Project
Summary
Author
---
Project Goal
The purpose of this project is to provide a clear, scalable, and maintainable automation solution for a case study based on Amazon.
The project is intentionally structured to show:
readable automation code
proper separation of concerns
reusable Page Object Model
reusable service layer
stable test flow for dynamic UI
realistic handling of unstable real-world pages
This is not a toy demo that clicks a static page.  
Amazon is highly dynamic, so the project is designed with fallbacks, parsing logic, and cleanup logic to handle real UI complexity.
---
Covered Scenario
Main scenario:
> As a new Amazon user, I want to search for the cheapest products, add them to the cart, and verify that the cart subtotal is calculated correctly.
In practice, the automated flow does the following:
Open Amazon homepage
Accept cookie banner if it appears
Search for a product
Wait for search results
Apply brand filter if available
Sort by Price: Low to High
Parse product cards from the search results page
Extract product names, prices, and URLs
Select the cheapest valid product
Open product page
Add the product to cart
Handle fallback flow through Buying Options if direct add-to-cart is unavailable
Repeat for multiple products
Open cart
Verify:
only expected products are present
subtotal equals the sum of selected product prices
Clean the cart after test execution
---
Tech Stack
Playwright – browser automation
TypeScript – static typing and maintainability
Cucumber – BDD layer and human-readable scenarios
Node.js – runtime
dotenv – environment variable management
---
Why This Architecture
This project is structured to keep responsibilities separated.
Instead of writing one large test with all logic inside step definitions, the project is split into clear layers:
Pages handle page-specific UI actions
Components handle reusable UI fragments
Services handle business logic and reusable algorithms
Models define shared data structures
Steps orchestrate the scenario
Hooks manage lifecycle and cleanup
World stores scenario state
This makes the code easier to:
read
debug
extend
maintain
explain during interview or code review
---
Project Structure
```text
src/
  components/      # Reusable UI pieces such as Header, SearchBar, CookieBanner
  models/          # Shared data models like Product and CartItem
  pages/           # Page Objects for Amazon pages
  services/        # Business logic helpers
  utils/           # Environment/config helpers

features/          # Cucumber feature files
steps/             # Step definitions
support/           # Hooks and CustomWorld
reports/           # JSON/HTML reports
```
---
Detailed Class Documentation
Pages
`BasePage`
Purpose:  
Common base class for page objects.
Why it exists:  
Instead of repeating simple shared actions in every page, the project keeps common helpers in one place.
Responsibilities:
navigation helper
generic click helper
generic fill helper
generic text extraction
generic visibility checks
Important note:  
`BasePage` does not contain business logic.  
It only provides shared low-level helpers.
---
`HomePage`
Purpose:  
Represents Amazon homepage.
Why it exists:  
The home page is the main entry point for the scenario, so it has its own page object.
Responsibilities:
open Amazon homepage
initialize the page
accept cookies through `CookieBanner`
expose the `Header` component
Key behavior:
opens the configured base URL
ensures home page is ready for interaction
---
`SearchResultsPage`
Purpose:  
Represents Amazon search results page.
Why it exists:  
Search result handling is the most complex part of the flow and should not live in step definitions.
Responsibilities:
wait for search result cards
apply brand filter if available
sort products by price
parse product cards from DOM
build structured `Product` objects
open a selected product
Key methods:
`waitForResults()`
`applyBrandFilter(brand)`
`sortByPriceLowToHigh()`
`getFirstValidProducts(limit)`
`openProduct(product)`
Why it matters:  
This class turns raw Amazon UI into structured product data.
---
`ProductPage`
Purpose:  
Represents product details page.
Why it exists:  
Product pages can differ a lot on Amazon. Direct add-to-cart may exist, or it may require another flow.
Responsibilities:
add product to cart
handle primary and fallback add-to-cart paths
navigate to Buying Options if necessary
Key methods:
`addToCart()`
`waitForAddToCartConfirmation()` (currently optional helper, not required for main scenario)
Important design note:  
The main scenario does not depend on confirmation popups like “Added to Cart” because those UI messages are unstable.  
The actual validation happens later in the cart.
---
`BuyingOptionsPage`
Purpose:  
Handles Amazon fallback flow when direct add-to-cart is unavailable.
Why it exists:  
Some products are only available through “See All Buying Options”.  
Without this class, the automation would fail on many real products.
Responsibilities:
wait for Buying Options UI
find available add-to-cart buttons
click the first usable offer
Key method:
`addFirstAvailableOfferToCart()`
Important design note:  
This class is intentionally isolated so that fallback behavior does not pollute `ProductPage` or step definitions.
---
`CartPage`
Purpose:  
Represents Amazon cart and performs final validation.
Why it exists:  
The cart is the source of truth for this scenario.
Responsibilities:
read subtotal values
collect item names from cart
verify only expected products are present
verify subtotal matches expected total
remove cart items after test
verify cart is empty after cleanup
Key methods:
`getCombinedSubtotal()`
`getRegularCartItemNames()`
`getFreshCollapsedItemNames()`
`getAllCartItemNames()`
`verifyCartContainsOnlyExpectedItems(expectedNames)`
`clearCart()`
`verifyCartIsEmpty()`
Why it matters:  
Final business validation happens here, not through unstable intermediate UI messages.
---
`AuthPage`
Purpose:  
Represents Amazon authentication page and login flow.
Why it exists:  
The project supports optional session reuse through stored authentication state.
Responsibilities:
open sign-in flow
enter email
enter password
submit login
verify if user is logged in
read greeting text from header
Key methods:
`openSignIn()`
`login(email, password)`
`isLoggedIn()`
`getGreetingText()`
Important note:  
Main cart/subtotal scenario does not require authentication, but session reuse is supported.
---
`SignInPage`
Purpose:  
Auxiliary page object for detecting sign-in screen.
Why it exists:  
Originally intended for unauthenticated redirect checks and kept as an auxiliary/helper class.
Responsibilities:
detect if sign-in page is open
Key method:
`isOpened()`
---
Components
`Header`
Purpose:  
Reusable representation of Amazon top header.
Responsibilities:
expose `SearchBar`
open cart
Key method:
`openCart()`
Why it exists:  
The header is reused across multiple pages, so it makes sense as a component rather than duplicating header selectors in each page object.
---
`SearchBar`
Purpose:  
Reusable search input component inside header.
Responsibilities:
wait for search bar readiness
search for products
Key methods:
`waitUntilReady()`
`searchFor(searchTerm)`
Why it exists:  
Search functionality is reusable and should not be hardcoded directly into page objects or step definitions.
---
`CookieBanner`
Purpose:  
Handles cookie consent popup.
Responsibilities:
accept cookies if the banner is visible
Key method:
`acceptIfPresent()`
Why it exists:  
Cookie banners are a common source of instability.  
This keeps that logic isolated.
---
Services
`ProductSelectionService`
Purpose:  
Business logic for selecting the cheapest product.
Responsibilities:
validate parsed products
filter invalid items
return cheapest valid product
Key method:
`getCheapestProduct(products)`
Why it exists:  
The logic of “find the cheapest valid product” is business logic, not UI logic.  
That is why it belongs in a service, not in step definitions or page objects.
---
`PriceParser`
Purpose:  
Converts raw UI text into numeric price values.
Responsibilities:
parse dollar strings
normalize price text
extract numeric values from UI text
Key method:
`parseCombinedPrice(rawText)`
Why it exists:  
Amazon displays price data in multiple DOM shapes, and raw UI strings need parsing before business validation.
---
`AuthSessionService`
Purpose:  
Manages storage state and optional session reuse.
Responsibilities:
check if storage state exists
validate whether stored session is still active
log in if needed
save fresh storage state
Key methods:
`storageStateExists()`
`createContext(browser)`
`ensureLoggedIn(browser)`
`isStoredSessionValid(browser)`
Why it exists:  
This keeps authentication/session orchestration outside page objects and hooks.
---
Models
`Product`
Represents a product used during search and selection flow.
```ts
export interface Product {
  name: string;
  searchTerm: string;
  price?: number;
  productUrl?: string;
}
```
Fields:
`name` → logical or parsed product title
`searchTerm` → search query used in flow
`price` → parsed numeric price
`productUrl` → URL of selected product page
---
`CartItem`
Represents a product entry in cart.
```ts
export interface CartItem {
  name: string;
  price: number;
  quantity: number;
}
```
Fields:
`name` → cart product title
`price` → single item price
`quantity` → item quantity
---
BDD Layer
Feature Files (`features/`)
Contain human-readable scenarios written in Gherkin.
Example flow:
initialize framework
search for product
open cheapest product
add product to cart
open cart
verify subtotal
This makes the test readable even for non-developers.
---
Step Definitions (`steps/amazon.steps.ts`)
Purpose:  
Connect Gherkin text to actual code.
Responsibilities:
orchestrate page objects and services
keep steps readable
avoid direct DOM work
Why it matters:  
Step definitions should describe the flow, not contain all technical details.
---
Support Layer
`CustomWorld`
Purpose:  
Stores scenario-specific runtime state.
Responsibilities:
hold browser
hold context
hold page
store selected products
store current search term
Why it exists:  
Scenario state should live in one place and be shared across step definitions.
---
`hooks.ts`
Purpose:  
Manage test lifecycle.
Responsibilities:
set global timeout
validate/login session in `BeforeAll`
reset scenario state in `Before`
launch browser/page
capture screenshot on failure
clean cart in `After`
close browser/context/page
Why it matters:  
This ensures:
test isolation
reliable cleanup
repeatable runs
---
Environment Variables
Create a `.env` file in project root.
Example:
```env
BASE_URL=https://www.amazon.com
HEADED=false

AMAZON_EMAIL=
AMAZON_PASSWORD=

STORAGE_STATE_PATH=storageState.json
```
Variables explained
`BASE_URL`
base URL of tested application
default: `https://www.amazon.com`
`HEADED`
if `true`, browser opens visibly
if `false`, tests run headless
`AMAZON_EMAIL`
optional login email for session reuse
`AMAZON_PASSWORD`
optional login password for session reuse
`STORAGE_STATE_PATH`
path to saved Playwright storage state file
Important:  
Authentication is optional for the main scenario.
---
Installation
1. Install dependencies
```bash
npm install

for example(
    npm install -D typescript ts-node @types/node
    npm install -D playwright @playwright/test
    npm install -D @cucumber/cucumber
    npm install -D dotenv
    npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
    npm install -D prettier eslint-config-prettier eslint-plugin-prettier
    npm install -D rimraf cross-env
)
```
2. Install Playwright browsers
```bash
npx playwright install
```
This command downloads browser binaries required by Playwright.
---
## CI Pipeline

The project can be executed in CI using GitHub Actions.

Recommended pipeline steps:
- checkout repository
- install Node.js
- install npm dependencies
- install Playwright browsers
- run type check
- run lint
- run BDD tests
- upload reports and artifacts

Example workflow file:

`.github/workflows/ci.yml`

The CI pipeline is designed to:
- validate code quality
- validate TypeScript correctness
- execute automated scenarios
- preserve reports and artifacts for debugging
---
Running Tests
Run BDD tests (headless)
```bash
npm run test:bdd
```
Run BDD tests with browser UI
```bash
npm run test:bdd:headed
```
Run BDD tests in debug mode
```bash
npm run test:bdd:debug
```
Type check
```bash
npm run typecheck
```
Build
```bash
npm run build
```
Lint
```bash
npm run lint
```
Format
```bash
npm run format
```
---
Cross-Platform Support
This project supports execution on:
Windows
Linux
macOS
Why this works
Playwright automatically manages browser binaries for the current operating system.  
That means there is no need to manually download and maintain:
ChromeDriver
GeckoDriver
Safari/WebKit driver binaries
This is one of the key advantages over older Selenium-style setups.
Browser installation
```bash
npx playwright install
```
This command downloads the required browser binaries for the current OS.
Playwright browser configuration
The project includes Playwright configuration with browser definitions for:
Chromium
Firefox
WebKit
This demonstrates that the project is designed with cross-browser and cross-platform compatibility in mind.
---
Reports
After test execution, reports are generated in the `reports/` folder.
Available reports
`reports/cucumber-report.json`
`reports/cucumber-report.html`
These reports can be used for:
local debugging
sharing results
reviewing failures
Additionally, Playwright artifacts such as screenshots, trace files, and videos are retained on failure where configured.
---
How the Main Flow Works
Here is the exact logic of the main scenario:
`HomePage` opens Amazon
`CookieBanner` accepts cookies if needed
`SearchBar` searches a product
`SearchResultsPage` waits for results
`SearchResultsPage` tries to apply brand filter
`SearchResultsPage` sorts by low-to-high price
`SearchResultsPage` parses first valid result cards
`PriceParser` parses raw prices
`ProductSelectionService` selects the cheapest product
`SearchResultsPage` opens the selected product
`ProductPage` adds the product to cart
If direct cart add is unavailable, `BuyingOptionsPage` handles fallback flow
After all products are added, `Header` opens cart
`CartPage` verifies:
expected items are present
subtotal is correct
`CartPage` clears cart after test
`CartPage` verifies cart is empty
---
Design Decisions
1. Page Object Model
UI interactions are isolated in page objects.
Why:
cleaner test steps
less duplicated locator code
easier maintenance if UI changes
---
2. Service Layer for business logic
Cheapest-product selection and price parsing are not part of page objects.
Why:
keeps business logic separate from UI interaction
improves reusability
easier to unit-test if needed later
---
3. No reliance on unstable confirmation popups
The project does not use cart confirmation popups as the main business validation.
Why:
Amazon confirmation UI is inconsistent
popups may appear differently or not appear at all
cart content is a more reliable final validation point
So the project validates the final state in cart instead of trusting transient popups.
---
4. Resilient selector strategy
Amazon UI is dynamic, so the project uses:
primary selectors
fallback selectors
optional flows such as Buying Options
Why:
reduce flakiness
support real DOM variations
make the solution more realistic
---
5. Scenario cleanup
After each scenario:
cart is opened
products are removed
cart is verified empty
Why:
avoid test pollution
keep runs repeatable
support multi-run stability
---
Cleanup Strategy
Cleanup is handled in `After` hooks.
What happens
If scenario fails, a screenshot is captured
Cart is opened
All products are removed
Empty cart state is verified
Browser is closed
Why it matters
This keeps the environment stable across runs.
Without cleanup:
later tests may fail
subtotal may include old products
product verification becomes unreliable
---
Known Limitations
Because Amazon is a live external website, some limitations are unavoidable:
UI can change at any time
product availability can change
some products may appear without direct add-to-cart
brand filters may not always be present
dynamic rendering may occasionally require fallback waits
The project handles this with:
flexible parsing
fallback locators
buying options support
cart-based validation instead of popup-based validation
---
How to Extend the Project
Add more products
Product list is data-driven.
Example:
```ts
export const targetProducts: Product[] = [
  { name: 'Snickers', searchTerm: 'Snickers' },
  { name: 'Skittles', searchTerm: 'Skittles' },
  { name: 'Twix', searchTerm: 'Twix' },
  { name: 'Kit Kat', searchTerm: 'Kit Kat' }
];
```
Add another entry and reuse the same flow.
---
Add more scenarios
You can add more feature files for example:
cart cleanup validation
unauthenticated checkout redirect
product availability checks
different product categories
The architecture already supports extension because page logic, state, and business logic are separated.
---
Add more browsers
Playwright config already supports browser setup.  
The project can be expanded to run broader browser coverage if needed.
---
Summary
This project demonstrates:
real-world UI automation against a dynamic public website
Playwright + TypeScript + Cucumber stack
scalable Page Object Model
separation of concerns
resilient product parsing
cheapest-product selection logic
final business validation in cart
cleanup and session handling
cross-platform support for Windows, Linux, and macOS
The focus of the project is not only “making the test pass”, but building a structure that is readable, maintainable, and extensible.
---
Author
Serghei Patrasco