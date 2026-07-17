import { describe, expect, test } from 'bun:test';

import { isValidPrinterIp, normalizePrinterIp, parsePrinterTarget } from './printer-ip';

describe('printer-ip', () => {
  test('accepts IPv4 with optional port', () => {
    expect(isValidPrinterIp('192.168.1.50')).toBe(true);
    expect(isValidPrinterIp('192.168.1.50:9100')).toBe(true);
    expect(isValidPrinterIp(' 10.0.0.1:9100 ')).toBe(true);
  });

  test('rejects empty or malformed values', () => {
    expect(isValidPrinterIp('')).toBe(false);
    expect(isValidPrinterIp('printer.local')).toBe(false);
    expect(isValidPrinterIp('192.168.1')).toBe(false);
    expect(isValidPrinterIp('192.168.1.50:')).toBe(false);
    expect(isValidPrinterIp('http://192.168.1.50')).toBe(false);
  });

  test('normalizePrinterIp trims whitespace', () => {
    expect(normalizePrinterIp('  192.168.1.50:9100  ')).toBe('192.168.1.50:9100');
  });

  test('parsePrinterTarget defaults port to 9100', () => {
    expect(parsePrinterTarget('192.168.1.50')).toEqual({
      host: '192.168.1.50',
      port: 9100,
      target: '192.168.1.50:9100',
    });
    expect(parsePrinterTarget('10.0.0.8:9101')).toEqual({
      host: '10.0.0.8',
      port: 9101,
      target: '10.0.0.8:9101',
    });
  });
});
