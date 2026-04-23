/**
 * Pages API - TaskFlow Interface
 *
 * Provides memory page operations through taskflow API.
 */

const { MemoryBusManager } = require('./implementation');
const { MemoryBusManager: MBM } = require('./implementation');

class PagesAPI {
  constructor(manager) {
    this.manager = manager;
    this.operations = manager.operations;
  }

  async create(page, params = {}) {
    const opId = this.operations.create(
      page.name,
      page.category,
      page.metadata || {}
    );
    return {
      id: page.id,
      operation_id: opId,
      success: true
    };
  }

  async executeOperation(operationId, params = {}) {
    const op = this.operations.get(operationId);
    if (!op) {
      throw new Error(`Operation ${operationId} not found`);
    }

    if (op.action === 'read') {
      const result = await this.executeRead(op);
      return {
        id: operationId,
        success: result.found,
        pageId: result.pageId,
        category: result.category
      };
    } else if (op.action === 'write') {
      await this.executeWrite(op);
      return {
        id: operationId,
        success: true
      };
    } else if (op.action === 'delete') {
      await this.executeDelete(op);
      return {
        id: operationId,
        success: true
      };
    } else if (op.action === 'execute') {
      await this.executeBatch([op]);
      return {
        id: operationId,
        success: true
      };
    } else if (op.action === 'batch') {
      await this.executeBatch(op);
      return {
        id: operationId,
        success: true
      };
    } else {
      throw new Error(`Unknown operation: ${op.action}`);
    }
  }

  async executeRead(opId, category = null, since = null, pageId = null) {
    const page = this.manager.getPages().find(p => p.id === pageId);
    if (!page) {
      return {
        found: false,
        error: 'Page not found'
      };
    }

    let match = true;
    if (category !== null) {
      if (page.category !== category) match = false;
    }
    if (since !== null) {
      if (page.timestamp < since) match = false;
    }

    return {
      found: match,
      pageId,
      category: page.category,
      timestamp: page.timestamp
    };
  }

  async executeWrite(op) {
    const pageId = op.target_pages?.[0];
    if (!pageId) {
      throw new Error('No target page found');
    }

    const existingPage = this.manager.getPages().find(p => p.id === pageId);

    if (existingPage) {
      // Update existing page
      const updatedPage = {
        ...existingPage,
        name: op.params.name,
        category: op.params.category,
        properties: op.params.properties || {}
      };
      this.manager.stateJson.pages = this.manager.stateJson.pages.map(p =>
        p.id === pageId ? updatedPage : p
      );
    } else {
      // Create new page
      const createdPage = await this.create({
        ...op.params,
        id: pageId,
        properties: op.params.properties || {}
      });
      this.manager.stateJson.pages.push(createdPage);
    }
  }

  async executeDelete(op) {
    const pageId = op.target_pages?.[0];
    if (!pageId) {
      throw new Error('No target page found');
    }

    const page = this.manager.getPages().find(p => p.id === pageId);
    if (!page) {
      throw new Error('Page not found');
    }

    this.manager.stateJson.pages = this.manager.stateJson.pages.filter(
      p => p.id !== pageId
    );
  }

  async executeBatch(operations) {
    const executed = [];
    try {
      for (const op of operations) {
        if (executed.includes(op.operation_id)) continue;
        await this.executeOperation(op.operation_id, op.params);
        executed.push(op.operation_id);
      }
    } catch (e) {
      throw e;
    }
  }

  async search(category, since, pageId) {
    const pages = this.manager.getPages().filter(p => p.id === pageId);
    let matches = [];

    for (const page of pages) {
      let categoryMatch = true;
      if (category !== null && category !== undefined) {
        categoryMatch = page.category === category;
      }
      let timestampMatch = true;
      if (since !== null) {
        timestampMatch = page.timestamp > since;
      }

      if (categoryMatch && timestampMatch) {
        matches.push(page);
      }
    }

    return { results: matches, total: matches.length };
  }

  async queryOperation(operationId) {
    return this.operations.get(operationId);
  }

  async getPages() {
    return this.manager.getPages();
  }
}

// Initialize API with manager
const pages = new PagesAPI(memoryBusManager);

// Export for module use
module.exports = {
  PagesAPI,
  pages
};
