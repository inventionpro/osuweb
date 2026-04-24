const BMSelectPage = document.getElementById('page-bmselect');
const BMSBack = BMSelectPage.querySelector('.back');
const BMSList = BMSelectPage.querySelector('.list');
const BMSListop = BMSelectPage.querySelector('.list-top');
const BMSInfo = BMSelectPage.querySelector('.info');

function BMSelect(set) {
  if (BMSList.querySelector('.set[selected]')) BMSList.querySelector('.set[selected]').removeAttribute('selected');
  set.setAttribute('selected','');
  let tx = db.transaction(['mapset','map','mapsetfiles'], 'readonly');
  let setstore = tx.objectStore('mapset');
  let mapstore = tx.objectStore('map');
  let filestore = tx.objectStore('mapsetfiles');
  let id = set.getAttribute('data-id');
  let setreq = setstore.get(id);
  setreq.onsuccess = ()=>{
    let setdata = setreq.result;
    // Info panel
    BMSInfo.querySelector('.badge').innerText = setdata.status;
    BMSInfo.querySelector('.badge').style.setProperty('--color', statusColors[setdata.status]);
    BMSInfo.querySelector('.title').innerText = setdata.title;
    BMSInfo.querySelector('.artist').innerText = setdata.artist;
    // Specific map
    let mapreq = mapstore.get(setdata.beatmaps.flat(1)[0].id.toString()); // TODO: individual map select
    mapreq.onsuccess = ()=>{
      let osu = parseOsu(mapreq.result);
      // Info panel - extra data
      console.log(osu);
      BMSInfo.querySelector('.title').innerText = osu.title;
      BMSInfo.querySelector('.artist').innerText = osu.artist;
      // Background image
      let filereq = filestore.get(id+'-'+osu.events.find(ev=>ev.type===0).extra.file);
      filereq.onsuccess = ()=>{
        BMSBack.style.setProperty('--img', 'url('+URL.createObjectURL(new Blob([filereq.result]))+')');
      };
    };
  };
}

let BMSBackPress;
BMSBack.onpointerdown = ()=>{
  if (BMSBackPress) return;
  BMSBackPress = setTimeout(()=>{
    BMSelectPage.classList.add('cleared');
    BMSBackPress = null;
  }, 250);
};
BMSBack.onpointerup = ()=>{
  if (!BMSBackPress) {
    BMSelectPage.classList.remove('cleared');
    return;
  }
  clearTimeout(BMSBackPress);
  BMSBackPress = null;
};

function BMAdjust() {
  let center = BMSList.offsetHeight/2;
  let rect = BMSList.getBoundingClientRect();
  Array.from(BMSList.querySelectorAll('.set, .set[selected] + .maps .map')).forEach((item,i)=>{
    let itemRect = item.getBoundingClientRect();
    let itemCenter = item.offsetHeight/2+(itemRect.top-rect.top);
    item.style.setProperty('--sep', Math.abs(center-itemCenter));
    item.style.setProperty('--i', i);
  });
}

function BMShowList(sets) {
  BMSListop.querySelector('.search span').innerText = `${sets.length} matches`;
  BMSList.innerHTML = sets
    .map(set=>`<div class="set" data-id="${set.id}" role="button" style="--cover:url(${set.cover.replace('list','cover')})">
    <b>${set.title}</b>
    <span style="font-size:85%">${set.artist}</span>
    <div class="binfo">
    <span class="badge" style="--color:${statusColors[set.status]}">${set.status}</span>
    ${set.beatmaps.map(t=>{
      if (t.length<1) return '';
      return `<img src="assets/icons/ruleset-${['osu','taiko','catch','mania'][t[0].mode]}.svg">
${t.map(map=>`<span class="diff" style="--bg:${difficultySpectrumBG(map.difficulty).hex()}"></span>`).join('')}`;
    }).join('')}
  </div>
</div>
<div class="maps" data-parent="${set.id}" style="--count:${set.beatmaps[window.mode].length}">
  ${set.beatmaps[window.mode].map(map=>`<div class="map" onclick="changePage('playfield');playMap('${map.id}')" style="--tx:${difficultySpectrumTX(map.difficulty).hex()};--bg:${difficultySpectrumBG(map.difficulty).hex()}">
  <svg width="14" height="14" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="6" y="6" width="116" height="116" rx="58" fill="none" stroke-width="12"/><rect x="23" y="23" width="82" height="82" rx="41"/></svg>
  <div>
    <span>${map.version}</span>
    <div class="stars">
      <span><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 256 256"><path d="M120.392 13.4164C122.786 6.04591 133.214 6.04592 135.608 13.4164L159.881 88.1196C160.952 91.4158 164.024 93.6474 167.489 93.6474H246.037C253.787 93.6474 257.009 103.564 250.739 108.12L187.193 154.289C184.389 156.326 183.216 159.937 184.287 163.233L208.559 237.936C210.954 245.307 202.518 251.436 196.249 246.88L132.702 200.711C129.898 198.674 126.102 198.674 123.298 200.711L59.7514 246.88C53.4817 251.436 45.0458 245.307 47.4407 237.936L71.7132 163.233C72.7842 159.937 71.6109 156.326 68.807 154.289L5.2607 108.12C-1.00901 103.564 2.2132 93.6474 9.96299 93.6474H88.5106C91.9764 93.6474 95.048 91.4158 96.119 88.1196L120.392 13.4164Z"/></svg> ${map.difficulty.toFixed(2)}</span>
      ${Array.from({ length: Math.max(Math.ceil(map.difficulty),10) },(_,i)=>`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="${Math.max(Math.min(map.difficulty-i,1),0.2)*14}" viewBox="0 0 256 256"><path d="M120.392 13.4164C122.786 6.04591 133.214 6.04592 135.608 13.4164L159.881 88.1196C160.952 91.4158 164.024 93.6474 167.489 93.6474H246.037C253.787 93.6474 257.009 103.564 250.739 108.12L187.193 154.289C184.389 156.326 183.216 159.937 184.287 163.233L208.559 237.936C210.954 245.307 202.518 251.436 196.249 246.88L132.702 200.711C129.898 198.674 126.102 198.674 123.298 200.711L59.7514 246.88C53.4817 251.436 45.0458 245.307 47.4407 237.936L71.7132 163.233C72.7842 159.937 71.6109 156.326 68.807 154.289L5.2607 108.12C-1.00901 103.564 2.2132 93.6474 9.96299 93.6474H88.5106C91.9764 93.6474 95.048 91.4158 96.119 88.1196L120.392 13.4164Z"/></svg>`).join('')}
    </div>
  </div>
</div>`).join('')}
</div>`)
    .join('');
  if (BMSList.querySelector('.set')) BMSelect(BMSList.querySelector('.set'));
  BMSList.querySelectorAll('.set').forEach(set=>{
    set.onclick = ()=>{BMSelect(set)};
  });
  BMAdjust();
}

let BMAnimate;
window.BMSelectOpen = ()=>{
  if (BMAnimate) cancelAnimationFrame(BMAnimate);
  let tx = db.transaction(['mapset'], 'readonly');
  let setstore = tx.objectStore('mapset');
  let setreq = setstore.getAll();
  setreq.onsuccess = ()=>{
    let scrollbar = BMSelectPage.querySelector('.scrollbar');
    let sets = setreq.result
      .filter(set=>set.beatmaps[window.mode].length);
    console.log(setreq.result, sets);

    let lastResults = '';
    let searchInput = BMSListop.querySelector('.search input');
    searchInput.oninput = ()=>{
      let query = searchInput.value.toLowerCase();
      let newSet = sets.filter(set=>set.title.toLowerCase().includes(query));
      if (lastResults===JSON.stringify(newSet)) return;
      lastResults = JSON.stringify(newSet);
      BMShowList(newSet);
    };
    searchInput.oninput();

    let top = 0;
    function animateScroll() {
      if (BMSList.scrollTop!==top) {
        BMSList.scrollTop += (top-BMSList.scrollTop)/20;
        BMAdjust();
        scrollbar.style.setProperty('--perc', Math.floor(BMSList.scrollTop/(BMSList.scrollHeight-BMSList.clientHeight)*100)/100);
        scrollbar.style.setProperty('--size', (BMSList.clientHeight/BMSList.scrollHeight)*BMSList.offsetHeight+'px');
      }
      BMAnimate = requestAnimationFrame(animateScroll);
    }
    BMAnimate = requestAnimationFrame(animateScroll);
    BMSList.onwheel = (evt)=>{ top = Math.min(Math.max(top+evt.deltaY,0),(BMSList.scrollHeight-BMSList.clientHeight)) };
  };
};