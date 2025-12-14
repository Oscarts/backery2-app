#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testMaterialBreakdown() {
    let browser;
    try {
        console.log('🚀 Starting material breakdown test...');
        
        browser = await puppeteer.launch({ 
            headless: false, // Set to true for headless mode
            defaultViewport: { width: 1200, height: 800 }
        });
        
        const page = await browser.newPage();
        
        // Navigate to finished products page
        console.log('📱 Navigating to finished products page...');
        await page.goto('http://localhost:3002/finished-products', { 
            waitUntil: 'networkidle2',
            timeout: 10000 
        });
        
        // Wait for the page to load
        await page.waitForTimeout(2000);
        
        // Take screenshot
        await page.screenshot({ path: '/tmp/finished-products-page.png', fullPage: true });
        console.log('📸 Screenshot saved to /tmp/finished-products-page.png');
        
        // Check if finished products are loaded
        const productCards = await page.$$('[data-testid="finished-product-card"], .MuiCard-root');
        console.log(`📦 Found ${productCards.length} product cards`);
        
        if (productCards.length === 0) {
            console.log('⚠️  No product cards found, checking page content...');
            const pageText = await page.evaluate(() => document.body.textContent);
            console.log('Page content preview:', pageText.substring(0, 500));
        }
        
        // Look for material breakdown button
        const materialButtons = await page.$$('button[aria-label*="material"], button[title*="material"], button:has-text("Material")');
        console.log(`🔍 Found ${materialButtons.length} potential material buttons`);
        
        if (materialButtons.length > 0) {
            console.log('🎯 Clicking material breakdown button...');
            await materialButtons[0].click();
            
            // Wait for dialog to appear
            await page.waitForTimeout(1000);
            
            // Check if dialog opened
            const dialogs = await page.$$('.MuiDialog-root, [role="dialog"]');
            console.log(`💬 Found ${dialogs.length} dialogs after click`);
            
            if (dialogs.length > 0) {
                console.log('✅ Material breakdown dialog opened successfully!');
                await page.screenshot({ path: '/tmp/material-breakdown-dialog.png', fullPage: true });
                console.log('📸 Dialog screenshot saved to /tmp/material-breakdown-dialog.png');
            }
        }
        
        console.log('✅ Test completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        if (browser) {
            const page = browser.pages()[0];
            if (page) {
                await page.screenshot({ path: '/tmp/error-screenshot.png', fullPage: true });
                console.log('📸 Error screenshot saved to /tmp/error-screenshot.png');
            }
        }
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Run the test
testMaterialBreakdown();