import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@domain': path.resolve(__dirname, './domain'),
      '@': path.resolve(__dirname, './frontend/src')
    }
  },
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['domain/rules/**/*.ts'],
      exclude: ['**/*.test.ts']
    }
  }
})
