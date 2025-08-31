# Bakery Inventory Management System - Documentation

## 📚 Documentation Overview

This documentation provides everything you need to understand, develop, and maintain the Bakery Inventory Management System.

## 🚀 Quick Start for Developers

### Before You Start Coding

**MANDATORY READING ORDER:**

1. **[Project Overview](./project-overview.md)** - Understand what we're building and current status
2. **[Development Guidelines](./development-guidelines.md)** - Critical coding standards and testing requirements
3. **[Technical Architecture](./technical-architecture.md)** - System structure and technology stack
4. **[API Reference](./api-reference.md)** - Backend endpoints and data models
5. **[UI Guidelines](./ui-guidelines.md)** - Frontend patterns and design standards
6. Optional references:
	- [Changelog](./CHANGELOG.md)
	- [Publish checklist](./publish.md)
	- [API Testing docs](./testing/api-test-troubleshooting.md)
	- [API Test fixes](./testing/api-test-fixes.md)
	- [AI Agent Playbook](./ai-agent-playbook.md)
	- [Environment & Configuration](./env.md)
	- [Contributing Guide](./CONTRIBUTING.md)
	- [Test Strategy](./testing/test-strategy.md)
	- OpenAPI spec: `./openapi.yaml`

### Development Workflow

1. Read the relevant documentation sections
2. Check current status in [Development Progress](./development-progress.md)
3. Follow coding guidelines and testing requirements
4. Update documentation when adding features
5. Run tests before committing changes

## 📁 Document Structure

| Document | Purpose | When to Update |
|----------|---------|----------------|
| **project-overview.md** | High-level project description, features, and current status | After major milestones |
| **development-guidelines.md** | Coding standards, testing requirements, and mandatory practices | When adding new standards |
| **technical-architecture.md** | System architecture, database schema, and technology stack | When changing architecture |
| **api-reference.md** | Backend API endpoints, data models, and usage examples | When adding/modifying APIs |
| **ui-guidelines.md** | Frontend patterns, component standards, and design guidelines | When creating new UI patterns |
| **development-progress.md** | Feature completion tracking and development history | After every feature completion |
| **CHANGELOG.md** | Versioned summary of notable changes | On every release-worthy change |
| **publish.md** | Steps to deploy/publish | Before each release |
| **testing/** | Test playbooks and troubleshooting | When tests change |

## 🎯 Key Principles

- **Always use Real API** - Never mock data, always connect to actual database
- **Test-Driven Development** - Every feature must have unit tests
- **Documentation First** - Read docs before coding, update docs after coding
- **Consistency** - Follow established patterns for UI, API, and code structure

## 🚨 Critical Guidelines

- Backend server must be running on `http://localhost:8000`
- Frontend uses `realApi.ts` - never `mockApi.ts`
- All features require unit tests before marking as complete
- Update development progress tracking after every completed feature

## 📞 Need Help?

Check the relevant documentation section first. If the information isn't there, it should be added to maintain project knowledge.
