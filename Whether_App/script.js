let unit = "C";
let currentCity = null;
let favorites = JSON.parse(localStorageGet('ar_favs') || '[]');
let recents = JSON.parse(localStorageGet('ar_recents') || '[]');

function localStorageGet(k){ try{ return window.__mem && window.__mem[k]; }catch(e){ return null; } }
window.__mem = {};
function memSet(k,v){ window.__mem[k]=JSON.stringify(v); }
function memGet(k){ let v=window.__mem[k]; return v?JSON.parse(v):null; }
favorites = memGet('ar_favs') || [{name:"Karachi",lat:24.8607,lon:67.0011,country:"Pakistan"}];
recents = memGet('ar_recents') || [];

const loaderMsgs = ["Calibrating atmosphere","Reading the wind","Aligning satellites","Warming up the globe","Almost there"];
let lp=0;
const loaderFill=document.getElementById('loaderFill');
const loaderTag=document.getElementById('loaderTag');
const loaderInt=setInterval(()=>{
  lp=Math.min(lp+Math.random()*18,96);
  loaderFill.style.width=lp+"%";
  loaderTag.textContent=loaderMsgs[Math.floor(lp/20)%loaderMsgs.length];
},260);
function finishLoader(){
  clearInterval(loaderInt);
  loaderFill.style.width="100%";
  setTimeout(()=>{
    document.getElementById('loader').classList.add('hide');
  },350);
}

const cursor=document.getElementById('cursor');
let cx=innerWidth/2, cy=innerHeight/2, tx=cx, ty=cy;
window.addEventListener('mousemove',e=>{tx=e.clientX;ty=e.clientY;});
(function loop(){cx+=(tx-cx)*0.16;cy+=(ty-cy)*0.16;cursor.style.left=cx+"px";cursor.style.top=cy+"px";requestAnimationFrame(loop);})();
document.addEventListener('mouseover',e=>{
  if(e.target.closest('button,.icon-btn,.hour-card,.day-card,.detail-card,.fav-chip,input,.suggest-item')){
    cursor.style.width="44px";cursor.style.height="44px";cursor.style.borderColor="var(--violet)";
  }
});
document.addEventListener('mouseout',e=>{
  if(e.target.closest('button,.icon-btn,.hour-card,.day-card,.detail-card,.fav-chip,input,.suggest-item')){
    cursor.style.width="26px";cursor.style.height="26px";cursor.style.borderColor="var(--cyan)";
  }
});

const aurora=document.getElementById('aurora');
function setAuroraTheme(theme){
  const themes={
    sunny:"radial-gradient(circle at 20% 20%, #ffb84d55, transparent 55%), radial-gradient(circle at 80% 30%, #ff8a4d33, transparent 50%), radial-gradient(circle at 50% 80%, #4ee1ff22, transparent 55%)",
    night:"radial-gradient(circle at 20% 20%, #1a2a6c55, transparent 55%), radial-gradient(circle at 80% 30%, #4ee1ff2e, transparent 50%), radial-gradient(circle at 50% 85%, #8b6bff33, transparent 55%)",
    rain:"radial-gradient(circle at 20% 20%, #33475955, transparent 55%), radial-gradient(circle at 80% 30%, #4ee1ff2e, transparent 50%), radial-gradient(circle at 50% 85%, #22344433, transparent 55%)",
    snow:"radial-gradient(circle at 20% 20%, #cfe8ff55, transparent 55%), radial-gradient(circle at 80% 30%, #ffffff2e, transparent 50%), radial-gradient(circle at 50% 85%, #4ee1ff22, transparent 55%)",
    storm:"radial-gradient(circle at 20% 20%, #4b2e8355, transparent 55%), radial-gradient(circle at 80% 30%, #8b6bff33, transparent 50%), radial-gradient(circle at 50% 85%, #ffb84d22, transparent 55%)",
    cloudy:"radial-gradient(circle at 20% 20%, #5b6b7c55, transparent 55%), radial-gradient(circle at 80% 30%, #8b6bff2e, transparent 50%), radial-gradient(circle at 50% 85%, #4ee1ff22, transparent 55%)"
  };
  aurora.style.background=themes[theme]||themes.night;
}

const pCanvas=document.getElementById('particle-canvas');
const pCtx=pCanvas.getContext('2d');
function resizeCanvas(){pCanvas.width=innerWidth;pCanvas.height=innerHeight;}
resizeCanvas();window.addEventListener('resize',resizeCanvas);
let particles=[];
let particleMode='none';
let lightningAlpha=0;
function initParticles(mode){
  particleMode=mode;
  const count = mode==='rain'||mode==='storm' ? 160 : mode==='snow' ? 110 : 0;
  particles=[];
  for(let i=0;i<count;i++){
    particles.push({
      x:Math.random()*innerWidth,
      y:Math.random()*innerHeight,
      speed:mode==='snow'?(0.5+Math.random()*1.2):(6+Math.random()*8),
      len:mode==='snow'?0:(10+Math.random()*14),
      size:mode==='snow'?(1.5+Math.random()*2.5):1,
      drift:Math.random()*2-1
    });
  }
}
function drawParticles(){
  pCtx.clearRect(0,0,pCanvas.width,pCanvas.height);
  if(particleMode==='rain'||particleMode==='storm'){
    pCtx.strokeStyle='rgba(180,220,255,0.35)';
    pCtx.lineWidth=1;
    particles.forEach(p=>{
      pCtx.beginPath();
      pCtx.moveTo(p.x,p.y);
      pCtx.lineTo(p.x+p.drift*2,p.y+p.len);
      pCtx.stroke();
      p.y+=p.speed;p.x+=p.drift*0.3;
      if(p.y>innerHeight){p.y=-20;p.x=Math.random()*innerWidth;}
    });
    if(particleMode==='storm' && Math.random()<0.012){lightningAlpha=0.5+Math.random()*0.4;}
    if(lightningAlpha>0){
      pCtx.fillStyle=`rgba(200,220,255,${lightningAlpha})`;
      pCtx.fillRect(0,0,pCanvas.width,pCanvas.height);
      lightningAlpha-=0.05;
    }
  } else if(particleMode==='snow'){
    pCtx.fillStyle='rgba(255,255,255,0.75)';
    particles.forEach(p=>{
      pCtx.beginPath();
      pCtx.arc(p.x,p.y,p.size,0,Math.PI*2);
      pCtx.fill();
      p.y+=p.speed;p.x+=Math.sin(p.y*0.01)*0.6;
      if(p.y>innerHeight){p.y=-10;p.x=Math.random()*innerWidth;}
    });
  }
  requestAnimationFrame(drawParticles);
}
drawParticles();

let bgScene,bgCamera,bgRenderer,bgOrbs=[];
function initBgScene(){
  try{
    if(typeof THREE==='undefined') throw new Error('THREE not loaded');
    const canvas=document.getElementById('bg-canvas');
    bgRenderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
    bgRenderer.setSize(innerWidth,innerHeight);
    bgRenderer.setPixelRatio(Math.min(devicePixelRatio,2));
    bgScene=new THREE.Scene();
    bgCamera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,0.1,100);
    bgCamera.position.z=14;
    const colors=[0x4ee1ff,0x8b6bff,0xffb84d];
    for(let i=0;i<3;i++){
      const geo=new THREE.SphereGeometry(2.2+i*0.6,32,32);
      const mat=new THREE.MeshBasicMaterial({color:colors[i],transparent:true,opacity:0.06,wireframe:false});
      const mesh=new THREE.Mesh(geo,mat);
      mesh.position.set((i-1)*7,(Math.random()-0.5)*4,-6-i*3);
      bgScene.add(mesh);
      bgOrbs.push(mesh);
    }
    window.addEventListener('resize',()=>{
      bgCamera.aspect=innerWidth/innerHeight;bgCamera.updateProjectionMatrix();
      bgRenderer.setSize(innerWidth,innerHeight);
    });
    animateBg();
  }catch(err){
    console.warn('3D background unavailable, continuing without it:', err.message);
  }
}
let mouseNX=0,mouseNY=0;
window.addEventListener('mousemove',e=>{mouseNX=(e.clientX/innerWidth-0.5);mouseNY=(e.clientY/innerHeight-0.5);});
function animateBg(){
  requestAnimationFrame(animateBg);
  bgOrbs.forEach((o,i)=>{
    o.rotation.y+=0.0015+i*0.0004;
    o.position.x+=Math.sin(Date.now()*0.0002+i)*0.002;
  });
  bgCamera.position.x+=(mouseNX*2-bgCamera.position.x)*0.02;
  bgCamera.position.y+=(-mouseNY*2-bgCamera.position.y)*0.02;
  bgCamera.lookAt(0,0,-6);
  bgRenderer.render(bgScene,bgCamera);
}

let heroScene,heroCamera,heroRenderer,heroGroup,heroMesh,heroGlow;
function initHero3D(){
  try{
    if(typeof THREE==='undefined') throw new Error('THREE not loaded');
    const canvas=document.getElementById('hero3d');
    const size=420;
    heroRenderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
    heroRenderer.setSize(size,size);
    heroRenderer.setPixelRatio(Math.min(devicePixelRatio,2));
    heroScene=new THREE.Scene();
    heroCamera=new THREE.PerspectiveCamera(45,1,0.1,100);
    heroCamera.position.z=6;
    heroGroup=new THREE.Group();
    heroScene.add(heroGroup);

    const geo=new THREE.IcosahedronGeometry(1.7,3);
    const mat=new THREE.MeshBasicMaterial({color:0x4ee1ff,wireframe:true,transparent:true,opacity:0.5});
    heroMesh=new THREE.Mesh(geo,mat);
    heroGroup.add(heroMesh);

    const glowGeo=new THREE.SphereGeometry(2.05,32,32);
    const glowMat=new THREE.MeshBasicMaterial({color:0x4ee1ff,transparent:true,opacity:0.06});
    heroGlow=new THREE.Mesh(glowGeo,glowMat);
    heroGroup.add(heroGlow);

    animateHero();
  }catch(err){
    console.warn('3D hero orb unavailable, continuing without it:', err.message);
  }
}
function setHeroTheme(theme){
  const colorMap={sunny:0xffb84d,night:0x8b6bff,rain:0x4ee1ff,snow:0xdff3ff,storm:0x8b6bff,cloudy:0x9aa6c9};
  const c=colorMap[theme]||0x4ee1ff;
  if(heroMesh){heroMesh.material.color.setHex(c);}
  if(heroGlow){heroGlow.material.color.setHex(c);}
}
function animateHero(){
  requestAnimationFrame(animateHero);
  if(heroGroup){
    heroGroup.rotation.y+=0.0032;
    heroGroup.rotation.x=Math.sin(Date.now()*0.0003)*0.15;
  }
  heroRenderer.render(heroScene,heroCamera);
}

function decodeWMO(code,isDay){
  const map={
    0:["Clear sky", isDay?"☀️":"🌙", isDay?"sunny":"night"],
    1:["Mainly clear", isDay?"🌤️":"🌙", isDay?"sunny":"night"],
    2:["Partly cloudy","⛅","cloudy"],
    3:["Overcast","☁️","cloudy"],
    45:["Fog","🌫️","cloudy"],
    48:["Rime fog","🌫️","cloudy"],
    51:["Light drizzle","🌦️","rain"],
    53:["Drizzle","🌦️","rain"],
    55:["Dense drizzle","🌧️","rain"],
    56:["Freezing drizzle","🌧️","rain"],
    57:["Freezing drizzle","🌧️","rain"],
    61:["Light rain","🌧️","rain"],
    63:["Rain","🌧️","rain"],
    65:["Heavy rain","🌧️","rain"],
    66:["Freezing rain","🌧️","rain"],
    67:["Freezing rain","🌧️","rain"],
    71:["Light snow","🌨️","snow"],
    73:["Snow","❄️","snow"],
    75:["Heavy snow","❄️","snow"],
    77:["Snow grains","❄️","snow"],
    80:["Light showers","🌦️","rain"],
    81:["Showers","🌧️","rain"],
    82:["Violent showers","🌧️","rain"],
    85:["Snow showers","🌨️","snow"],
    86:["Heavy snow showers","❄️","snow"],
    95:["Thunderstorm","⛈️","storm"],
    96:["Thunderstorm + hail","⛈️","storm"],
    99:["Severe thunderstorm","⛈️","storm"]
  };
  return map[code]||["Unknown","🌡️","cloudy"];
}

async function fetchGeocode(query){
  const url=`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`;
  const res=await fetch(url);
  const data=await res.json();
  return (data.results||[]).map(r=>({
    name:r.name, country:r.country||'', admin1:r.admin1||'',
    lat:r.latitude, lon:r.longitude
  }));
}
async function fetchWeather(lat,lon){
  const url=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`+
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,`+
    `surface_pressure,visibility&hourly=temperature_2m,weather_code,precipitation_probability&`+
    `daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max&`+
    `timezone=auto&forecast_days=8`;
  const res=await fetch(url);
  return res.json();
}
async function fetchAQI(lat,lon){
  const url=`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`;
  try{
    const res=await fetch(url);
    const data=await res.json();
    return data.current ? data.current.us_aqi : null;
  }catch(e){return null;}
}

function fmtTemp(c){
  const v = unit==='C' ? c : (c*9/5+32);
  return Math.round(v)+"°";
}
function fmtTime(iso){
  return new Date(iso).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
}
function fmtDay(iso,i){
  if(i===0) return "Today";
  return new Date(iso).toLocaleDateString([], {weekday:'short'});
}

function aqiInfo(aqi){
  if(aqi==null) return {status:"Unavailable",rec:"Air quality data isn't available for this location.",color:"#9aa6c9",pct:0};
  if(aqi<=50) return {status:"Good",rec:"Air quality is great — perfect for outdoor activity.",color:"#7fe0a5",pct:aqi/300};
  if(aqi<=100) return {status:"Moderate",rec:"Acceptable air quality; sensitive groups should take care.",color:"#ffd166",pct:aqi/300};
  if(aqi<=150) return {status:"Unhealthy for sensitive groups",rec:"Reduce prolonged outdoor exertion if you're sensitive.",color:"#ffb84d",pct:aqi/300};
  if(aqi<=200) return {status:"Unhealthy",rec:"Consider limiting outdoor activity today.",color:"#ff7a5c",pct:aqi/300};
  return {status:"Very unhealthy",rec:"Avoid outdoor exertion — air quality is poor.",color:"#ff5c7a",pct:1};
}

async function loadCity(city){
  currentCity=city;
  document.getElementById('heroCity').textContent = `${city.name}${city.country?', '+city.country:''}`;
  try{
    const [weather,aqi]=await Promise.race([
      Promise.all([fetchWeather(city.lat,city.lon),fetchAQI(city.lat,city.lon)]),
      new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),12000))
    ]);
    renderWeather(weather);
    renderAQI(aqi);
    pushRecent(city);
  }catch(err){
    console.error('AR-Weather fetch failed:', err);
    document.getElementById('heroCond').textContent='Could not load weather data';
    document.getElementById('heroFeel').textContent =
      location.protocol==='file:'
        ? "This page was opened as a local file — browsers block API requests from file:// URLs. Serve it from a local server (e.g. run 'npx serve' in its folder) or upload it to any static host, then reload."
        : "Check your internet connection, then try searching again.";
  }
  finishLoader();
}

function themeToParticle(theme){
  if(theme==='rain') return 'rain';
  if(theme==='storm') return 'storm';
  if(theme==='snow') return 'snow';
  return 'none';
}

function renderWeather(data){
  const cur=data.current;
  const [label,icon,theme]=decodeWMO(cur.weather_code,cur.is_day);

  document.getElementById('heroDate').textContent=new Date().toLocaleDateString([], {weekday:'long', month:'long', day:'numeric'});
  document.getElementById('heroTemp').textContent=fmtTemp(cur.temperature_2m);
  document.getElementById('heroCond').textContent=`${icon} ${label}`;
  document.getElementById('heroFeel').textContent=`Feels like ${fmtTemp(cur.apparent_temperature)}`;
  document.getElementById('heroHi').textContent=fmtTemp(data.daily.temperature_2m_max[0]);
  document.getElementById('heroLo').textContent=fmtTemp(data.daily.temperature_2m_min[0]);
  document.getElementById('heroSunrise').textContent=fmtTime(data.daily.sunrise[0]);
  document.getElementById('heroSunset').textContent=fmtTime(data.daily.sunset[0]);

  document.getElementById('statHumidity').textContent=cur.relative_humidity_2m+"%";
  document.getElementById('statWind').textContent=Math.round(cur.wind_speed_10m)+" km/h";
  document.getElementById('statPressure').textContent=Math.round(cur.surface_pressure)+" hPa";
  document.getElementById('statVisibility').textContent=(cur.visibility/1000).toFixed(1)+" km";
  document.getElementById('statUv').textContent=Math.round(data.daily.uv_index_max[0]);

  const finalTheme = cur.is_day ? theme : (theme==='sunny'?'night':theme);
  setAuroraTheme(finalTheme);
  setHeroTheme(finalTheme);
  initParticles(themeToParticle(finalTheme));

  // hourly (next 24h from now)
  const nowIdx=data.hourly.time.findIndex(t=>new Date(t)>=new Date());
  const hourlyScroll=document.getElementById('hourlyScroll');
  hourlyScroll.innerHTML='';
  for(let i=nowIdx;i<nowIdx+24 && i<data.hourly.time.length;i++){
    const [,hicon]=decodeWMO(data.hourly.weather_code[i],1);
    const el=document.createElement('div');
    el.className='hour-card';
    el.innerHTML=`<div class="hour-time">${i===nowIdx?'Now':fmtTime(data.hourly.time[i])}</div>
      <div class="hour-ico">${hicon}</div>
      <div class="hour-temp">${fmtTemp(data.hourly.temperature_2m[i])}</div>`;
    hourlyScroll.appendChild(el);
  }

  const daysList=document.getElementById('daysList');
  daysList.innerHTML='';
  const maxT=Math.max(...data.daily.temperature_2m_max);
  const minT=Math.min(...data.daily.temperature_2m_min);
  for(let i=0;i<7 && i<data.daily.time.length;i++){
    const [,dicon]=decodeWMO(data.daily.weather_code[i],1);
    const hi=data.daily.temperature_2m_max[i], lo=data.daily.temperature_2m_min[i];
    const leftPct=((lo-minT)/(maxT-minT||1))*70;
    const widthPct=((hi-lo)/(maxT-minT||1))*100*0.5+18;
    const el=document.createElement('div');
    el.className='day-card';
    el.innerHTML=`
      <div class="day-name">${fmtDay(data.daily.time[i],i)}</div>
      <div class="day-ico">${dicon}</div>
      <div class="day-rain">${data.daily.precipitation_probability_max[i]||0}%</div>
      <div class="day-range">
        <span class="day-lo">${fmtTemp(lo)}</span>
        <div class="day-track"><div class="day-fill" style="left:${leftPct}%;width:${widthPct}%;"></div></div>
        <span class="day-hi">${fmtTemp(hi)}</span>
      </div>`;
    daysList.appendChild(el);
  }

  reobserve();
}

function renderAQI(aqi){
  const card=document.getElementById('aqiCard');
  card.style.display='flex';
  const info=aqiInfo(aqi);
  document.getElementById('aqiNum').textContent=aqi==null?'--':aqi;
  document.getElementById('aqiStatus').textContent=info.status;
  document.getElementById('aqiRec').textContent=info.rec;
  const arc=document.getElementById('aqiArc');
  const circumference=201;
  arc.style.stroke=info.color;
  arc.style.strokeDashoffset=circumference-(circumference*Math.min(info.pct,1));
}

function reobserve(){
  const obs=new IntersectionObserver((entries)=>{
    entries.forEach((e,i)=>{
      if(e.isIntersecting){
        setTimeout(()=>e.target.classList.add('reveal'), i*40);
        obs.unobserve(e.target);
      }
    });
  },{threshold:0.15});
  document.querySelectorAll('.hour-card:not(.reveal), .day-card:not(.reveal), .detail-card:not(.reveal), .aqi-card:not(.reveal)').forEach(el=>obs.observe(el));
}
document.getElementById('hero').classList.add('reveal');

const searchInput=document.getElementById('searchInput');
const suggest=document.getElementById('suggest');
let searchTimer=null;
searchInput.addEventListener('input',()=>{
  clearTimeout(searchTimer);
  const q=searchInput.value.trim();
  if(q.length<2){suggest.classList.remove('show');return;}
  searchTimer=setTimeout(async ()=>{
    const results=await fetchGeocode(q);
    if(!results.length){suggest.classList.remove('show');return;}
    suggest.innerHTML=results.map((r,i)=>
      `<div class="suggest-item" data-idx="${i}">${r.name}${r.admin1?', '+r.admin1:''}${r.country?', '+r.country:''}</div>`
    ).join('');
    suggest.classList.add('show');
    suggest.querySelectorAll('.suggest-item').forEach((el,i)=>{
      el.addEventListener('click',()=>{
        selectCity(results[i]);
        suggest.classList.remove('show');
        searchInput.value='';
      });
    });
  },350);
});
document.addEventListener('click',e=>{
  if(!e.target.closest('.search-wrap')) suggest.classList.remove('show');
});
function selectCity(city){
  document.getElementById('loader').classList.remove('hide');
  lp=0;
  loadCity(city);
}

const geoBanner=document.getElementById('geoBanner');
document.getElementById('geoAllow').addEventListener('click', requestGeo);
document.getElementById('geoBtn').addEventListener('click', requestGeo);
function requestGeo(){
  if(!navigator.geolocation){ geoBanner.classList.add('hide'); return; }
  navigator.geolocation.getCurrentPosition(pos=>{
    geoBanner.classList.add('hide');
    selectCity({name:"Your location",country:"",lat:pos.coords.latitude,lon:pos.coords.longitude});
  },()=>{
    geoBanner.querySelector('span').textContent="Location access denied — search a city above instead.";
  });
}

document.getElementById('unitBtn').addEventListener('click',()=>{
  unit = unit==='C' ? 'F' : 'C';
  document.getElementById('unitBtn').textContent = '°'+unit;
  if(currentCity) loadCity(currentCity);
});

function renderFavs(){
  const wrap=document.getElementById('favs');
  wrap.innerHTML='';
  favorites.forEach(f=>{
    const chip=document.createElement('div');
    chip.className='fav-chip';
    chip.innerHTML=`<span>${f.name}</span><span class="rm" data-name="${f.name}">✕</span>`;
    chip.addEventListener('click',(e)=>{
      if(e.target.classList.contains('rm')){
        favorites=favorites.filter(x=>x.name!==f.name);
        memSet('ar_favs',favorites);
        renderFavs();
        return;
      }
      selectCity(f);
    });
    wrap.appendChild(chip);
  });
}
document.getElementById('favBtn').addEventListener('click',()=>{
  if(!currentCity) return;
  if(!favorites.find(f=>f.name===currentCity.name)){
    favorites.push(currentCity);
    memSet('ar_favs',favorites);
    renderFavs();
    document.getElementById('favBtn').classList.add('active');
    document.getElementById('favBtn').textContent='♥';
  }
});
function pushRecent(city){
  document.getElementById('favBtn').textContent = favorites.find(f=>f.name===city.name) ? '♥' : '♡';
  document.getElementById('favBtn').classList.toggle('active', !!favorites.find(f=>f.name===city.name));
}

try{ initBgScene(); }catch(e){ console.warn('bg init failed', e); }
try{ initHero3D(); }catch(e){ console.warn('hero3d init failed', e); }
try{ renderFavs(); }catch(e){ console.warn('renderFavs failed', e); }
try{ requestGeo(); }catch(e){ console.warn('geo request failed', e); }
setTimeout(()=>{ if(!currentCity) loadCity(favorites[0]); }, 600);
setTimeout(()=>{ finishLoader(); }, 15000);
