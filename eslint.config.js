const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['.expo/**', 'dist/**', 'web-build/**', 'node_modules/**'],
  },
  {
    // Les scripts de `scripts/` sont des programmes Node exécutés en CommonJS,
    // et non du code React Native. `expo lint` ne les analyse pas : sans ce
    // bloc, `npx eslint .` échouait sur `__dirname is not defined`.
    files: ['scripts/**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        __dirname: 'readonly',
        __filename: 'readonly',
        console: 'readonly',
        module: 'writable',
        process: 'readonly',
        require: 'readonly',
      },
    },
  },
]);