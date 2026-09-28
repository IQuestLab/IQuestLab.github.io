/* ============================================================
   audio.js — 发条八音盒主题音效（全部 Web Audio 合成）
   ============================================================ */
const AudioSys = {
  ctx:null, master:null, musicGain:null, musicTimer:null, noiseBuf:null, enabled:true,

  init(){
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext||window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.45;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.35;
      this.musicGain.connect(this.master);
      // 预生成噪声缓冲
      const len = this.ctx.sampleRate * 0.5;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i=0;i<len;i++) d[i] = Math.random()*2-1;
    } catch(e){ this.enabled = false; }
  },
  resume(){ if (this.ctx && this.ctx.state==='suspended') this.ctx.resume(); },
  setEnabled(v){ this.enabled=v; if(this.master) this.master.gain.value = v?0.45:0; },

  /* 基础音:频率、时长、波形、音量、滑音 */
  tone(freq, dur, type, vol, slideTo, delay){
    if (!this.ctx || !this.enabled) return;
    const t0 = this.ctx.currentTime + (delay||0);
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type||'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20,slideTo), t0+dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol||0.2, t0+0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0+dur);
    o.connect(g); g.connect(this.master);
    o.start(t0); o.stop(t0+dur+0.02);
  },
  noise(dur, vol, filterFreq, delay){
    if (!this.ctx || !this.enabled || !this.noiseBuf) return;
    const t0 = this.ctx.currentTime + (delay||0);
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type='lowpass'; f.frequency.value = filterFreq||2000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol||0.2, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0+dur);
    s.connect(f); f.connect(g); g.connect(this.master);
    s.start(t0); s.stop(t0+dur+0.02);
  },

  /* ---- 具体音效 ---- */
  click(){ this.tone(760, 0.06, 'square', 0.15, 520); },
  hover(){ this.tone(520, 0.04, 'sine', 0.06); },
  shoot(kind){
    if (kind==='slinger'){ this.noise(0.12,0.3,1200); this.tone(300,0.12,'triangle',0.2,90); }
    else if (kind==='gyro'){ this.noise(0.25,0.35,900); this.tone(180,0.3,'sawtooth',0.22,50); }
    else { this.noise(0.08,0.22,2600); this.tone(620,0.09,'square',0.14,240); }
  },
  hit(){ this.tone(220,0.1,'triangle',0.22,110); this.noise(0.06,0.15,900); },
  hurt(){ this.tone(160,0.18,'sawtooth',0.25,70); },
  reload(){ this.tone(500,0.05,'square',0.14); this.tone(700,0.05,'square',0.14,null,0.16); this.tone(900,0.06,'square',0.16,null,0.34); },
  jump(){ this.tone(340,0.12,'sine',0.14,620); },
  step(){ this.noise(0.04,0.05,500); },
  death(){ this.tone(420,0.5,'sawtooth',0.25,60); this.noise(0.4,0.2,600); },
  respawn(){ this.tone(440,0.1,'sine',0.18); this.tone(660,0.1,'sine',0.18,null,0.1); this.tone(880,0.16,'sine',0.2,null,0.2); },
  buy(){ this.tone(880,0.08,'square',0.16); this.tone(1320,0.14,'square',0.16,null,0.08); },
  deny(){ this.tone(200,0.18,'square',0.18,120); },
  gear(){ this.tone(1046,0.07,'sine',0.12); this.tone(1568,0.1,'sine',0.1,null,0.05); },
  bossAlarm(){
    for (let i=0;i<4;i++){
      this.tone(520,0.28,'sawtooth',0.22,760, i*0.34);
      this.tone(760,0.28,'sawtooth',0.22,520, i*0.34+0.17);
    }
  },
  bossRoar(){ this.tone(90,0.9,'sawtooth',0.3,45); this.noise(0.8,0.25,400); },
  bossHit(){ this.tone(140,0.12,'square',0.2,80); this.noise(0.1,0.18,700); },
  stomp(){ this.tone(70,0.3,'sine',0.35,35); this.noise(0.25,0.3,300); },
  spit(){ this.tone(400,0.2,'sawtooth',0.18,120); },
  explosion(){ this.noise(0.6,0.4,500); this.tone(80,0.5,'sine',0.3,30); },

  /* ---- 八音盒旋律（钢片琴质感）---- */
  musicBoxNote(freq, delay, vol){
    if (!this.ctx || !this.enabled) return;
    const t0 = this.ctx.currentTime + (delay||0);
    // 基音 + 泛音，快速衰减 = 钢片琴
    [[1,1],[2,0.4],[3.01,0.18],[4.2,0.08]].forEach(([mult,amp])=>{
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type='sine'; o.frequency.value = freq*mult;
      const v = (vol||0.18)*amp;
      g.gain.setValueAtTime(0.0001,t0);
      g.gain.exponentialRampToValueAtTime(v,t0+0.006);
      g.gain.exponentialRampToValueAtTime(0.0001,t0+0.9);
      o.connect(g); g.connect(this.musicGain);
      o.start(t0); o.stop(t0+1.0);
    });
  },
  /* 欢快五声音阶循环 */
  startMusic(){
    if (!this.ctx || this.musicTimer) return;
    const N = {C5:523.25,D5:587.33,E5:659.25,G5:783.99,A5:880,C6:1046.5,D6:1174.66,E6:1318.5};
    const melody = [
      [N.C5,0],[N.E5,.22],[N.G5,.44],[N.C6,.66],
      [N.A5,.9],[N.G5,1.12],[N.E5,1.34],
      [N.D5,1.6],[N.E5,1.82],[N.G5,2.04],[N.A5,2.26],
      [N.C5,2.6],[N.D5,2.82],[N.E5,3.04],
      [N.G5,3.3],[N.E5,3.52],[N.D5,3.74],[N.C5,3.96]
    ];
    const bass = [N.C5/2, N.G5/2, N.A5/2, N.G5/2];
    let loop = 0;
    const playLoop = ()=>{
      melody.forEach(([f,t])=> this.musicBoxNote(f, t+loop*0.0, 0.16));
      bass.forEach((f,i)=> this.musicBoxNote(f, i*1.1+loop*0.0, 0.12));
      loop += 4.3;
    };
    playLoop();
    this.musicTimer = setInterval(playLoop, 4300);
  },
  stopMusic(){
    if (this.musicTimer){ clearInterval(this.musicTimer); this.musicTimer=null; }
  }
};
