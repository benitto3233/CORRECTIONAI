// Simplified service implementations for cloud deployment

class CacheService {
  constructor() {
    this.cache = new Map();
    console.log('Simplified CacheService initialized');
  }

  async get(key) {
    return this.cache.get(key);
  }

  async set(key, value, ttl = 3600) {
    this.cache.set(key, value);
    return true;
  }

  async delete(key) {
    return this.cache.delete(key);
  }
}

class QueueService {
  constructor() {
    this.queues = new Map();
    console.log('Simplified QueueService initialized');
  }

  async connect() {
    console.log('Simplified QueueService connected');
    return true;
  }

  async close() {
    console.log('Simplified QueueService closed');
    return true;
  }

  async createQueue(queueName) {
    if (!this.queues.has(queueName)) {
      this.queues.set(queueName, []);
    }
    return true;
  }

  async sendToQueue(queueName, data) {
    await this.createQueue(queueName);
    const queue = this.queues.get(queueName);
    queue.push(data);
    
    // Process immediately for demo purposes
    setTimeout(() => {
      const callback = this.consumers.get(queueName);
      if (callback) {
        callback(data);
      }
    }, 500);
    
    return true;
  }

  async consume(queueName, callback) {
    await this.createQueue(queueName);
    this.consumers = this.consumers || new Map();
    this.consumers.set(queueName, callback);
    return true;
  }
}

module.exports = {
  CacheService,
  QueueService
};
