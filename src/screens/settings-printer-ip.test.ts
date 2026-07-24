import { resolvePrinterIpSettingsSave } from './settings-printer-ip';

describe('settings printer IP', () => {
  test('clears empty drafts', () => {
    expect(resolvePrinterIpSettingsSave('')).toEqual({ kind: 'clear' });
    expect(resolvePrinterIpSettingsSave('   ')).toEqual({ kind: 'clear' });
  });

  test('rejects invalid IPs', () => {
    expect(resolvePrinterIpSettingsSave('printer.local')).toEqual({
      kind: 'invalid',
      message: 'Use an IPv4 address, optionally with a port (e.g. 192.168.1.50:9100).',
    });
  });

  test('saves normalized valid IPs', () => {
    expect(resolvePrinterIpSettingsSave('  192.168.1.50:9100  ')).toEqual({
      kind: 'save',
      value: '192.168.1.50:9100',
    });
  });
});
