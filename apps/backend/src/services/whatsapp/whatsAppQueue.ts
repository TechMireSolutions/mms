import { EventEmitter } from 'events';

export interface Task {
  id: string;
  data: {
    contactId: string | number;
    phoneNumber: string;
  };
  attempts: number;
}

export class WhatsAppQueue extends EventEmitter {
  private queue: Task[] = [];
  private activeWorkers = 0;
  private maxWorkers = 3;
  private isProcessing = false;
  private processor: (task: Task) => Promise<void> = async () => {};

  constructor() {
    super();
  }

  setProcessor(processor: (task: Task) => Promise<void>) {
    this.processor = processor;
  }

  addJob(contactId: string | number, phoneNumber: string) {
    const jobId = `${contactId}-${Date.now()}`;
    const task: Task = {
      id: jobId,
      data: { contactId, phoneNumber },
      attempts: 0
    };
    this.queue.push(task);
    this.emit('added', jobId);
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0 || this.activeWorkers >= this.maxWorkers) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0 && this.activeWorkers < this.maxWorkers) {
      const task = this.queue.shift();
      if (!task) continue;

      this.activeWorkers++;
      this.executeTask(task);
    }

    this.isProcessing = false;
  }

  private async executeTask(task: Task) {
    try {
      this.emit('active', task.id);
      await this.processor(task);
      this.emit('completed', task.id);
    } catch (error: unknown) {
      task.attempts++;
      const message = error instanceof Error ? error.message : 'WhatsApp job failed';
      this.emit('failed', task.id, message);

      if (task.attempts < 3) {
        // Back-off logic: retry after exponential delay
        const delay = Math.pow(2, task.attempts) * 1000;
        setTimeout(() => {
          this.queue.push(task);
          this.processQueue();
        }, delay);
      }
    } finally {
      this.activeWorkers--;
      this.processQueue();
    }
  }
}

// Global queue singleton instance for backend app
export const whatsAppQueue = new WhatsAppQueue();
