import net from 'node:net';

/**
 * Grabs a single high-quality JPEG frame directly from a phone running DroidCam.
 * Bypasses all browser CORS and canvas tainting limitations.
 */
export async function fetchDroidcamFrame(ipOrHost: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
  let cleaned = ipOrHost.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!cleaned.includes(':')) {
    cleaned = `${cleaned}:4747`;
  }

  // 1. Try common DroidCam snapshot endpoints first
  const snapshotEndpoints = ['/cam/1/frame.jpg', '/shot.jpg', '/cam/1/shot.jpg'];
  for (const endpoint of snapshotEndpoints) {
    try {
      const response = await fetch(`http://${cleaned}${endpoint}`, {
        signal: AbortSignal.timeout(1500),
      });
      if (response.ok) {
        const ct = response.headers.get('content-type') || '';
        if (ct.includes('image') || ct.includes('jpeg')) {
          const ab = await response.arrayBuffer();
          return { buffer: Buffer.from(ab), mimeType: 'image/jpeg' };
        }
      }
    } catch {
      // Continue to next option
    }
  }

  // 2. Connect to /video MJPEG stream and extract the first complete JPEG frame
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`http://${cleaned}/video`, {
      signal: controller.signal,
    });

    if (!response.ok || !response.body) {
      clearTimeout(timeout);
      return null;
    }

    const reader = response.body.getReader();
    let accumulated = Buffer.alloc(0);
    let startIndex = -1;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        accumulated = Buffer.concat([accumulated, Buffer.from(value)]);

        if (startIndex === -1) {
          // Search for JPEG Start of Image (SOI) marker: 0xFF, 0xD8
          for (let i = 0; i < accumulated.length - 1; i++) {
            if (accumulated[i] === 0xff && accumulated[i + 1] === 0xd8) {
              startIndex = i;
              break;
            }
          }
        }

        if (startIndex !== -1) {
          // Search for JPEG End of Image (EOI) marker: 0xFF, 0xD9
          for (let i = startIndex + 2; i < accumulated.length - 1; i++) {
            if (accumulated[i] === 0xff && accumulated[i + 1] === 0xd9) {
              const frameBuffer = accumulated.subarray(startIndex, i + 2);
              clearTimeout(timeout);
              controller.abort();
              return { buffer: frameBuffer, mimeType: 'image/jpeg' };
            }
          }
        }
      }
    }
    clearTimeout(timeout);
  } catch {
    // Stream read ended or timed out
  }

  return null;
}
