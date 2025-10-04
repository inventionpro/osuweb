const MainPage = document.getElementById('page-main');

// Fetches to osu api
const proxyUrl = 'https://api.fsh.plus/file?url=';
function osufetch(url, opts) {
  return fetch((proxyUrl?proxyUrl+encodeURIComponent(url):url), opts);
}

// Pages
function changePage(page) {}

// Seasonal main backgrounds
const BGMainChangeInterval = 3 * 60 * 1000; // 3 Minutes
const BGMainUnfocusTimeout = 6 * 1000; // 6 Seconds
window.sbgs = [];
let LastBgIndex = 0;
let SBGcache = new Map();
function newSeasonalBg() {
  if (window.sbgs.length<1) return;
  let rand = LastBgIndex;
  while (rand===LastBgIndex&&window.sbgs.length>1) {
    rand = Math.floor(Math.random()*window.sbgs.length);
  }
  let url = window.sbgs[rand].url;
  if (SBGcache.has(url)) {
    MainPage.style.backgroundImage = `url(${SBGcache.get(url)})`;
  } else {
    osufetch(url)
      .then(res=>res.blob())
      .then(res=>{
        SBGcache.set(url, URL.createObjectURL(res));
        MainPage.style.backgroundImage = `url(${SBGcache.get(url)})`;
      })
  }
}
osufetch('https://osu.ppy.sh/api/v2/seasonal-backgrounds')
  .then(res=>res.json())
  .then(res=>{
    window.sbgs = res.backgrounds;
    newSeasonalBg();
    setInterval(()=>{
      newSeasonalBg();
    }, BGMainChangeInterval);
  });
let SBGunfocustimeout = null;
MainPage.onpointermove = (evt)=>{
  if (SBGunfocustimeout) clearTimeout(SBGunfocustimeout);
  let x = (evt.clientX/window.innerWidth)*10;
  let y = (evt.clientY/window.innerHeight)*10;
  MainPage.style.backgroundPosition = `calc(50% + ${x.toFixed(2)}px) calc(50% + ${y.toFixed(2)}px)`;
  SBGunfocustimeout = setTimeout(closesubmenu, BGMainUnfocusTimeout);
};

// Click logo
function opensubmenu() {
  if (!document.querySelector('#page-main .menu').classList.contains('hidden')) {
    changePage('play');
    return;
  }
  document.querySelector('#page-main .menu').classList.remove('hidden');
  document.querySelector('#page-main .menu').removeAttribute('inert');
  document.getElementById('topbar').classList.remove('hidden');
  document.getElementById('topbar').removeAttribute('inert');
  (new Audio('assets/sounds/osu-logo-select.wav')).play();
}
function closesubmenu() {
  if (document.querySelector('#page-main .menu').classList.contains('hidden')) return;
  document.querySelector('#page-main .menu').classList.add('hidden');
  document.querySelector('#page-main .menu').setAttribute('inert','');
  document.getElementById('topbar').classList.add('hidden');
  document.getElementById('topbar').setAttribute('inert','');
  (new Audio('assets/sounds/back-to-logo.wav')).play();
}
document.querySelector('#page-main .logo').onclick = opensubmenu;
document.body.onkeydown = (evt)=>{
  if (evt.key===' '||evt.key==='Enter'){ opensubmenu() }
  else if (evt.key==='Escape'){ closesubmenu() }
};