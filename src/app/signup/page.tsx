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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
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
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640, min: 320, max: 1280 },
          height: { ideal: 480, min: 240, max: 720 }
        }, 
        audio: false 
      });
      console.log('Camera stream obtained:', stream);
      console.log('Video tracks:', stream.getVideoTracks());
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        console.log('Setting video srcObject...');
        videoRef.current.srcObject = stream;
        
        // Wait for metadata to load
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          console.log('Video dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
          
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              console.log('Video playing successfully');
              setIsCameraOn(true);
            }).catch(err => {
              console.error('Error playing video:', err);
            });
          }
        };
        
        // Also try to play immediately if already loaded
        if (videoRef.current.readyState >= 3) {
          videoRef.current.play().catch(console.error);
          setIsCameraOn(true);
        }
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
    setIsCameraOn(false);
  };

  const captureFromCamera = async () => {
    if (!videoRef.current) {
      console.error('Video element not found');
      return;
    }
    
    const video = videoRef.current;
    
    if (video.readyState !== 4) {
      console.error('Video not ready, readyState:', video.readyState);
      alert('Please wait for camera to load completely');
      return;
    }
    
    console.log('Capturing from video...');
    console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
    
    const canvas = canvasRef.current || document.createElement('canvas');
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get canvas context');
      return;
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
      
      // stop camera after capture
      closeCamera();
      
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
    
    // Only validate password for mess members (users)
    if (currentRole === 'user') {
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    if (currentRole === 'user') {
      // If a photo is selected, convert to data URL and include in metadata
      let avatarData: string | undefined = undefined;
      if (photoFile) {
        avatarData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error('Failed to read image'));
          reader.readAsDataURL(photoFile);
        }).catch(() => undefined);
      }
      // For mess members, create account with password
      const { error } = await signUp(formData.email, formData.password, {
        full_name: formData.full_name,
        phone: formData.phone,
        role: formData.role
        , avatar: avatarData
      });
      
      if (error) {
        setError(error.message || 'Failed to create account');
      } else {
        router.push('/dashboard');
      }
    } else {
      // For mess owners, just collect information (no password needed for demo)
      // In a real app, this would send data to admin or create a pending account
      alert(`Thank you ${formData.full_name}! Your mess owner registration has been submitted. You will receive login credentials via email shortly.`);
      router.push('/');
    }
    
    setLoading(false);
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
                    <div className="text-xs text-gray-500 mb-2">
                      Photo Preview: {photoPreview ? '✓ Set' : '✗ Not set'} | 
                      Camera: {isCameraOn ? '✓ On' : '✗ Off'} | 
                      File: {photoFile ? '✓ Selected' : '✗ None'}
                      {photoPreview && <div className="truncate">URL: {photoPreview.substring(0, 50)}...</div>}
                    </div>

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
                        >
                          Use Camera
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={captureFromCamera}
                            className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded hover:bg-green-100"
                          >
                            Capture
                          </button>
                          <button
                            type="button"
                            onClick={closeCamera}
                            className="px-3 py-1.5 bg-white border border-orange-200 text-orange-600 rounded hover:bg-orange-50"
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
                          className="w-48 h-36 rounded-lg bg-gray-800" 
                          playsInline 
                          muted 
                          autoPlay
                          controls={false}
                          style={{ objectFit: 'cover' }}
                          onLoadedMetadata={() => {
                            console.log('Video element loaded metadata');
                            console.log('Video dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
                          }}
                          onPlay={() => console.log('Video element started playing')}
                          onError={(e) => console.error('Video error:', e)}
                          onCanPlay={() => console.log('Video can play')}
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

              {/* Only show password fields for mess members (users) */}
              {currentRole === 'user' && (
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
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

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
            </div>
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