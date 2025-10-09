"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChefHat, Users, CreditCard, Clock, Star, MapPin, Menu, X } from "lucide-react";

export default function Home() {
  const [currentLanguage, setCurrentLanguage] = useState('English');
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'mr', name: 'मराठी', flag: '🇮🇳' }
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsLanguageDropdownOpen(false);
      setIsMobileMenuOpen(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleJoinAsMember = () => {
    router.push('/signup?role=user');
  };

  const handleAdminAccess = () => {
    router.push('/login?role=admin');
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section with Background */}
      <div className="relative min-h-screen">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/indian-food-spread.jpg"
            alt="Delicious Indian Food Spread"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-orange-900/80 via-amber-900/70 to-yellow-900/80"></div>
        </div>

        {/* Navigation */}
        <nav className="relative z-10 bg-white/10 backdrop-blur-md border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-600 rounded-lg">
                  <ChefHat className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white">MessMate</h1>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-8">
                <a href="#features" className="text-white/90 hover:text-white font-medium transition-colors">Features</a>
                <a href="#pricing" className="text-white/90 hover:text-white font-medium transition-colors">Pricing</a>
                <a href="#contact" className="text-white/90 hover:text-white font-medium transition-colors">Contact</a>

                {/* Language Selector */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsLanguageDropdownOpen(!isLanguageDropdownOpen);
                    }}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors"
                  >
                    <span className="text-sm">{languages.find(lang => lang.name === currentLanguage)?.flag}</span>
                    <span className="text-sm font-medium">{currentLanguage}</span>
                  </button>

                  {isLanguageDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg py-1 z-20">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentLanguage(lang.name);
                            setIsLanguageDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-orange-900 hover:bg-orange-50 flex items-center space-x-2"
                        >
                          <span>{lang.flag}</span>
                          <span>{lang.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMobileMenuOpen(!isMobileMenuOpen);
                }}
                className="md:hidden p-2 rounded-lg bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
              <div className="md:hidden bg-white/10 backdrop-blur-md rounded-lg mb-4 p-4">
                <div className="flex flex-col space-y-4">
                  <a href="#features" className="text-white/90 hover:text-white font-medium">Features</a>
                  <a href="#pricing" className="text-white/90 hover:text-white font-medium">Pricing</a>
                  <a href="#contact" className="text-white/90 hover:text-white font-medium">Contact</a>
                  
                  <div className="border-t border-white/20 pt-4">
                    <p className="text-white/70 text-sm mb-2">Language</p>
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentLanguage(lang.name);
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded flex items-center space-x-2"
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Welcome to <span className="text-orange-300">MessMate</span>
            </h1>
            <p className="text-xl sm:text-2xl text-orange-100 mb-8 max-w-3xl mx-auto">
              Your personal mess management solution. Join as a member or manage your mess with our comprehensive platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={handleJoinAsMember}
                size="lg"
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-8 py-4 text-lg min-w-[200px]"
              >
                <Users className="h-5 w-5 mr-2" />
                Join as Member
              </Button>
              
              <Button
                onClick={handleAdminAccess}
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-orange-900 font-semibold px-8 py-4 text-lg min-w-[200px]"
              >
                <ChefHat className="h-5 w-5 mr-2" />
                Admin Access
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-orange-900 mb-4">
              Why Choose Our Mess?
            </h2>
            <p className="text-xl text-orange-700 max-w-2xl mx-auto">
              Experience the best of home-style cooking with modern convenience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="group hover:shadow-lg transition-all duration-300 border-orange-200 hover:border-orange-400">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                  <ChefHat className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle className="text-orange-900">Fresh Home-Style Cooking</CardTitle>
                <CardDescription>
                  Authentic Indian meals prepared with fresh ingredients and traditional recipes
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-orange-200 hover:border-orange-400">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle className="text-orange-900">Timely Service</CardTitle>
                <CardDescription>
                  Regular meal times with reliable service and consistent quality
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-orange-200 hover:border-orange-400">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                  <CreditCard className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle className="text-orange-900">Flexible Payment</CardTitle>
                <CardDescription>
                  Easy online payments with multiple options and flexible plans
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-orange-200 hover:border-orange-400">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                  <Users className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle className="text-orange-900">Community Dining</CardTitle>
                <CardDescription>
                  Connect with fellow members in a friendly, welcoming environment
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-orange-200 hover:border-orange-400">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                  <Star className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle className="text-orange-900">Quality Assured</CardTitle>
                <CardDescription>
                  Hygienic preparation with quality ingredients and regular health checks
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-orange-200 hover:border-orange-400">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                  <MapPin className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle className="text-orange-900">Convenient Location</CardTitle>
                <CardDescription>
                  Easily accessible location with comfortable dining space
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-orange-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-orange-700 max-w-2xl mx-auto">
              Choose a plan that works for you with no hidden fees
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="relative border-orange-200 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold text-orange-900">Monthly</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-orange-600">₹3,000</span>
                  <span className="text-orange-700">/month</span>
                </div>
                <CardDescription className="mt-4">
                  Perfect for trying out our service
                </CardDescription>
              </CardHeader>
              <div className="px-6 pb-6">
                <ul className="space-y-3 text-orange-800">
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-orange-600 mr-2" />
                    2 meals per day
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-orange-600 mr-2" />
                    Fresh ingredients
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-orange-600 mr-2" />
                    Basic support
                  </li>
                </ul>
                <Button className="w-full mt-6 bg-orange-600 hover:bg-orange-700" onClick={handleJoinAsMember}>
                  Get Started
                </Button>
              </div>
            </Card>

            <Card className="relative border-orange-400 hover:shadow-xl transition-shadow ring-2 ring-orange-400">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span className="bg-orange-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold text-orange-900">Quarterly</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-orange-600">₹8,000</span>
                  <span className="text-orange-700">/3 months</span>
                </div>
                <CardDescription className="mt-4">
                  Save ₹1,000 with quarterly plan
                </CardDescription>
              </CardHeader>
              <div className="px-6 pb-6">
                <ul className="space-y-3 text-orange-800">
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-orange-600 mr-2" />
                    2 meals per day
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-orange-600 mr-2" />
                    Premium ingredients
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-orange-600 mr-2" />
                    Priority support
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-orange-600 mr-2" />
                    Special menu options
                  </li>
                </ul>
                <Button className="w-full mt-6 bg-orange-600 hover:bg-orange-700" onClick={handleJoinAsMember}>
                  Choose Plan
                </Button>
              </div>
            </Card>

            <Card className="relative border-orange-200 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold text-orange-900">Annual</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-orange-600">₹30,000</span>
                  <span className="text-orange-700">/year</span>
                </div>
                <CardDescription className="mt-4">
                  Best value - save ₹6,000 annually
                </CardDescription>
              </CardHeader>
              <div className="px-6 pb-6">
                <ul className="space-y-3 text-orange-800">
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-orange-600 mr-2" />
                    2 meals per day
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-orange-600 mr-2" />
                    Premium ingredients
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-orange-600 mr-2" />
                    24/7 support
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-orange-600 mr-2" />
                    Custom menu requests
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-orange-600 mr-2" />
                    Festival special meals
                  </li>
                </ul>
                <Button className="w-full mt-6 bg-orange-600 hover:bg-orange-700" onClick={handleJoinAsMember}>
                  Best Value
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-orange-900 mb-4">
              Get in Touch
            </h2>
            <p className="text-xl text-orange-700 max-w-2xl mx-auto">
              Have questions? We'd love to hear from you.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold text-orange-900 mb-6">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-orange-600" />
                  <span className="text-orange-800">123 Food Street, Mess Colony, City 400001</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-orange-600" />
                  <span className="text-orange-800">+91 98765 43210</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-5 w-5 text-orange-600" />
                  <span className="text-orange-800">contact@messmate.com</span>
                </div>
              </div>
            </div>

            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="text-orange-900">Send us a message</CardTitle>
                <CardDescription>We'll get back to you within 24 hours</CardDescription>
              </CardHeader>
              <div className="p-6 pt-0">
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-orange-800 mb-1">Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-orange-800 mb-1">Email</label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-orange-800 mb-1">Message</label>
                    <textarea
                      rows={4}
                      className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="How can we help you?"
                    ></textarea>
                  </div>
                  <Button className="w-full bg-orange-600 hover:bg-orange-700">
                    Send Message
                  </Button>
                </form>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-orange-900 text-orange-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-orange-600 rounded-lg">
                  <ChefHat className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">MessMate</span>
              </div>
              <p className="text-orange-200">
                Your trusted partner for delicious, home-style meals with modern convenience.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-orange-200 hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-orange-200 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#contact" className="text-orange-200 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Services</h4>
              <ul className="space-y-2">
                <li><span className="text-orange-200">Daily Meals</span></li>
                <li><span className="text-orange-200">Special Events</span></li>
                <li><span className="text-orange-200">Custom Menus</span></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-orange-200 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-orange-200 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-orange-200 hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-orange-800 mt-8 pt-8 text-center">
            <p className="text-orange-200">
              © 2025 MessMate. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}