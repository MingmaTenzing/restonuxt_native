import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { ScreenScroll } from '@/components/screen-scroll';
import { Table, TableCell, TableRow } from '@/components/table';
import { ThemeToggle } from '@/components/theme-toggle';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAppState } from '@/hooks/use-app-state';
import { useTheme } from '@/hooks/use-theme';
import { loadPrinterIp, savePrinterIp } from '@/screens/receipt/printer-ip-storage';

import { resolvePrinterIpSettingsSave } from './settings-printer-ip';

export default function SettingsScreen() {
  const appState = useAppState();
  const theme = useTheme();
  const { isTablet } = useResponsiveLayout();

  const [printerIp, setPrinterIp] = useState('');
  const [isSavingPrinterIp, setSavingPrinterIp] = useState(false);
  const [printerIpMessage, setPrinterIpMessage] = useState<string | null>(null);
  const [printerIpError, setPrinterIpError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadPrinterIp().then((saved) => {
      if (!cancelled && saved) setPrinterIp(saved);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSavePrinterIp = async () => {
    const decision = resolvePrinterIpSettingsSave(printerIp);
    setPrinterIpMessage(null);

    if (decision.kind === 'invalid') {
      setPrinterIpError(decision.message);
      return;
    }

    setPrinterIpError(null);
    setSavingPrinterIp(true);
    try {
      if (decision.kind === 'clear') {
        await savePrinterIp('');
        setPrinterIp('');
        setPrinterIpMessage('Printer IP cleared.');
      } else {
        await savePrinterIp(decision.value);
        setPrinterIp(decision.value);
        setPrinterIpMessage('Printer IP saved for receipt printing.');
      }
    } finally {
      setSavingPrinterIp(false);
    }
  };

  return (
    <ScreenScroll>
      <View className="gap-2">
        <Text
          className={`font-bold tracking-tight text-foreground ${
            isTablet ? 'text-3xl' : 'text-4xl'
          }`}>
          Settings
        </Text>
        <Text className="text-base leading-6 text-muted-foreground">
          App preferences, appearance, and hardware.
        </Text>
      </View>

      <Table>
        <ThemeToggle />
        <TableRow>
          <TableCell label="App state">{appState}</TableCell>
          <TableCell label="Theme">{theme.colorScheme}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell label="Accent">{theme.colors.accent}</TableCell>
          <TableCell label="Surface">{theme.colors.surface}</TableCell>
        </TableRow>
      </Table>

      <View className="gap-3">
        <View className="gap-1">
          <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Hardware
          </Text>
          <Text className="text-lg font-semibold text-foreground">Thermal printer</Text>
          <Text className="text-sm leading-5 text-muted-foreground">
            Saved IP is used when printing receipts from Cashier. Default port is 9100.
          </Text>
        </View>

        <View
          className="gap-3 rounded-3xl border border-border bg-card p-4"
          style={{ borderCurve: 'continuous' }}>
          <TextInput
            value={printerIp}
            onChangeText={(value) => {
              setPrinterIp(value);
              setPrinterIpError(null);
              setPrinterIpMessage(null);
            }}
            placeholder="Printer IP (e.g. 192.168.1.50:9100)"
            placeholderTextColor="#8E8E93"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="numbers-and-punctuation"
            editable={!isSavingPrinterIp}
            className="rounded-2xl border border-input bg-background px-4 py-3 text-base text-foreground"
            style={{ borderCurve: 'continuous' }}
          />

          <Pressable
            onPress={isSavingPrinterIp ? undefined : () => void handleSavePrinterIp()}
            disabled={isSavingPrinterIp}
            accessibilityRole="button"
            accessibilityLabel="Save printer IP address"
            className={`items-center rounded-2xl px-4 py-3 ${
              isSavingPrinterIp ? 'bg-muted opacity-70' : 'bg-primary active:opacity-80'
            }`}
            style={{ borderCurve: 'continuous' }}>
            <Text
              className={`text-sm font-semibold ${
                isSavingPrinterIp ? 'text-muted-foreground' : 'text-primary-foreground'
              }`}>
              {isSavingPrinterIp ? 'Saving...' : 'Save printer IP'}
            </Text>
          </Pressable>

          {printerIpError ? (
            <Text selectable className="text-xs text-red-600 dark:text-red-400">
              {printerIpError}
            </Text>
          ) : null}

          {printerIpMessage ? (
            <Text className="text-xs text-emerald-700 dark:text-emerald-400">
              {printerIpMessage}
            </Text>
          ) : null}
        </View>
      </View>
    </ScreenScroll>
  );
}
