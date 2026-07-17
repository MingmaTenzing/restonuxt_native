import TcpSocket from 'react-native-tcp-socket';

const CONNECT_TIMEOUT_MS = 5000;

/** Send raw ESC/POS bytes to a LAN thermal printer from this device. */
export function sendEscPosToPrinter(host: string, port: number, bytes: Uint8Array) {
  return new Promise<void>((resolve, reject) => {
    let settled = false;

    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      try {
        client.destroy();
      } catch {
        // Ignore destroy errors after connect/write failures.
      }
      if (error) reject(error);
      else resolve();
    };

    const client = TcpSocket.createConnection(
      {
        host,
        port,
        timeout: CONNECT_TIMEOUT_MS,
      },
      () => {
        client.write(bytes, 'binary', (writeError) => {
          if (writeError) {
            finish(
              writeError instanceof Error
                ? writeError
                : new Error('Failed to send receipt to the printer.')
            );
            return;
          }
          // Give the printer a moment to accept the buffer before closing.
          setTimeout(() => finish(), 150);
        });
      }
    );

    client.on('error', (error) => {
      finish(
        error instanceof Error
          ? error
          : new Error(`Printer not reachable at ${host}:${port}`)
      );
    });

    client.on('timeout', () => {
      finish(new Error(`Printer connection timed out at ${host}:${port}`));
    });
  });
}
