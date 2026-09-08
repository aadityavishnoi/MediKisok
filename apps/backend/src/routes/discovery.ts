import { Router } from 'express';
import os from 'node:os';
import net from 'node:net';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);
export const discoveryRouter = Router();

function probePort(ip: string, port: number = 4747, timeoutMs: number = 550): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);

    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });

    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    try {
      socket.connect(port, ip);
    } catch {
      resolve(false);
    }
  });
}

async function getArpNeighborIps(): Promise<string[]> {
  try {
    const { stdout } = await execAsync('arp -a', { timeout: 1500 });
    const ips = new Set<string>();
    const regex = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g;
    let match;
    while ((match = regex.exec(stdout)) !== null) {
      const ip = match[1];
      if (
        !ip.startsWith('224.') &&
        !ip.startsWith('239.') &&
        !ip.endsWith('.255') &&
        ip !== '255.255.255.255' &&
        ip !== '0.0.0.0'
      ) {
        ips.add(ip);
      }
    }
    return Array.from(ips);
  } catch {
    return [];
  }
}

// Auto-discover phone running DroidCam on local network, USB, or Wi-Fi
discoveryRouter.get('/devices/find-droidcam', async (req, res) => {
  try {
    const requestedTarget = req.query.target ? String(req.query.target).trim() : null;
    const candidates = new Set<string>();

    // 1. If explicit target requested, test it first
    if (requestedTarget) {
      const clean = requestedTarget.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      const [host, portStr] = clean.split(':');
      const port = portStr ? parseInt(portStr, 10) : 4747;
      const ok = await probePort(host, port, 1000);
      if (ok) {
        res.json({
          found: true,
          ip: host,
          port,
          fullUrl: `http://${host}:${port}/video`,
          proxyUrl: `/api/devices/droidcam-frame?ip=${encodeURIComponent(`${host}:${port}`)}`,
          mode: host === '127.0.0.1' || host === 'localhost' ? 'USB' : 'WIFI',
        });
        return;
      }
    }

    // 2. Test Localhost / USB ADB mode (DroidCam PC client or ADB port forward)
    const usbOk = await probePort('127.0.0.1', 4747, 400);
    if (usbOk) {
      res.json({
        found: true,
        ip: '127.0.0.1',
        port: 4747,
        fullUrl: 'http://127.0.0.1:4747/video',
        proxyUrl: `/api/devices/droidcam-frame?ip=${encodeURIComponent('127.0.0.1:4747')}`,
        mode: 'USB',
      });
      return;
    }

    // 3. Fast ARP Cache check for active neighbors
    const arpIps = await getArpNeighborIps();
    for (const ip of arpIps) {
      candidates.add(ip);
    }

    // 4. Inspect local network interfaces
    const interfaces = os.networkInterfaces();
    const subnets: string[] = [];

    for (const name of Object.keys(interfaces)) {
      const addrs = interfaces[name] || [];
      for (const addr of addrs) {
        if (addr.family === 'IPv4' && !addr.internal) {
          candidates.add(addr.address);
          const parts = addr.address.split('.');
          if (parts.length === 4) {
            const subnetPrefix = `${parts[0]}.${parts[1]}.${parts[2]}.`;
            if (!subnets.includes(subnetPrefix)) {
              subnets.push(subnetPrefix);
            }
            // Add immediate neighborhood around this machine's IP (e.g. +/- 30)
            const myOctet = parseInt(parts[3], 10);
            const start = Math.max(1, myOctet - 30);
            const end = Math.min(254, myOctet + 30);
            for (let i = start; i <= end; i++) {
              candidates.add(`${subnetPrefix}${i}`);
            }
          }
        }
      }
    }

    // 5. Common hotspot & router gateway IPs
    const commonGateways = [
      '192.168.43.1',   // Android Wi-Fi Hotspot default phone IP
      '172.20.10.1',    // iPhone Personal Hotspot default phone IP
      '192.168.137.1',  // Windows Mobile Hotspot default
      '192.168.29.1',   // JioFiber default
      '192.168.1.1',    // Airtel / TP-Link default
      '192.168.0.1',    // D-Link default
    ];
    for (const gw of commonGateways) {
      candidates.add(gw);
    }

    const candidateList = Array.from(candidates);

    // Concurrently probe candidate list in chunks of 40
    const CHUNK_SIZE = 40;
    const foundList: { ip: string; port: number }[] = [];

    for (let i = 0; i < candidateList.length; i += CHUNK_SIZE) {
      const chunk = candidateList.slice(i, i + CHUNK_SIZE);
      const results = await Promise.all(
        chunk.map(async (ip) => {
          // Probe default DroidCam port 4747
          const is4747 = await probePort(ip, 4747, 500);
          if (is4747) return { ip, port: 4747 };
          // Probe IP Webcam port 8080 as alternate
          const is8080 = await probePort(ip, 8080, 450);
          if (is8080) return { ip, port: 8080 };
          return null;
        })
      );

      for (const resItem of results) {
        if (resItem) {
          foundList.push(resItem);
        }
      }

      // If we found a device, return immediately for instant response
      if (foundList.length > 0) {
        const best = foundList[0];
        res.json({
          found: true,
          ip: best.ip,
          port: best.port,
          fullUrl: `http://${best.ip}:${best.port}/video`,
          proxyUrl: `/api/devices/droidcam-frame?ip=${encodeURIComponent(`${best.ip}:${best.port}`)}`,
          allFound: foundList,
          mode: best.ip === '127.0.0.1' ? 'USB' : 'WIFI',
        });
        return;
      }
    }

    res.status(404).json({
      found: false,
      message: 'No DroidCam device found automatically. Check that DroidCam is running on your phone, or enter the Wi-Fi IP shown in the DroidCam app.',
      subnetsChecked: subnets,
      scannedCount: candidateList.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message || 'Discovery error' } });
  }
});

// Quick endpoint to test/verify any DroidCam IP & Port
discoveryRouter.post('/devices/probe-droidcam', async (req, res) => {
  try {
    const { ip, port = 4747 } = req.body;
    if (!ip) {
      res.status(400).json({ error: { message: 'Missing IP' } });
      return;
    }
    const cleanIp = String(ip).trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const [host, portStr] = cleanIp.split(':');
    const targetPort = portStr ? parseInt(portStr, 10) : Number(port) || 4747;

    const ok = await probePort(host, targetPort, 1200);
    res.json({
      success: ok,
      ip: host,
      port: targetPort,
      fullUrl: `http://${host}:${targetPort}/video`,
      proxyUrl: `/api/devices/droidcam-frame?ip=${encodeURIComponent(`${host}:${targetPort}`)}`,
      message: ok ? 'DroidCam reachable!' : `Cannot connect to ${host}:${targetPort}`,
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});
