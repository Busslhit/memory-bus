/**
 * Memory Bus Skill - TaskFlow Integration
 *
 * This skill can be used directly via the TaskFlow API.
 */

const { MemoryBusManager } = require('./implementation');
const { MemoryBusManager: MBM } = require('./implementation');

const taskFlow = api.runtime.tasks.flow;

/**
 * Create a memory bus flow for a specific task
 */
async function createMemoryBusFlow(managed = {}) {
  try {
    const created = taskFlow.createManaged(managed);
    if (!created) {
      throw new Error('Failed to create memory bus flow');
    }
    return {
      id: created.flowId,
      flow: created,
      stateJson: created.stateJson,
      currentStep: created.currentStep,
      revision: created.revision
    };
  } catch (e) {
    throw new Error(e.reason || 'Failed to create memory bus flow');
  }
}

/**
 * Run a task on the memory bus flow
 */
async function runMemoryBusTask({ flowId, childSessionKey, task, status, startedAt }) {
  try {
    const child = taskFlow.runTask({
      flowId,
      childSessionKey,
      task,
      status,
      startedAt,
      lastEventAt: Date.now()
    });
    return child;
  } catch (e) {
    throw e;
  }
}

/**
 * Set the memory bus flow to waiting state
 */
async function setMemoryBusWaiting({ flowId, expectedRevision, currentStep, stateJson, waitJson }) {
  try {
    await taskFlow.setWaiting({
      flowId,
      expectedRevision,
      currentStep,
      stateJson,
      waitJson
    });
    return true;
  } catch (e) {
    throw e;
  }
}

/**
 * Resume the memory bus flow
 */
async function resumeMemoryBusFlow({ flowId, expectedRevision, status, currentStep, stateJson }) {
  try {
    const resumed = taskFlow.resume({
      flowId,
      expectedRevision,
      status,
      currentStep,
      stateJson
    });
    return resumed;
  } catch (e) {
    throw e;
  }
}

/**
 * Finish the memory bus flow
 */
async function finishMemoryBusFlow({ flowId, expectedRevision, stateJson }) {
  try {
    await taskFlow.finish({
      flowId,
      expectedRevision,
      stateJson
    });
    return true;
  } catch (e) {
    throw e;
  }
}

/**
 * Cancel the memory bus flow
 */
async function cancelMemoryBusFlow({ flowId }) {
  try {
    await taskFlow.cancel({ flowId });
    return true;
  } catch (e) {
    throw e;
  }
}

/**
 * Execute a memory bus operation
 */
async function executeMemoryBusOperation({
  operationId,
  action,
  params,
  targetPages,
  status,
  startedAt
}) {
  const operation = taskFlow.createManaged({
    controllerId: 'memory-bus-operation',
    goal: action + ' operation',
    stateJson: { operation_id: operationId, action }
  });

  if (!operation) {
    throw new Error('Failed to create memory bus operation');
  }

  await runMemoryBusTask({
    flowId: operation.flowId,
    childSessionKey: 'agent:main:memory-bus',
    task: 'Execute memory bus operation',
    status,
    startedAt,
    lastEventAt: Date.now()
  });

  return {
    id: operationId,
    created: true,
    flow: operation,
    operation_id: operationId
  };
}

/**
 * Get memory bus state
 */
function getMemoryBusState() {
  return {
    flowId: api.runtime.tasks.flow.fromToolContext(ctx)?.flowId || null,
    stateJson: null,
    revision: null,
    currentStep: null,
    created: null
  };
}

module.exports = {
  createMemoryBusFlow,
  runMemoryBusTask,
  setMemoryBusWaiting,
  resumeMemoryBusFlow,
  finishMemoryBusFlow,
  cancelMemoryBusFlow,
  executeMemoryBusOperation,
  getMemoryBusState
};
