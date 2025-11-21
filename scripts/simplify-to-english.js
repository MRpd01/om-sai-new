const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Remove language variable if it exists
content = content.replace(/const\s+\{\s*language\s*\}\s*=\s*useLanguage\(\);?\s*/g, '');
content = content.replace(/import\s+\{\s*useLanguage\s*\}\s+from\s+['"]@\/contexts\/LanguageContext['"];?\s*/g, '');

// Replace all ternary language conditionals with English text
const replacements = [
  // Navigation items
  [/\{language === 'en' \? 'Dashboard' : 'डॅशबोर्ड'\}/g, 'Dashboard'],
  [/\{language === 'en' \? 'Manage your account' : 'तुमचे खाते व्यवस्थापित करा'\}/g, 'Manage your account'],
  [/\{language === 'en' \? 'Profile Settings' : 'प्रोफाइल सेटिंग्ज'\}/g, 'Profile Settings'],
  [/\{language === 'en' \? 'Update your information' : 'तुमची माहिती अपडेट करा'\}/g, 'Update your information'],
  [/\{language === 'en' \? 'Menu' : 'मेनू'\}/g, 'Menu'],
  [/\{language === 'en' \? 'View today\\\'s menu' : 'आजचा मेनू पहा'\}/g, "View today's menu"],
  [/\{language === 'en' \? 'Members' : 'सदस्य'\}/g, 'Members'],
  [/\{language === 'en' \? 'View mess members' : 'मेस सदस्य पहा'\}/g, 'View mess members'],
  [/\{language === 'en' \? 'Sign Out' : 'साइन आउट'\}/g, 'Sign Out'],
  [/\{language === 'en' \? 'Logout from your account' : 'तुमच्या खात्यातून लॉगआउट करा'\}/g, 'Logout from your account'],
  [/\{language === 'en' \? 'Location' : 'स्थान'\}/g, 'Location'],
  [/\{language === 'en' \? 'Go to Dashboard' : 'डॅशबोर्ड वर जा'\}/g, 'Go to Dashboard'],
  
  // Hero section
  [/\{language === 'en' \? '\(by our happy customers\)' : '\(आमच्या समाधानी ग्राहकांकडून\)'\}/g, '(by our happy customers)'],
  
  // Features section
  [/\{language === 'en' \? 'Why Choose OM Sai Bhojnalay\?' : 'ओम साई भोजनालयाची निवड का करावी\?'\}/g, 'Why Choose OM Sai Bhojnalay?'],
  [/\{language === 'en' \? 'Tiffin Service Available' : 'टिफिन सेवा उपलब्ध'\}/g, 'Tiffin Service Available'],
  [/\{language === 'en' \? 'Rated 4\.5\/5 Stars' : '4\.5\/5 स्टार रेटिंग'\}/g, 'Rated 4.5/5 Stars'],
  [/\{language === 'en' \? 'Wide Varieties of Food' : 'विविध प्रकारचे जेवण'\}/g, 'Wide Varieties of Food'],
  [/\{language === 'en' \? 'Sunday Special Feast' : 'रविवार विशेष मेजवानी'\}/g, 'Sunday Special Feast'],
  [/\{language === 'en' \? 'Affordable Monthly Plans' : 'परवडणारे मासिक योजना'\}/g, 'Affordable Monthly Plans'],
  [/\{language === 'en' \? 'Hygienic & Fresh Meals' : 'स्वच्छ आणि ताजे जेवण'\}/g, 'Hygienic & Fresh Meals'],
  [/\{language === 'en' \? 'Important Notice' : 'महत्त्वाची सूचना'\}/g, 'Important Notice'],
  
  // About section
  [/\{language === 'en' \? 'About OM Sai Bhojnalay' : 'ओम साई भोजनालयाबद्दल'\}/g, 'About OM Sai Bhojnalay'],
  [/\{language === 'en' \? 'Visit Us' : 'आम्हाला भेट द्या'\}/g, 'Visit Us'],
  [/\{language === 'en' \? 'Get Directions' : 'दिशानिर्देश मिळवा'\}/g, 'Get Directions'],
  [/\{language === 'en' \? 'Find Our Mess' : 'आमचा मेस शोधा'\}/g, 'Find Our Mess'],
  [/\{language === 'en' \? 'Live Location' : 'थेट स्थान'\}/g, 'Live Location'],
  [/\{language === 'en' \? 'Get In Touch' : 'संपर्कात रहा'\}/g, 'Get In Touch'],
  [/\{language === 'en' \? 'Contact Mess Owner' : 'मेस मालकाशी संपर्क साधा'\}/g, 'Contact Mess Owner'],
];

// Apply all replacements
replacements.forEach(([pattern, replacement]) => {
  content = content.replace(pattern, replacement);
});

// Handle multi-line conditionals
content = content.replace(
  /\{language === 'en'\s*\?\s*'Join hundreds of satisfied members enjoying homely meals'\s*:\s*'घरगुती जेवणाचा आनंद घेत असलेल्या शेकडो समाधानी सदस्यांमध्ये सामील व्हा'\s*\}/g,
  'Join hundreds of satisfied members enjoying homely meals'
);

content = content.replace(
  /\{language === 'en'\s*\?\s*'Experience authentic homely meals with premium quality and service'\s*:\s*'प्रीमियम गुणवत्ता आणि सेवेसह अस्सल घरगुती जेवणाचा अनुभव घ्या'\s*\}/g,
  'Experience authentic homely meals with premium quality and service'
);

content = content.replace(
  /\{language === 'en'\s*\?\s*'Special tiffin service for college students - fresh, hygienic, and delivered on time!'\s*:\s*'महाविद्यालयीन विद्यार्थ्यांसाठी विशेष टिफिन सेवा - ताजे, स्वच्छ आणि वेळेवर डिलिव्हरी!'\s*\}/g,
  'Special tiffin service for college students - fresh, hygienic, and delivered on time!'
);

content = content.replace(
  /\{language === 'en'\s*\?\s*'Consistently rated highly by our satisfied customers for quality and taste'\s*:\s*'गुणवत्ता आणि चवीसाठी आमच्या समाधानी ग्राहकांकडून सातत्याने उच्च रेटिंग'\s*\}/g,
  'Consistently rated highly by our satisfied customers for quality and taste'
);

content = content.replace(
  /\{language === 'en'\s*\?\s*'No item repetition in a week! Enjoy different delicious meals every day'\s*:\s*'आठवड्यात कोणतीही वस्तू पुनरावृत्ती नाही! दररोज वेगवेगळ्या स्वादिष्ट जेवणाचा आनंद घ्या'\s*\}/g,
  'No item repetition in a week! Enjoy different delicious meals every day'
);

content = content.replace(
  /\{language === 'en'\s*\?\s*'Special Sunday menu with extra items and sweets to make your weekend special'\s*:\s*'तुमचा आठवडा अंत खास बनवण्यासाठी अतिरिक्त पदार्थ आणि मिठाईसह विशेष रविवार मेनू'\s*\}/g,
  'Special Sunday menu with extra items and sweets to make your weekend special'
);

content = content.replace(
  /\{language === 'en'\s*\?\s*'Get best value for money with our monthly subscription plans starting from just ₹3000'\s*:\s*'फक्त ₹3000 पासून सुरू होणाऱ्या आमच्या मासिक सबस्क्रिप्शन योजनांसह पैशाची सर्वोत्तम किंमत मिळवा'\s*\}/g,
  'Get best value for money with our monthly subscription plans starting from just ₹3000'
);

content = content.replace(
  /\{language === 'en'\s*\?\s*'We maintain highest standards of hygiene and serve fresh meals prepared with quality ingredients'\s*:\s*'आम्ही स्वच्छतेची सर्वोच्च मानके राखतो आणि दर्जेदार घटकांसह तयार केलेले ताजे जेवण देतो'\s*\}/g,
  'We maintain highest standards of hygiene and serve fresh meals prepared with quality ingredients'
);

content = content.replace(
  /\{language === 'en'\s*\?\s*'Please note that we offer both tiffin service and mess service\. Contact us for more details about our services and pricing\.'\s*:\s*'कृपया लक्षात ठेवा की आम्ही टिफिन सेवा आणि मेस सेवा दोन्ही ऑफर करतो\. आमच्या सेवा आणि किंमतींबद्दल अधिक माहितीसाठी आमच्याशी संपर्क साधा\.'\s*\}/g,
  'Please note that we offer both tiffin service and mess service. Contact us for more details about our services and pricing.'
);

// Handle location-specific text
content = content.replace(
  /language === 'mr'\s*\n\s*\? 'बी-\d+, बिड बायपास, झोन-\d+, चिकलठाणा, छत्रपती संभाजीनगर, महाराष्ट्र \d+'\n\s*: language === 'hi'\s*\n\s*\? 'बी-\d+, बीड बाइपास, जोन-\d+, चिकलठाणा, छत्रपति संभाजीनगर, महाराष्ट्र \d+'\n\s*: '[^']+'/g,
  "'B-32, Bid Bypass, Zone-5, Chikalthana, Chhatrapati Sambhajinagar, Maharashtra 431006'"
);

content = content.replace(
  /language === 'en'\s*\n\s*\? 'Located in Chikalthana, near Bid Bypass road, easily accessible for college students and working professionals\.'\n\s*: 'चिकलठाणा येथे स्थित, बीड बायपास रस्त्याजवळ, महाविद्यालयीन विद्यार्थी आणि कार्यरत व्यावसायिकांसाठी सहज प्रवेशयोग्य\.'/g,
  "'Located in Chikalthana, near Bid Bypass road, easily accessible for college students and working professionals.'"
);

content = content.replace(
  /language === 'en'\s*\n\s*\? 'Serving delicious, home-style meals to students and professionals in Chhatrapati Sambhajinagar since \d+\. We take pride in providing healthy, hygienic, and affordable food that tastes just like home\.'\n\s*: 'छत्रपती संभाजीनगर मधील विद्यार्थी आणि व्यावसायिकांना \d+ पासून स्वादिष्ट, घरगुती शैलीचे जेवण देत आहोत\. आम्ही निरोगी, स्वच्छ आणि परवडणारे अन्न प्रदान करण्यात अभिमान बाळगतो जे अगदी घरासारखे चवदार आहे\.'/g,
  "'Serving delicious, home-style meals to students and professionals in Chhatrapati Sambhajinagar since 2020. We take pride in providing healthy, hygienic, and affordable food that tastes just like home.'"
);

content = content.replace(
  /language === 'en'\s*\n\s*\? 'Click below to view our exact location on Google Maps and get directions to OM Sai Bhojnalay\.'\n\s*: 'आमचे अचूक स्थान Google नकाशावर पहाण्यासाठी आणि ओम साई भोजनालयाचे दिशानिर्देश मिळविण्यासाठी खाली क्लिक करा\.'/g,
  "'Click below to view our exact location on Google Maps and get directions to OM Sai Bhojnalay.'"
);

content = content.replace(
  /language === 'en'\s*\n\s*\? "We're located in the heart of Chikalthana, making it convenient for students and professionals in the area\. Visit us to experience quality homely food!"\n\s*: "आम्ही चिकलठाणाच्या मध्यभागी स्थित आहोत, ज्यामुळे या भागातील विद्यार्थी आणि व्यावसायिकांसाठी सोयीचे आहे\. दर्जेदार घरगुती जेवणाचा अनुभव घेण्यासाठी आम्हाला भेट द्या!"/g,
  `"We're located in the heart of Chikalthana, making it convenient for students and professionals in the area. Visit us to experience quality homely food!"`
);

content = content.replace(
  /language === 'en'\s*\n\s*\? 'Have questions or want to join\? Feel free to reach out to us via phone or email\. We\'re here to help!'\n\s*: 'प्रश्न आहेत किंवा सामील व्हायचे आहे\? फोन किंवा ईमेलद्वारे आमच्याशी संपर्क साधा\. आम्ही मदत करण्यासाठी येथे आहोत!'/g,
  "'Have questions or want to join? Feel free to reach out to us via phone or email. We're here to help!'"
);

content = content.replace(
  /language === 'en'\s*\n\s*\? 'Whatsapp Only'\n\s*: 'फक्त व्हाट्सअॅप'/g,
  "'Whatsapp Only'"
);

// Write back to file
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Successfully converted page.tsx to English only!');
console.log('📝 Preserved Marathi mess name: ओम साई भोजनालय');
