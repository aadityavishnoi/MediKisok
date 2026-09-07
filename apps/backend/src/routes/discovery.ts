import { Router } from 'express';
import os from 'node:os';
import net from 'node:net';

export const discoveryRouter = Router();

// Auto-discover phone running DroidCam on the local Wi-Fi subnet
discoveryRouter.get('/devices/find-droidcam', async (_req, res) => {
  try {
    const interfaces = os.networkInterfaces();
    let localSubnets: string[] = [];

    for (const name of Object.keys(interfaces)) {
      const addrs = interfaces[name] || [];
      for (const addr of addrs) {
        if (addr.family === 'IPv4' && !addr.internal && (addr.address.startsWith('192.168.') || addr.address.startsWith('10.') || addr.address.startsWith('172.'))) {
          const subnet = addr.address.substring(0, addr.address.lastIndexOf('.') + 1);
          if (!localSubnets.includes(subnet)) {
            localSubnets.push(subnet);
          }
        }
      }
    }

    if (localSubnets.length === 0) {
      localSubnets = ['192.168.29.', '192.168.1.', '192.168.0.'];
    }

    // Probe port 4747 on the subnets concurrently
    const probePromises: Promise<string | null>[] = [];

    for (const subnet of localSubnets) {
      for (let i = 1; i <= 254; i++) {
        const targetIp = `${subnet}${i}`;
        probePromises.push(
          new Promise((resolve) => {
            const socket = new net.Socket();
            socket.setTimeout(750);

            socket.on('connect', () => {
              socket.destroy();
              resolve(targetIp);
            });

            socket.on('error', () => {
              socket.destroy();
              resolve(null);
            });

            socket.on('timeout', () => {
              socket.destroy();
              resolve(null);
            });

            socket.connect(4747, targetIp);
          })
        );
      }
    }

    const results = await Promise.all(probePromises);
    const foundIps = results.filter((ip): ip is string => Boolean(ip));

    if (foundIps.length > 0) {
      const bestIp = foundIps[0];
      res.json({
        found: true,
        ip: bestIp,
        port: 4747,
        fullUrl: `http://${bestIp}:4747/video`,
        allFound: foundIps,
      });
      return;
    }

    res.status(404).json({
      found: false,
      message: 'No DroidCam device found on local Wi-Fi. Ensure DroidCam is open on your phone and on the same Wi-Fi.',
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message || 'Discovery error' } });
  }
});
