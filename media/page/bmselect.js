const BMSelectPage = document.getElementById('page-bmselect');
const BMSPlist = BMSelectPage.querySelector('.list');

function BMSelect(set) {
  if (BMSPlist.querySelector('.set[selected]')) BMSPlist.querySelector('.set[selected]').removeAttribute('selected');
  set.setAttribute('selected','');
  let tx = db.transaction(['mapset','map','mapsetfiles'], 'readonly');
  let setstore = tx.objectStore('mapset');
  let mapstore = tx.objectStore('map');
  let filestore = tx.objectStore('mapsetfiles');
  let id = set.getAttribute('data-id');
  let setreq = setstore.get(id);
  setreq.onsuccess = ()=>{
    let mapreq = mapstore.get(setreq.result.beatmaps.flat(1)[0].id.toString());
    mapreq.onsuccess = ()=>{
      let osu = parseOsu(mapreq.result);
      let filereq = filestore.get(id+'-'+osu.events.find(ev=>ev.type===0).extra.file);
      filereq.onsuccess = ()=>{
        BMSelectPage.querySelector('img').src = URL.createObjectURL(new Blob([filereq.result]));
      };
    };
  };
}

window.BMSelectOpen = ()=>{
  let tx = db.transaction(['mapset'], 'readonly');
  let setstore = tx.objectStore('mapset');
  let setreq = setstore.getAll();
  setreq.onsuccess = ()=>{
    console.log(setreq.result)
    let scrollbar = BMSelectPage.querySelector('.scrollbar');
    BMSPlist.innerHTML = setreq.result
      .map(set=>`<div class="set" data-id="${set.id}" role="button" style="--cover:url(${set.cover.replace('list','cover')})">
    <b>${set.title}</b>
    <span style="font-size:85%">${set.artist}</span>
    <div class="binfo">
    <span class="badge" style="--color:${statusColors[set.status]}">${set.status}</span>
    ${set.beatmaps.map(t=>{
      if (t.length<1) return '';
      return `<img src="assets/icons/ruleset-${['osu','taiko','catch','mania'][t[0].mode]}.svg">
${t.map(bb=>`<span class="diff" style="--bg:${difficultySpectrumBG(bb.difficulty).hex()}"></span>`).join('')}`;
    }).join('')}
  </div>
</div>
<div class="maps" data-parent="${set.id}">Beatmaps here</div>`)
      .join('');
    if (BMSPlist.querySelector('.set')) BMSelect(BMSPlist.querySelector('.set'));
    BMSPlist.querySelectorAll('.set').forEach(set=>{
      set.onclick = ()=>{BMSelect(set)};
    });
    let top = 0;
    function adjust() {
      let center = BMSPlist.offsetHeight/2;
      let rect = BMSPlist.getBoundingClientRect();
      Array.from(BMSPlist.children).forEach((item,i)=>{
        let itemRect = item.getBoundingClientRect();
        let itemCenter = item.offsetHeight/2+(itemRect.top-rect.top);
        item.style.setProperty('--sep', Math.abs(center-itemCenter));
        item.style.setProperty('--i', i);
      });
    };
    adjust();
    function animateScroll() {
      if (BMSPlist.scrollTop!==top) {
        BMSPlist.scrollTop += (top-BMSPlist.scrollTop)/20;
        adjust();
        scrollbar.style.setProperty('--perc', Math.floor(BMSPlist.scrollTop/(BMSPlist.scrollHeight-BMSPlist.clientHeight)*100)/100);
        scrollbar.style.setProperty('--size', (BMSPlist.clientHeight/BMSPlist.scrollHeight)*BMSPlist.offsetHeight+'px');
      }
      requestAnimationFrame(animateScroll);
    }
    requestAnimationFrame(animateScroll);
    BMSPlist.onwheel = (evt)=>{ top = Math.min(Math.max(top+evt.deltaY,0),(BMSPlist.scrollHeight-BMSPlist.clientHeight)) };
  };
};