const MainPage = document.getElementById('page-main');

// Fetches that need proxing api
const proxyUrl = 'https://api.fsh.plus/file?url=';
const proxyCache = new Map();
async function proxyfetch(url, opts, proxy=true, type='json') {
  let k = url+JSON.stringify(opts);
  if (proxyCache.has(k)) {
    return proxyCache.get(k)
  }
  let req = await fetch((proxy?proxyUrl+encodeURIComponent(url):url), opts);
  req = await req[type]();
  proxyCache.set(k, req);
  return req;
}

// Pages
function changePage(page) {}

window.mmodalopen = false;
function openMModal(id) {
  window.mmodalopen = true;
  document.getElementById(id).style.height = '';
  document.getElementById(id).show();
  document.getElementById(id).onclose = ()=>{
    window.mmodalopen = false;
    document.getElementById(id).style.height = '';
  };
  setTimeout(()=>{
    document.getElementById(id).style.height = 'calc(100dvh - var(--nav-size) + 20px)';
  }, 50);
  switch(id) {
    case 'explore':
      let textin = document.getElementById('explore-search');
      let search = ()=>{
        let url = 'https://catboy.best/api/v2/search?limit='+(3*7)+'&offset=0';
        if (textin.value.length>0) url += '&q='+textin.value;
        url += document.querySelector('input[name="mode"]:checked').value;
        url += document.querySelector('input[name="cat"]:checked').value;
        proxyfetch(url, undefined, false)
          .then(res=>{
            document.getElementById('explore-res').innerHTML = res
              .map(b=>`<div>
  <img src="${b.covers.list}" width="100" height="100" loading="lazy">
  <div>
    <b>${b.title_unicode}</b>
    <span>by ${b.artist_unicode}</span>
    <span style="flex:1"></span>
    <div class="stats">
      <span>H ${b.favourite_count} P ${b.play_count} D ${b.ranked_date}</span>
    </div>
    <div>
      <span>${b.status}</span>
    </div>
  </div>
</div>`)
              .join('');
          });
      };
      textin.onchange = search;
      search();
      break;
  }
}
window.openMModal = openMModal;

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
    proxyfetch(url, undefined, true, 'blob')
      .then(res=>{
        SBGcache.set(url, URL.createObjectURL(res));
        MainPage.style.backgroundImage = `url(${SBGcache.get(url)})`;
      })
  }
}
proxyfetch('https://osu.ppy.sh/api/v2/seasonal-backgrounds')
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
  if (window.mmodalopen) {
    if (SBGunfocustimeout) clearTimeout(SBGunfocustimeout);
    SBGunfocustimeout = setTimeout(closesubmenu, BGMainUnfocusTimeout);
    return;
  }
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