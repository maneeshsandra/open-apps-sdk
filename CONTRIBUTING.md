# Contributing to Open Apps SDK

Thank you for your interest in contributing to the Open Apps SDK! This document outlines the contribution process and guidelines.

## Understanding the Project Intent

Before contributing, please take time to understand the core purpose of the Open Apps SDK:

**Open Apps SDK** is a framework for building LLM-agnostic conversational applications with custom UI components and MCP (Model Context Protocol) servers. It enables developers to:

- Build rich, interactive apps that work with any LLM (Claude, GPT, Gemini, etc.)
- Maintain full control over UI components and data
- Connect to multiple MCP servers seamlessly
- Create type-safe, React-based conversational interfaces

The SDK emphasizes:
- **LLM Agnosticism**: No vendor lock-in
- **Component Ownership**: Developers control their UI
- **MCP Integration**: Standardized tool calling
- **Developer Experience**: TypeScript, React, Bun-powered

## Contribution Process

### 1. Create an Issue First

**Always create an issue before starting work.** This ensures:

- Your contribution aligns with project goals
- No duplicate work
- Proper discussion and planning
- Clear acceptance criteria

**Issue Types:**
- 🐛 **Bug Report**: Something isn't working
- ✨ **Feature Request**: New functionality
- 📚 **Documentation**: Improvements or additions
- 🔧 **Enhancement**: Improvements to existing features
- ❓ **Question**: General inquiries

### 2. Development Workflow

Once your issue is approved:

1. **Fork the repository**
2. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-number-description
   # or
   git checkout -b docs/add-hooks-documentation
   ```
3. **Make your changes** following our coding standards
4. **Test thoroughly** - run `bun test` and `bun run typecheck`
5. **Update documentation** if needed
6. **Commit with clear messages**:
   ```bash
   git commit -m "feat: add new hook for component state management

   - Implements useComponentState hook
   - Adds TypeScript types
   - Includes comprehensive tests
   - Updates documentation

   Closes #123"
   ```

### 3. Pull Request Process

1. **Push your branch** to your fork
2. **Create a Pull Request** targeting the `main` branch
3. **Fill out the PR template** completely
4. **Request review** from maintainers
5. **Address feedback** and make requested changes
6. **Wait for approval** and merge

### Branch Naming Convention

- `feature/description-of-feature`
- `fix/issue-number-description`
- `docs/add-documentation`
- `refactor/component-improvements`
- `test/add-unit-tests`

### Commit Message Format

We follow conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance

**Examples:**
```
feat: add useComponentState hook
fix: resolve WebSocket connection issue
docs: update hooks documentation
test: add unit tests for component registry
```

## Code Guidelines

### TypeScript
- Strict TypeScript usage
- Proper type definitions for all exports
- Use interfaces over types for public APIs

### React Components
- Functional components with hooks
- Proper TypeScript typing
- Consistent naming conventions
- Accessibility considerations

### MCP Servers
- Follow MCP protocol standards
- Proper error handling
- Structured content for component integration
- Clear tool descriptions

### Testing
- Unit tests for utilities and hooks
- Integration tests for MCP servers
- Component testing with React Testing Library
- 80%+ code coverage target

### Documentation
- JSDoc comments for public APIs
- README updates for new features
- Example code in documentation
- Clear installation and usage instructions

## Development Setup

```bash
# Clone and setup
git clone https://github.com/maneeshsandra/open-apps-sdk.git
cd open-apps-sdk
bun run setup

# Development
bun run dev          # Start dev server
bun run build        # Build for production
bun run test         # Run tests
bun run typecheck    # Type checking
```

## Code Review Process

All PRs require review. Reviewers will check for:

- ✅ Code quality and style
- ✅ Test coverage
- ✅ Documentation updates
- ✅ Breaking changes clearly marked
- ✅ Performance implications
- ✅ Security considerations

## Recognition

Contributors are recognized through:
- GitHub contributor statistics
- Mention in release notes
- Attribution in documentation

## Questions?

- Check existing issues and documentation first
- Create a discussion for questions
- Join our community chats

Thank you for contributing to Open Apps SDK! 🚀