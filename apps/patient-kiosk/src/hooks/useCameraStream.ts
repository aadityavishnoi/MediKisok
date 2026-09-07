import { useState, useEffect, useRef, useCallback } from 'react';

export interface CameraDevice {
  deviceId: string;
  label: string;
  isDroidCam: boolean;
}

export function useCameraStream() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Stop any existing stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  // Enumerate connected cameras
  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return [];
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices.filter((d) => d.kind === 'videoinput');
      const mapped: CameraDevice[] = videoInputs.map((d, index) => {
        const rawLabel = d.label || `Camera ${index + 1}`;
        const isDroidCam = /droidcam|droid/i.test(rawLabel);
        return {
          deviceId: d.deviceId,
          label: isDroidCam ? `📱 ${rawLabel} (Phone DroidCam)` : `📷 ${rawLabel}`,
          isDroidCam,
        };
      });

      setDevices(mapped);
      return mapped;
    } catch (err) {
      console.warn('Failed to enumerate media devices:', err);
      return [];
    }
  }, []);

  // Start stream with specified or preferred device using a resilient fallback ladder
  const startCamera = useCallback(
    async (targetDeviceId?: string) => {
      stopCamera();
      setError(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera API is not supported in this browser.');
        return;
      }

      try {
        let stream: MediaStream | null = null;

        // Try 1: Targeted device or ideal resolution
        try {
          const primaryConstraints: MediaStreamConstraints = {
            video: targetDeviceId
              ? { deviceId: { exact: targetDeviceId } }
              : { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          };
          stream = await navigator.mediaDevices.getUserMedia(primaryConstraints);
        } catch (firstErr) {
          console.warn('[useCameraStream] Ideal constraints failed, trying basic video:', firstErr);
          // Try 2: Generic video constraint (avoids OverconstrainedError on virtual webcams)
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: targetDeviceId ? { deviceId: targetDeviceId } : true,
              audio: false,
            });
          } catch (secondErr) {
            console.warn('[useCameraStream] Targeted video failed, trying any video device:', secondErr);
            // Try 3: Absolute fallback
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          }
        }

        if (!stream) {
          throw new Error('Could not establish video stream.');
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch {
            // Handled if browser autoplays
          }
        }
        setIsStreaming(true);

        // After permission is granted, device labels become available
        const currentDevices = await refreshDevices();

        // Auto-select DroidCam if not explicitly targeted
        if (!targetDeviceId && currentDevices.length > 0) {
          const droidCam = currentDevices.find((d) => d.isDroidCam);
          if (droidCam && droidCam.deviceId) {
            // If the active track is not already the DroidCam, switch to it
            const activeTrack = stream.getVideoTracks()[0];
            const activeSetting = activeTrack?.getSettings();
            if (activeSetting?.deviceId !== droidCam.deviceId) {
              setSelectedDeviceId(droidCam.deviceId);
              // Switch directly
              stopCamera();
              const droidStream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: droidCam.deviceId } },
                audio: false,
              });
              streamRef.current = droidStream;
              if (videoRef.current) {
                videoRef.current.srcObject = droidStream;
                try {
                  await videoRef.current.play();
                } catch {}
              }
              setIsStreaming(true);
              return;
            }
            setSelectedDeviceId(droidCam.deviceId);
          } else {
            const activeTrack = stream.getVideoTracks()[0];
            const activeSetting = activeTrack?.getSettings();
            if (activeSetting?.deviceId) {
              setSelectedDeviceId(activeSetting.deviceId);
            }
          }
        } else if (targetDeviceId) {
          setSelectedDeviceId(targetDeviceId);
        }
      } catch (err: any) {
        console.error('Camera stream error:', err);
        setIsStreaming(false);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Camera permission was denied. Please click the lock/camera icon in your browser address bar and allow Camera access.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('No camera device detected. Make sure DroidCam is running and click Start.');
        } else if (err.name === 'NotReadableError') {
          setError('Camera is in use by another application (like Windows Camera app or Zoom). Please close other apps and try again.');
        } else {
          setError(`Camera notice: ${err.message || err.name || 'Unknown issue'}`);
        }
      }
    },
    [stopCamera, refreshDevices]
  );

  // Switch camera when selectedDeviceId changes
  const switchDevice = useCallback(
    async (deviceId: string) => {
      setSelectedDeviceId(deviceId);
      await startCamera(deviceId);
    },
    [startCamera]
  );

  // Capture current video frame to base64
  const captureSnapshot = useCallback((): { base64: string; width: number; height: number } | null => {
    if (!videoRef.current || !isStreaming) return null;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/jpeg', 0.92);
    return { base64, width: canvas.width, height: canvas.height };
  }, [isStreaming]);

  // Initial load and device listener
  useEffect(() => {
    refreshDevices();
    startCamera();

    const handleDeviceChange = () => {
      refreshDevices();
    };

    navigator.mediaDevices?.addEventListener?.('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices?.removeEventListener?.('devicechange', handleDeviceChange);
      stopCamera();
    };
  }, [startCamera, stopCamera, refreshDevices]);

  return {
    videoRef,
    devices,
    selectedDeviceId,
    isStreaming,
    error,
    startCamera,
    stopCamera,
    switchDevice,
    captureSnapshot,
    refreshDevices,
  };
}
