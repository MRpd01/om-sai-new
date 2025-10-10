"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChefHat, Users, LogIn, UserPlus, ChevronDown, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import GoogleMap from "@/components/GoogleMap";

export default function Home() {
  const router = useRouter();
  const [language, setLanguage] = useState<'en' | 'mr'>('mr'); // Default to Marathi
  const [isSignInDropdownOpen, setIsSignInDropdownOpen] = useState(false);
  const [isSignUpDropdownOpen, setIsSignUpDropdownOpen] = useState(false);

  const content: Record<'en' | 'mr', {
    title: string;
    subtitle: string;
    description: string;
    signIn: string;
    signUp: string;
    memberSignIn: string;
    ownerSignIn: string;
    memberSignUp: string;
    ownerSignUp: string;
    features: string;
    about: string;
    contact: string;
    getStarted: string;
  }> = {
    en: {
      title: "Welcome to OM Sai Bhojnalay",
      subtitle: "Your Complete Mess Management Solution",
      description: "Streamline your mess operations with digital payments, member management, menu planning, and multi-language support. Perfect for mess owners and members alike.",
      signIn: "Sign In",
      signUp: "Sign Up",
      memberSignIn: "Sign In as Member",
      ownerSignIn: "Sign In as Mess Owner",
      memberSignUp: "Join as Member",
      ownerSignUp: "Register as Mess Owner",
      features: "Features",
      about: "About",
      contact: "Contact",
      getStarted: "Get Started Today"
    },
    mr: {
      title: "ॐ साई भोजनालयात स्वागत आहे",
      subtitle: "तुमचा संपूर्ण मेस व्यवस्थापन समाधान",
      description: "डिजिटल पेमेंट, सदस्य व्यवस्थापन, मेनू नियोजन आणि बहुभाषिक समर्थनासह तुमच्या मेसचे कामकाज सुव्यवस्थित करा. मेस मालक आणि सदस्यांसाठी परिपूर्ण.",
      signIn: "साइन इन",
      signUp: "साइन अप",
      memberSignIn: "सदस्य म्हणून साइन इन",
      ownerSignIn: "मेस मालक म्हणून साइन इन",
      memberSignUp: "सदस्य म्हणून सामील व्हा",
      ownerSignUp: "मेस मालक म्हणून नोंदणी करा",
      features: "वैशिष्ट्ये",
      about: "आमच्याबद्दल",
      contact: "संपर्क",
      getStarted: "आज सुरुवात करा"
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsSignInDropdownOpen(false);
      setIsSignUpDropdownOpen(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen hero-bg relative">
      {/* Background overlay for better text readability - reduced opacity */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/40 via-amber-50/40 to-yellow-50/40"></div>
      
      {/* Content wrapper */}
      <div className="relative z-10">
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-md shadow-sm border-b border-orange-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-600 rounded-lg">
                <ChefHat className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-orange-900">ॐ साई भोजनालय</h1>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-orange-700 hover:text-orange-900 font-medium transition-colors">
                {content[language].features}
              </a>
              <a href="#about" className="text-orange-700 hover:text-orange-900 font-medium transition-colors">
                {content[language].about}
              </a>
              <a href="#location" className="text-orange-700 hover:text-orange-900 font-medium transition-colors">
                {language === 'en' ? 'Location' : 'स्थान'}
              </a>
              <a href="#contact" className="text-orange-700 hover:text-orange-900 font-medium transition-colors">
                {content[language].contact}
              </a>

              {/* Language Toggle */}
              <div className="flex items-center space-x-2 bg-orange-100 rounded-lg p-1">
                <button
                  onClick={() => setLanguage('mr')}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    language === 'mr' 
                      ? 'bg-orange-600 text-white' 
                      : 'text-orange-600 hover:bg-orange-200'
                  }`}
                >
                  🇮🇳 मराठी
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    language === 'en' 
                      ? 'bg-orange-600 text-white' 
                      : 'text-orange-600 hover:bg-orange-200'
                  }`}
                >
                  🇺🇸 English
                </button>
              </div>
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              {/* Sign In Dropdown */}
              <div className="relative">
                <Button
                  variant="ghost"
                  className="text-orange-700 hover:text-orange-900 hover:bg-orange-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSignInDropdownOpen(!isSignInDropdownOpen);
                    setIsSignUpDropdownOpen(false);
                  }}
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  {content[language].signIn}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>

                {isSignInDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-20 border border-orange-200">
                    <button
                      onClick={() => {
                        router.push('/login?role=user');
                        setIsSignInDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-orange-900 hover:bg-orange-50 flex items-center space-x-3"
                    >
                      <Users className="h-4 w-4 text-orange-600" />
                      <div>
                        <div className="font-medium">{content[language].memberSignIn}</div>
                        <div className="text-xs text-orange-600">Access your mess account</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        router.push('/login?role=admin');
                        setIsSignInDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-orange-900 hover:bg-orange-50 flex items-center space-x-3"
                    >
                      <ChefHat className="h-4 w-4 text-orange-600" />
                      <div>
                        <div className="font-medium">{content[language].ownerSignIn}</div>
                        <div className="text-xs text-orange-600">Manage your mess operations</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Sign Up Dropdown */}
              <div className="relative">
                <Button
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSignUpDropdownOpen(!isSignUpDropdownOpen);
                    setIsSignInDropdownOpen(false);
                  }}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {content[language].signUp}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>

                {isSignUpDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-20 border border-orange-200">
                    <button
                      onClick={() => {
                        router.push('/signup?role=user');
                        setIsSignUpDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-orange-900 hover:bg-orange-50 flex items-center space-x-3"
                    >
                      <Users className="h-4 w-4 text-orange-600" />
                      <div>
                        <div className="font-medium">{content[language].memberSignUp}</div>
                        <div className="text-xs text-orange-600">Start your mess membership</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        router.push('/signup?role=admin');
                        setIsSignUpDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-orange-900 hover:bg-orange-50 flex items-center space-x-3"
                    >
                      <ChefHat className="h-4 w-4 text-orange-600" />
                      <div>
                        <div className="font-medium">{content[language].ownerSignUp}</div>
                        <div className="text-xs text-orange-600">Setup your mess business</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-2">
              <div className="flex justify-center space-x-4 mb-3">
                <a href="#features" className="text-orange-700 text-sm">{content[language].features}</a>
                <a href="#about" className="text-orange-700 text-sm">{content[language].about}</a>
                <a href="#location" className="text-orange-700 text-sm">{language === 'en' ? 'Location' : 'स्थान'}</a>
                <a href="#contact" className="text-orange-700 text-sm">{content[language].contact}</a>
              </div>
              
              {/* Mobile Language Toggle */}
              <div className="flex justify-center">
                <div className="flex items-center space-x-2 bg-orange-100 rounded-lg p-1">
                  <button
                    onClick={() => setLanguage('mr')}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      language === 'mr' 
                        ? 'bg-orange-600 text-white' 
                        : 'text-orange-600 hover:bg-orange-200'
                    }`}
                  >
                    🇮🇳 मराठी
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      language === 'en' 
                        ? 'bg-orange-600 text-white' 
                        : 'text-orange-600 hover:bg-orange-200'
                    }`}
                  >
                    🇺🇸 English
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="p-6 bg-orange-600 rounded-full shadow-lg">
                <ChefHat className="h-16 w-16 text-white" />
              </div>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-orange-900 mb-6">
              {content[language].title}
            </h1>
            
            <h2 className="text-xl sm:text-2xl text-orange-700 mb-8 max-w-3xl mx-auto font-medium">
              {content[language].subtitle}
            </h2>
            
            <p className="text-lg text-orange-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              {content[language].description}
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button
                onClick={() => router.push('/signup?role=user')}
                size="lg"
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-8 py-4 text-lg min-w-[240px] shadow-lg hover:shadow-xl transition-all"
              >
                <Users className="h-5 w-5 mr-3" />
                {content[language].memberSignUp}
              </Button>
              
              <Button
                onClick={() => router.push('/signup?role=admin')}
                size="lg"
                variant="outline"
                className="border-2 border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white font-semibold px-8 py-4 text-lg min-w-[240px] shadow-lg hover:shadow-xl transition-all"
              >
                <ChefHat className="h-5 w-5 mr-3" />
                {content[language].ownerSignUp}
              </Button>
            </div>

                        <div className="mt-8">
              <p className="text-orange-500 text-sm">
                {content[language].getStarted}
              </p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section id="features" className="py-20 bg-white/90 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-orange-900 mb-4">
                {language === 'en' ? 'Why Choose OM Sai Bhojnalay?' : 'ॐ साई भोजनालयाची निवड का करावी?'}
              </h2>
              <p className="text-xl text-orange-700 max-w-2xl mx-auto">
                {language === 'en' 
                  ? 'Everything you need to manage your mess efficiently'
                  : 'तुमचा मेस कार्यक्षमतेने चालवण्यासाठी आवश्यक असलेली प्रत्येक गोष्ट'
                }
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="text-center p-6 rounded-lg border border-orange-200 hover:shadow-lg transition-shadow">
                <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-orange-900 mb-3">
                  {language === 'en' ? 'Member Management' : 'सदस्य व्यवस्थापन'}
                </h3>
                <p className="text-orange-700">
                  {language === 'en' 
                    ? 'Easy registration, subscription tracking, and member communication'
                    : 'सोपी नोंदणी, सदस्यत्व ट्रॅकिंग आणि सदस्य संवाद'
                  }
                </p>
              </div>

              <div className="text-center p-6 rounded-lg border border-orange-200 hover:shadow-lg transition-shadow">
                <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <ChefHat className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-orange-900 mb-3">
                  {language === 'en' ? 'Digital Payments' : 'डिजिटल पेमेंट'}
                </h3>
                <p className="text-orange-700">
                  {language === 'en' 
                    ? 'Secure online payments with automatic tracking and receipts'
                    : 'स्वयंचलित ट्रॅकिंग आणि पावत्यांसह सुरक्षित ऑनलाइन पेमेंट'
                  }
                </p>
              </div>

              <div className="text-center p-6 rounded-lg border border-orange-200 hover:shadow-lg transition-shadow">
                <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <LogIn className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-orange-900 mb-3">
                  {language === 'en' ? 'Multi-Language Support' : 'बहुभाषिक समर्थन'}
                </h3>
                <p className="text-orange-700">
                  {language === 'en' 
                    ? 'Available in English and Marathi for better accessibility'
                    : 'चांगल्या प्रवेशक्षमतेसाठी इंग्रजी आणि मराठीमध्ये उपलब्ध'
                  }
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-20 bg-gradient-to-br from-orange-50/90 via-amber-50/90 to-yellow-50/90 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-orange-900 mb-8">
                {language === 'en' ? 'About OM Sai Bhojnalay' : 'ॐ साई भोजनालयाबद्दल'}
              </h2>
              <div className="max-w-4xl mx-auto text-lg text-orange-700 leading-relaxed">
                <p className="mb-6">
                  {language === 'en' 
                    ? 'OM Sai Bhojnalay is designed to revolutionize mess management by providing a comprehensive digital solution for both mess owners and members. Our platform streamlines operations, reduces paperwork, and enhances communication.'
                    : 'ॐ साई भोजनालय मेस मालक आणि सदस्य दोघांसाठी एक व्यापक डिजिटल समाधान प्रदान करून मेस व्यवस्थापनात क्रांती घडवून आणण्यासाठी डिझाइन केले गेले आहे. आमचे प्लॅटफॉर्म ऑपरेशन्स सुव्यवस्थित करते, कागदी कामे कमी करते आणि संवाद वाढवते.'
                  }
                </p>
                <p>
                  {language === 'en' 
                    ? 'Whether you\'re a mess owner looking to digitize your operations or a member seeking convenient access to mess services, OM Sai Bhojnalay provides the tools you need for a seamless experience.'
                    : 'तुम्ही तुमच्या ऑपरेशन्सचे डिजिटायझेशन करू इच्छिणारे मेस मालक असाल किंवा मेस सेवांमध्ये सोयीस्कर प्रवेश शोधणारे सदस्य असाल, ॐ साई भोजनालय तुम्हाला अखंड अनुभवासाठी आवश्यक साधने प्रदान करते.'
                  }
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section id="location" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-orange-900 mb-4">
                {language === 'en' ? 'Find Our Mess' : 'आमचा मेस शोधा'}
              </h2>
              <p className="text-xl text-orange-700 max-w-2xl mx-auto mb-8">
                {language === 'en' 
                  ? 'Conveniently located for easy access. Visit us today!'
                  : 'सोप्या प्रवेशासाठी सोयीस्कर ठिकाणी स्थित. आज आम्हाला भेट द्या!'
                }
              </p>
              <div className="flex items-center justify-center space-x-2 text-orange-600 mb-8">
                <MapPin className="h-5 w-5" />
                <span className="text-lg font-medium">
                  {language === 'en' ? 'Live Location' : 'थेट स्थान'}
                </span>
              </div>
            </div>
            
            {/* Google Map */}
            <div className="max-w-4xl mx-auto">
              <GoogleMap className="w-full h-96 md:h-[500px]" />
            </div>
            
            <div className="text-center mt-8">
              <p className="text-orange-600 text-sm">
                {language === 'en' 
                  ? 'Location shown is based on your current position. Contact us for exact mess address.'
                  : 'दर्शविलेले स्थान तुमच्या सध्याच्या स्थितीवर आधारित आहे. अचूक मेस पत्त्यासाठी आमच्याशी संपर्क साधा.'
                }
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-orange-900 mb-8">
                {language === 'en' ? 'Get In Touch' : 'संपर्कात रहा'}
              </h2>
              <div className="max-w-2xl mx-auto">
                <p className="text-lg text-orange-700 mb-8">
                  {language === 'en' 
                    ? 'Ready to transform your mess management? Get started today or contact us for more information.'
                    : 'तुमच्या मेस व्यवस्थापनात बदल करण्यास तयार आहात? आज सुरुवात करा किंवा अधिक माहितीसाठी आमच्याशी संपर्क साधा.'
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={() => router.push('/signup')}
                    size="lg"
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    {language === 'en' ? 'Get Started Now' : 'आता सुरुवात करा'}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white"
                  >
                    {language === 'en' ? 'Contact Support' : 'सपोर्टशी संपर्क साधा'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-orange-900 text-orange-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="p-2 bg-orange-600 rounded-lg">
                <ChefHat className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">ॐ साई भोजनालय</span>
            </div>
            <p className="text-orange-200 mb-4">
              {language === 'en' 
                ? 'Your trusted partner for mess management solutions'
                : 'मेस व्यवस्थापन समाधानांसाठी तुमचा विश्वसनीय भागीदार'
              }
            </p>
            <p className="text-orange-300 text-sm">
              © 2025 ॐ साई भोजनालय. {language === 'en' ? 'All rights reserved.' : 'सर्व हक्क राखीव.'}
            </p>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
