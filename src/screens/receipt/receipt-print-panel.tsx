import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, useColorScheme, View } from 'react-native';

import { useApi } from '@/hooks/use-api';

import { printReceipt, type PrintReceiptTarget } from './api';
import { isValidPrinterIp } from './printer-ip';
import { loadPrinterIp, savePrinterIp } from './printer-ip-storage';
import { sendEscPosToPrinter } from './send-to-printer';

interface ReceiptPrintPanelProps {
  target: PrintReceiptTarget;
  /** Compact layout for headers / sidebars. */
  compact?: boolean;
  /** Nested inside another card — drop outer chrome. */
  embedded?: boolean;
}

export function ReceiptPrintPanel({
  target,
  compact = false,
  embedded = false,
}: ReceiptPrintPanelProps) {
  const { api, isReady } = useApi();
  const isDark = useColorScheme() === 'dark';
  const [printerIp, setPrinterIp] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadPrinterIp().then((saved) => {
      if (!cancelled && saved) setPrinterIp(saved);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const printMutation = useMutation({
    mutationFn: async (ip: string) => printReceipt(api, target, ip, sendEscPosToPrinter),
    onSuccess: async (_result, ip) => {
      await savePrinterIp(ip);
      setValidationError(null);
      setSuccessMessage('Sent to printer');
    },
    onError: () => {
      setSuccessMessage(null);
    },
  });

  const handlePrint = () => {
    const ip = printerIp.trim();
    setSuccessMessage(null);

    if (!ip) {
      setValidationError('Enter the printer IP address.');
      return;
    }

    if (!isValidPrinterIp(ip)) {
      setValidationError('Use an IPv4 address, optionally with a port (e.g. 192.168.1.50:9100).');
      return;
    }

    if (!isReady) {
      setValidationError('Sign in again to print.');
      return;
    }

    setValidationError(null);
    printMutation.mutate(ip);
  };

  const errorMessage =
    validationError ??
    (printMutation.isError ? (printMutation.error as Error).message : null);

  return (
    <View
      className={`gap-3 ${
        embedded
          ? ''
          : `rounded-3xl border border-border bg-card ${compact ? 'p-3.5' : 'p-4'}`
      }`}
      style={embedded ? undefined : { borderCurve: 'continuous' }}>
      <View className="gap-1">
        <View className="flex-row items-center gap-2">
          <Ionicons name="print-outline" size={18} color={isDark ? '#E4E4E7' : '#18181B'} />
          <Text className="text-sm font-semibold text-foreground">Print receipt</Text>
        </View>
        {!embedded ? (
          <Text className="text-xs leading-4 text-muted-foreground">
            Sends over Wi‑Fi to your thermal printer (port 9100). Default IP can be set in Settings.
          </Text>
        ) : null}
      </View>

      <TextInput
        value={printerIp}
        onChangeText={(value) => {
          setPrinterIp(value);
          setValidationError(null);
          setSuccessMessage(null);
          printMutation.reset();
        }}
        placeholder="Printer IP (e.g. 192.168.1.50)"
        placeholderTextColor="#8E8E93"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="numbers-and-punctuation"
        editable={!printMutation.isPending}
        className="rounded-2xl border border-input bg-background px-4 py-3.5 text-base text-foreground"
        style={{ borderCurve: 'continuous' }}
      />

      <Pressable
        onPress={printMutation.isPending ? undefined : handlePrint}
        disabled={printMutation.isPending}
        accessibilityRole="button"
        accessibilityLabel="Print receipt to thermal printer"
        className={`flex-row items-center justify-center gap-2 rounded-2xl px-4 py-3.5 ${
          printMutation.isPending ? 'bg-muted opacity-70' : 'bg-neutral-950 active:opacity-85 dark:bg-white'
        }`}
        style={{ borderCurve: 'continuous' }}>
        <Ionicons
          name={printMutation.isPending ? 'hourglass-outline' : 'print-outline'}
          size={18}
          color={
            printMutation.isPending
              ? isDark
                ? '#A1A1AA'
                : '#71717A'
              : isDark
                ? '#18181B'
                : '#FAFAFA'
          }
        />
        <Text
          className={`text-sm font-semibold ${
            printMutation.isPending
              ? 'text-muted-foreground'
              : 'text-white dark:text-neutral-950'
          }`}>
          {printMutation.isPending ? 'Printing…' : 'Print receipt'}
        </Text>
      </Pressable>

      {errorMessage ? (
        <Text selectable className="text-xs text-red-600 dark:text-red-400">
          {errorMessage}
        </Text>
      ) : null}

      {successMessage ? (
        <Text className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
          {successMessage}
        </Text>
      ) : null}
    </View>
  );
}
