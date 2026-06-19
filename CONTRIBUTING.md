# 🤝 Contributing to Solar ഉണ്ടോ?

First off, thanks for taking the time to contribute! 🎉

We welcome community contributions to make "Solar ഉണ്ടോ?" better, more accurate, and easier to use for everyone in Kerala. 

## 📝 How to Contribute

### 1. Report Bugs
If you find a bug, please create an issue on GitHub. Include:
- A clear, descriptive title.
- Steps to reproduce the issue.
- Your browser and OS.
- Any relevant screenshots or error logs.

### 2. Suggest Features
Have an idea to improve the app? Create a feature request issue! Explain why the feature would be useful and how it should work.

### 3. Submit Pull Requests (Code & Documentation)
If you're ready to write code or improve documentation:

1. **Fork the repository** to your own GitHub account.
2. **Clone** it locally: `git clone https://github.com/yourusername/solar-undo.git`
3. **Create a new branch** for your feature or bugfix: `git checkout -b feature/my-new-feature`
4. **Make your changes** and test them locally using `npm run dev`.
5. **Commit your changes** with clear, descriptive commit messages: `git commit -m "Add some feature"`
6. **Push to the branch**: `git push origin feature/my-new-feature`
7. **Open a Pull Request** against the `main` branch.

## 🛠️ Development Guidelines

- **UI/UX**: We use `shadcn/ui` and `Tailwind CSS v4`. Please ensure any new components align with the existing design system (e.g., maintaining the sleek, mobile-first aesthetic and proper dark mode support).
- **Type Safety**: This is a TypeScript project. Ensure all new code is strictly typed and resolves without `any` wherever possible.
- **Linting**: Before committing, run `npm run lint` to ensure your code matches our ESLint configuration.
- **Data Privacy**: Never log or store user consumer numbers or PII (Personally Identifiable Information) anywhere in the application logic. 

## 🗺️ Code Structure

- `/src/app`: Next.js App Router pages and API routes.
- `/src/components`: Reusable React components (shadcn ui, forms, layouts).
- `/src/features`: Domain-specific business logic (solar, transformer, consumer).
- `/src/lib` & `/src/utils`: Helper functions, configurations, and utilities.

For deeper insights, read our [ARCHITECTURE.md](./ARCHITECTURE.md).

Thank you for helping make Solar ഉണ്ടോ? amazing! ☀️
