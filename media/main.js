const MainPage = document.getElementById('page-main');

// Fetches to osu api
const proxyUrl = 'https://api.fsh.plus/file?url=';
function osufetch(url, opts) {
  return fetch((proxyUrl?proxyUrl+encodeURIComponent(url):url), opts);
}

// Pages
function changePage(page) {}

// Seasonal main backgrounds
const BGMainChangeInterval = 2 * 60 * 1000; // 2 Minutes
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
  let x = (evt.clientX/window.innerWidth)*5;
  let y = (evt.clientY/window.innerHeight)*5;
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
  (new Audio('../assets/osu-logo-select.wav')).play();
}
function closesubmenu() {
  if (document.querySelector('#page-main .menu').classList.contains('hidden')) return;
  document.querySelector('#page-main .menu').classList.add('hidden');
  (new Audio('../assets/back-to-logo.wav')).play();
}
document.querySelector('#page-main .logo').onclick = opensubmenu;
document.body.onkeydown = (evt)=>{
  if (evt.key===' '){ opensubmenu() }
  else if (evt.key==='Escape'){ closesubmenu() }
};