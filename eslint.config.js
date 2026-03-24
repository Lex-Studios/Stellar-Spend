const path = require("path");
const { createRequire } = require("module");

function requirePackage(packageName) {
  try {
    return require(packageName);
  } catch (localError) {
    const pathEntries = (process.env.PATH || "").split(path.delimiter);

    for (const entry of pathEntries) {
      if (!entry.endsWith(`${path.sep}node_modules${path.sep}.bin`)) {
        continue;
      }

      const nodeModulesDir = path.resolve(entry, "..");

      try {
        const packageRequire = createRequire(path.join(nodeModulesDir, "package.json"));
        return packageRequire(packageName);
      } catch {
        continue;
      }
    }

    throw localError;
  }
}

const tsParser = requirePackage("@typescript-eslint/parser");
const reactHooksPlugin = requirePackage("eslint-plugin-react-hooks");
const reactPlugin = requirePackage("eslint-plugin-react");
const nextPlugin = requirePackage("@next/eslint-plugin-next");

module.exports = [
  {
    ignores: [".next/**", "node_modules/**"],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "@next/next": nextPlugin,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    settings: {
      react: {
        version: "detect",
      },
      next: {
        rootDir: path.resolve(__dirname),
      },
    },
    rules: {
      ...reactPlugin.configs.flat.recommended.rules,
      ...reactPlugin.configs.flat["jsx-runtime"].rules,
      ...reactHooksPlugin.configs["recommended-latest"].rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "react/no-unknown-property": "off",
      "react/prop-types": "off",
    },
  },
];
