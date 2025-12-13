import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration for RapidPro Bakery App
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    testDir: './e2e',

    /* Run tests in files in parallel */
    fullyParallel: true,

    /* Fail the build on CI if you accidentally left test.only in the source code */
    forbidOnly: !!process.env.CI,

    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,

    /* Reporter to use */
    reporter: [
        ['html', { outputFolder: 'playwright-report' }],
        ['list']
    ],

    /* Shared settings for all projects below */
    use: {
        /* Base URL to use in actions like `await page.goto('/')` */
        baseURL: process.env.E2E_BASE_URL || 'http://localhost:3002',

        /* Collect trace when retrying the failed test */
        trace: 'on-first-retry',

        /* Screenshot on failure */
        screenshot: 'only-on-failure',

        /* Video recording */
        video: 'retain-on-failure',
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        // Uncomment for additional browser testing
        // {
        //   name: 'firefox',
        //   use: { ...devices['Desktop Firefox'] },
        // },
        // {
        //   name: 'webkit',
        //   use: { ...devices['Desktop Safari'] },
        // },
    ],

    /* Run your local dev server before starting the tests */
    webServer: process.env.CI ? undefined : {
        command: 'npm run dev',
        url: 'http://localhost:3002',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
    },

    /* Global timeout for each test */
    timeout: 30 * 1000,

    /* Expect timeout */
    expect: {
        timeout: 5 * 1000,
    },
});
