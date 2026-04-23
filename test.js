/**
 * Memory Bus Test Script
 * Demonstrates the memory bus system
 */

const { createMemoryBusFlow } = require('./taskflowSkill');
const { MemoryBusManager } = require('./implementation');

async function runTest() {
  console.log('=== Memory Bus System Tests ===\n');

  // Test 1: Create memory bus flow
  console.log('Test 1: Create Memory Bus Flow');
  try {
    const flow = await createMemoryBusFlow({
      controllerId: 'memory-bus-system',
      goal: 'organize memories',
    });
    console.log('✓ Created flow:', flow.id);
    console.log('  - Current Step:', flow.currentStep);
    console.log('  - State JSON:', JSON.stringify(flow.stateJson, null, 2));
    console.log('✓ Test 1 PASSED\n');
  } catch (e) {
    console.log('✗ Test 1 FAILED:', e.message, '\n');
  }

  // Test 2: Run task on flow
  console.log('Test 2: Run Task on Flow');
  try {
    const child = await memoryBusManager.runTask({
      flowId: flow.flowId,
      childSessionKey: 'agent:main:memory-bus',
      task: 'Test memory bus operations',
      status: 'running',
      startedAt: Date.now(),
    });
    console.log('✓ Task started with ID:', child.operationId);
    console.log('✓ Test 2 PASSED\n');
  } catch (e) {
    console.log('✗ Test 2 FAILED:', e.message, '\n');
  }

  // Test 3: Set waiting state
  console.log('Test 3: Set Waiting State');
  try {
    const waiting = await memoryBusManager.setWaiting({
      flowId: flow.flowId,
      expectedRevision: flow.revision,
      currentStep: 'await_input',
      waitJson: {
        kind: 'confirm',
        operationId: 'create:test-page-1',
        targetPages: ['memory-bus']
      }
    });
    console.log('✓ Waiting state set:', waiting.applied);
    console.log('✓ Waiting ID:', waiting.flowId);
    console.log('✓ Test 3 PASSED\n');
  } catch (e) {
    console.log('✗ Test 3 FAILED:', e.message, '\n');
  }

  // Test 4: Resume flow
  console.log('Test 4: Resume Flow');
  try {
    const resumed = await memoryBusManager.resume({
      flowId: waiting.flow.flowId,
      expectedRevision: waiting.flow.revision,
      currentStep: 'execute',
      stateJson: waiting.flow.stateJson,
    });
    console.log('✓ Flow resumed:', resumed.currentStep);
    console.log('✓ Test 4 PASSED\n');
  } catch (e) {
    console.log('✗ Test 4 FAILED:', e.message, '\n');
  }

  // Test 5: Finish flow
  console.log('Test 5: Finish Flow');
  try {
    const finished = await memoryBusManager.finish({
      flowId: resumed.flow.flowId,
      expectedRevision: resumed.flow.revision,
      stateJson: resumed.flow.stateJson,
    });
    console.log('✓ Flow finished');
    console.log('✓ Test 5 PASSED\n');
  } catch (e) {
    console.log('✗ Test 5 FAILED:', e.message, '\n');
  }

  // Test 6: Query the page
  console.log('Test 6: Query the Page');
  try {
    const page = await memoryBusManager.queryOperation('create:test-page-1');
    console.log('✓ Operation exists:', page.found);
    console.log('✓ Page Category:', page.category);
    console.log('✓ Test 6 PASSED\n');
  } catch (e) {
    console.log('✗ Test 6 FAILED:', e.message, '\n');
  }

  // Test 7: Get pages list
  console.log('Test 7: Get Pages List');
  try {
    const pages = memoryBusManager.getPages();
    console.log(`✓ Found ${pages.length} page(s)`);
    if (pages.length > 0) {
      const page = pages[0];
      console.log('  - Page ID:', page.id);
      console.log('  - Page Name:', page.name);
      console.log('  - Category:', page.category);
      console.log('  - Timestamp:', new Date(page.timestamp).toLocaleString());
      console.log('✓ Test 7 PASSED\n');
    } else {
      console.log('  No pages created');
      console.log('✓ Test 7 PASSED (empty list is valid)\n');
    }
  } catch (e) {
    console.log('✗ Test 7 FAILED:', e.message, '\n');
  }

  // Test 8: Get bus state
  console.log('Test 8: Get Bus State');
  try {
    const state = memoryBusManager.getBusState();
    console.log('✓ Flow ID:', state.flowId);
    console.log('✓ State JSON:', JSON.stringify(state.stateJson, null, 2));
    console.log('✓ Created:', state.created);
    console.log('✓ Test 8 PASSED\n');
  } catch (e) {
    console.log('✗ Test 8 FAILED:', e.message, '\n');
  }

  // Test 9: Cancel flow
  console.log('Test 9: Cancel Flow');
  try {
    await memoryBusManager.cancel();
    console.log('✓ Flow cancelled');
    console.log('✓ Test 9 PASSED\n');
  } catch (e) {
    console.log('✗ Test 9 FAILED:', e.message, '\n');
  }

  // Test 10: Operations registration
  console.log('Test 10: Operations Registration');
  try {
    const createOp = memoryBusManager.operations.create('test-page-2', 'personal');
    console.log('✓ Created operation:', createOp);
    console.log('✓ Test 10 PASSED\n');
  } catch (e) {
    console.log('✗ Test 10 FAILED:', e.message, '\n');
  }

  console.log('=== All Tests Complete ===');
}

// Initialize
const memoryBusManager = new MemoryBusManager();
runTest();
