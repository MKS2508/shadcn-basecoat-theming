import 'fake-indexeddb/auto';

// Mock localStorage
const localStorageMock = {
  data: {} as Record<string, string>,
  getItem: vi.fn((key: string) => localStorageMock.data[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageMock.data[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageMock.data[key];
  }),
  clear: vi.fn(() => {
    localStorageMock.data = {};
  }),
  key: vi.fn((index: number) => Object.keys(localStorageMock.data)[index] || null),
  get length() {
    return Object.keys(localStorageMock.data).length;
  }
};

// Mock fetch API
const fetchMock = vi.fn();

// Mock performance API
const performanceMock = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn(() => []),
  getEntriesByType: vi.fn(() => [])
};

// Mock requestIdleCallback
const requestIdleCallbackMock = vi.fn((callback: IdleRequestCallback) => {
  setTimeout(callback, 0);
  return 1;
});

// Mock window.matchMedia
const matchMediaMock = vi.fn((query: string) => ({
  matches: query === '(prefers-color-scheme: dark)',
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn()
}));

// Global mocks
global.localStorage = localStorageMock;
global.sessionStorage = localStorageMock;
global.fetch = fetchMock;
global.performance = performanceMock;
global.requestIdleCallback = requestIdleCallbackMock;
global.cancelIdleCallback = vi.fn();

// Window mocks
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock  
});

Object.defineProperty(window, 'fetch', {
  value: fetchMock
});

Object.defineProperty(window, 'performance', {
  value: performanceMock
});

Object.defineProperty(window, 'requestIdleCallback', {
  value: requestIdleCallbackMock
});

Object.defineProperty(window, 'matchMedia', {
  value: matchMediaMock
});

// Mock CSS loading helper
export const mockCSSResponse = (cssContent: string) => {
  fetchMock.mockResolvedValueOnce({
    ok: true,
    status: 200,
    text: async () => cssContent,
    json: async () => ({}),
    blob: async () => new Blob([cssContent], { type: 'text/css' })
  });
};

// Mock theme CSS content
export const mockThemeCSS = `:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --secondary: 210 40% 96%;
}`;

// Helper to reset all mocks
export const resetAllMocks = () => {
  vi.clearAllMocks();
  localStorageMock.clear();
  localStorageMock.data = {};
};