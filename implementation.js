/**
 * Memory Bus Manager - TaskFlow Implementation
 *
 * A TaskFlow-based system for organizing memories with pages and operations.
 */

class MemoryBusManager {
  constructor() {
    // Initialize API
    this.initApi();

    // Create the main flow for the memory bus system
    this.flowId = 'memory-bus-system-' + Date.now();
    this.stateJson = {
      pages: [],
      operations: [],
      queries: [],
      operationsInFlight: [],
      executionOrder: [],
    };

    // Register the create operation
    this.operations = {
      create: (name, category, properties) => {
        const now = Date.now();
        const id = crypto.randomUUID();

        const page = {
          id,
          name,
          category,
          timestamp: now,
          metadata: {
            tags: [],
            source: null,
            created_by: null
          }
        };

        const operation = {
          operation_id: 'create:' + id,
          action: 'write',
          params: { name, category, properties },
          target_pages: [id]
        };

        this.executeBatch([operation]);
        return id;
      },
      read: (pageId, category = null, since = null, pageId2 = null) => {
        const page = this.stateJson.pages.find(p => p.id === pageId);
        if (!page) {
          return { found: false, error: 'Page not found' };
        }

        let match = true;
        if (category !== null && category !== undefined) {
          match = page.category === category;
        }
        if (since !== null) {
          match = page.timestamp > since;
        }

        return { found: match, pageId, category: page.category, timestamp: page.timestamp };
      },
      write: (op) => {
        const pageId = op.target_pages?.[0];
        if (!pageId) throw new Error('No target page found');

        const existingPage = this.stateJson.pages.find(p => p.id === pageId);

        if (existingPage) {
          // Update existing page
          const updatedPage = {
            ...existingPage,
            name: op.params.name,
            category: op.params.category,
            properties: op.params.properties || {}
          };
          this.stateJson.pages = this.stateJson.pages.map(p =>
            p.id === pageId ? updatedPage : p
          );
        } else {
          // Create new page
          const createdPage = this.executeOperation({
            operation_id: 'create:' + op.operation_id,
            action: 'write',
            params: { name: op.params.name, category: op.params.category, properties: op.params.properties },
            target_pages: [pageId]
          });
          this.stateJson.pages.push(createdPage);
        }

        return { success: true };
      },
      delete: (op) => {
        const pageId = op.target_pages?.[0];
        if (!pageId) throw new Error('No target page found');

        const page = this.stateJson.pages.find(p => p.id === pageId);
        if (!page) throw new Error('Page not found');

        this.stateJson.pages = this.stateJson.pages.filter(p => p.id !== pageId);
        return { success: true };
      },
      execute: (op) => {
        const pageId = op.target_pages?.[0];
        if (!pageId) throw new Error('No target page found');

        const existingPage = this.stateJson.pages.find(p => p.id === pageId);

        if (existingPage) {
          // Execute read on existing page
          const result = this.executeRead(op.operation_id, op.params.category, op.params.since, pageId);
          if (result.found) {
            return { found: true, pageId, category: result.category, timestamp: result.timestamp };
          } else {
            // Delete if not found
            this.executeDelete(op);
            return { found: false, error: 'Page not found' };
          }
        } else {
          // Create new page
          const createdPage = this.executeOperation({
            operation_id: op.operation_id,
            action: 'write',
            params: {
              name: op.params.name,
              category: op.params.category,
              properties: op.params.properties || {}
            },
            target_pages: [pageId]
          });
          return { found: true, pageId: createdPage.pageId };
        }
      },
      executeBatch: (operations) => {
        const executed = [];
        try {
          for (const op of operations) {
            if (executed.includes(op.operation_id)) continue;
            const result = this.executeOperation(op);
            executed.push(op.operation_id);
            return result;
          }
        } catch (e) {
          throw e;
        }
      },
      getPages: () => this.stateJson.pages || [],
      getOperation: (opId) => this.stateJson.operations.find(o => o.operation_id === opId),
      getPagesByCategory: (category) => this.stateJson.pages.filter(p => p.category === category),
      getPagesBySince: (since) => this.stateJson.pages.filter(p => p.timestamp > since),
      queryOperation: (operationId) => {
        const op = this.getOperation(operationId);
        if (!op) return { error: 'Operation not found' };
        return { ...op, found: true };
      },
      getBusState: () => ({
        flowId: this.flowId,
        stateJson: this.stateJson,
        created: !!this.stateJson.created,
        revision: this.stateJson.revision,
        currentStep: this.stateJson.currentStep
      })
    };
  }

  initApi() {
    // Initialize API
    return api;
  }

  createManaged(controllerId = 'memory-bus-system', goal = 'organize memories') {
    const managed = {
      flowId: this.flowId,
      stateJson: this.stateJson,
      currentStep: 'init',
      created: false,
      reason: null
    };

    try {
      api.runtime.tasks.flow.createManaged(managed);
      this.stateJson.flowId = this.flowId;
      this.stateJson.currentStep = 'init';
      this.stateJson.created = true;
      this.stateJson.revision = managed.revision;
    } catch (e) {
      managed.reason = e.reason;
      api.runtime.tasks.flow.fail(managed);
    }

    return managed;
  }

  runTask(task) {
    if (!this.stateJson.created) {
      throw new Error('Memory bus not initialized. Call createManaged first.');
    }

    return {
      create: async (opId, params) => {
        if (!this.stateJson.created) {
          throw new Error('Memory bus not initialized.');
        }
        const operation = {
          operation_id: opId,
          action: 'execute',
          params,
          target_pages: []
        };
        this.executeBatch([operation]);
        return { created: true, reason: null };
      },
      setWaiting: async (waitJson) => {
        if (!this.stateJson.created) {
          throw new Error('Memory bus not initialized.');
        }
        if (!waitJson.operationId || !waitJson.targetPages) {
          throw new Error('Missing waitJson operationId or targetPages');
        }
        await api.runtime.tasks.flow.setWaiting({
          flowId: this.flowId,
          expectedRevision: this.stateJson.revision,
          currentStep: 'execute_operation',
          stateJson: this.stateJson,
          waitJson: waitJson,
        });
        return { applied: true, code: null };
      },
      resume: async (resumeParams) => {
        if (!this.stateJson.created) {
          throw new Error('Memory bus not initialized.');
        }
        const resumed = {
          flowId: this.flowId,
          stateJson: this.stateJson,
          currentStep: 'finished'
        };
        return api.runtime.tasks.flow.resume(resumeParams);
      },
      finish: async () => {
        if (!this.stateJson.created) {
          throw new Error('Memory bus not initialized.');
        }
        const finished = {
          flowId: this.flowId,
          stateJson: this.stateJson,
          currentStep: 'finished'
        };
        return api.runtime.tasks.flow.finish(finished);
      },
      cancel: async () => {
        if (!this.stateJson.created) {
          throw new Error('Memory bus not initialized.');
        }
        return api.runtime.tasks.flow.cancel({ flowId: this.flowId });
      }
    };
  }

  executeBatch(operations) {
    const batch = {
      operations,
      executed: []
    };

    try {
      for (const op of operations) {
        if (batch.executed.includes(op.operation_id)) {
          continue;
        }
        try {
          const op = api.runtime.tasks.flow.createManaged({
            controllerId: 'memory-bus-operation',
            goal: op.action + ' operation',
            stateJson: { operation_id: op.operation_id, action: op.action },
          });

          if (!op.flowId) {
            throw new Error('Failed to create operation');
          }

          api.runtime.tasks.flow.createBatch({
            flowId: op.flowId,
            status: 'running',
            currentStep: 'processing',
            stateJson: op.stateJson,
            operations: op.operation_id,
          });

          batch.executed.push(op.operation_id);

          api.runtime.tasks.flow.finish({
            flowId: op.flowId,
            expectedRevision: op.flow.revision,
            stateJson: op.stateJson,
          });
        } catch (e) {
          this.stateJson.operations = this.stateJson.operations.filter(
            o => o !== op.operation_id
          );
          batch.executed = batch.executed.filter(
            o => o !== op.operation_id
          );
          throw e;
        }
      }
    } catch (e) {
      api.runtime.tasks.flow.fail({
        flowId: this.flowId,
        expectedRevision: this.stateJson.revision,
        reason: e.reason,
        stateJson: this.stateJson
      });
      throw e;
    }
  }

  getPages() {
    return this.stateJson.pages || [];
  }

  getOperation(opId) {
    return this.stateJson.operations.find(o => o.operation_id === opId);
  }

  getPagesByCategory(category) {
    return this.stateJson.pages.filter(p => p.category === category);
  }

  getPagesBySince(since) {
    return this.stateJson.pages.filter(p => p.timestamp > since);
  }

  queryOperation(operationId) {
    const op = this.getOperation(operationId);
    if (!op) {
      return { error: 'Operation not found' };
    }
    return { ...op, found: true };
  }

  getBusState() {
    return {
      flowId: this.flowId,
      stateJson: this.stateJson,
      created: !!this.stateJson.created,
      revision: this.stateJson.revision,
      currentStep: this.stateJson.currentStep
    };
  }
}

// Initialize and register the memory bus manager
const memoryBusManager = new MemoryBusManager();

// Export for use in other modules
module.exports = {
  MemoryBusManager,
  memoryBusManager,
  taskFlow: api.runtime.tasks.flow
};
