/* ============================================================
   app.js — 路由 / 入口页 / 大厅 / 商店 UI / 聊天 / 排行榜
   ============================================================ */

(function(){
  'use strict';
  if (typeof THREE === 'undefined'){
    document.body.innerHTML = '<div style="padding:40px;font-family:sans-serif">Three.js failed to load. Please check your network and refresh.</div>';
    return;
  }

  /* ---------- Global UI interface (called by game.js) ---------- */
  const UI = {
    game: null,
    sysMsg(text){
      const log = document.getElementById('chat-log');
      if (!log) return;
      const d = document.createElement('div');
      d.className = 'chat-msg sys';
      d.textContent = '📢 ' + text;
      log.appendChild(d);
      log.scrollTop = log.scrollHeight;
      while (log.children.length>40) log.removeChild(log.firstChild);
    },
    addChat(name, text, color){
      const log = document.getElementById('chat-log');
      if (!log) return;
      const d = document.createElement('div');
      d.className = 'chat-msg';
      const c = color ? '#'+color.toString(16).padStart(6,'0') : '#43302B';
      d.innerHTML = `<span class="cn" style="color:${c}">${escapeHtml(name)}</span>: ${escapeHtml(text)}`;
      log.appendChild(d);
      log.scrollTop = log.scrollHeight;
      while (log.children.length>40) log.removeChild(log.firstChild);
    },
    killFeed(killer, victim, weaponIcon){
      const kf = document.getElementById('killfeed');
      if (!kf) return;
      const d = document.createElement('div');
      d.className = 'kf-toast';
      d.innerHTML = `<span>${escapeHtml(killer)}</span><span class="wep">${weaponIcon||'🔫'}</span><span class="vic">${escapeHtml(victim)}</span>`;
      kf.appendChild(d);
      setTimeout(()=>{ d.classList.add('out'); setTimeout(()=>d.remove(), 300); }, 2600);
      while (kf.children.length>4) kf.removeChild(kf.firstChild);
    },
    showDeath(killerName, weaponIcon){
      const ov = document.getElementById('death-overlay');
      const by = document.getElementById('death-by');
      if (by) by.textContent = `Defeated by ${killerName} ${weaponIcon||'🔫'}`;
      if (ov) ov.classList.remove('hidden');
    },
    hideDeath(){
      const ov = document.getElementById('death-overlay');
      if (ov) ov.classList.add('hidden');
    },
    bossWarning(){
      // Banner is controlled by game.js
    },
    updateGearChip(){
      if (!UI.game) return;
      const g = document.getElementById('chip-gears');
      if (g) g.querySelector('span').textContent = UI.game.player.gears;
    },
    updateShopGears(){
      if (!UI.game) return;
      const g = document.getElementById('shop-gear-count');
      if (g) g.textContent = UI.game.player.gears;
    },
    updateLeaderboard(){
      if (!UI.game) return;
      const body = document.getElementById('lb-body');
      if (!body) return;
      const g = UI.game;
      const rows = [{name:g.playerName, kills:g.player.kills, deaths:g.player.deaths, color:0x5E8C4A, me:true}];
      g.bots.forEach(b=>rows.push({name:b.name, kills:b.kills, deaths:b.deaths, color:b.color, me:false}));
      rows.sort((a,b)=>b.kills-a.kills || a.deaths-b.deaths);
      body.innerHTML = rows.map((r,i)=>`
        <div class="lb-row${r.me?' me':''}">
          <span class="rank">${i+1}</span>
          <span class="dot" style="background:#${r.color.toString(16).padStart(6,'0')}"></span>
          <span class="nm">${escapeHtml(r.name)}${r.me?' (You)':''}</span>
          <span class="kd">${r.kills}/${r.deaths}</span>
        </div>`).join('');
    },
    openShop(){
      const modal = document.getElementById('shop-modal');
      if (!modal) return;
      UI.updateShopGears();
      UI._renderShopItems();
      modal.classList.remove('hidden');
    },
    closeShop(){
      const modal = document.getElementById('shop-modal');
      if (modal) modal.classList.add('hidden');
    },
    _renderShopItems(){
      if (!UI.game) return;
      const wrap = document.getElementById('shop-items');
      if (!wrap) return;
      const items = UI.game._shopItems();
      const gears = UI.game.player.gears;
      wrap.innerHTML = items.map((it,i)=>`
        <div class="shop-item${gears<it.price?' cant':''}" style="animation-delay:${i*0.05}s">
          <div class="si-icon">${it.icon}</div>
          <div class="si-name">${it.name}</div>
          <div class="si-desc">${it.desc}</div>
          <div class="si-price">⚙️ ${it.price}</div>
          <button class="si-buy" data-id="${it.id}" ${gears<it.price?'disabled':''}>${gears<it.price?'Not enough gears':'Buy'}</button>
        </div>`).join('');
      wrap.querySelectorAll('.si-buy').forEach(btn=>{
        btn.addEventListener('click', ()=>UI.game.buyItem(btn.dataset.id));
      });
    },
  };
  window.UI = UI;

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  /* ---------- 路由 ---------- */
  function route(){
    const hash = location.hash || '#/';
    const gameScreen = document.getElementById('screen-game');
    // 停止旧游戏
    if (UI.game && !hash.startsWith('#/game')){
      UI.game.dispose();
      UI.game = null;
    }
    document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
    if (hash.startsWith('#/game')){
      gameScreen.classList.add('active');
      startGame();
    } else if (hash.startsWith('#/lobby')){
      document.getElementById('screen-lobby').classList.add('active');
      enterLobby();
    } else {
      stopPreview();
      document.getElementById('screen-entry').classList.add('active');
      startBgBlocks();
    }
  }
  window.addEventListener('hashchange', route);

  /* ---------- 房间工具 ---------- */
  function genRoomCode(){
    const chars='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let s='';
    for (let i=0;i<5;i++) s+=chars[Math.floor(Math.random()*chars.length)];
    return s;
  }
  function currentRoom(){
    const m = location.hash.match(/#\/(?:lobby|game)\/([A-Z0-9]+)/i);
    return m ? m[1].toUpperCase() : null;
  }

  /* ---------- 入口页漂浮积木背景 ---------- */
  let bgRAF = null;
  function startBgBlocks(){
    const cv = document.getElementById('bg-blocks');
    if (!cv || bgRAF) return;
    const x = cv.getContext('2d');
    let W,H;
    function resize(){ W=cv.width=window.innerWidth; H=cv.height=window.innerHeight; }
    resize();
    window.addEventListener('resize', resize);
    const colors=['#FF6B5B','#FFC93C','#5BB8E8','#6FD9A7','#A78BFA','#FF9F45'];
    const blocks=[];
    for (let i=0;i<22;i++){
      blocks.push({
        x:Math.random()*window.innerWidth, y:Math.random()*window.innerHeight,
        s:24+Math.random()*46, c:colors[i%6],
        vy:-(0.15+Math.random()*0.35), rot:Math.random()*Math.PI, vr:(Math.random()-0.5)*0.008,
        depth:0.4+Math.random()*0.6,
      });
    }
    function drawCube(b){
      const s=b.s, h=s/2;
      x.save();
      x.translate(b.x,b.y); x.rotate(b.rot);
      x.globalAlpha = 0.25+b.depth*0.45;
      // 顶面
      x.fillStyle = lighten(b.c, 1.25);
      x.beginPath(); x.moveTo(0,-h); x.lineTo(h,0); x.lineTo(0,h); x.lineTo(-h,0); x.closePath(); x.fill();
      // 左面
      x.fillStyle = lighten(b.c, 0.8);
      x.beginPath(); x.moveTo(-h,0); x.lineTo(0,h); x.lineTo(0,h+s*0.55); x.lineTo(-h,s*0.55); x.closePath(); x.fill();
      // 右面
      x.fillStyle = b.c;
      x.beginPath(); x.moveTo(h,0); x.lineTo(0,h); x.lineTo(0,h+s*0.55); x.lineTo(h,s*0.55); x.closePath(); x.fill();
      x.strokeStyle='rgba(67,48,43,.5)'; x.lineWidth=2;
      x.beginPath(); x.moveTo(0,-h); x.lineTo(h,0); x.lineTo(h,s*0.55); x.lineTo(0,h+s*0.55); x.lineTo(-h,s*0.55); x.lineTo(-h,0); x.closePath(); x.stroke();
      x.restore();
    }
    function lighten(hex,f){
      const n=parseInt(hex.slice(1),16);
      let r=(n>>16)&255,g=(n>>8)&255,b=n&255;
      r=Math.min(255,r*f); g=Math.min(255,g*f); b=Math.min(255,b*f);
      return `rgb(${r|0},${g|0},${b|0})`;
    }
    let t=0;
    function loop(){
      bgRAF = requestAnimationFrame(loop);
      t++;
      x.clearRect(0,0,W,H);
      blocks.forEach(b=>{
        b.y += b.vy; b.rot += b.vr;
        if (b.y < -b.s*2){ b.y=H+b.s; b.x=Math.random()*W; }
        drawCube(b);
      });
    }
    loop();
  }
  function stopBgBlocks(){
    if (bgRAF){ cancelAnimationFrame(bgRAF); bgRAF=null; }
  }

  /* ---------- 大厅 3D 预览 ---------- */
  let preview = null;
  function enterLobby(){
    stopBgBlocks();
    const code = currentRoom() || genRoomCode();
    document.getElementById('lobby-room-code').textContent = code;
    // 玩家列表
    renderPlayerList(code);
    // 启动 3D 预览
    setTimeout(startPreview, 60);
    // 模拟其他玩家陆续加入
    scheduleBotJoins();
  }
  function renderPlayerList(code){
    const list = document.getElementById('player-list');
    const count = document.getElementById('player-count');
    const saved = lobbyPlayers[code];
    const players = saved || [{name:playerName, host:true, color:0x5E8C4A}];
    list.innerHTML = '';
    players.forEach(p=>{
      const row = document.createElement('div');
      row.className='player-row';
      row.innerHTML = `
        <div class="avatar" style="background:#${p.color.toString(16).padStart(6,'0')}">🪖</div>
        <div class="pname">${escapeHtml(p.name)}</div>
        ${p.host?'<div class="host-badge">👑 Host</div>':''}`;
      list.appendChild(row);
    });
    // 空位
    for (let i=players.length;i<8;i++){
      const row = document.createElement('div');
      row.className='player-row empty';
      row.innerHTML = `<div class="empty-slot"></div><div class="pname" style="color:var(--ink-soft)">Waiting to join…</div>`;
      list.appendChild(row);
    }
    count.textContent = `${players.length}/8`;
  }
  const lobbyPlayers = {};
  let joinTimers = [];
  function scheduleBotJoins(){
    joinTimers.forEach(clearTimeout); joinTimers=[];
    const code = currentRoom();
    if (!code) return;
    if (!lobbyPlayers[code]) lobbyPlayers[code] = [{name:playerName, host:true, color:0x5E8C4A}];
    const pool = BOT_NAMES.filter(n=>n!==playerName);
    let delay = 1200;
    const n = 2+Math.floor(Math.random()*4);
    for (let i=0;i<n;i++){
      joinTimers.push(setTimeout(()=>{
        const arr = lobbyPlayers[code];
        if (arr.length>=8) return;
        const name = pool[Math.floor(Math.random()*pool.length)];
        if (arr.find(p=>p.name===name)) return;
        arr.push({name, host:false, color:BOT_COLORS[i%BOT_COLORS.length]});
        renderPlayerList(code);
        AudioSys.click();
      }, delay));
      delay += 1200+Math.random()*1800;
    }
  }

  function startPreview(){
    const cv = document.getElementById('preview-canvas');
    if (!cv) return;
    if (preview){ preview.renderer.dispose(); preview=null; }
    const renderer = new THREE.WebGLRenderer({canvas:cv, antialias:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xDFF1FF);
    scene.fog = new THREE.Fog(0xDFF1FF, 8, 22);
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0,1.6,4.2);
    camera.lookAt(0,1,0);
    // 灯光
    scene.add(new THREE.HemisphereLight(0xCFE8FF, 0xFFE0B8, 0.8));
    const key = new THREE.DirectionalLight(0xFFF2D0, 1.1);
    key.position.set(3,6,4); key.castShadow=true;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x9FD4FF, 0.5);
    rim.position.set(-4,3,-3); scene.add(rim);
    // 底座
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.8,0.3,32),
      new THREE.MeshStandardMaterial({color:0xFFC93C, roughness:0.5}));
    base.position.y=-0.15; base.receiveShadow=true; scene.add(base);
    const baseRing = new THREE.Mesh(new THREE.TorusGeometry(1.65,0.08,8,32),
      new THREE.MeshStandardMaterial({color:0xFF6B5B, roughness:0.4, metalness:0.2}));
    baseRing.rotation.x=Math.PI/2; baseRing.position.y=0.02; scene.add(baseRing);
    // 士兵
    const soldier = Models.buildSoldier({uniform:0x5E8C4A, helmet:0x5E8C4A, knob:0xFFC93C});
    soldier.scale.set(1.15,1.15,1.15);
    soldier.position.y=0;
    scene.add(soldier);
    // 周围小积木
    for (let i=0;i<7;i++){
      const s=0.18+Math.random()*0.2;
      const b = new THREE.Mesh(new THREE.BoxGeometry(s,s,s),
        new THREE.MeshStandardMaterial({color:BOT_COLORS[i%BOT_COLORS.length], roughness:0.5}));
      const a=i/7*Math.PI*2;
      b.position.set(Math.cos(a)*2.4, s/2, Math.sin(a)*2.4);
      b.rotation.y=Math.random(); b.castShadow=true;
      scene.add(b);
    }
    // 拖拽旋转
    let dragging=false, lastX=0, rotY=0, velY=0, dist=4.2;
    cv.addEventListener('pointerdown', e=>{dragging=true; lastX=e.clientX; cv.setPointerCapture(e.pointerId);});
    cv.addEventListener('pointermove', e=>{
      if (!dragging) return;
      const dx=e.clientX-lastX; lastX=e.clientX;
      rotY += dx*0.01; velY = dx*0.01;
    });
    cv.addEventListener('pointerup', ()=>{dragging=false;});
    cv.addEventListener('wheel', e=>{
      e.preventDefault();
      dist = Math.max(2.8, Math.min(7, dist + e.deltaY*0.003));
    }, {passive:false});

    function resize(){
      const w=cv.clientWidth, h=cv.clientHeight;
      if (!w||!h) return;
      renderer.setSize(w,h,false);
      camera.aspect=w/h; camera.updateProjectionMatrix();
    }
    resize();
    const ro = new ResizeObserver(resize); ro.observe(cv);

    let t=0;
    preview = {renderer, stop:false};
    function loop(){
      requestAnimationFrame(loop);
      if (!preview || preview.stop) return;
      t+=0.016;
      if (!dragging){ velY*=0.92; rotY += velY + 0.003; }
      soldier.rotation.y = rotY;
      soldier.position.y = Math.sin(t*1.5)*0.04;
      // 手部微动
      soldier.userData.gunG.rotation.x = Math.sin(t*1.2)*0.06;
      camera.position.x = Math.sin(t*0.2)*0.3;
      camera.lookAt(0,1,0);
      camera.position.z = dist;
      renderer.render(scene,camera);
    }
    loop();
    preview._ro = ro;
    preview._stopFn = ()=>{ if(preview) preview.stop=true; ro.disconnect(); };
  }
  function stopPreview(){
    if (preview){ preview._stopFn && preview._stopFn(); preview=null; }
  }

  /* ---------- 启动游戏 ---------- */
  function startGame(){
    const code = currentRoom();
    if (!code){ location.hash = '#/'; return; }
    stopPreview();
    const canvas = document.getElementById('game-canvas');
    // 确保武器栏等初始化
    UI.game = new GameEngine(canvas, {playerName, roomId:code});
    UI.game._updateWeaponBar();
    UI.updateGearChip();
    UI.updateLeaderboard();
    // 重置 HUD
    document.getElementById('chat-log').innerHTML='';
    document.getElementById('killfeed').innerHTML='';
    document.getElementById('boss-hp-wrap').classList.add('hidden');
    document.getElementById('death-overlay').classList.add('hidden');
    document.getElementById('shop-modal').classList.add('hidden');
    document.getElementById('hp-shield').style.width='0';
    document.getElementById('reload-bar').classList.add('hidden');
    // 提示（指针锁定由 game.js 的画布点击处理）
    const sp = document.getElementById('start-prompt');
    sp.classList.remove('hidden');
  }

  /* ---------- 玩家名 ---------- */
  let playerName = 'LittleToySoldier' + Math.floor(Math.random()*900+100);

  /* ---------- 入口页事件 ---------- */
  function setupEntry(){
    const btnCreate = document.getElementById('btn-create');
    const btnJoin = document.getElementById('btn-join');
    const inputRoom = document.getElementById('input-room');
    const share = document.getElementById('room-share');
    const shareUrl = document.getElementById('share-url');

    function doCreate(){
      AudioSys.init(); AudioSys.click();
      const code = genRoomCode();
      const url = `${location.origin}${location.pathname}#/lobby/${code}`;
      shareUrl.value = url;
      share.classList.remove('hidden');
      location.hash = `#/lobby/${code}`;
    }
    function doJoin(){
      AudioSys.init(); AudioSys.click();
      let code = inputRoom.value.trim().toUpperCase();
      if (code.length<3){ inputRoom.focus(); inputRoom.style.borderColor='var(--danger)'; setTimeout(()=>inputRoom.style.borderColor='',800); return; }
      location.hash = `#/lobby/${code}`;
    }
    btnCreate.addEventListener('click', doCreate);
    btnJoin.addEventListener('click', doJoin);
    inputRoom.addEventListener('keydown', e=>{ if(e.key==='Enter') doJoin(); });
    document.getElementById('btn-copy').addEventListener('click', ()=>{
      shareUrl.select();
      navigator.clipboard ? navigator.clipboard.writeText(shareUrl.value).catch(()=>{})
        : document.execCommand('copy');
      AudioSys.buy();
      const btn = document.getElementById('btn-copy');
      const old = btn.textContent;
      btn.textContent='✅ Copied!';
      setTimeout(()=>btn.textContent=old, 1400);
    });
  }

  /* ---------- 大厅事件 ---------- */
  function setupLobby(){
    document.getElementById('btn-copy-code').addEventListener('click', ()=>{
      const code = currentRoom()||'';
      navigator.clipboard ? navigator.clipboard.writeText(code).catch(()=>{}) : document.execCommand('copy');
      AudioSys.buy();
    });
    document.getElementById('btn-start').addEventListener('click', ()=>{
      AudioSys.init(); AudioSys.click();
      const code = currentRoom()||genRoomCode();
      location.hash = `#/game/${code}`;
    });
    document.getElementById('btn-leave').addEventListener('click', ()=>{
      AudioSys.click();
      location.hash = '#/';
    });
  }

  /* ---------- 游戏内 HUD 事件 ---------- */
  function setupGameUI(){
    // 排行榜折叠
    document.getElementById('lb-toggle').addEventListener('click', ()=>{
      document.getElementById('leaderboard-wrap').classList.toggle('collapsed');
      AudioSys.click();
    });
    // 聊天快捷
    document.querySelectorAll('.chat-quick button').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        if (!UI.game) return;
        UI.addChat(playerName, btn.dataset.msg, 0x5E8C4A);
        // bot 回应
        setTimeout(()=>{
          const alive = UI.game.bots.filter(b=>b.alive);
          if (alive.length) UI.addChat(alive[0].name, ['Charge!','Haha','Wait for me!'][Math.floor(Math.random()*3)], alive[0].color);
        }, 700+Math.random()*800);
      });
    });
    // 聊天输入
    const chatInput = document.getElementById('chat-input');
    chatInput.addEventListener('keydown', e=>{
      e.stopPropagation();
      if (e.key==='Enter'){
        const v = chatInput.value.trim();
        if (v){ UI.addChat(playerName, v, 0x5E8C4A); }
        chatInput.value='';
      }
    });
    // 商店关闭
    document.getElementById('shop-close').addEventListener('click', ()=>{
      if (UI.game) UI.game.closeShop();
    });
    // 点击遮罩关闭
    document.getElementById('shop-modal').addEventListener('click', e=>{
      if (e.target.id==='shop-modal' && UI.game) UI.game.closeShop();
    });
  }

  /* ---------- 启动 ---------- */
  function boot(){
    AudioSys.init();
    setupEntry();
    setupLobby();
    setupGameUI();
    route();
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
