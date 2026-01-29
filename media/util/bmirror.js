let BMSCache = new Map();

const Mino = {
  health: ()=>{
    return proxyfetch('https://catboy.best/api', undefined, false);
  },
  search: async(q, limit, page, other)=>{
    let url = `https://catboy.best/api/v2/search?limit=${limit}&offset=${limit*page}`;
    if (q&&q.length>0) url += '&q='+encodeURIComponent(q);
    Object.keys(other)
      .forEach(k=>{
        if (!other[k]) return;
        switch(k) {
          case 'mode':
            url += '&mode='+other[k];
            break;
          case 'cat':
            url += '&status='+other[k];
            break;
        }
      });
    let m2m = { osu: 0, taiko: 1, fruits: 2, mania: 3 };
    let bbFormat = (bm)=>{return {
      id: bm.id,
      mode: m2m[bm.mode],
      convert: bm.convert,
      bpm: bm.bpm,
      difficulty: bm.difficulty_rating,
      version: bm.version,
      mapper: bm.owners?bm.owners[0].username:bm.user_id
    }};
    let res = await proxyfetch(url, undefined, false);
    res = res.map(b=>{return {
      id: b.id,
      cover: `https://assets.ppy.sh/beatmaps/${b.id}/covers/list.jpg`,
      title: b.title_unicode,
      artist: b.artist_unicode,
      favs: b.favourite_count,
      plays: b.play_count,
      ranked: b.ranked_date,
      status: b.status,
      video: b.video,
      mappers: Array.from(new Set(b.beatmaps.map(bb=>bb.owners?bb.owners.map(o=>o.username):bb.user_id).flat(2))),
      beatmaps: Object.keys(m2m).map(t=>b.beatmaps.filter(bb=>bb.mode===t).toSorted((a,b)=>a.difficulty_rating-b.difficulty_rating).map(bbFormat))
    }});
    res.forEach(b=>BMSCache.set(b.id, b));
    return res;
  },
  download: async(id, video=true)=>{
    return await proxyfetch(`https://catboy.best/d/${id}${video?'':'n'}`, {}, false, 'arrayBuffer');
  }
};

const Nerinyan = {
  health: ()=>{
    return proxyfetch('https://api.nerinyan.moe/health', undefined, false);
  },
  search: async(q, limit, page, other)=>{
    let url = `https://api.nerinyan.moe/search?ps=${limit}&page=${page}`;
    if (q&&q.length>0) url += '&q='+encodeURIComponent(q);
    Object.keys(other)
      .forEach(k=>{
        if (!other[k]) return;
        switch(k) {
          case 'mode':
            url += '&m='+other[k];
            break;
          case 'cat':
            url += '&s='+other[k];
            break;
        }
      });
    let m2m = { osu: 0, taiko: 1, fruits: 2, mania: 3 };
    let bbFormat = (bm,b)=>{return {
      id: bm.id,
      mode: m2m[bm.mode],
      convert: bm.convert,
      bpm: bm.bpm,
      difficulty: bm.difficulty_rating,
      version: bm.version,
      mapper: b.creator
    }};
    let res = await proxyfetch(url, undefined, false);
    res = res.map(b=>{return {
      id: b.id,
      cover: `https://assets.ppy.sh/beatmaps/${b.id}/covers/list.jpg`,
      title: b.title_unicode,
      artist: b.artist_unicode,
      favs: b.favourite_count,
      plays: b.play_count,
      ranked: b.ranked_date,
      status: b.status,
      video: b.video,
      mappers: [b.creator],
      beatmaps: Object.keys(m2m).map(t=>b.beatmaps.filter(bb=>bb.mode===t).toSorted((a,b)=>a.difficulty_rating-b.difficulty_rating).map(bm=>bbFormat(bm,b)))
    }});
    res.forEach(b=>BMSCache.set(b.id, b));
    return res;
  },
  download: async(id, video=true)=>{
    return await proxyfetch(`https://api.nerinyan.moe/d/${id}?noVideo=${!video}`, {}, false, 'arrayBuffer');
  }
};