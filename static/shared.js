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

// ✅ FIX: DB name → localStorage → "Farmer" fallback chain
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
