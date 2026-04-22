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
Environment Variables
Installation
Running Tests
CI Pipeline
Cross-Platform Support
Reports
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
---
Covered Scenario
Main scenario:
As a new Amazon user, I want to search for the cheapest products, add them to the cart, and verify that the cart subtotal is calculated correctly.
Flow:
Open Amazon homepage
Accept cookie banner if needed
Search for a product
Sort by Price: Low to High
Parse product cards
Select the cheapest product
Add product to cart
Handle Buying Options fallback if needed
Open cart
Validate subtotal
Clean cart
---
Tech Stack
Playwright
TypeScript
Cucumber (BDD)
Node.js
dotenv
---
Project Structure
src/
components/
models/
pages/
services/
utils/
features/
steps/
support/
reports/
---
Environment Variables
Create .env file:
BASE_URL=https://www.amazon.com
HEADED=false
AMAZON_EMAIL=
AMAZON_PASSWORD=
STORAGE_STATE_PATH=storageState.json
---
Installation
npm install
npx playwright install
---
Running Tests
npm run test:bdd
npm run test:bdd:headed
npm run test:bdd:debug
---
CI Pipeline
GitHub Actions pipeline includes:
install dependencies
install browsers
run tests
upload reports
---
Cross-Platform Support
Works on Windows, Linux, macOS.
---
Reports
Reports are generated in reports/ folder.
---
Design Decisions
Page Object Model
Service Layer
Cart-based validation
Fallback selectors
Cleanup after tests
---
Cleanup Strategy
Cart is cleared after each test.
---
Known Limitations
Amazon UI changes frequently
product availability varies
---
How to Extend
Add new products or scenarios.
---
Summary
Scalable and maintainable automation project.
---
Author
Serghei Patrasco