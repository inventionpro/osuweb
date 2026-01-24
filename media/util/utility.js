const proxyUrl = 'https://api.fsh.plus/file?url=';
const proxyCache = new Map();
async function proxyfetch(url, opts={}, proxy=true, type='json') {
  let k = url+JSON.stringify(opts);
  if (proxyCache.has(k)) return proxyCache.get(k)
  let req = await fetch((proxy?proxyUrl+encodeURIComponent(url):url), opts);
  let res = await req[type]();
  proxyCache.set(k, res);
  return res;
}

const difficultySpectrumBG = chroma.scale(['#AAAAAA', '#4290FB', '#4FC0FF', '#4FFFD5', '#7CFF4F', '#F6F05C', '#FF8068', '#FF4E6F', '#C645B8', '#6563DE', '#18158E', '#000000'])
  .domain([0, 0.1, 1.25, 2, 2.5, 3.3, 4.2, 4.9, 5.8, 6.7, 7.7, 9])
  .mode('lrgb');
const difficultySpectrumTX = chroma.scale(['#000000DF', '#FFD966', '#FFD966', '#F6F05C', '#FF8068', '#FF4E6F', '#C645B8', '#6563DE'])
  .domain([6.4, 6.5, 8.89, 9, 9.9, 10.6, 11.5, 12.4])
  .mode('lrgb');

const statusColors = {
  graveyard: '#0a0c0c',
  wip: '#fb9664',
  pending: '#fdd765',
  ranked: '#b3ff66',
  approved: '#86efac',
  qualified: '#62bfed',
  loved: '#df629c'
}