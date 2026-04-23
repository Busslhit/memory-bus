# Memory Bus System

A TaskFlow-based memory management system for organizing your memories with structured pages and operations.

## Overview

The Memory Bus is a flexible workflow system designed to:

1. **Organize memories into pages** - Create and store structured memory items
2. **Execute operations** - Perform actions on pages via the memory bus
3. **Manage workflow states** - Use TaskFlow to track progression of tasks
4. **Query and filter** - Search and find relevant memories

## Architecture

### Pages

Each memory is stored as a page with the following structure:

```json
{
  "id": "uuid",
  "name": "Memory Title",
  "category": "work/personal/ideas",
  "timestamp": 1234567890,
  "metadata": {
    "tags": ["urgent", "important"],
    "source": "web",
    "created_by": "user-id"
  }
}
```

### Operations

Operations are functions that act on pages:

- **read** - Query or read a page
- **write** - Create, update, or delete a page
- **delete** - Remove a page
- **query** - Search/filter pages
- **execute** - Execute an operation on matching pages
- **batch** - Execute a batch of operations

### TaskFlow Integration

The Memory Bus leverages TaskFlow's:

- Managed flows for persistent state
- Revision tracking for concurrent modifications
- Waiting/resuming patterns for workflow orchestration
- Task chaining for sequential operations

## Quick Start

### Create a Memory Page

```bash
memory-bus create my-first-note important
```

Or programmatically:

```javascript
import { PagesAPI } from './pages';

const api = await PagesAPI();
const result = await api.executeOperation('create:abc12345678901234567890123456789012345');
console.log(result);
```

### Execute an Operation

```bash
memory-bus execute read abc12345678901234567890123456789012345
```

### List All Pages

```bash
memory-bus list
```

### Query Pages

```bash
memory-bus query read abc12345678901234567890123456789012345 --category work
```

## Usage Examples

### Basic Workflow

1. **Create memory page**
   ```
   memory-bus create my-project important
   ```

2. **Register operation (read)**
   ```
   memory-bus execute read abc12345678901234567890123456789012345
   ```

3. **Set waiting state** (await human input)
   ```
   memory-bus:execute read abc12345678901234567890123456789012345 set waiting --category work
   ```

4. **Resume** (after user confirms)
   ```
   memory-bus:execute read abc12345678901234567890123456789012345 resume
   ```

5. **Finish** when complete
   ```
   memory-bus:execute read abc12345678901234567890123456789012345 finish
   ```

### Query and Filter

```bash
memory-bus list
memory-bus query read abc12345678901234567890123456789012345 --category work
memory-bus query read abc12345678901234567890123456789012345 --since 2024-01-01
```

## API Reference

### PagesAPI

```javascript
import { PagesAPI } from './pages';

const api = new PagesAPI();

// Create operation
await api.executeOperation(
  'create:abc12345678901234567890123456789012345',
  { name: 'My Page', category: 'work' }
);

// Execute read
const result = await api.executeRead(
  'abc12345678901234567890123456789012345',
  'work'
);

// Query search
const { results, total } = await api.search(
  'work',
  '2024-01-01',
  'abc12345678901234567890123456789012345'
);

// Get pages by category
const pages = await api.getPagesByCategory('work');

// Get pages by timestamp
const pages = await api.getPagesBySince('2024-01-01');
```

## Implementation

The implementation includes:

- `pages.js` - Pages API interface
- `implementation.js` - Core memory bus manager
- `cli.js` - Command-line interface
- `taskflowSkill.js` - TaskFlow integration layer
- `memory-bus/SKILL.md` - Skill documentation

## Development

### Adding a New Operation

1. Register in `pages.js`:
   ```javascript
   this.operations.create(name, category) {
     // return operation ID
   }
   ```

2. Add operation in `implementation.js`:
   ```javascript
   if (op.action === 'create') {
     return opId;
   }
   ```

3. Document in `SKILL.md`

## License

MIT License - Feel free to use, modify, and distribute.

---

**Author**: Quintus
**Created**: 2026-04-23
