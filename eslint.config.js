import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'node_modules', 'src/mocks']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      // Разрешаем неиспользуемые переменные с префиксом _
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      // Разрешаем any только с предупреждением
      '@typescript-eslint/no-explicit-any': 'warn',
      // Требуем явные типы возврата только для экспортируемых функций
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      // React 18+ — JSX без импорта React
      'react-refresh/only-export-components': ['warn', {
        allowConstantExport: true,
      }],
    },
  },
])
