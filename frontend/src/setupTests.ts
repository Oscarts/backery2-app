import '@testing-library/jest-dom';
import React from 'react';

// Make React available globally in test environment with all its properties
global.React = React;
if (typeof React.forwardRef === 'undefined') {
    React.forwardRef = (fn: any) => fn;
}

// Global setup for all tests
global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

// Mock for window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});
