# Contributing to Stellar Spend

Thank you for your interest in contributing to Stellar Spend! This document provides guidelines and information for contributors.

## Development Environment Setup

### Prerequisites

- Node.js 18+ and npm
- Git

### Getting Started

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/your-username/stellar-spend.git
   cd stellar-spend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Verify formatting and linting**
   ```bash
   npm run format:check
   npm run lint
   ```

## Branch Naming Conventions

Use descriptive branch names with the following prefixes:

- `feat/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `style/` - Code style changes (formatting, etc.)
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests
- `chore/` - Maintenance tasks

**Examples:**

- `feat/add-stellar-wallet-integration`
- `fix/paycrest-webhook-validation`
- `docs/update-api-documentation`

## Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/) for consistent commit messages:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, missing semicolons, etc.)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks
- `ci` - CI/CD changes

### Examples

```bash
feat: add Stellar wallet connection
fix: resolve Paycrest webhook signature validation
docs: update environment setup instructions
style: format code with Prettier
refactor: extract common validation logic
test: add unit tests for bridge adapter
chore: update dependencies
```

## Pull Request Process

1. **Create a feature branch** from `main`

   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes** following the coding standards
   - Write clear, self-documenting code
   - Add comments for complex logic
   - Follow TypeScript best practices
   - Ensure proper error handling

3. **Test your changes**

   ```bash
   npm run format:check
   npm run lint
   npm run build
   ```

4. **Commit your changes** using conventional commit format

   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

5. **Push to your fork**

   ```bash
   git push origin feat/your-feature-name
   ```

6. **Create a Pull Request**
   - Use a clear, descriptive title
   - Reference any related issues
   - Provide a detailed description of changes
   - Include screenshots for UI changes

### PR Requirements

- [ ] Code follows the project's coding standards
- [ ] All tests pass
- [ ] Code is properly formatted (`npm run format:check`)
- [ ] No linting errors (`npm run lint`)
- [ ] Commit messages follow conventional format
- [ ] PR description clearly explains the changes

## Code Style Guidelines

### TypeScript

- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid `any` type when possible
- Use meaningful variable and function names

### React/Next.js

- Use functional components with hooks
- Follow React best practices
- Use proper error boundaries
- Implement proper loading states

### Environment Variables

- Use the centralized `src/lib/env.ts` module
- Never import server-side vars in client components
- Add new variables to `.env.example`

### Formatting

- Code is automatically formatted with Prettier on save
- Use single quotes for strings
- 100 character line limit
- Trailing commas in multi-line structures

## Project Structure

```
src/
├── app/                 # Next.js app router
│   ├── api/            # API routes
│   └── ...
├── hooks/              # React hooks
├── lib/                # Utility libraries
│   ├── env.ts         # Environment configuration
│   ├── offramp/       # Offramp logic
│   └── stellar/       # Stellar integration
└── types/              # TypeScript type definitions
```

## Getting Help

- Check existing issues and discussions
- Create a new issue for bugs or feature requests
- Join our community discussions
- Review the project documentation

## Code of Conduct

Please note that this project is released with a [Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

Thank you for contributing to Stellar Spend! 🚀
