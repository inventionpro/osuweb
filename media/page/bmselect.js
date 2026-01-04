const BMSelectPage = document.getElementById('page-bmselect');

function changeSelectBG(set) {
  let tx = db.transaction(['map','mapsetfiles'], 'readonly');
  let mapstore = tx.objectStore('map');
  let filestore = tx.objectStore('mapsetfiles');
  let mapreq = setstore.get();
  setreq.onsuccess = ()=>{
    console.log(setreq.result)
  };
  BMSelectPage.querySelector('> img');
}

window.BMSelectOpen = ()=>{
  let tx = db.transaction(['mapset'], 'readonly');
  let setstore = tx.objectStore('mapset');
  let setreq = setstore.getAll();
  setreq.onsuccess = ()=>{
    console.log(setreq.result)
    let list = BMSelectPage.querySelector('.list');
    let scrollbar = BMSelectPage.querySelector('.scrollbar');
    list.innerHTML = setreq.result
      .map(set=>`<div class="set" data-id="${set.id}" style="--cover:url(${set.cover.replace('list','cover')})">
    <b>${set.title}</b>
    <span style="font-size:85%">${set.artist}</span>
    <div class="binfo">
    <span class="badge" style="--color:${statusColors[set.status]}">${set.status}</span>
    ${set.beatmaps.map(t=>{
      if (t.length<1) return '';
      return `<img src="assets/icons/ruleset-${['osu','taiko','catch','mania'][t[0].mode]}.svg">
${t.map(bb=>`<span class="diff" style="--color:${difficultySpectrum(bb.difficulty).hex()}"></span>`).join('')}`;
    }).join('')}
  </div>
</div>
<div class="maps" data-parent="${set.id}"></div>`)
      .join('');
    let top = 0;
    function adjust() {
      let center = list.offsetHeight/2;
      let rect = list.getBoundingClientRect();
      Array.from(list.children).forEach((item,i)=>{
        let itemRect = item.getBoundingClientRect();
        let itemCenter = item.offsetHeight/2+(itemRect.top-rect.top);
        item.style.setProperty('--sep', Math.abs(center-itemCenter));
        item.style.setProperty('--i', i);
      });
    };
    adjust();
    function animateScroll() {
      if (list.scrollTop!==top) {
        list.scrollTop += (top-list.scrollTop)/20;
        adjust();
        scrollbar.style.setProperty('--perc', Math.floor(list.scrollTop/(list.scrollHeight-list.clientHeight)*100)/100);
        scrollbar.style.setProperty('--size', (list.clientHeight/list.scrollHeight)*list.offsetHeight+'px');
      }
      requestAnimationFrame(animateScroll);
    }
    requestAnimationFrame(animateScroll);
    list.onwheel = (evt)=>{ top = Math.min(Math.max(top+evt.deltaY,0),(list.scrollHeight-list.clientHeight)) };
  };
};