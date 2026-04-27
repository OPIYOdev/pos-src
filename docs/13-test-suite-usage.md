# 13. Test Suite Usage Guide

This document provides a comprehensive guide on how to set up, run, and interpret the results of the Pharmacy POS System's test suite. The test suite is designed to ensure the full functionality and reliability of all implemented modules, including Sales & Billing, Inventory Management, Prescription Management, Customer & Credit Management, Insurance & Claims, Financial & Accounting, and the Multi-Branch Reallocation Module.

---

## 1. Prerequisites

Before running the test suite, ensure you have the following installed:

*   **Node.js (v18.0.0 or higher):** The runtime environment for the application and test suite.
*   **npm (Node Package Manager):** Used to install project dependencies. Usually comes bundled with Node.js.
*   **MySQL Database:** A running MySQL instance is required as the tests interact with the database models. Ensure your `.env` file (or environment variables) are configured correctly for database connection.

---

## 2. Environment Setup

1.  **Clone the Repository:**
    If you haven't already, clone the `pos-src` repository from GitHub:
    ```bash
    git clone https://github.com/OPIYOdev/pos-src.git
    cd pos-src
    ```

2.  **Install Dependencies:**
    Navigate to the project root directory and install all required Node.js packages:
    ```bash
    npm install
    ```

3.  **Database Configuration:**
    Ensure your database connection details are correctly set up. You can create a `.env` file in the project root based on the `.env.example` provided:
    ```bash
    cp .env.example .env
    # Edit .env with your MySQL credentials
    ```
    The tests assume a database named `pharmacy_pos` is accessible with the provided credentials.

4.  **Database Schema:**
    Apply the necessary SQL schemas to your database. This includes the base schema, additions, and the transfer schema:
    ```bash
    mysql -u <your_db_user> -p<your_db_password> pharmacy_pos < sql/schema.sql
    mysql -u <your_db_user> -p<your_db_password> pharmacy_pos < sql/schema_additions.sql
    mysql -u <your_db_user> -p<your_db_password> pharmacy_pos < sql/transfer_schema.sql
    ```
    *Note: Replace `<your_db_user>` and `<your_db_password>` with your actual database credentials.* 

---

## 3. Running the Test Suite

The test suite uses `jest` as its testing framework. To run all tests, execute the following command from the project root directory:

```bash
npm test
```

This command will execute all files ending with `.test.js` within the `tests/` directory.

---

## 4. Interpreting Test Results

After running `npm test`, the console output will display a summary of the test execution. Key information includes:

*   **Test Suites:** Number of test files executed.
*   **Tests:** Total number of individual test cases, indicating how many passed, failed, or were skipped.
*   **Time:** Duration of the test run.

### Example Output:

```
Test Suites: 1 passed, 1 total
Tests:       43 passed, 43 total
Snapshots:   0 total
Time:        0.551 s
Ran all test suites.
```

*   **`✅ [Test Name]`**: Indicates a successful test case.
*   **`❌ [Test Name]`**: Indicates a failed test case. Details of the failure (e.g., assertion errors, stack trace) will be provided below the summary.

If all tests pass, it confirms that the core functionalities and the multi-branch reallocation module are working as expected according to their defined logic and requirements.

---

## 5. Troubleshooting

*   **`npm install` errors:** Check your Node.js and npm versions. Ensure you have a stable internet connection.
*   **Database connection errors:** Verify your `.env` file settings (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`) and ensure your MySQL server is running and accessible.
*   **Test failures:** Review the detailed error messages in the console output. These messages will point to the specific test case and assertion that failed, helping you pinpoint the issue in the code.
*   **Missing tables/columns:** Ensure you have applied all SQL schema files (`schema.sql`, `schema_additions.sql`, `transfer_schema.sql`) to your database.

---

## 6. Extending the Test Suite

To add new tests for future features or modifications, create new `.test.js` files within the `tests/` directory. Follow the existing structure and use `assert` or `jest` matchers to define your test cases. This ensures maintainability and consistency across the test suite.

---

*This document is part of the Pharmacy POS System Procedures Manual.*
