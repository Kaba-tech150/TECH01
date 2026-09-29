const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    /*
     * `dist-web/**` EST ICI POUR UNE RAISON MESURÉE.
     *
     * `npx expo export --output-dir dist-web` écrit un bundle MINIFIÉ, et ce
     * répertoire est gitignoré — mais il n'était pas ignoré d'ESLint. Le
     * premier export suffisait donc à faire échouer `npx eslint .` avec
     * plusieurs milliers d'erreurs sur des symboles minifiés (`__r is not
     * defined`), alors que le code source était sain.
     *
     * C'est le pire genre de défaut : il ne se voit qu'après une étape de
     * vérification, il rend le signal vert/rouge illisible, et il aurait été
     * pris pour une régression du code.
     */
    ignores: ['.expo/**', 'dist/**', 'dist-web/**', 'web-build/**', 'node_modules/**'],
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