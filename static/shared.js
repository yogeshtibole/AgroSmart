// ── SIDEBAR ──────────────────────────────────────────────────────────────────
function toggleSidebar(){
  var sb=document.getElementById("sidebar"), ov=document.getElementById("sbOverlay");
  if(!sb) return;
  var open=sb.classList.toggle("open");
  if(ov) ov.style.display=open?"block":"none";
}
function toggleProfile(){
  var box=document.getElementById("profileBox");
  if(box) box.classList.toggle("show");
}
document.addEventListener("click",function(e){
  var box=document.getElementById("profileBox"), pill=document.querySelector(".profile-pill");
  if(box&&box.classList.contains("show")&&!box.contains(e.target)&&pill&&!pill.contains(e.target))
    box.classList.remove("show");
});
function doLogout(){
  fetch('/logout').then(function(){ localStorage.clear(); window.location.href="/login"; });
}

// ── NAV USER + PROFILE PIC ────────────────────────────────────────────────────
function setNavUser(dbName, dbPhone){
  var name  = (dbName  && dbName  !=='None' && dbName  !=='') ? dbName  : (localStorage.getItem('name')  || '');
  var phone = (dbPhone && dbPhone !=='None' && dbPhone !=='') ? dbPhone : (localStorage.getItem('phone') || '');
  if(name)  localStorage.setItem('name',  name);
  if(phone) localStorage.setItem('phone', phone);
  var n1=document.getElementById("navUserName"),
      n2=document.getElementById("pdName"),
      n3=document.getElementById("pdPhone");
  if(n1) n1.innerText = name  || "Farmer";
  if(n2) n2.innerText = name  || "Farmer";
  if(n3) n3.innerText = phone || "";
}

// Fix 3: setNavPic — update profile pill image from actual uploaded file
function setNavPic(url){
  if(!url) return;
  var navImg = document.getElementById('navPicImg');
  var pdImg  = document.getElementById('pdPicImg');
  if(navImg) navImg.src = url;
  if(pdImg)  pdImg.src  = url;
  localStorage.setItem('navPic', url);
}

// ── Fix 4: THEME — applies to whole project, reads from localStorage ──────────
var THEMES = {
  light: {
    '--cream':'#f4f7f4','--white':'#ffffff','--text':'#1a1a1a',
    '--text-mid':'#4a5568','--text-light':'#9aab9e','--border':'#dde8df',
    '--green-dark':'#1a3d22','--green-mid':'#2d6a3f','--green':'#4caf50',
    '--green-light':'#e6f4ea','--sidebar-bg':'#1a3d22','--card-bg':'#ffffff'
  },
  dark: {
    '--cream':'#0f1117','--white':'#1a1d27','--text':'#e8eaf6',
    '--text-mid':'#9fa8c2','--text-light':'#5c6285','--border':'#2d3250',
    '--green-dark':'#2e7d32','--green-mid':'#388e3c','--green':'#66bb6a',
    '--green-light':'#1b2e1c','--sidebar-bg':'#111827','--card-bg':'#1a1d27'
  },
  green: {
    '--cream':'#e8f5e9','--white':'#f1f8f2','--text':'#1b2e1c',
    '--text-mid':'#2e5c2f','--text-light':'#558b57','--border':'#a5d6a7',
    '--green-dark':'#1a3d22','--green-mid':'#2d6a3f','--green':'#43a047',
    '--green-light':'#c8e6c9','--sidebar-bg':'#1a3d22','--card-bg':'#f1f8f2'
  }
};

function applyTheme(theme){
  var vars = THEMES[theme] || THEMES.light;
  var root = document.documentElement;
  for(var k in vars) root.style.setProperty(k, vars[k]);
  // dark mode specific
  if(theme === 'dark'){
    document.querySelectorAll('.form-input,.form-select').forEach(function(el){
      el.style.background = '#1a1d27';
      el.style.color      = '#e8eaf6';
    });
  }
}

// ── LANGUAGE — unified system, applies to whole project ──────────────────────
// Keys used with data-lang="" or data-k="" on any page
var LANG_MAP = {
  en: {
    // ── Sidebar / Nav ──
    'dashboard':'Dashboard','weather':'Weather','crop_advisor':'Crop Advisor',
    'irrigation':'Irrigation','yield_calc':'Yield Calculator','ai_diag':'AI Diagnosis',
    'profile':'Profile','history':'History','settings':'Settings','community':'Community',
    'crop_calendar':'Crop Calendar','fertilizer_calc':'Fertilizer Calc','crop_diary':'Crop Diary',

    // ── Dashboard ──
    'quick_access':'Quick Access','farm_overview':'Farm Overview',
    'weather_today':'Weather Today','crop_health':'Crop Health','soil_info':'Soil & Farm Info',
    'today_tasks':"Today's Tasks",'farm_gallery':'Farm Gallery',
    'search_farmers':'Search Farmers',
    'soil_farm_info':'Soil & Farm Info',
    'run_diagnosis':'Run Diagnosis →','crop_advice':'Crop Advice →',
    'open_diary':'Open Diary →',

    // ── Profile ──
    'edit_profile':'Edit Profile','save_changes':'Save Changes','save_profile':'Save Profile',
    'full_name':'Full Name','village':'Village / Location','bio':'Bio / About',
    'farm_size':'Farm Size (acres)','soil_ph':'Soil pH','soil_type':'Soil Type',
    'profile_picture':'Profile Picture',

    // ── Settings ──
    'save_settings':'Save Settings',
    'settings_sub':'Manage your profile, appearance, language and account security',
    'stab_appearance':'🎨 Appearance','stab_profile':'👤 Profile',
    'stab_security':'🔐 Security','stab_ai':'🤖 AI Settings',
    'theme_label':'Theme','theme_sub':'Choose how AgroSmart looks across all pages',
    'language':'Language','lang_sub':'Select your preferred language — applies to all pages instantly',
    'save_appearance':'💾 Save Appearance Settings',
    'personal_info':'Personal Information','personal_info_sub':'Update your name, location, and farm details',
    'pwd_security':'Password & Security',
    'danger_zone':'Danger Zone','danger_caution':'Irreversible account actions — proceed with caution',
    'delete_account':'Delete Account Data',
    'ai_assistant':'AI Assistant (Groq API)',

    // ── Irrigation ──
    'input_params':'Input Parameters','crop_type':'Crop Type',
    'soil_moisture':'Soil Moisture (%)','weather_cond':'Weather Condition',
    'farm_size_acres':'Farm Size (acres)','check_irrigation':'Check Irrigation Need',
    'recommendation':'Recommendation',

    // ── Yield Calculator ──
    'farm_params':'Farm Parameters','area_acres':'Area (acres)',
    'water_rain':'Water / Rain Condition','calc_yield':'Calculate Yield',
    'est_yield':'Estimated Yield',

    // ── Weather ──
    'search_city':'Search your city above',

    // ── Community ──
    'share_community':'Share with the Community',
    'post_title':'Title','post_message':'Message','post_photo':'Photo (optional)',
    'post_btn':'Post to Community','farmers_connect':'Farmers to Connect With',
    'send':'Send',

    // ── Fertilizer (shared with page's own data-k system) ──
    'inputs':'Crop & Field Inputs','crop':'Crop','area':'Farm Area (acres)',
    'soil_ph_k':'Soil pH','soil_type_k':'Soil Type',
    'prev_crop':'Previous Crop (for residue benefit)',
    'calculate':'Calculate Dose','results':'Fertilizer Recommendation',
    'npk_guide':'NPK Nutrient Guide',

    // ── AI Diagnosis ──
    'describe_problem':'Describe Your Crop Problem',
    'symptoms':'Symptoms Observed','extra_details':'Extra Details (optional)',
    'diagnose_btn':'🔍 Diagnose My Crop',
    'diag_result':'AI Diagnosis Result','recent_diag':'Recent Diagnoses (this session)',
    'quick_ref':'Common Crop Diseases Quick Reference',

    // ── Crop Calendar (shared with page's own data-k system) ──
    'select_crop':'Select Your Crop & Region','region':'Region / State',
    'generate':'Generate Calendar','select_to_view':'Select a crop and click Generate Calendar',
    'kharif':'Kharif','rabi':'Rabi','zaid':'Zaid',
    'kharif_months':'Jun – Oct','rabi_months':'Nov – Mar','zaid_months':'Mar – Jun',
    'kharif_desc':'Monsoon crops: Rice, Cotton, Maize, Soybean',
    'rabi_desc':'Winter crops: Wheat, Gram, Mustard',
    'zaid_desc':'Summer crops: Watermelon, Mung, Vegetables',

    // ── Crop Diary ──
    'add_entry':'Add Entry','diary_entries':'My Diary Entries',
    'entry_date':'Date','entry_crop':'Crop','entry_note':'Note / Observation',
    'save_entry':'Save Entry',

    // ── History ──
    'activity_history':'Activity History',
    'hist_sub':'Complete record of all your logins and page activities',
    'tab_all':'All','tab_logins':'🔑 Logins','tab_activity':'⚡ Activity',
    'clear_all':'🗑 Clear All','clear_logins':'🗑 Clear Logins','clear_activity':'🗑 Clear Activity',
    'clear_all_logins':'🗑 Clear All Logins','clear_all_activity':'🗑 Clear All Activity',
    'logged_in':'🔑 Logged in','no_history':'No history yet','no_login_records':'No login records','no_activity_yet':'No activity yet',

    // ── Weather ──
    'weather_title':'🌦 Weather Forecast',
    'weather_sub':'Search your city to get live weather and farming advice',
    'weather_search_ph':'Search city e.g. Pune, Nashik, Mumbai...',
    'weather_search_btn':'🔍 Search',
    'rain_alert_heading':'Rain Alert — Farming Advisory',
    'farming_advice':'🌱 Farming Advice',
    'wind_direction':'💨 Wind Direction',
    'wind_speed':'Speed','wind_degrees':'Degrees','wind_dir_label':'Direction',
    'forecast_label':'🗓️ 5-Day Forecast',
    'forecast_today':'Today','forecast_tomorrow':'Tomorrow',
    'forecast_note':'Rain % = probability of precipitation for that day',
    'weather_tip_h':'Search your city above',
    'weather_tip_p':'Get live weather, 5-day forecast, wind compass, and rain alerts for any city in India.',
    'humidity':'Humidity','wind':'Wind','feels_like':'Feels Like',

    // ── Login ──
    'login_tagline':'Intelligent Farming, for every farmer.',
    'feat_weather':'Live Weather','feat_weather_p':'Real-time forecasts',
    'feat_crop':'Crop Advisor','feat_crop_p':'AI-powered recommendations',
    'feat_disease':'Disease Diagnosis','feat_disease_p':'Detect crop disease early',
    'feat_irr':'Smart Irrigation','feat_irr_p':'Optimize water usage',
    'login_footer':'Trusted by farmers across India 🇮🇳',
    'tab_returning':'Returning Farmer','tab_new':'New Here?',
    'welcome_back':'Welcome back 👋','enter_mobile':'Enter your mobile to continue',
    'mobile_number':'Mobile Number',
    'password_label':'Password','pwd_hint_login':'(leave blank if not set)',
    'pwd_ph':'Enter password if you have one',
    'login_btn':'Login to Dashboard',
    'no_account':'No account?','create_profile_link':'Create your profile →',
    'setup_farm':'Set up your farm 🌾','takes_min':'Takes less than a minute',
    'full_name_label':'Full Name',
    'mobile_required':'Mobile Number',
    'village_location':'Village / Location',
    'farm_size_label':'Farm Size (acres)',
    'soil_ph_label':'Soil pH',
    'soil_type_label':'Soil Type','select_soil_type':'Select soil type',
    'set_password':'Set Password','pwd_optional':'(optional — can set later too)',
    'pwd_min':'Min 6 characters',
    'confirm_password':'Confirm Password','repeat_pwd':'Repeat password',
    'create_enter':'Create Profile & Enter',
    'already_reg':'Already registered?','login_link':'Login →',

    // ── Crop Advisor ──
    'crop_adv_title':'🌱 AI Crop Advisor',
    'crop_adv_sub':'Get personalized crop recommendations powered by Claude AI',
    'response_in':'🌍 Response in:',
    'farm_conditions':'🧪 Your Farm Conditions',
    'soil_type_label2':'Soil Type','select_soil':'Select soil type',
    'growing_season':'Growing Season','select_season':'Select season',
    'state_region':'State / Region','select_state':'Select state',
    'annual_rainfall':'Annual Rainfall (mm)',
    'water_source':'Water Source','select_water':'Select',
    'market_access':'Market Access','select_market':'Select',
    'get_advice_btn':'🌾 Get Crop Advice',
    'ai_recommendations':'✅ AI Crop Recommendations',
    'ask_question':'💬 Ask AI a Quick Farming Question',
    'type_question':'Type your farming question...',
    'ask_ai_btn':'Ask AI →',
    'qa_govt':'🏛 Govt Schemes','qa_msp':'💰 MSP Prices','qa_organic':'🌿 Organic Farming',
    'qa_drip':'💧 Drip Irrigation','qa_soil':'🪨 Soil Health','qa_pmkisan':'📋 PM Kisan',

    // ── Community Thread ──
    'back_community':'← Back to Community',
    'likes':'Likes','write_reply':'✍️ Write a Reply',
    'reply_ph':'Share your experience or answer...',
    'post_reply_btn':'💬 Post Reply',
    'no_replies':'No replies yet. Be the first to answer!',

    // ── Farmer Profile ──
    'back_to_community':'← Back to Community',
    'posts_label':'Posts','followers_label':'Followers','following_label':'Following',
    'follow_btn':'➕ Follow','following_btn':'✅ Following','message_btn':'✉️ Message',
    'farm_size_fp':'🌾 Farm Size:','soil_ph_fp':'🧪 Soil pH:','soil_fp':'🪨 Soil:',
    'acres':'acres',
    'no_posts_farmer':'No posts yet from this farmer.',
    'no_location':'Location not set'
  },

  hi: {
    // ── Sidebar / Nav ──
    'dashboard':'डैशबोर्ड','weather':'मौसम','crop_advisor':'फसल सलाहकार',
    'irrigation':'सिंचाई','yield_calc':'उत्पादन कैलकुलेटर','ai_diag':'AI निदान',
    'profile':'प्रोफाइल','history':'इतिहास','settings':'सेटिंग्स','community':'समुदाय',
    'crop_calendar':'फसल कैलेंडर','fertilizer_calc':'खाद कैलकुलेटर','crop_diary':'फसल डायरी',

    // ── Dashboard ──
    'quick_access':'त्वरित पहुँच','farm_overview':'खेत अवलोकन',
    'weather_today':'आज का मौसम','crop_health':'फसल स्वास्थ्य','soil_info':'मिट्टी व खेत जानकारी',
    'today_tasks':'आज के कार्य','farm_gallery':'खेत गैलरी',
    'search_farmers':'किसान खोजें',
    'soil_farm_info':'मिट्टी व खेत जानकारी',
    'run_diagnosis':'निदान चलाएं →','crop_advice':'फसल सलाह →',
    'open_diary':'डायरी खोलें →',

    // ── Profile ──
    'edit_profile':'प्रोफाइल संपादित करें','save_changes':'बदलाव सहेजें','save_profile':'प्रोफाइल सहेजें',
    'full_name':'पूरा नाम','village':'गाँव / स्थान','bio':'परिचय / विवरण',
    'farm_size':'खेत का आकार (एकड़)','soil_ph':'मिट्टी pH','soil_type':'मिट्टी का प्रकार',
    'profile_picture':'प्रोफाइल फोटो',

    // ── Settings ──
    'save_settings':'सेटिंग्स सहेजें',
    'settings_sub':'अपनी प्रोफाइल, दिखावट, भाषा और सुरक्षा प्रबंधित करें',
    'stab_appearance':'🎨 दिखावट','stab_profile':'👤 प्रोफाइल',
    'stab_security':'🔐 सुरक्षा','stab_ai':'🤖 AI सेटिंग्स',
    'theme_label':'थीम','theme_sub':'AgroSmart सभी पेजों पर कैसा दिखे चुनें',
    'language':'भाषा','lang_sub':'पसंदीदा भाषा चुनें — सभी पेजों पर तुरंत लागू होगी',
    'save_appearance':'💾 दिखावट सेटिंग्स सहेजें',
    'personal_info':'व्यक्तिगत जानकारी','personal_info_sub':'अपना नाम, स्थान और खेत की जानकारी अपडेट करें',
    'pwd_security':'पासवर्ड और सुरक्षा',
    'danger_zone':'खतरनाक क्षेत्र','danger_caution':'अपरिवर्तनीय खाता कार्रवाई — सावधानी से करें',
    'delete_account':'खाता डेटा हटाएं',
    'ai_assistant':'AI सहायक (Groq API)',

    // ── Irrigation ──
    'input_params':'इनपुट जानकारी','crop_type':'फसल का प्रकार',
    'soil_moisture':'मिट्टी की नमी (%)','weather_cond':'मौसम की स्थिति',
    'farm_size_acres':'खेत का आकार (एकड़)','check_irrigation':'💦 सिंचाई की जरूरत जांचें',
    'recommendation':'सिफारिश',

    // ── Yield Calculator ──
    'farm_params':'खेत की जानकारी','area_acres':'क्षेत्र (एकड़)',
    'water_rain':'पानी / बारिश की स्थिति','calc_yield':'📊 उत्पादन गणना करें',
    'est_yield':'अनुमानित उत्पादन',

    // ── Weather ──
    'search_city':'अपना शहर ऊपर खोजें',

    // ── Community ──
    'share_community':'समुदाय के साथ साझा करें',
    'post_title':'शीर्षक','post_message':'संदेश','post_photo':'फोटो (वैकल्पिक)',
    'post_btn':'📢 समुदाय में पोस्ट करें','farmers_connect':'जुड़ने के लिए किसान',
    'send':'भेजें',

    // ── Fertilizer ──
    'inputs':'फसल और खेत की जानकारी','crop':'फसल','area':'खेत का क्षेत्र (एकड़)',
    'soil_ph_k':'मिट्टी pH','soil_type_k':'मिट्टी का प्रकार',
    'prev_crop':'पिछली फसल (अवशेष लाभ के लिए)',
    'calculate':'खुराक गणना करें','results':'खाद की सिफारिश',
    'npk_guide':'NPK पोषक तत्व गाइड',

    // ── AI Diagnosis ──
    'describe_problem':'अपनी फसल की समस्या बताएं',
    'symptoms':'देखे गए लक्षण','extra_details':'अतिरिक्त विवरण (वैकल्पिक)',
    'diagnose_btn':'🔍 मेरी फसल का निदान करें',
    'diag_result':'AI निदान परिणाम','recent_diag':'हाल के निदान (इस सत्र में)',
    'quick_ref':'सामान्य फसल रोग त्वरित संदर्भ',

    // ── Crop Calendar ──
    'select_crop':'अपनी फसल और क्षेत्र चुनें','region':'राज्य / क्षेत्र',
    'generate':'कैलेंडर बनाएं','select_to_view':'फसल चुनें और कैलेंडर बनाएं',
    'kharif':'खरीफ','rabi':'रबी','zaid':'जायद',
    'kharif_months':'जून – अक्तूबर','rabi_months':'नवम्बर – मार्च','zaid_months':'मार्च – जून',
    'kharif_desc':'मानसून फसलें: धान, कपास, मक्का, सोयाबीन',
    'rabi_desc':'रबी फसलें: गेहूँ, चना, सरसों',
    'zaid_desc':'ग्रीष्म फसलें: तरबूज, मूंग, सब्जियाँ',

    // ── Crop Diary ──
    'add_entry':'प्रविष्टि जोड़ें','diary_entries':'मेरी डायरी प्रविष्टियाँ',
    'entry_date':'तारीख','entry_crop':'फसल','entry_note':'नोट / अवलोकन',
    'save_entry':'प्रविष्टि सहेजें',

    // ── History ──
    'activity_history':'गतिविधि इतिहास',
    'hist_sub':'आपके सभी लॉगिन और गतिविधियों का पूर्ण रिकॉर्ड',
    'tab_all':'सभी','tab_logins':'🔑 लॉगिन','tab_activity':'⚡ गतिविधि',
    'clear_all':'🗑 सब हटाएं','clear_logins':'🗑 लॉगिन हटाएं','clear_activity':'🗑 गतिविधि हटाएं',
    'clear_all_logins':'🗑 सभी लॉगिन हटाएं','clear_all_activity':'🗑 सभी गतिविधि हटाएं',
    'logged_in':'🔑 लॉग इन हुए','no_history':'अभी कोई इतिहास नहीं','no_login_records':'कोई लॉगिन रिकॉर्ड नहीं','no_activity_yet':'अभी कोई गतिविधि नहीं',

    // ── Weather ──
    'weather_title':'🌦 मौसम पूर्वानुमान',
    'weather_sub':'अपना शहर खोजें और लाइव मौसम व कृषि सलाह पाएं',
    'weather_search_ph':'शहर खोजें जैसे पुणे, नासिक, मुंबई...',
    'weather_search_btn':'🔍 खोजें',
    'rain_alert_heading':'वर्षा चेतावनी — कृषि सलाह',
    'farming_advice':'🌱 कृषि सलाह',
    'wind_direction':'💨 हवा की दिशा',
    'wind_speed':'गति','wind_degrees':'डिग्री','wind_dir_label':'दिशा',
    'forecast_label':'🗓️ 5 दिनों का पूर्वानुमान',
    'forecast_today':'आज','forecast_tomorrow':'कल',
    'forecast_note':'वर्षा % = उस दिन वर्षा की संभावना',
    'weather_tip_h':'अपना शहर ऊपर खोजें',
    'weather_tip_p':'किसी भी भारतीय शहर के लिए लाइव मौसम, 5 दिनों का पूर्वानुमान, हवा कंपास और वर्षा चेतावनी पाएं।',
    'humidity':'आर्द्रता','wind':'हवा','feels_like':'महसूस होता है',

    // ── Login ──
    'login_tagline':'बुद्धिमान खेती, हर किसान के लिए।',
    'feat_weather':'लाइव मौसम','feat_weather_p':'रियल-टाइम पूर्वानुमान',
    'feat_crop':'फसल सलाहकार','feat_crop_p':'AI-संचालित सिफारिशें',
    'feat_disease':'रोग निदान','feat_disease_p':'फसल रोग जल्दी पहचानें',
    'feat_irr':'स्मार्ट सिंचाई','feat_irr_p':'पानी का उपयोग अनुकूलित करें',
    'login_footer':'पूरे भारत के किसानों का विश्वास 🇮🇳',
    'tab_returning':'पुराना किसान','tab_new':'नया यहाँ?',
    'welcome_back':'वापस स्वागत है 👋','enter_mobile':'जारी रखने के लिए मोबाइल दर्ज करें',
    'mobile_number':'मोबाइल नंबर',
    'password_label':'पासवर्ड','pwd_hint_login':'(सेट नहीं है तो खाली छोड़ें)',
    'pwd_ph':'पासवर्ड हो तो दर्ज करें',
    'login_btn':'डैशबोर्ड में लॉगिन करें',
    'no_account':'खाता नहीं?','create_profile_link':'अपनी प्रोफाइल बनाएं →',
    'setup_farm':'अपना खेत सेट करें 🌾','takes_min':'एक मिनट से कम',
    'full_name_label':'पूरा नाम',
    'mobile_required':'मोबाइल नंबर',
    'village_location':'गाँव / स्थान',
    'farm_size_label':'खेत का आकार (एकड़)',
    'soil_ph_label':'मिट्टी pH',
    'soil_type_label':'मिट्टी का प्रकार','select_soil_type':'मिट्टी का प्रकार चुनें',
    'set_password':'पासवर्ड सेट करें','pwd_optional':'(वैकल्पिक — बाद में भी सेट कर सकते हैं)',
    'pwd_min':'न्यूनतम 6 अक्षर',
    'confirm_password':'पासवर्ड की पुष्टि करें','repeat_pwd':'पासवर्ड दोहराएं',
    'create_enter':'प्रोफाइल बनाएं और प्रवेश करें',
    'already_reg':'पहले से पंजीकृत?','login_link':'लॉगिन करें →',

    // ── Crop Advisor ──
    'crop_adv_title':'🌱 AI फसल सलाहकार',
    'crop_adv_sub':'Claude AI द्वारा व्यक्तिगत फसल सिफारिशें पाएं',
    'response_in':'🌍 जवाब भाषा:',
    'farm_conditions':'🧪 आपकी खेत की स्थिति',
    'soil_type_label2':'मिट्टी का प्रकार','select_soil':'मिट्टी का प्रकार चुनें',
    'growing_season':'उगाने का मौसम','select_season':'मौसम चुनें',
    'state_region':'राज्य / क्षेत्र','select_state':'राज्य चुनें',
    'annual_rainfall':'वार्षिक वर्षा (मिमी)',
    'water_source':'जल स्रोत','select_water':'चुनें',
    'market_access':'बाजार पहुँच','select_market':'चुनें',
    'get_advice_btn':'🌾 फसल सलाह लें',
    'ai_recommendations':'✅ AI फसल सिफारिशें',
    'ask_question':'💬 AI से त्वरित खेती प्रश्न पूछें',
    'type_question':'अपना खेती प्रश्न टाइप करें...',
    'ask_ai_btn':'AI से पूछें →',
    'qa_govt':'🏛 सरकारी योजनाएं','qa_msp':'💰 MSP मूल्य','qa_organic':'🌿 जैविक खेती',
    'qa_drip':'💧 ड्रिप सिंचाई','qa_soil':'🪨 मिट्टी स्वास्थ्य','qa_pmkisan':'📋 PM किसान',

    // ── Community Thread ──
    'back_community':'← समुदाय पर वापस',
    'likes':'पसंद','write_reply':'✍️ जवाब लिखें',
    'reply_ph':'अपना अनुभव या जवाब साझा करें...',
    'post_reply_btn':'💬 जवाब पोस्ट करें',
    'no_replies':'अभी कोई जवाब नहीं। पहले जवाब दें!',

    // ── Farmer Profile ──
    'back_to_community':'← समुदाय पर वापस',
    'posts_label':'पोस्ट','followers_label':'अनुयायी','following_label':'अनुसरण',
    'follow_btn':'➕ अनुसरण करें','following_btn':'✅ अनुसरण हो रहा है','message_btn':'✉️ संदेश',
    'farm_size_fp':'🌾 खेत का आकार:','soil_ph_fp':'🧪 मिट्टी pH:','soil_fp':'🪨 मिट्टी:',
    'acres':'एकड़',
    'no_posts_farmer':'इस किसान की अभी कोई पोस्ट नहीं।',
    'no_location':'स्थान सेट नहीं है'
  },

  mr: {
    // ── Sidebar / Nav ──
    'dashboard':'डॅशबोर्ड','weather':'हवामान','crop_advisor':'पीक सल्लागार',
    'irrigation':'सिंचन','yield_calc':'उत्पादन कॅल्क्युलेटर','ai_diag':'AI निदान',
    'profile':'प्रोफाइल','history':'इतिहास','settings':'सेटिंग्ज','community':'समुदाय',
    'crop_calendar':'पीक दिनदर्शिका','fertilizer_calc':'खत कॅल्क्युलेटर','crop_diary':'पीक डायरी',

    // ── Dashboard ──
    'quick_access':'त्वरित प्रवेश','farm_overview':'शेत आढावा',
    'weather_today':'आजचे हवामान','crop_health':'पीक आरोग्य','soil_info':'माती व शेत माहिती',
    'today_tasks':'आजची कामे','farm_gallery':'शेत गॅलरी',
    'search_farmers':'शेतकरी शोधा',
    'soil_farm_info':'माती व शेत माहिती',
    'run_diagnosis':'निदान चालवा →','crop_advice':'पीक सल्ला →',
    'open_diary':'डायरी उघडा →',

    // ── Profile ──
    'edit_profile':'प्रोफाइल संपादित करा','save_changes':'बदल जतन करा','save_profile':'प्रोफाइल जतन करा',
    'full_name':'पूर्ण नाव','village':'गाव / स्थान','bio':'परिचय / विवरण',
    'farm_size':'शेताचा आकार (एकर)','soil_ph':'माती pH','soil_type':'मातीचा प्रकार',
    'profile_picture':'प्रोफाइल फोटो',

    // ── Settings ──
    'save_settings':'सेटिंग्ज जतन करा',
    'settings_sub':'तुमची प्रोफाइल, देखावा, भाषा आणि सुरक्षा व्यवस्थापित करा',
    'stab_appearance':'🎨 देखावा','stab_profile':'👤 प्रोफाइल',
    'stab_security':'🔐 सुरक्षा','stab_ai':'🤖 AI सेटिंग्ज',
    'theme_label':'थीम','theme_sub':'AgroSmart सर्व पानांवर कसे दिसेल ते निवडा',
    'language':'भाषा','lang_sub':'पसंतीची भाषा निवडा — सर्व पानांवर त्वरित लागू होईल',
    'save_appearance':'💾 देखावा सेटिंग्ज जतन करा',
    'personal_info':'वैयक्तिक माहिती','personal_info_sub':'तुमचे नाव, स्थान आणि शेत माहिती अपडेट करा',
    'pwd_security':'पासवर्ड आणि सुरक्षा',
    'danger_zone':'धोकादायक क्षेत्र','danger_caution':'अपरिवर्तनीय खाते क्रिया — सावधानीने करा',
    'delete_account':'खाते डेटा हटवा',
    'ai_assistant':'AI सहाय्यक (Groq API)',

    // ── Irrigation ──
    'input_params':'इनपुट माहिती','crop_type':'पिकाचा प्रकार',
    'soil_moisture':'मातीतील ओलावा (%)','weather_cond':'हवामान स्थिती',
    'farm_size_acres':'शेताचा आकार (एकर)','check_irrigation':'💦 सिंचनाची गरज तपासा',
    'recommendation':'शिफारस',

    // ── Yield Calculator ──
    'farm_params':'शेत माहिती','area_acres':'क्षेत्र (एकर)',
    'water_rain':'पाणी / पाऊस स्थिती','calc_yield':'📊 उत्पादन मोजा',
    'est_yield':'अनुमानित उत्पादन',

    // ── Weather ──
    'search_city':'वरती तुमचे शहर शोधा',

    // ── Community ──
    'share_community':'समुदायासह सामायिक करा',
    'post_title':'शीर्षक','post_message':'संदेश','post_photo':'फोटो (पर्यायी)',
    'post_btn':'📢 समुदायात पोस्ट करा','farmers_connect':'जोडण्यासाठी शेतकरी',
    'send':'पाठवा',

    // ── Fertilizer ──
    'inputs':'पीक आणि शेत माहिती','crop':'पीक','area':'शेत क्षेत्र (एकर)',
    'soil_ph_k':'माती pH','soil_type_k':'मातीचा प्रकार',
    'prev_crop':'मागील पीक (अवशेष फायद्यासाठी)',
    'calculate':'डोस मोजा','results':'खताची शिफारस',
    'npk_guide':'NPK पोषक मार्गदर्शक',

    // ── AI Diagnosis ──
    'describe_problem':'तुमची पीक समस्या सांगा',
    'symptoms':'दिसलेली लक्षणे','extra_details':'अतिरिक्त तपशील (पर्यायी)',
    'diagnose_btn':'🔍 माझ्या पिकाचे निदान करा',
    'diag_result':'AI निदान परिणाम','recent_diag':'अलीकडील निदान (या सत्रात)',
    'quick_ref':'सामान्य पीक रोग द्रुत संदर्भ',

    // ── Crop Calendar ──
    'select_crop':'तुमची पीक आणि प्रदेश निवडा','region':'राज्य / प्रदेश',
    'generate':'कॅलेंडर तयार करा','select_to_view':'पीक निवडा आणि कॅलेंडर तयार करा',
    'kharif':'खरीप','rabi':'रब्बी','zaid':'उन्हाळी',
    'kharif_months':'जून – ऑक्टोबर','rabi_months':'नोव्हेंबर – मार्च','zaid_months':'मार्च – जून',
    'kharif_desc':'पावसाळी पिके: भात, कापूस, मका, सोयाबीन',
    'rabi_desc':'हिवाळी पिके: गहू, हरभरा, मोहरी',
    'zaid_desc':'उन्हाळी पिके: टरबूज, मूग, भाजीपाला',

    // ── Crop Diary ──
    'add_entry':'नोंद जोडा','diary_entries':'माझ्या डायरी नोंदी',
    'entry_date':'तारीख','entry_crop':'पीक','entry_note':'नोट / निरीक्षण',
    'save_entry':'नोंद जतन करा',

    // ── History ──
    'activity_history':'क्रियाकलाप इतिहास',
    'hist_sub':'आपल्या सर्व लॉगिन आणि क्रियाकलापांची पूर्ण नोंद',
    'tab_all':'सर्व','tab_logins':'🔑 लॉगिन','tab_activity':'⚡ क्रियाकलाप',
    'clear_all':'🗑 सर्व साफ करा','clear_logins':'🗑 लॉगिन साफ करा','clear_activity':'🗑 क्रियाकलाप साफ करा',
    'clear_all_logins':'🗑 सर्व लॉगिन साफ करा','clear_all_activity':'🗑 सर्व क्रियाकलाप साफ करा',
    'logged_in':'🔑 लॉग इन केले','no_history':'अद्याप इतिहास नाही','no_login_records':'लॉगिन नोंदी नाहीत','no_activity_yet':'अद्याप क्रियाकलाप नाही',

    // ── Weather ──
    'weather_title':'🌦 हवामान अंदाज',
    'weather_sub':'तुमचे शहर शोधा आणि थेट हवामान व शेती सल्ला मिळवा',
    'weather_search_ph':'शहर शोधा उदा. पुणे, नाशिक, मुंबई...',
    'weather_search_btn':'🔍 शोधा',
    'rain_alert_heading':'पाऊस इशारा — शेती सल्ला',
    'farming_advice':'🌱 शेती सल्ला',
    'wind_direction':'💨 वाऱ्याची दिशा',
    'wind_speed':'वेग','wind_degrees':'अंश','wind_dir_label':'दिशा',
    'forecast_label':'🗓️ ५ दिवसांचा अंदाज',
    'forecast_today':'आज','forecast_tomorrow':'उद्या',
    'forecast_note':'पाऊस % = त्या दिवशी पावसाची शक्यता',
    'weather_tip_h':'वरती तुमचे शहर शोधा',
    'weather_tip_p':'भारतातील कोणत्याही शहरासाठी थेट हवामान, ५ दिवसांचा अंदाज, वाऱ्याचा कंपास आणि पाऊस इशारे मिळवा।',
    'humidity':'आर्द्रता','wind':'वारा','feels_like':'जाणवते',

    // ── Login ──
    'login_tagline':'बुद्धिमान शेती, प्रत्येक शेतकऱ्यासाठी.',
    'feat_weather':'थेट हवामान','feat_weather_p':'रिअल-टाइम अंदाज',
    'feat_crop':'पीक सल्लागार','feat_crop_p':'AI-आधारित शिफारसी',
    'feat_disease':'रोग निदान','feat_disease_p':'पीक रोग लवकर ओळखा',
    'feat_irr':'स्मार्ट सिंचन','feat_irr_p':'पाण्याचा वापर अनुकूल करा',
    'login_footer':'संपूर्ण भारतातील शेतकऱ्यांचा विश्वास 🇮🇳',
    'tab_returning':'जुना शेतकरी','tab_new':'नवीन येथे?',
    'welcome_back':'परत स्वागत आहे 👋','enter_mobile':'पुढे जाण्यासाठी मोबाइल टाका',
    'mobile_number':'मोबाइल नंबर',
    'password_label':'पासवर्ड','pwd_hint_login':'(सेट नसेल तर रिकामे सोडा)',
    'pwd_ph':'पासवर्ड असल्यास टाका',
    'login_btn':'डॅशबोर्डमध्ये लॉगिन करा',
    'no_account':'खाते नाही?','create_profile_link':'तुमची प्रोफाइल तयार करा →',
    'setup_farm':'तुमचे शेत सेट करा 🌾','takes_min':'एक मिनिटापेक्षा कमी',
    'full_name_label':'पूर्ण नाव',
    'mobile_required':'मोबाइल नंबर',
    'village_location':'गाव / स्थान',
    'farm_size_label':'शेताचा आकार (एकर)',
    'soil_ph_label':'माती pH',
    'soil_type_label':'मातीचा प्रकार','select_soil_type':'मातीचा प्रकार निवडा',
    'set_password':'पासवर्ड सेट करा','pwd_optional':'(पर्यायी — नंतरही सेट करता येईल)',
    'pwd_min':'किमान ६ अक्षरे',
    'confirm_password':'पासवर्ड पुष्टी करा','repeat_pwd':'पासवर्ड पुन्हा टाका',
    'create_enter':'प्रोफाइल तयार करा आणि प्रवेश करा',
    'already_reg':'आधीच नोंदणी केली?','login_link':'लॉगिन करा →',

    // ── Crop Advisor ──
    'crop_adv_title':'🌱 AI पीक सल्लागार',
    'crop_adv_sub':'Claude AI द्वारे वैयक्तिक पीक शिफारसी मिळवा',
    'response_in':'🌍 उत्तर भाषा:',
    'farm_conditions':'🧪 तुमच्या शेताची स्थिती',
    'soil_type_label2':'मातीचा प्रकार','select_soil':'मातीचा प्रकार निवडा',
    'growing_season':'वाढीचा हंगाम','select_season':'हंगाम निवडा',
    'state_region':'राज्य / प्रदेश','select_state':'राज्य निवडा',
    'annual_rainfall':'वार्षिक पाऊस (मिमी)',
    'water_source':'पाण्याचा स्रोत','select_water':'निवडा',
    'market_access':'बाजार उपलब्धता','select_market':'निवडा',
    'get_advice_btn':'🌾 पीक सल्ला मिळवा',
    'ai_recommendations':'✅ AI पीक शिफारसी',
    'ask_question':'💬 AI ला त्वरित शेती प्रश्न विचारा',
    'type_question':'तुमचा शेती प्रश्न टाइप करा...',
    'ask_ai_btn':'AI ला विचारा →',
    'qa_govt':'🏛 शासकीय योजना','qa_msp':'💰 MSP किंमती','qa_organic':'🌿 सेंद्रिय शेती',
    'qa_drip':'💧 ठिबक सिंचन','qa_soil':'🪨 माती आरोग्य','qa_pmkisan':'📋 PM किसान',

    // ── Community Thread ──
    'back_community':'← समुदायावर परत',
    'likes':'पसंत','write_reply':'✍️ उत्तर लिहा',
    'reply_ph':'तुमचा अनुभव किंवा उत्तर सामायिक करा...',
    'post_reply_btn':'💬 उत्तर पोस्ट करा',
    'no_replies':'अद्याप कोणतेही उत्तर नाही. पहिले उत्तर द्या!',

    // ── Farmer Profile ──
    'back_to_community':'← समुदायावर परत',
    'posts_label':'पोस्ट','followers_label':'अनुयायी','following_label':'फॉलो करत आहे',
    'follow_btn':'➕ फॉलो करा','following_btn':'✅ फॉलो केले','message_btn':'✉️ संदेश',
    'farm_size_fp':'🌾 शेताचा आकार:','soil_ph_fp':'🧪 माती pH:','soil_fp':'🪨 माती:',
    'acres':'एकर',
    'no_posts_farmer':'या शेतकऱ्याची अद्याप कोणतीही पोस्ट नाही.',
    'no_location':'स्थान सेट नाही'
  }
};

// Applies language to ALL elements using either data-lang or data-k attribute
// This unifies the sidebar system (data-lang) and page system (data-k) into one
function applyLang(lang){
  var map = LANG_MAP[lang] || LANG_MAP.en;
  // Handle data-lang (sidebar, dashboard)
  document.querySelectorAll('[data-lang]').forEach(function(el){
    var key = el.getAttribute('data-lang');
    if(map[key]) el.innerText = map[key];
  });
  // Handle data-k (fertilizer, crop_calendar, crop_diary pages)
  document.querySelectorAll('[data-k]').forEach(function(el){
    var key = el.getAttribute('data-k');
    if(map[key]) el.textContent = map[key];
  });
  // Handle data-ph (placeholder translations)
  document.querySelectorAll('[data-ph]').forEach(function(el){
    var key = el.getAttribute('data-ph');
    if(map[key]) el.placeholder = map[key];
  });
  document.documentElement.setAttribute('lang', lang === 'hi' ? 'hi' : lang === 'mr' ? 'mr' : 'en');
}

// ── INIT on every page load ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function(){
  // Apply saved theme
  var theme = localStorage.getItem('agro_theme') || 'light';
  applyTheme(theme);

  // Apply saved language
  var lang = localStorage.getItem('agro_lang') || 'en';
  applyLang(lang);

  // Restore nav pic if saved
  var savedPic = localStorage.getItem('navPic');
  if(savedPic){
    var navImg = document.getElementById('navPicImg');
    var pdImg  = document.getElementById('pdPicImg');
    if(navImg) navImg.src = savedPic;
    if(pdImg)  pdImg.src  = savedPic;
  }
});

// Called from settings page when user picks theme
function changeTheme(theme){
  localStorage.setItem('agro_theme', theme);
  applyTheme(theme);
}
// Called from settings page when user picks language
function changeLang(lang){
  localStorage.setItem('agro_lang', lang);
  applyLang(lang);
}
// ══════════════════════════════════════════════
// NOTIFICATION SYSTEM
// ══════════════════════════════════════════════
var notifOpen = false;
var notifData = [];

function toggleNotif(){
  notifOpen = !notifOpen;
  var dd = document.getElementById('notifDropdown');
  if(dd) dd.style.display = notifOpen ? 'block' : 'none';
  if(notifOpen) loadNotifications();
}

document.addEventListener('click', function(e){
  var wrap = document.getElementById('notifWrap');
  if(wrap && notifOpen && !wrap.contains(e.target)){
    notifOpen = false;
    var dd = document.getElementById('notifDropdown');
    if(dd) dd.style.display = 'none';
  }
});

function loadNotifications(){
  fetch('/notifications/list')
  .then(function(r){ return r.json(); })
  .then(function(d){
    notifData = d.notifications || [];
    renderNotifications();
    updateBadge();
  }).catch(function(){
    // Fallback: show mock notifications so UI still looks good
    notifData = getLocalNotifs();
    renderNotifications();
    updateBadge();
  });
}

function getLocalNotifs(){
  var stored = localStorage.getItem('agro_notifs');
  return stored ? JSON.parse(stored) : [];
}

function renderNotifications(){
  var list = document.getElementById('notifList');
  if(!list) return;
  if(!notifData.length){
    list.innerHTML = '<div class="notif-empty"><div style="font-size:36px;margin-bottom:8px">🔔</div><p>No notifications yet</p><span>Likes, comments &amp; follows will appear here</span></div>';
    return;
  }
  var icons = {like:'❤️',comment:'💬',follow:'👤',share:'🔗',message:'✉️'};
  var iconClass = {like:'like',comment:'comment',follow:'follow',share:'share',message:'comment'};
  list.innerHTML = notifData.map(function(n){
    return '<div class="notif-item '+(n.read?'':'unread')+'" onclick="onNotifClick(\''+n.id+'\',\''+n.link+'\')">'+
      '<div class="notif-icon '+(iconClass[n.type]||'like')+'">'+(icons[n.type]||'🔔')+'</div>'+
      '<div class="notif-body">'+
        '<strong>'+escapeHtml(n.actor||'Someone')+'</strong>'+
        '<p>'+escapeHtml(n.text||'')+'</p>'+
        '<span class="notif-time">'+timeAgo(n.created_at)+'</span>'+
      '</div>'+
      (n.read?'':'<div class="notif-unread-dot"></div>')+
    '</div>';
  }).join('');
}

function onNotifClick(id, link){
  // mark as read
  fetch('/notifications/read', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id:id})})
  .catch(function(){});
  notifData.forEach(function(n){ if(n.id===id) n.read=true; });
  updateBadge();
  if(link && link !== 'undefined') window.location.href = link;
}

function markAllRead(){
  fetch('/notifications/read_all', {method:'POST'}).catch(function(){});
  notifData.forEach(function(n){ n.read=true; });
  renderNotifications();
  updateBadge();
}

function updateBadge(){
  var badge = document.getElementById('notifBadge');
  if(!badge) return;
  var unread = notifData.filter(function(n){ return !n.read; }).length;
  if(unread > 0){
    badge.style.display = 'flex';
    badge.textContent = unread > 9 ? '9+' : unread;
  } else {
    badge.style.display = 'none';
  }
}

// Poll for new notifications every 60s
setInterval(function(){
  fetch('/notifications/count')
  .then(function(r){ return r.json(); })
  .then(function(d){
    var badge = document.getElementById('notifBadge');
    if(!badge) return;
    var c = d.count || 0;
    if(c > 0){ badge.style.display='flex'; badge.textContent=c>9?'9+':c; }
    else badge.style.display='none';
  }).catch(function(){});
}, 60000);

function escapeHtml(t){ return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function timeAgo(ts){
  if(!ts) return 'just now';
  var d = new Date(ts), now = new Date();
  var diff = Math.floor((now - d) / 1000);
  if(diff < 60) return 'just now';
  if(diff < 3600) return Math.floor(diff/60)+'m ago';
  if(diff < 86400) return Math.floor(diff/3600)+'h ago';
  return Math.floor(diff/86400)+'d ago';
}

// Initial badge load on page load
document.addEventListener('DOMContentLoaded', function(){
  fetch('/notifications/count')
  .then(function(r){ return r.json(); })
  .then(function(d){
    var badge = document.getElementById('notifBadge');
    if(!badge) return;
    var c = d.count || 0;
    if(c > 0){ badge.style.display='flex'; badge.textContent=c>9?'9+':c; }
  }).catch(function(){});
});

// ══════════════════════════════════════════════
// MESSAGE NOTIFICATION SYSTEM
// ══════════════════════════════════════════════
var msgNotifOpen = false;
var msgNotifData = [];

function toggleMsgNotif(){
  // Close regular notif if open
  if(notifOpen){
    notifOpen = false;
    var dd = document.getElementById('notifDropdown');
    if(dd) dd.style.display = 'none';
  }
  msgNotifOpen = !msgNotifOpen;
  var dd = document.getElementById('msgNotifDropdown');
  if(dd) dd.style.display = msgNotifOpen ? 'block' : 'none';
  if(msgNotifOpen) loadMsgNotifications();
}

document.addEventListener('click', function(e){
  var wrap = document.getElementById('msgNotifWrap');
  if(wrap && msgNotifOpen && !wrap.contains(e.target)){
    msgNotifOpen = false;
    var dd = document.getElementById('msgNotifDropdown');
    if(dd) dd.style.display = 'none';
  }
});

// Also close regular notif when msg notif opens
var _origToggleNotif = typeof toggleNotif === 'function' ? toggleNotif : null;

function loadMsgNotifications(){
  fetch('/community/messages/preview')
  .then(function(r){ return r.json(); })
  .then(function(d){
    msgNotifData = d.messages || [];
    renderMsgNotifications();
    updateMsgBadge(0);
  }).catch(function(){
    renderMsgNotifications();
  });
}

function renderMsgNotifications(){
  var list = document.getElementById('msgNotifList');
  if(!list) return;
  if(!msgNotifData.length){
    list.innerHTML = '<div class="notif-empty"><div style="font-size:36px;margin-bottom:8px">✉️</div><p>No messages yet</p><span>Messages from farmers will appear here</span></div>';
    return;
  }
  list.innerHTML = msgNotifData.map(function(m){
    var initials = (m.from_name || 'F')[0].toUpperCase();
    var avatarHtml = m.from_pic
      ? '<img src="/static/'+m.from_pic+'" style="width:38px;height:38px;border-radius:50%;object-fit:cover;flex-shrink:0">'
      : '<div style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#1a3d22,#4caf50);color:#fff;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;flex-shrink:0">'+initials+'</div>';
    return '<a href="/community/farmer/'+encodeURIComponent(m.from_phone)+'" class="notif-item '+(m.read?'':'unread')+'" style="text-decoration:none;display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid #f2f2f2">'+
      avatarHtml+
      '<div style="flex:1;min-width:0">'+
        '<strong style="font-size:13px;font-weight:700;color:var(--text)">'+escapeHtml(m.from_name||'Farmer')+'</strong>'+
        '<p style="font-size:12px;color:var(--text-mid);margin:2px 0 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+escapeHtml(m.text||'')+'</p>'+
        '<span style="font-size:11px;color:#bbb;display:block;margin-top:3px">'+timeAgo(m.created_at)+'</span>'+
      '</div>'+
      (m.read?'':'<div style="width:8px;height:8px;border-radius:50%;background:#e53935;flex-shrink:0"></div>')+
    '</a>';
  }).join('');
}

function updateMsgBadge(count){
  var badge = document.getElementById('msgNotifBadge');
  if(!badge) return;
  if(count > 0){
    badge.style.display = 'flex';
    badge.textContent = count > 9 ? '9+' : count;
  } else {
    badge.style.display = 'none';
  }
}

// Poll for unread message count every 30s
function pollMsgCount(){
  fetch('/community/messages/unread_count')
  .then(function(r){ return r.json(); })
  .then(function(d){
    updateMsgBadge(d.count || 0);
  }).catch(function(){});
}

document.addEventListener('DOMContentLoaded', function(){
  pollMsgCount();
  setInterval(pollMsgCount, 30000);
});