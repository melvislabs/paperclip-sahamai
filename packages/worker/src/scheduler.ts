export interface CronSchedule {
  expression: string;
  timezone?: string;
}

export interface ScheduledJob {
  name: string;
  schedule: CronSchedule;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export class JobScheduler {
  private readonly jobs = new Map<string, ScheduledJob>();
  private readonly timers = new Map<string, NodeJS.Timeout>();
  private readonly now: () => Date;

  constructor(options: { now?: () => Date } = {}) {
    this.now = options.now ?? (() => new Date());
  }

  register(job: ScheduledJob): void {
    this.jobs.set(job.name, job);
  }

  unregister(name: string): void {
    const timer = this.timers.get(name);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(name);
    }
    this.jobs.delete(name);
  }

  async start(
    name: string,
    handler: () => Promise<void>
  ): Promise<void> {
    const job = this.jobs.get(name);
    if (!job) {
      throw new Error(`Job ${name} not registered`);
    }

    if (!job.enabled) return;

    const intervalMs = this.parseCronToMs(job.schedule.expression);
    if (intervalMs <= 0) {
      throw new Error(`Invalid cron expression: ${job.schedule.expression}`);
    }

    const scheduleNext = () => {
      const timer = setTimeout(async () => {
        job.lastRun = this.now();
        try {
          await handler();
        } catch (error) {
          console.error(`Job ${name} failed:`, error);
        } finally {
          job.nextRun = new Date(this.now().getTime() + intervalMs);
          scheduleNext();
        }
      }, intervalMs);

      this.timers.set(name, timer);
      job.nextRun = new Date(this.now().getTime() + intervalMs);
    };

    scheduleNext();
  }

  stop(name: string): void {
    const timer = this.timers.get(name);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(name);
    }
  }

  stopAll(): void {
    for (const [name] of this.timers) {
      this.stop(name);
    }
  }

  getJob(name: string): ScheduledJob | undefined {
    return this.jobs.get(name);
  }

  getAllJobs(): ScheduledJob[] {
    return Array.from(this.jobs.values());
  }

  private parseCronToMs(expression: string): number {
    const parts = expression.split(' ');
    if (parts.length < 5) {
      return 0;
    }

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    if (minute === '*' && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      return 60000;
    }

    if (minute.startsWith('*/')) {
      const intervalMin = parseInt(minute.slice(2));
      return intervalMin * 60 * 1000;
    }

    if (hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      return 60 * 60 * 1000;
    }

    if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      return 24 * 60 * 60 * 1000;
    }

    return 24 * 60 * 60 * 1000;
  }
}
