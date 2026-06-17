import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'

const { combine, timestamp, json, colorize, simple, errors } = winston.format

const fileTransport = new DailyRotateFile({
  filename:      'logs/lendora-%DATE%.log',
  datePattern:   'YYYY-MM-DD',
  zippedArchive: true,
  maxSize:       '20m',
  maxFiles:      '14d',
  format:        combine(timestamp(), errors({ stack: true }), json()),
})

const consoleTransport = new winston.transports.Console({
  format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), simple()),
})

export const logger = winston.createLogger({
  level:       process.env['LOG_LEVEL'] ?? 'info',
  transports:  process.env['NODE_ENV'] === 'production'
    ? [fileTransport]
    : [consoleTransport, fileTransport],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
})
