Playwright Tests (Amazon Case Study)
Automation project built with Playwright + TypeScript + Cucumber (BDD).
This project validates a real user flow:
searching for products
selecting the cheapest one
adding products to the cart
verifying the subtotal
---
🏃 Running Tests Locally
Prerequisites
Make sure the following tools are installed:
Node.js v18+
npm or yarn
Check installed versions:
```bash
node -v
npm -v
```
---
⚙️ Setup
Clone the repository
```bash
git clone https://github.com/SerhioE1/amazon-playwright-case-study.git
```
Install dependencies
```bash
npm install
```
Optional manual install:
```bash
npm install -D typescript ts-node @types/node
npm install -D playwright @playwright/test
npm install -D @cucumber/cucumber
npm install -D dotenv
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier eslint-config-prettier eslint-plugin-prettier
npm install -D rimraf cross-env
```
Install Playwright browsers
```bash
npx playwright install
```
For CI / Linux:
```bash
npx playwright install --with-deps
```
---
🔐 Environment Variables
Create a `.env` file in the root:
```env
BASE_URL=https://www.amazon.com
HEADED=false

AMAZON_EMAIL=
AMAZON_PASSWORD=

STORAGE_STATE_PATH=storageState.json
```
Authentication is optional.
---
▶️ Running Tests
Run tests (headless):
```bash
npm run test:bdd
```
Run with UI:
```bash
npm run test:bdd:headed
```
Debug mode:
```bash
npm run test:bdd:debug
```
---
📊 Reports
After execution:
reports/
├── cucumber-report.json
└── cucumber-report.html
Open HTML report to see results.
---
📁 Project Structure
src/
pages/  
components/  
services/  
models/
features/  
steps/  
support/
---
🔄 CI/CD
Basic pipeline:
Install dependencies
Install Playwright browsers
Run tests
Upload reports
---
⚠️ Notes
Amazon is a live website
UI and prices may change
Some flows may vary
The project handles this using fallback logic and cart-based validation.
---
🧑‍💻 Author
Serghei Patrasco