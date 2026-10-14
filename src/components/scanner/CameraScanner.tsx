'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  RefreshCw,
  SwitchCamera,
  AlertCircle,
  ShieldCheck,
  Zap,
  ZapOff,
  Smartphone,
} from 'lucide-react';
import { toast } from 'sonner';

interface CameraScannerProps {
  onCapture: (imageDataUrl: string) => void;
}

export function CameraScanner({ onCapture }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [isShutterActive, setIsShutterActive] = useState<boolean>(false);
  const [isTorchSupported, setIsTorchSupported] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsTorchOn(false);
  }, []);

  // Start camera stream
  const startCamera = useCallback(
    async (facing: 'environment' | 'user' = facingMode) => {
      stopCamera();
      setPermissionError(null);

      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissionError('Camera API is not supported in this browser. Please use HTTPS or upload an image.');
        return;
      }

      try {
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 },
          },
          audio: false,
        };

        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch {
          // Fallback if environment facing constraint is unsupported (e.g. desktop webcam)
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setIsCameraActive(true);

        // Check torch support on mobile track
        const track = stream.getVideoTracks()[0];
        if (track && 'getCapabilities' in track) {
          const capabilities = (track as any).getCapabilities?.();
          setIsTorchSupported(Boolean(capabilities?.torch));
        }

        // Enumerate devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setAvailableDevices(videoInputs);
      } catch (err: unknown) {
        console.error('Camera access error:', err);
        let message = 'Unable to access camera.';
        if (err instanceof DOMException) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            message = 'Camera permission was denied. Please allow camera permissions in your browser address bar.';
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            message = 'No camera device was found on this computer or phone.';
          } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            message = 'Camera is already in use by another app or tab.';
          }
        }
        setPermissionError(message);
        setIsCameraActive(false);
        toast.error(message);
      }
    },
    [facingMode, stopCamera]
  );

  // Toggle flashlight on supported mobile devices
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && 'applyConstraints' in track) {
      try {
        const nextTorch = !isTorchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextTorch }],
        });
        setIsTorchOn(nextTorch);
        toast.info(nextTorch ? 'Flashlight turned ON' : 'Flashlight turned OFF');
      } catch {
        toast.error('Torch could not be toggled on this lens.');
      }
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !isCameraActive) return;

    // Haptic vibration feedback for mobile devices
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(40);
    }

    setIsShutterActive(true);
    setTimeout(() => setIsShutterActive(false), 200);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

    stopCamera();
    toast.success('NID photo captured successfully!');
    onCapture(dataUrl);
  };

  return (
    <div className="w-full bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
      {/* Top Camera Status Bar */}
      <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isCameraActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
            }`}
          />
          <span className="font-semibold text-slate-200">
            {isCameraActive ? 'Active Lens Feed' : 'Camera Ready'}
          </span>
        </div>

        {isCameraActive && (
          <div className="flex items-center gap-2">
            {/* Flashlight toggle for mobile */}
            {isTorchSupported && (
              <button
                onClick={toggleTorch}
                className={`p-1.5 rounded-lg transition-colors ${
                  isTorchOn ? 'bg-amber-400 text-slate-900' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="Toggle Flashlight"
              >
                {isTorchOn ? <Zap className="w-4 h-4 fill-slate-900" /> : <ZapOff className="w-4 h-4" />}
              </button>
            )}

            {/* Switch camera lens (mobile front/rear) */}
            {availableDevices.length > 1 && (
              <button
                onClick={toggleFacingMode}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
                title="Switch Camera (Front / Rear)"
              >
                <SwitchCamera className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Flip</span>
              </button>
            )}

            <button
              onClick={stopCamera}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs transition-colors"
            >
              <CameraOff className="w-3.5 h-3.5" />
              <span>Stop</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Viewport Container (Responsive for Mobile, Tab, and PC) */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] md:aspect-[16/9] bg-slate-950 flex items-center justify-center overflow-hidden">
        {/* Shutter Animation */}
        {isShutterActive && (
          <div className="absolute inset-0 bg-white z-40 animate-out fade-out duration-200" />
        )}

        {/* Video stream */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isCameraActive ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Responsive Card Scanning Guide Overlay */}
        {isCameraActive && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4 sm:p-6 z-20">
            {/* Aspect ratio frame 1.586 (standard Bangladeshi NID) */}
            <div className="relative w-[92%] sm:w-[85%] md:w-[75%] max-w-lg aspect-[1.586/1] rounded-2xl border-2 border-blue-400 shadow-2xl overflow-hidden scanner-active-glow">
              {/* Corner Target Brackets */}
              <div className="absolute top-0 left-0 w-6 sm:w-8 h-6 sm:h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-6 sm:w-8 h-6 sm:h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-6 sm:w-8 h-6 sm:h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-6 sm:w-8 h-6 sm:h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />

              {/* Animated Laser Scanning Beam */}
              <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-scan-beam" />

              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-white/80 uppercase bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-sm border border-white/10">
                  Align NID Card Inside Frame
                </span>
              </div>
            </div>

            <p className="mt-3 text-[11px] sm:text-xs text-slate-200 font-bengali text-center bg-slate-900/90 px-3 py-1.5 rounded-full border border-slate-700/80 shadow max-w-sm">
              এনআইডি কার্ডটি ফ্রেমের সমান্তরালে রাখুন এবং পর্যাপ্ত আলো নিশ্চিত করুন
            </p>
          </div>
        )}

        {/* Inactive Standby Screen */}
        {!isCameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-slate-950">
            {permissionError ? (
              <div className="max-w-md p-5 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-slate-200">
                <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
                <h3 className="font-semibold text-rose-200 text-sm mb-1">Camera Access Notice</h3>
                <p className="text-xs text-rose-300 mb-4">{permissionError}</p>
                <button
                  onClick={() => startCamera()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 mx-auto transition-all shadow"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
              </div>
            ) : (
              <div className="max-w-sm flex flex-col items-center text-slate-400">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 mb-4 shadow-inner">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-white text-base mb-1">Live NID Camera Scanner</h3>
                <p className="text-xs text-slate-400 mb-5 leading-relaxed font-bengali">
                  মোবাইল, ট্যাব বা পিসির ক্যামেরা দিয়ে কার্ড স্ক্যান করতে স্টার্ট চাপুন
                </p>
                <button
                  onClick={() => startCamera()}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2.5 shadow-lg shadow-blue-600/30 transition-all hover:scale-105 active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>Start Camera / ক্যামেরা চালু করুন</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Shutter Action Bar */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="hidden sm:inline">In-Memory Local Stream</span>
        </div>

        {/* Large touch-friendly capture button */}
        {isCameraActive && (
          <div className="flex items-center justify-center flex-1 sm:flex-initial">
            <button
              onClick={capturePhoto}
              className="px-6 py-3 sm:px-8 sm:py-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-sm flex items-center gap-3 shadow-xl shadow-emerald-500/30 transition-all transform hover:scale-105 active:scale-95 ring-4 ring-emerald-500/20"
            >
              <div className="w-3.5 h-3.5 rounded-full bg-white animate-ping" />
              <span>Capture Photo / ছবি তুলুন</span>
            </button>
          </div>
        )}

        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500">
          <Smartphone className="w-3.5 h-3.5" />
          <span>Mobile & Tab Optimized</span>
        </div>
      </div>
    </div>
  );
}
