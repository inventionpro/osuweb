function osuSectionKeyPair(content, separator) {
  return Object.fromEntries(content
    .split('\n')
    .map(line=>line.split(separator)));
}
const OsuEventTextTypeNumbers = {
  Background: 0,
  Video: 1,
  Break: 2,
  'Storyboard Layer': 3, // No text equivalent but anyways
  Sound: 4,
  Storyboard: 5
}

function parseOsu(contents) {
  if (!contents.startsWith('osu file format v')) throw new Error('Not a .osu file?');

  let bm = {};
  bm.version = Number(contents.match(/osu file format v([0-9]+)$/mi)[1]);
  // It should be able to parse fine 6-14 and 128 but only 14 is really fully suported
  if (Number.isNaN(bm.version)||bm.version<6||(bm.version>14&&bm.version!==128)) console.warn('Unsuported beatmap version '+bm.version+' gonna try to parse anyway');

  contents = (contents+'\n').replaceAll(/^\/\/.*?$\n/gm,'');

  let sections = {};
  Array.from(contents.matchAll(/\[([a-zA-Z]+?)\]\n((?:.+?\n)+)(?:\n|$)/g))
    .forEach(sec=>sections[sec[1]]=sec[2]);

  // Why does every section use a different content type
  sections.General = osuSectionKeyPair(sections.General, ': ');
  //sections.Editor = osuSectionKeyPair(sections.Editor, ': '); No editor for now
  sections.Metadata = osuSectionKeyPair(sections.Metadata, ':');
  sections.Difficulty = osuSectionKeyPair(sections.Difficulty, ':');
  sections.Colours = osuSectionKeyPair(sections.Colours, ' : ');

  sections.Events = sections.Events.split('\n').filter(l=>l.length);
  sections.TimingPoints = sections.TimingPoints.split('\n').filter(l=>l.length);
  sections.HitObjects = sections.HitObjects.split('\n').filter(l=>l.length);

  // BP Info
  bm.title = sections.Metadata.TitleUnicode??sections.Metadata.Title;
  bm.artist = sections.Metadata.ArtistUnicode??sections.Metadata.Artist;
  bm.creator = sections.Metadata.Creator;

  bm.name = sections.Metadata.Version;
  bm.id = sections.Metadata.BeatmapID??sections.Metadata.BeatmapUUID;
  bm.mode = Number(sections.General.Mode)||0;
  bm.epilepsy = sections.General.EpilepsyWarning==='1';
  bm.maniaSpecialStyle = sections.General.SpecialStyle==='1'; // Adds extra column N+1

  bm.audioFile = sections.General.AudioFilename;
  bm.audioDelay = Number(sections.General.AudioLeadIn)||0;
  bm.audioPreview = Number(sections.General.PreviewTime)||-1;
  bm.sampleSet = sections.General.SampleSet??'Normal';
  bm.samplesSpeedChange = sections.General.SamplesMatchPlaybackRate==='1';
  bm.countdown = Number(sections.General.Countdown)||1;
  bm.countdownOffset = Number(sections.General.CountdownOffset)||0;

  bm.stackLeniency = Number(sections.General.StackLeniency)||0.7;
  bm.HP = Number(sections.Difficulty.HPDrainRate);
  bm.CS = Number(sections.Difficulty.CircleSize);
  bm.OD = Number(sections.Difficulty.OverallDifficulty);
  bm.AR = Number(sections.Difficulty.ApproachRate)||bm.OD;
  bm.sliderMult = Number(sections.Difficulty.SliderMultiplier)||1.4;
  bm.sliderTick = Number(sections.Difficulty.SliderTickRate)||1;

  bm.events = [];
  sections.Events.forEach(event=>{
    let data = event.split(',');
    let type = OsuEventTextTypeNumbers[data[0]]??Number(data[0]);
    let extra = {};
    switch(type) {
      case 0: // BG
      case 1: // Video
        extra.file = data[2];
        extra.x = Number(data[3]);
        extra.y = Number(data[4]);
        break;
      case 2: // Break
        extra.end = Number(data[2]);
        break;
      case 4: // Sound
        extra.layer = Number(data[2]);
        extra.file = data[3];
        extra.volume = Number(data[4]);
        break;
      // TODO: Storyboards https://osu.ppy.sh/wiki/en/Storyboard/Scripting
    }
    bm.events.push({ type, start: Number(data[1]), extra });
  });

  // TODO: Timing points, what even are they https://osu.ppy.sh/wiki/en/Client/File_formats/osu_%28file_format%29#timing-points

  bm.colors = {
    sliderBorder: sections.Colours.SliderBorder||'255,255,255',
    sliderTrack: sections.Colours.SliderTrackOverride, // Missing = combo color
    combo: Object.entries(sections.Colours)
      .filter(c=>c[0].startsWith('Combo'))
      .toSorted((a,b)=>Number(b[0].slice(5))-Number(a[0].slice(5)))
      .map(c=>c[1])
  };

  bm.objects = sections.HitObjects
    .map(ho=>ho.split(','))
    .toSorted((a,b)=>Number(b[2])-Number(a[2]))
    .map(ho=>{
      let typeb = Number(ho[3]);
      let type = typeb&2?'slider':(typeb&8?'spinner':(typeb&128?'hold':'circle'));
      let hitsound = ho[4]&2?'whistle':(ho[4]&4?'finish':(ho[4]&8?'clap':'normal'));
      let extra = {};
      switch(type) {
        case 'slider':
          extra.type = ho[5].split('|')[0];
          extra.points = ho[5].split('|').slice(1).map(p=>p.split(':')),
          extra.slides = Number(ho[6]);
          extra.length = Number(ho[7]);
          //extra.edgeSounds = ho[8];
          //extra.edgeSets = ho[9];
          break;
        case 'spinner':
        case 'hold':
          extra.end = Number(ho[5]);
          break;
      }
      return {
        x: Number(ho[0]),
        y: Number(ho[1]),
        time: Number(ho[2]),
        type,
        newCombo: (typeb&4)!==0,
        comboSkip: (typeb&112)>>>4,
        hitsound,
        extra,
        //hitSample: null // TODO: Figure this out https://osu.ppy.sh/wiki/en/Client/File_formats/osu_%28file_format%29#hitsounds
      }
    });

  return bm;
}