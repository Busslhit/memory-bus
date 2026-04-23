---
name: memory-bus
description: TaskFlow-based memory bus system with pages and operations
metadata: { "openclaw": { "emoji": "🧠" } }
---

# Memory Bus Skill

This skill provides a complete TaskFlow-based memory bus system for organizing memories with pages and operations.

## Overview

The memory bus skill enables you to:

- Create memory pages with structured metadata
- Register and execute operations on pages
- Query and filter pages by category, date, or ID
- Manage workflow states with TaskFlow (waiting/resuming)
- Track flow state and revision integrity

## Available Commands

### Create Memory Page

Create a new memory page with a unique ID and metadata:

```
memory-bus create [name] [category] [properties]
```

**Parameters:**
- `name`: Human-readable name for the memory
- `category`: Memory category (`work`, `personal`, `ideas`, `projects`, `learned`, `health`, `other`)
- `properties`: Flexible properties for the page

**Example:**
```
memory-bus create my-project important --category work
```

### Execute Operation

Execute an operation (read/write/delete) on one or more pages:

```
memory-bus execute [operation-id] [options]
```

**Example:**
```
memory-bus execute create:abc12345678901234567890123456789012345 write --category work
```

**Options:**
- `--category CATEGORY` - Filter to specific category
- `--since TIMESTAMP` - Filter by creation timestamp
- `--page ID` - Execute on specific page
- `--batch` - Execute batch operations

### Query Operation

Query the result of an operation and filter pages:

```
memory-bus query [operation-id] [category-filter]
```

**Example:**
```
memory-bus query read abc12345678901234567890123456789012345 --category work
```

**Examples:**
```
memory-bus query read abc12345678901234567890123456789012345 --category work
memory-bus query create:abc12345678901234567890123456789012345 --category work
memory-bus query read abc12345678901234567890123456789012345 --since 2024-01-01
```

### List All Pages

List all memory pages:

```
memory-bus list
```

### Get Bus State

View the current memory bus state:

```
memory-bus get-state
```

## Operations Reference

### create
Create a new memory page. Returns the operation ID that can be used to reference the page.

### read
Read or query a page. Returns the page ID and any filtering metadata.

### write
Create, update, or modify a page.

### delete
Remove a page from storage.

### execute
Execute an operation on pages matching the query criteria.

### batch
Execute a batch of operations on multiple pages.

## API Usage

### Programmatic Usage

```javascript
// Initialize the skill
const taskFlow = api.runtime.tasks.flow;

// Create memory bus flow
const flow = await createMemoryBusFlow({
  controllerId: 'memory-bus-system',
  goal: 'organize memories',
  stateJson: {
    pages: [],
    operations: [],
    queries: []
  }
});

// Run a task on the flow
const child = await runMemoryBusTask({
  flowId: flow.id,
  childSessionKey: 'agent:main:memory-bus',
  task: 'Create memory page',
  status: 'running',
  startedAt: Date.now(),
});

// Set waiting for human input
const waiting = await setMemoryBusWaiting({
  flowId: flow.id,
  currentStep: 'await_input',
  waitJson: {
    kind: 'confirm',
    operationId: 'read:abc12345678901234567890123456789012345'
  }
});

// Execute the operation
await executeMemoryBusOperation({
  operationId: 'read:abc12345678901234567890123456789012345',
  action: 'read',
  params: {},
  targetPages: [flow.id],
  status: 'running',
  startedAt: Date.now()
});

// Resume when complete
await resumeMemoryBusFlow({
  flowId: waiting.flowId,
  expectedRevision: waiting.flow.revision,
  currentStep: 'finished',
  stateJson: waiting.flow.stateJson
});

// Finish the flow
await finishMemoryBusFlow({
  flowId: waiting.flow.flowId,
  expectedRevision: waiting.flow.revision,
  stateJson: waiting.flow.stateJson
});
```

## Usage Examples

### 1. Simple Memory Creation

```bash
# Create a memory page
memory-bus create my-urgent-note urgent
```

### 2. Execute Read Operation

```bash
# Execute a read operation on a page
memory-bus execute read abc12345678901234567890123456789012345
```

### 3. Query and Filter

```bash
# Query operation by ID
memory-bus query read abc12345678901234567890123456789012345 --category work
```

### 4. Batch Operations

```bash
# Execute create operation on multiple pages
memory-bus execute create:abc12345678901234567890123456789012345 batch
```

### 5. List All Pages

```bash
# List all memory pages
memory-bus list
```

## File Structure

```
memory-bus/
├── SKILL.md                 # Skill documentation
├── README.md                # User guide
├── pages.json               # Page schema
├── operations.json          # Operation schema
├── memory-bus-index.json    # System metadata
├── cli.js                   # Command-line interface
├── implementation.js        # Core manager
├── pages.js                 # Pages API
└── taskflowSkill.js         # TaskFlow integration
```

## Design Decisions

### Why TaskFlow?

TaskFlow provides:
- **Persistent state** across prompts
- **Revision tracking** for concurrent mutations
- **Waiting patterns** for workflow orchestration
- **Task linking** for child-task relationships

### Page Structure

Pages store:
- **id**: UUID (auto-generated by system)
- **name**: Human-readable name
- **category**: 7-character category string
- **timestamp**: Unix timestamp
- **metadata**: Flexible properties

### Operation Design

Operations are atomic and atomic on the page list:
- Each operation acts on pages in batch
- Operations can read, create, delete, or execute other operations
- State persists across operation execution

### Waiting State

Workflow orchestration uses TaskFlow waiting:
- Blocks execution until confirmation
- Stores human feedback in waitJson
- Allows graceful termination

## Integration Examples

### Combining with Other Tasks

```javascript
import { MemoryBusManager } from './implementation';

const memoryBus = new MemoryBusManager();

// Start the memory bus
const flow = memoryBus.createManaged('memory-bus');

// Create operations and execute them
await memoryBus.runTask({
  flowId: flow.flowId,
  childSessionKey: 'agent:main:memory-bus',
  task: 'Create memory pages',
  status: 'running',
  startedAt: Date.now(),
});

// Set up workflow: create pages, then wait for confirmation
await memoryBus.setWaiting({
  flowId: flow.flowId,
  currentStep: 'await_input',
  waitJson: {
    kind: 'confirm',
    targetPages: ['memory-bus']
  }
});

// Execute read operation
await memoryBus.resume({
  flowId: flow.flowId,
  currentStep: 'execute',
  stateJson: flow.stateJson,
});
```

## Limitations

1. **Not persistent across sessions** - State is ephemeral within TaskFlow session
2. **Single flow** - All operations share the same flow ID
3. **Basic query support** - No complex filtering (would need database or separate API)

## Troubleshooting

### Issue: "Memory bus not initialized"
**Solution**: Call `createMemoryBusFlow()` or `memoryBus.createManaged()` before running tasks.

### Issue: Operations failing
**Solution**: Check that target pages exist and operation parameters are valid.

### Issue: Waiting not accepting
**Solution**: Ensure `waitJson` contains all required fields (`kind`, `operationId`, `targetPages`).

## Contributing

To add a new operation or command:
1. Add to `operations.json`
2. Register in `implementation.js`
3. Update `SKILL.md`

---

**Author**: Quintus
**Version**: 1.0.0
