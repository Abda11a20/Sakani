// apps/backend/src/common/logger/custom-logger.service.ts

import { ConsoleLogger, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CustomLogger extends ConsoleLogger {
  private logDir = path.join(process.cwd(), 'logs');
  private errorLogStream!: fs.WriteStream;
  private combinedLogStream!: fs.WriteStream;

  constructor() {
    super();
    // Ensure logs directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    // Initialize append-mode streams
    this.errorLogStream = fs.createWriteStream(path.join(this.logDir, 'error.log'), { flags: 'a' });
    this.combinedLogStream = fs.createWriteStream(path.join(this.logDir, 'combined.log'), { flags: 'a' });
  }

  private writeToFile(stream: fs.WriteStream, message: string) {
    const timestamp = new Date().toISOString();
    // Strips any ANSI color codes if we write to files
    const cleanMessage = message.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
    stream.write(`[${timestamp}] ${cleanMessage}\n`);
  }

  log(message: any, context?: string) {
    super.log(message, context);
    this.writeToFile(this.combinedLogStream, `LOG [${context ?? 'App'}] ${message}`);
  }

  error(message: any, stack?: string, context?: string) {
    super.error(message, stack, context);
    const logMsg = `ERROR [${context ?? 'App'}] ${message}${stack ? `\nStack: ${stack}` : ''}`;
    this.writeToFile(this.errorLogStream, logMsg);
    this.writeToFile(this.combinedLogStream, logMsg);
  }

  warn(message: any, context?: string) {
    super.warn(message, context);
    this.writeToFile(this.combinedLogStream, `WARN [${context ?? 'App'}] ${message}`);
  }

  debug(message: any, context?: string) {
    super.debug(message, context);
    this.writeToFile(this.combinedLogStream, `DEBUG [${context ?? 'App'}] ${message}`);
  }

  verbose(message: any, context?: string) {
    super.verbose(message, context);
    this.writeToFile(this.combinedLogStream, `VERBOSE [${context ?? 'App'}] ${message}`);
  }
}
