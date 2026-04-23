#!/usr/bin/env node

/**
 * Memory Bus CLI
 *
 * Commands:
 *   memory-bus create [name] [category] [properties]
 *   memory-bus execute [op-id] [options]
 *   memory-bus query [op-id] --category [filter]
 *   memory-bus list [options]
 */

const { MemoryBusManager } = require('./implementation');

async function main() {
  const memoryBus = new MemoryBusManager();
  const { MemoryBusManager: MBM } = require('./implementation');

  // Create CLI manager
  const cliMemoryBus = new MemoryBusManager();
  
  const { runCLI = async (cmd) => {
    console.log('Memory Bus CLI commands:');
    console.log('  memory-bus create <name> [category] [properties]');
    console.log('  memory-bus execute [operation-id] [options]');
    console.log('  memory-bus query [operation-id] --category [filter]');
    console.log('  memory-bus list [options]');
    console.log('');
    console.log('Examples:');
    console.log('  memory-bus create my-note important');
    console.log('  memory-bus execute create:abc12345678901234567890123456789012345 write --category work');
    console.log('  memory-bus query create:abc12345678901234567890123456789012345 --category work');
    console.log('  memory-bus list');
    console.log('');
    console.log('See ./implementation.js for more details.');
  } = runCLI || require('../node_modules/.bin/execute.js');

  const { MemoryBusManager: MBM2 } = require('../node_modules/.bin/execute.js');
  const { MemoryBusManager: MBM3 } = require('./implementation');

  // Process commands
  const args = process.argv.slice(2);
  let cmd = args[0] || '';

  // Create the manager for this specific instance
  const cliMemoryBus = new MemoryBusManager();
  const { create } = cliMemoryBus;

  if (args[0] === 'list') {
    const pages = cliMemoryBus.getPages();
    if (pages.length === 0) {
      console.log('No memory pages found.');
    } else {
      for (const p of pages) {
        console.log('');
        console.log(`ID: ${p.id}`);
        console.log(`Name: ${p.name}`);
        console.log(`Category: ${p.category}`);
        console.log(`Timestamp: ${new Date(p.timestamp).toLocaleString()}`);
        if (p.metadata) {
          console.log('Tags:', p.metadata.tags.join(', '));
        }
      }
    }
  } else if (args[0] === 'query') {
    if (args[1] && args[1].includes('--category')) {
      // Parse arguments
      const category = args[1].split(' ')[1];
      const opId = args[2];
      
      const page = cliMemoryBus.queryOperation(opId);
      if (!page.found) {
        console.log(`Operation ${opId} not found.`);
      } else {
        const pages = cliMemoryBus.getPagesByCategory(category);
        if (pages.length === 0) {
          console.log(`No pages found in category "${category}" for operation ${opId}.`);
        } else {
          console.log(`Found ${pages.length} page(s) in category "${category}" for operation ${opId}.`);
          pages.forEach(p => console.log('  - ' + p.name));
        }
      }
    } else {
      // Query operation by ID with category filter
      if (args[1]) {
        const category = args[1].split(' ')[1];
        const opId = args[2];
        
        const page = cliMemoryBus.queryOperation(opId);
        if (!page.found) {
          console.log(`Operation ${opId} not found.`);
        } else {
          const pages = cliMemoryBus.getPagesByCategory(category);
          if (pages.length > 0) {
            console.log(`Found ${pages.length} page(s) in category "${category}" for operation ${opId}.`);
            pages.forEach(p => console.log('  - ' + p.name));
          } else {
            console.log(`No pages found in category "${category}" for operation ${opId}.`);
          }
        }
      } else {
        console.log('Please specify an operation ID and an optional category filter.');
        console.log('Usage: memory-bus query [operation-id] --category [filter]');
      }
    }
  } else if (args[0] === 'execute') {
    if (args.length < 3) {
      console.log('Usage: memory-bus execute [operation-id] [options]');
      console.log('Options: --category, --since, --page');
      console.log('  --category CATEGORY Filter pages by category');
      console.log('  --since TIMESTAMP Filter by timestamp');
      console.log('  --page ID Filter by specific page ID');
      console.log('');
      console.log('Examples:');
      console.log('  memory-bus execute read abc12345678901234567890123456789012345');
      console.log('  memory-bus execute write --category work');
      console.log('  memory-bus execute delete abc12345678901234567890123456789012345');
    } else {
      const opId = args[1];
      const category = args[2] || null;
      const since = args[3] ? args[3].split(' ')[1] : null;
      const page = args[4] || null;
      
      // Determine if this is a create operation or read
      const createOp = 'create:' + opId;
      const op = cliMemoryBus.getOperation(opId);
      
      if (op && op.action === 'write') {
        // Execute write operation
        if (category) {
          const categoryPages = cliMemoryBus.getPagesByCategory(category);
          if (categoryPages.length === 0) {
            console.log(`No pages found in category "${category}".`);
            return;
          }
        } else if (since) {
          const sincePages = cliMemoryBus.getPagesBySince(since);
          if (sincePages.length === 0) {
            console.log(`No pages found after "${since}".`);
            return;
          }
        } else if (page) {
          const pageId = page.replace(/[^0-9a-f]/gi, '');
          const pagePages = cliMemoryBus.getPages().filter(p => p.id === pageId);
          if (pagePages.length > 0) {
            console.log(`Executing on page(s): ${pagePages.length} page(s) with ID "${page}"`);
            cliMemoryBus.executeBatch([
              {
                operation_id: opId,
                action: 'read',
                params: {},
                target_pages: pagePages.map(p => p.id)
              }
            ]);
          } else {
            console.log(`No pages found with ID "${page}".`);
            return;
          }
        } else {
          // Default to current time
          const pages = cliMemoryBus.getPages();
          if (pages.length > 0) {
            const pageId = pages[0].id;
            console.log(`Executing on page with ID "${pageId}"`);
            cliMemoryBus.executeBatch([
              {
                operation_id: opId,
                action: 'read',
                params: {},
                target_pages: [pageId]
              }
            ]);
          } else {
            console.log('No pages found.');
            return;
          }
        }
      } else if (op && op.action === 'execute') {
        // Execute operation
        if (category) {
          const categoryPages = cliMemoryBus.getPagesByCategory(category);
          if (categoryPages.length === 0) {
            console.log(`No pages found in category "${category}".`);
            return;
          }
        } else if (since) {
          const sincePages = cliMemoryBus.getPagesBySince(since);
          if (sincePages.length === 0) {
            console.log(`No pages found after "${since}".`);
            return;
          }
        } else if (page) {
          const pageId = page.replace(/[^0-9a-f]/gi, '');
          const pagePages = cliMemoryBus.getPages().filter(p => p.id === pageId);
          if (pagePages.length > 0) {
            cliMemoryBus.executeBatch([
              {
                operation_id: opId,
                action: 'read',
                params: {},
                target_pages: pagePages.map(p => p.id)
              }
            ]);
          } else {
            console.log(`No pages found with ID "${page}".`);
            return;
          }
        } else {
          const pages = cliMemoryBus.getPages();
          cliMemoryBus.executeBatch([
            {
              operation_id: opId,
              action: 'read',
              params: {},
              target_pages: pages.map(p => p.id)
            }
          ]);
        }
      } else {
        console.log(`Unknown operation "${op.action}" for operation ${opId}.`);
        console.log('Valid operations: create, read, write, delete, execute, batch');
        return;
      }
    }
  } else {
    console.log(`Unknown command: ${cmd}`);
    console.log('Usage: node cli.js <command> [options]');
    console.log('Commands: create, execute, query, list');
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

module.exports = { main };
