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

// ── Fix 4: LANGUAGE — applies to whole project ────────────────────────────────
var LANG_MAP = {
  en: {
    'dashboard':'Dashboard','weather':'Weather','crop_advisor':'Crop Advisor',
    'irrigation':'Irrigation','yield_calc':'Yield Calculator','ai_diag':'AI Diagnosis',
    'profile':'Profile','history':'History','settings':'Settings','community':'Community',
    'quick_access':'Quick Access','farm_overview':'Farm Overview',
    'weather_today':'Weather Today','crop_health':'Crop Health','soil_info':'Soil Info',
    'today_tasks':"Today's Tasks",'save_changes':'Save Changes',
    'edit_profile':'Edit Profile','farm_gallery':'Farm Gallery',
    'crop_calendar':'Crop Calendar','fertilizer_calc':'Fertilizer Calc','crop_diary':'Crop Diary'
  },
  hi: {
    'dashboard':'डैशबोर्ड','weather':'मौसम','crop_advisor':'फसल सलाहकार',
    'irrigation':'सिंचाई','yield_calc':'उत्पादन कैलकुलेटर','ai_diag':'AI निदान',
    'profile':'प्रोफाइल','history':'इतिहास','settings':'सेटिंग्स','community':'समुदाय',
    'quick_access':'त्वरित पहुँच','farm_overview':'खेत अवलोकन',
    'weather_today':'आज का मौसम','crop_health':'फसल स्वास्थ्य','soil_info':'मिट्टी जानकारी',
    'today_tasks':'आज के कार्य','save_changes':'बदलाव सहेजें',
    'edit_profile':'प्रोफाइल संपादित करें','farm_gallery':'खेत गैलरी',
    'crop_calendar':'फसल कैलेंडर','fertilizer_calc':'खाद कैलकुलेटर','crop_diary':'फसल डायरी'
  },
  mr: {
    'dashboard':'डॅशबोर्ड','weather':'हवामान','crop_advisor':'पीक सल्लागार',
    'irrigation':'सिंचन','yield_calc':'उत्पादन कॅल्क्युलेटर','ai_diag':'AI निदान',
    'profile':'प्रोफाइल','history':'इतिहास','settings':'सेटिंग्ज','community':'समुदाय',
    'quick_access':'त्वरित प्रवेश','farm_overview':'शेत आढावा',
    'weather_today':'आजचे हवामान','crop_health':'पीक आरोग्य','soil_info':'माती माहिती',
    'today_tasks':'आजची कामे','save_changes':'बदल जतन करा',
    'edit_profile':'प्रोफाइल संपादित करा','farm_gallery':'शेत गॅलरी',
    'crop_calendar':'पीक दिनदर्शिका','fertilizer_calc':'खत कॅल्क्युलेटर','crop_diary':'पीक डायरी'
  }
};

function applyLang(lang){
  var map = LANG_MAP[lang] || LANG_MAP.en;
  document.querySelectorAll('[data-lang]').forEach(function(el){
    var key = el.getAttribute('data-lang');
    if(map[key]) el.innerText = map[key];
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