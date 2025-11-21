const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace content[language] references
content = content.replace(/content\[language\]\.signIn/g, '"Sign In"');
content = content.replace(/content\[language\]\.memberSignIn/g, '"Member Sign In"');
content = content.replace(/content\[language\]\.ownerSignIn/g, '"Owner/Admin Sign In"');
content = content.replace(/content\[language\]\.signUp/g, '"Sign Up"');
content = content.replace(/content\[language\]\.memberSignUp/g, '"Join as Member"');
content = content.replace(/content\[language\]\.ownerSignUp/g, '"Register as Owner"');
content = content.replace(/content\[language\]\.features/g, '"Features"');
content = content.replace(/content\[language\]\.about/g, '"About"');
content = content.replace(/content\[language\]\.contact/g, '"Contact"');
content = content.replace(/content\[language\]\.title/g, '"Welcome to OM Sai Bhojnalay"');
content = content.replace(/content\[language\]\.subtitle/g, '"Authentic Home-Style Meals in Chhatrapati Sambhajinagar"');
content = content.replace(/content\[language\]\.description/g, '"Experience the taste of home-cooked food with our nutritious and delicious meals. Perfect for students and working professionals looking for quality mess services."');
content = content.replace(/content\[language\]\.getStarted/g, '"Get Started"');

// Replace multiline language conditionals
content = content.replace(
  /\{language === 'en'\s*\?\s*'No item repetition in a week! Enjoy different delicious meals every day'\s*:\s*'[^']+'\s*\}/gs,
  'No item repetition in a week! Enjoy different delicious meals every day'
);

content = content.replace(
  /\{language === 'en'\s*\?\s*'Special Sunday menu with extra items and sweets to make your weekend special'\s*:\s*'[^']+'\s*\}/gs,
  'Special Sunday menu with extra items and sweets to make your weekend special'
);

content = content.replace(
  /\{language === 'en'\s*\?\s*'Get best value for money with our monthly subscription plans starting from just ₹3000'\s*:\s*'[^']+'\s*\}/gs,
  'Get best value for money with our monthly subscription plans starting from just ₹3000'
);

content = content.replace(
  /\{language === 'en'\s*\?\s*'We maintain highest standards of hygiene and serve fresh meals prepared with quality ingredients'\s*:\s*'[^']+'\s*\}/gs,
  'We maintain highest standards of hygiene and serve fresh meals prepared with quality ingredients'
);

content = content.replace(
  /\{language === 'en'\s*\?\s*'Please note that we offer both tiffin service and mess service\. Contact us for more details about our services and pricing\.'\s*:\s*'[^']+'\s*\}/gs,
  'Please note that we offer both tiffin service and mess service. Contact us for more details about our services and pricing.'
);

content = content.replace(
  /\{language === 'en'\s*\?\s*"Serving delicious, home-style meals to students and professionals in Chhatrapati Sambhajinagar since 2020\. We take pride in providing healthy, hygienic, and affordable food that tastes just like home\."\s*:\s*"[^"]+"\s*\}/gs,
  '"Serving delicious, home-style meals to students and professionals in Chhatrapati Sambhajinagar since 2020. We take pride in providing healthy, hygienic, and affordable food that tastes just like home."'
);

content = content.replace(
  /\{language === 'en'\s*\?\s*'Located in Chikalthana, near Bid Bypass road, easily accessible for college students and working professionals\.'\s*:\s*'[^']+'\s*\}/gs,
  '"Located in Chikalthana, near Bid Bypass road, easily accessible for college students and working professionals."'
);

content = content.replace(
  /\{language === 'en'\s*\?\s*'Click below to view our exact location on Google Maps and get directions to OM Sai Bhojnalay\.'\s*:\s*'[^']+'\s*\}/gs,
  '"Click below to view our exact location on Google Maps and get directions to OM Sai Bhojnalay."'
);

content = content.replace(
  /\{language === 'en'\s*\?\s*"We're located in the heart of Chikalthana, making it convenient for students and professionals in the area\. Visit us to experience quality homely food!"\s*:\s*"[^"]+"\s*\}/gs,
  `"We're located in the heart of Chikalthana, making it convenient for students and professionals in the area. Visit us to experience quality homely food!"`
);

content = content.replace(
  /\{language === 'en'\s*\?\s*"Have questions or want to join\? Feel free to reach out to us via phone or email\. We're here to help!"\s*:\s*"[^"]+"\s*\}/gs,
  `"Have questions or want to join? Feel free to reach out to us via phone or email. We're here to help!"`
);

// Replace simple language conditionals
content = content.replace(/\{language === 'en' \? 'Join Now' : '[^']+'\}/g, 'Join Now');
content = content.replace(/\{language === 'en' \? 'Our Services' : '[^']+'\}/g, 'Our Services');
content = content.replace(/\{language === 'en' \? 'Whatsapp Only' : '[^']+'\}/g, 'Whatsapp Only');

// Replace language comparison conditions
content = content.replace(/language === 'mr'/g, 'false');
content = content.replace(/language === 'en'/g, 'true');
content = content.replace(/language === 'hi'/g, 'false');

// Remove language switcher functionality
content = content.replace(/onClick=\{\(\) => setLanguage\('[^']+'\)\}/g, 'onClick={() => {}}');

// Replace location text (handling special case)
content = content.replace(
  /language === 'mr'\s*\?\s*'[^']+'\s*:\s*language === 'hi'\s*\?\s*'[^']+'\s*:\s*'[^']+'/gs,
  "'B-32, Bid Bypass, Zone-5, Chikalthana, Chhatrapati Sambhajinagar, Maharashtra 431006'"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed all remaining language references');
