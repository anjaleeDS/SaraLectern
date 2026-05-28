import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Suppress React act() warnings in tests
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Mock import.meta.env
vi.stubGlobal('import', {
  meta: {
    env: {
      VITE_ANTHROPIC_API_KEY: 'sk-ant-test-key',
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    },
  },
});
