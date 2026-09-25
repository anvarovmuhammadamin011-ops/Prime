import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

const activeFiles = [
  'vite.config.js',
  'src/App.jsx',
  'src/main.jsx',
  'src/auth/**/*.jsx',
  'src/api/**/*.js',
  'src/telegram/**/*.js',
  'src/club/**/*.{js,jsx}',
  'src/components/AdminLayout.jsx',
  'src/components/AdminMobileNav.jsx',
  'src/components/Icons.jsx',
  'src/components/Layout.jsx',
  'src/components/MobileNav.jsx',
  'src/pages/Home.jsx',
  'src/pages/Login.jsx',
  'src/pages/Profile.jsx',
  'src/pages/admin/Bookings.jsx',
  'src/pages/admin/Computers.jsx',
  'src/pages/admin/Dashboard.jsx',
  'src/pages/admin/Settings.jsx',
  'src/pages/admin/Users.jsx',
  'src/pages/user/Bookings.jsx',
]

const serverFiles = ['server/**/*.js']

export default defineConfig([
  {
    ignores: ['dist/**', 'coverage/**'],
  },
  {
    files: serverFiles,
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.node,
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: activeFiles,
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.flat.recommended.rules,
      'react/jsx-uses-vars': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'react-refresh/only-export-components': 'off',
    },
  },
])
