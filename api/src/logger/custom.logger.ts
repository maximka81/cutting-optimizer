import * as fs from 'fs';
import * as path from 'path';

import { ConsoleLogger, Injectable, LogLevel, Scope } from '@nestjs/common';

import { getAppRootDir } from '../shared/utils';

@Injectable({ scope: Scope.TRANSIENT })
export class CustomLogger extends ConsoleLogger {
  private writeStream: fs.WriteStream | null = null; // Инициализируем как null
  private logDirectory: string;
  private logPath: string;
  private logLevels: LogLevel[] = []; // Инициализируем пустым массивом
  private isProduction = process.env.NODE_ENV === 'production';

  constructor(context?: string) {
    // Передаем context только если он определен
    super(context || 'Application');

    this.logDirectory = path.join(getAppRootDir(), 'logs');
    this.logPath = path.join(this.logDirectory, 'app.log');
    const logLevel: LogLevel = (process.env.LOG_LEVEL || 'debug') as LogLevel;

    this.ensureLogDirectory();
    this.setLogLevelsCustom(logLevel);
  }

  private setLogLevelsCustom(level: string) {
    const levels: { [key: string]: LogLevel[] } = {
      error: ['error'],
      warn: ['error', 'warn'],
      info: ['error', 'warn', 'log'],
      debug: ['error', 'warn', 'log', 'debug'],
      verbose: ['error', 'warn', 'log', 'debug', 'verbose'],
    };
    this.logLevels = levels[level] || levels['debug']; // Фолбэк на debug
  }

  public getContext(): string | undefined {
    return this.context;
  }

  public setContext(ctx: string): void {
    this.context = ctx;
  }

  shouldLog(logLevel: LogLevel): boolean {
    return this.logLevels.includes(logLevel);
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDirectory)) {
      fs.mkdirSync(this.logDirectory, { recursive: true });
    }
  }

  private processLog(logLevel: LogLevel, message: any, args: any[]): void {
    if (!this.shouldLog(logLevel)) {
      return;
    }

    // Преобразование первого аргумента в строку, если это не строка
    const formattedMessage = typeof message === 'string' ? message : JSON.stringify(message);

    // Объединение всех аргументов в одну строку
    const fullMessage = args.reduce((acc, arg) => {
      return `${acc} ${typeof arg === 'string' ? arg : JSON.stringify(arg)}`;
    }, formattedMessage);

    const context =
      typeof args[args.length - 1] === 'string' ? args[args.length - 1] : this.context;

    switch (logLevel) {
      case 'log':
        super.log(fullMessage, context);
        break;
      case 'error':
        super.error(fullMessage, args[1], context);
        break;
      case 'warn':
        super.warn(fullMessage, context);
        break;
      case 'debug':
        super.debug(fullMessage, context);
        break;
      case 'verbose':
        super.verbose(fullMessage, context);
        break;
      case 'fatal':
        super.fatal(fullMessage, context);
        break;
    }

    this.writeToFile(logLevel, fullMessage);
  }

  log(message: any, context?: string): void;
  log(message: any, ...optionalParams: [...any, string?]): void;
  log(message: any, ...args: any[]): void {
    this.processLog('log', message, args);
  }

  error(message: any, trace?: string, context?: string): void;
  error(message: any, ...optionalParams: [...any, string?, string?]): void;
  error(message: any, ...args: any[]): void {
    this.processLog('error', message, args);
  }

  warn(message: any, context?: string): void;
  warn(message: any, ...optionalParams: [...any, string?]): void;
  warn(message: any, ...args: any[]): void {
    this.processLog('warn', message, args);
  }

  debug(message: any, context?: string): void;
  debug(message: any, ...optionalParams: [...any, string?]): void;
  debug(message: any, ...args: any[]): void {
    this.processLog('debug', message, args);
  }

  verbose(message: any, context?: string): void;
  verbose(message: any, ...optionalParams: [...any, string?]): void;
  verbose(message: any, ...args: any[]): void {
    this.processLog('verbose', message, args);
  }

  fatal(message: any, context?: string): void;
  fatal(message: any, ...optionalParams: [...any, string?]): void;
  fatal(message: any, ...args: any[]): void {
    this.processLog('fatal', message, args);
  }

  private writeToFile(level: string, message: string, trace?: string): void {
    try {
      const formattedDateTime = new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
        .format(new Date())
        .replace(',', '');
      const formattedDate = formattedDateTime.split(' ')[0];

      const logFilePath = path.join(this.logDirectory, `${formattedDate}-${level}.log`);
      const log = `${formattedDateTime} [${level}] ${message}${trace ? `\n${trace}` : ''}\n`;

      // Проверяем, нужно ли создать новый поток или использовать существующий
      if (!this.writeStream || (this.writeStream.path as string) !== logFilePath) {
        // Закрываем старый поток если он существует
        if (this.writeStream) {
          this.writeStream.end();
        }
        this.writeStream = fs.createWriteStream(logFilePath, { flags: 'a' });
      }

      this.writeStream.write(log);
    } catch (error) {
      console.error('Ошибка записи в файл лога:', error);
    }
  }

  onModuleDestroy(): void {
    if (this.writeStream) {
      this.writeStream.end();
    }
  }
}
