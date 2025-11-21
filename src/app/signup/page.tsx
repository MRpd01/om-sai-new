"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChefHat, Mail, Lock, Eye, EyeOff, ArrowLeft, User, Phone, Users, Building } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function SignupContent() {
  const searchParams = useSearchParams();
  const urlRole = searchParams?.get('role');
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    parent_mobile: '',
    joining_date: '',
    password: '',
    confirmPassword: '',
    role: urlRole || 'user'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [videoReadyState, setVideoReadyState] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoListenersRef = useRef<Array<() => void>>([]);
  const [photoSelected, setPhotoSelected] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(null);
  const { signUp } = useAuth();
  const router = useRouter();

  // Update role when URL parameter changes
  useEffect(() => {
    if (urlRole) {
      setFormData(prev => ({
        ...prev,
        role: urlRole
      }));
    }
  }, [urlRole]);

  // cleanup preview object URL on unmount or when file changes
  useEffect(() => {
    return () => {
      // revoke preview URL
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
      // stop camera if active
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      setIsCameraOn(false);
    };
  }, [photoPreview]);

  const openCamera = async () => {
    try {
      console.log('Requesting camera access...');
      
      // Simple camera request without complex constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      });
      
      console.log('Camera stream obtained:', stream);
      streamRef.current = stream;
      setIsCameraOn(true);
      
      // Set video source immediately
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Auto-play the video and mark ready when playable
        const vid = videoRef.current;
        const onCanPlay = () => {
          console.log('Video can play');
          setVideoReadyState(true);
        };
        const onLoadedMetadata = async () => {
          console.log('Video metadata loaded, attempting to play...');
          try {
            await vid?.play();
            console.log('Video started playing successfully');
            setVideoReadyState(true);
          } catch (playErr) {
            console.error('Play error:', playErr);
          }
        };
        const onPlay = () => setVideoReadyState(true);

        vid.addEventListener('canplay', onCanPlay);
        vid.addEventListener('loadedmetadata', onLoadedMetadata);
        vid.addEventListener('play', onPlay);
        // remember listeners to remove later
        videoListenersRef.current = [
          () => vid.removeEventListener('canplay', onCanPlay),
          () => vid.removeEventListener('loadedmetadata', onLoadedMetadata),
          () => vid.removeEventListener('play', onPlay),
        ];
      }
    } catch (err) {
      console.error('Camera permission denied or not available', err);
      setIsCameraOn(false);
      alert('Unable to access camera. Please allow camera access or use upload.');
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      // remove any attached listeners
      try {
        videoListenersRef.current.forEach(fn => fn());
      } catch (e) {
        console.error('Error removing video listeners:', e);
      }
    }
    setIsCameraOn(false);
    setVideoReadyState(false);
  };

  // Test function to debug camera
  const testCamera = async () => {
    console.log('=== CAMERA TEST START ===');
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log('Available devices:', devices.filter(d => d.kind === 'videoinput'));
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      console.log('Test stream obtained:', stream);
      console.log('Stream active:', stream.active);
      console.log('Video tracks:', stream.getVideoTracks());
      
      // Stop test stream
      stream.getTracks().forEach(track => track.stop());
      
      alert('Camera test successful! Check console for details.');
    } catch (error) {
      console.error('Camera test failed:', error);
      alert('Camera test failed: ' + (error as Error).message);
    }
    console.log('=== CAMERA TEST END ===');
  };

  const captureFromCamera = async () => {
    if (!videoRef.current) {
      console.error('Video element not found');
      return;
    }
    
    const video = videoRef.current;
    // Wait for video to become ready (HAVE_ENOUGH_DATA / canplay) up to a timeout
    const waitForVideoReady = (timeout = 5000) => new Promise<boolean>((resolve) => {
      if (video.readyState >= 3) return resolve(true); // HAVE_FUTURE_DATA (3) or HAVE_ENOUGH_DATA (4)
      let settled = false;
      const timer = setTimeout(() => { if (!settled) { settled = true; resolve(false); } }, timeout);
      const onReady = () => { if (!settled) { settled = true; clearTimeout(timer); resolve(true); } };
      video.addEventListener('canplay', onReady, { once: true });
      video.addEventListener('loadedmetadata', onReady, { once: true });
      video.addEventListener('play', onReady, { once: true });
    });

    let ready = await waitForVideoReady(5000);
    let sourceVideo: HTMLVideoElement = video;

    if (!ready) {
      console.warn('Video not ready, attempting fallback using hidden temporary video element. readyState:', video.readyState);
      // Attempt fallback: create an offscreen video element and attach the same stream
      if (streamRef.current) {
        const tempVid = document.createElement('video');
        tempVid.muted = true;
        tempVid.playsInline = true;
        tempVid.style.position = 'fixed';
        tempVid.style.left = '-10000px';
        tempVid.style.width = '1px';
        tempVid.style.height = '1px';
        tempVid.srcObject = streamRef.current;
        document.body.appendChild(tempVid);

        try {
          await tempVid.play();
        } catch (playErr) {
          console.warn('tempVid.play() rejected:', playErr);
        }

        // wait briefly for canplay
        await new Promise((res) => {
          const onReady = () => { res(true); };
          tempVid.addEventListener('canplay', onReady, { once: true });
          // fallback timeout
          setTimeout(() => res(false), 4000);
        });

        if (tempVid.readyState >= 3) {
          console.log('Fallback temp video readyState:', tempVid.readyState);
          ready = true;
          sourceVideo = tempVid;
        } else {
          console.error('Fallback temp video not ready, readyState:', tempVid.readyState);
        }

        // proceed and ensure we clean up the temp video after capture
        var cleanupTempVideo = () => {
          try {
            tempVid.pause();
            // @ts-ignore
            tempVid.srcObject = null;
            tempVid.remove();
          } catch (e) { console.warn('Error cleaning up temp video', e); }
        };

        // we'll call cleanupTempVideo after capture
        (sourceVideo as any).__cleanupTempVideo = cleanupTempVideo;
      }
    }

    if (!ready) {
      console.error('Video not ready after fallback attempts, readyState:', video.readyState);
      alert('Please wait for camera to load completely');
      return;
    }
    
    console.log('Capturing from video...');
    console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
    
  const canvas = canvasRef.current || document.createElement('canvas');
  const width = (sourceVideo.videoWidth && sourceVideo.videoWidth > 0) ? sourceVideo.videoWidth : (video.videoWidth || 640);
  const height = (sourceVideo.videoHeight && sourceVideo.videoHeight > 0) ? sourceVideo.videoHeight : (video.videoHeight || 480);
    
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get canvas context');
      return;
    }
    
    // Try ImageCapture API as a fallback on some devices/browsers
    try {
      // If ImageCapture is available and we have a track, prefer it
      if ((window as any).ImageCapture && streamRef.current) {
        const [track] = streamRef.current.getVideoTracks();
        if (track) {
          try {
            const ImageCaptureCtor = (window as any).ImageCapture;
            const ic = new ImageCaptureCtor(track);
            // try takePhoto (may not be supported) then fallback to grabFrame
            if (ic.takePhoto) {
              const blob = await ic.takePhoto();
              if (blob) {
                const file = new File([blob], `avatar_${Date.now()}.png`, { type: blob.type || 'image/png' });
                const url = URL.createObjectURL(file);
                setPhotoFile(file);
                setPhotoPreview(url);
                setPhotoSelected(true);
                if ((sourceVideo as any).__cleanupTempVideo) {
                  try { (sourceVideo as any).__cleanupTempVideo(); } catch (e) { console.warn(e); }
                }
                console.log('Capture complete via ImageCapture.takePhoto');
                return;
              }
            }

            // fallback to grabFrame which returns an ImageBitmap
            if (ic.grabFrame) {
              const bitmap = await ic.grabFrame();
              // draw ImageBitmap to canvas
              canvas.width = bitmap.width;
              canvas.height = bitmap.height;
              ctx.drawImage(bitmap as any, 0, 0);
              // convert
              canvas.toBlob((blob2) => {
                if (!blob2) { console.error('Failed to create blob from bitmap'); return; }
                const file = new File([blob2], `avatar_${Date.now()}.png`, { type: blob2.type || 'image/png' });
                const url = URL.createObjectURL(file);
                setPhotoFile(file);
                setPhotoPreview(url);
                setPhotoSelected(true);
                if ((sourceVideo as any).__cleanupTempVideo) {
                  try { (sourceVideo as any).__cleanupTempVideo(); } catch (e) { console.warn(e); }
                }
                console.log('Capture complete via ImageCapture.grabFrame');
              }, 'image/png', 0.9);
              return;
            }
          } catch (icErr) {
            console.warn('ImageCapture failed, falling back to drawImage:', icErr);
            // continue to drawImage fallback
          }
        }
      }
    } catch (err) {
      console.warn('ImageCapture path threw:', err);
    }

    // Draw the video frame to canvas
    ctx.drawImage(video, 0, 0, width, height);

    // Convert to blob and create File
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Failed to create blob from canvas');
        return;
      }
      
      console.log('Blob created:', blob.size, 'bytes, type:', blob.type);
      
      const file = new File([blob], `avatar_${Date.now()}.png`, { type: 'image/png' });
      console.log('File created:', file.name, file.size, file.type);
      
      // revoke previous preview
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
      
      const url = URL.createObjectURL(file);
      console.log('Object URL created:', url);
      
      setPhotoFile(file);
      setPhotoPreview(url);
      setPhotoSelected(true);
      
      // If we used a temporary video, cleanup it separately; otherwise keep camera open but stop if desired
      if ((sourceVideo as any).__cleanupTempVideo) {
        try { (sourceVideo as any).__cleanupTempVideo(); } catch (e) { console.warn(e); }
      } else {
        // keep existing stream open but optionally close camera
        // closeCamera();
      }
      
      console.log('Capture complete, photo state updated');
    }, 'image/png', 0.9);
  };

  const markPhotoSelected = () => {
    if (photoFile) setPhotoSelected(true);
  };

  const uploadCapturedPhoto = async () => {
    if (!photoFile) return;
    setUploadingPhoto(true);
    // simulate upload by converting to data URL (this is what signUp uses for demo)
    const dataUrl = await new Promise<string | undefined>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(photoFile);
    });

    // simulate network delay
    await new Promise(r => setTimeout(r, 800));
    setUploadedAvatarUrl(dataUrl || null);
    setUploadingPhoto(false);
    alert('Photo uploaded (simulated) and ready to be used for signup.');
  };

  const roleConfig = {
    user: {
      title: 'Join as Member',
      description: 'Create your mess membership account',
      icon: Users,
      color: 'orange'
    },
    admin: {
      title: 'Register as Mess Owner',
      description: 'Submit your mess business registration',
      icon: ChefHat,
      color: 'orange'
    }
  };

  const currentRole = formData.role as 'user' | 'admin';
  const config = roleConfig[currentRole];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const validateForm = () => {
    if (!formData.full_name.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    // Parent mobile is optional but if provided, do basic validation
    if (formData.parent_mobile && formData.parent_mobile.trim().length < 6) {
      setError('Parent mobile number seems invalid');
      return false;
    }
    
    // Validate password for both members and mess owners
    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    // Skip photo conversion for now - handle it separately if needed
    // Photo will be null for initial signup to speed things up
    const avatarData = undefined; // Skip photo processing to speed up signup

    if (currentRole === 'user') {
      // Create account with Supabase Auth
      const { error } = await signUp(formData.email, formData.password, {
        full_name: formData.full_name,
        phone: formData.phone,
        parent_mobile: formData.parent_mobile,
        joining_date: formData.joining_date,
        role: formData.role,
        avatar: avatarData,
        language: 'mr', // Default to Marathi
      });
      
      setLoading(false); // Stop loading immediately after signUp
      
      if (error) {
        // Handle specific Supabase auth errors
        if (error.message === 'User already registered') {
          setError('An account with this email already exists. Please sign in instead.');
        } else if (error.message.includes('Password should be at least')) {
          setError('Password must be at least 6 characters long.');
        } else if (error.message.includes('Invalid email')) {
          setError('Please enter a valid email address.');
        } else {
          setError(error.message || 'Failed to create account');
        }
      } else {
        // Registration successful - redirect to login immediately
        router.push('/login');
      }
    } else {
      // For mess owners, create account
      const { error } = await signUp(formData.email, formData.password, {
        full_name: formData.full_name,
        phone: formData.phone,
        parent_mobile: formData.parent_mobile,
        role: 'admin',
        avatar: avatarData,
        language: 'mr',
      });
      
      setLoading(false); // Stop loading immediately
      
      if (error) {
        setError(error.message || 'Failed to create account');
      } else {
        router.push('/login?role=admin');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Back to Home */}
        <div className="mb-6">
          <Link 
            href="/" 
            className="inline-flex items-center text-orange-600 hover:text-orange-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <Card className="border-orange-200 shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className={`p-3 bg-${config.color}-100 rounded-full`}>
                <config.icon className={`h-8 w-8 text-${config.color}-600`} />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-orange-900">{config.title}</CardTitle>
            <CardDescription className="text-orange-700">
              {config.description}
            </CardDescription>
            
            {/* Role Switch */}
            <div className="flex items-center justify-center space-x-2 pt-2">
              <span className="text-sm text-orange-600">Not what you're looking for?</span>
              <Link 
                href={`/signup?role=${currentRole === 'user' ? 'admin' : 'user'}`}
                className="text-sm font-medium text-orange-700 hover:text-orange-900 underline"
              >
                {currentRole === 'user' ? 'Register as Mess Owner' : 'Join as Member'}
              </Link>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Photo upload (only for mess members) */}
              {currentRole === 'user' && (
                <div className="flex items-center justify-center">
                  <div className="text-center w-full">
                    <div className="mx-auto mb-3 w-28 h-28 rounded-full overflow-hidden bg-orange-50 border border-orange-200 flex items-center justify-center">
                      {photoPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={photoPreview} 
                          alt="Profile preview" 
                          className="w-full h-full object-cover"
                          onLoad={() => {
                            console.log('Image loaded successfully:', photoPreview);
                          }}
                          onError={(e) => {
                            console.error('Image failed to load:', e);
                            console.error('Image src:', photoPreview);
                          }}
                          style={{ 
                            display: 'block',
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover' 
                          }}
                        />
                      ) : (
                        <User className="h-12 w-12 text-orange-400" />
                      )}
                    </div>
                    
                    {/* Debug info */}
                    <div className="text-xs text-gray-700 mb-2">
                      Photo Preview: {photoPreview ? '✓ Set' : '✗ Not set'} | 
                      Camera: {isCameraOn ? '✓ On' : '✗ Off'} | 
                      File: {photoFile ? '✓ Selected' : '✗ None'}
                      {photoPreview && <div className="truncate">URL: {photoPreview.substring(0, 50)}...</div>}
                    </div>

                    {/* Camera Test Button */}
                    <button
                      type="button"
                      onClick={testCamera}
                      className="mb-3 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                      suppressHydrationWarning
                    >
                      Test Camera Access
                    </button>

                    <div className="flex items-center justify-center space-x-2">
                      {!isCameraOn && (
                        <>
                          <label htmlFor="photoUpload" className="inline-flex items-center px-3 py-1.5 bg-white border border-orange-200 text-orange-600 rounded cursor-pointer hover:bg-orange-50">
                            Upload Photo
                          </label>
                          {photoPreview && (
                            <button
                              type="button"
                              onClick={() => { setPhotoFile(null); setPhotoPreview(null); setPhotoSelected(false); setUploadedAvatarUrl(null); }}
                              className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 rounded hover:bg-red-100"
                              suppressHydrationWarning
                            >
                              Remove
                            </button>
                          )}
                        </>
                      )}

                      {!isCameraOn ? (
                        <button
                          type="button"
                          onClick={openCamera}
                          className="px-3 py-1.5 bg-white border border-orange-200 text-orange-600 rounded hover:bg-orange-50"
                          suppressHydrationWarning
                        >
                          Use Camera
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={captureFromCamera}
                            className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded hover:bg-green-100"
                            suppressHydrationWarning
                          >
                            Capture
                          </button>
                          <button
                            type="button"
                            onClick={closeCamera}
                            className="px-3 py-1.5 bg-white border border-orange-200 text-orange-600 rounded hover:bg-orange-50"
                            suppressHydrationWarning
                          >
                            Close Camera
                          </button>
                        </>
                      )}

                      <input
                        id="photoUpload"
                        name="photo"
                        type="file"
                        accept="image/*"
                        className={`${isCameraOn ? 'hidden' : 'hidden'}`}
                        onChange={(e) => {
                          console.log('File input changed:', e.target.files);
                          const f = e.target.files?.[0] || null;
                          if (f) {
                            console.log('Selected file:', f.name, f.size, f.type);
                            // revoke previous preview
                            if (photoPreview) URL.revokeObjectURL(photoPreview);
                            const url = URL.createObjectURL(f);
                            console.log('Created object URL:', url);
                            setPhotoFile(f);
                            setPhotoPreview(url);
                            setPhotoSelected(true);
                            console.log('Photo state updated');
                          } else {
                            console.log('No file selected');
                          }
                        }}
                      />
                    </div>

                    {/* Live camera preview */}
                    {isCameraOn && (
                      <div className="mt-3 flex flex-col items-center">
                        <video 
                          ref={videoRef} 
                          className="w-48 h-36 rounded-lg border border-orange-300" 
                          autoPlay
                          playsInline 
                          muted 
                          controls={false}
                          style={{ backgroundColor: '#000' }}
                          onCanPlay={() => console.log('Video ready to play')}
                          onPlay={() => console.log('Video playing')}
                          onError={(e) => console.error('Video error:', e)}
                        />
                        <canvas ref={canvasRef} className="hidden" />
                      </div>
                    )}

                    {/* Upload action after selection/capture */}
                    {photoSelected && (
                      <div className="mt-3 flex justify-center space-x-2">
                        <button
                          type="button"
                          onClick={uploadCapturedPhoto}
                          disabled={uploadingPhoto}
                          className="px-4 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded hover:bg-blue-100"
                          suppressHydrationWarning
                        >
                          {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                        </button>
                        {uploadedAvatarUrl && (
                          <span className="text-sm text-green-700">Photo ready</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="full_name" className="text-sm font-medium text-orange-900">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-orange-500" />
                  <Input
                    id="full_name"
                    name="full_name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="pl-10 border-orange-200 focus:border-orange-400 focus:ring-orange-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-orange-900">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-orange-500" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10 border-orange-200 focus:border-orange-400 focus:ring-orange-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-orange-900">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-orange-500" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="pl-10 border-orange-200 focus:border-orange-400 focus:ring-orange-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="parent_mobile" className="text-sm font-medium text-orange-900">
                  Parent / Guardian Mobile (optional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-orange-500" />
                  <Input
                    id="parent_mobile"
                    name="parent_mobile"
                    type="tel"
                    placeholder="Enter parent or guardian mobile"
                    value={formData.parent_mobile}
                    onChange={handleInputChange}
                    className="pl-10 border-orange-200 focus:border-orange-400 focus:ring-orange-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="joining_date" className="text-sm font-medium text-orange-900">
                  Joining Date (optional)
                </label>
                <div className="relative">
                  <Input
                    id="joining_date"
                    name="joining_date"
                    type="date"
                    placeholder="Select joining date"
                    value={formData.joining_date}
                    onChange={handleInputChange}
                    className="pl-3 border-orange-200 focus:border-orange-400 focus:ring-orange-400"
                  />
                </div>
              </div>

              {/* Show password fields for both members and mess owners */}
              <>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-orange-900">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-orange-500" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="pl-10 pr-10 border-orange-200 focus:border-orange-400 focus:ring-orange-400"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-orange-500 hover:text-orange-700"
                      suppressHydrationWarning
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-orange-900">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-orange-500" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="pl-10 pr-10 border-orange-200 focus:border-orange-400 focus:ring-orange-400"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-orange-500 hover:text-orange-700"
                      suppressHydrationWarning
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </>

              {/* Terms and conditions - only for mess members */}
              {currentRole === 'user' && (
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-orange-300 text-orange-600 focus:ring-orange-500" 
                    required
                  />
                  <span className="ml-2 text-sm text-orange-700">
                    I agree to the{' '}
                    <Link href="/terms" className="text-orange-600 hover:text-orange-700">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-orange-600 hover:text-orange-700">
                      Privacy Policy
                    </Link>
                  </span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                disabled={loading}
                suppressHydrationWarning
              >
                {loading ? 
                  (currentRole === 'user' ? 'Creating account...' : 'Submitting request...') : 
                  (currentRole === 'user' ? 'Create Account' : 'Submit Registration Request')
                }
              </Button>
            </form>

            <div className="text-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-orange-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-orange-500">Or</span>
                </div>
              </div>

              <div className="text-sm text-orange-700">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-orange-600 hover:text-orange-700">
                  Sign in
                </Link>
              </div>
            </div>`
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupContent />
    </Suspense>
  );
}