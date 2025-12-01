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
    let res = await proxyfetch(url, undefined, false);
    res = res.map(b=>{return {
      cover: `https://assets.ppy.sh/beatmaps/${b.id}/covers/list.jpg`,
      title: b.title_unicode,
      artist: b.artist_unicode,
      favs: b.favourite_count,
      plays: b.play_count,
      ranked: b.ranked_date,
      status: b.status,
      video: b.video
    }});
    return res;
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
    let res = await proxyfetch(url, undefined, false);
    res = res.map(b=>{return {
      cover: `https://assets.ppy.sh/beatmaps/${b.id}/covers/list.jpg`,
      title: b.title_unicode,
      artist: b.artist_unicode,
      favs: b.favourite_count,
      plays: b.play_count,
      ranked: b.ranked_date,
      status: b.status,
      video: b.video
    }});
    return res;
  }
};