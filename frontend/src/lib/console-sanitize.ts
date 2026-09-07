'use client';

const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  const originalConsoleError = console.error.bind(console);
  console.error = (...args: any[]) => {
    // Only log non-error messages in production
    originalConsoleError('[Error]', typeof args[0] === 'string' ? args[0].slice(0, 200) : 'An error occurred');
  };

  const originalConsoleWarn = console.warn.bind(console);
  console.warn = (...args: any[]) => {
    if (typeof args[0] === 'string') {
      originalConsoleWarn('[Warn]', args[0].slice(0, 200));
    }
  };
}
