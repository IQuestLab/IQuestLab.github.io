/* ============================================================
   game.js — 玩具兵大战 核心引擎
   Three.js 场景 / 倾斜移轴后处理 / FPS 控制 / AI / BOSS / HUD
   ============================================================ */

const WEAPONS = [
  {id:'blaster', name:'Bubble Blaster', icon:'🔫', damage:13, fireRate:0.13, maxAmmo:30, reserve:120, speed:42, spread:0.025, color:0xFF6B5B, splash:0},
  {id:'slinger', name:'Sling Shot',   icon:'🪃', damage:36, fireRate:0.55, maxAmmo:8,  reserve:32,  speed:52, spread:0.012, color:0x8B5E3C, splash:0},
  {id:'gyro',    name:'Gyro Cannon', icon:'🌀', damage:58, fireRate:1.05, maxAmmo:4,  reserve:14,  speed:30, spread:0.03,  color:0x5BB8E8, splash:3.2},
];
const BOT_NAMES = ['Tin Squad Leader','Block Warrior','Spring Hopper','Wind-up Kid','Plastic Knight','Rubber-band Hunter','Gyro Captain','Tin Soldier','Spring Toy','Block Knight'];
const BOT_COLORS = [0xFF6B5B,0x5BB8E8,0xFFC93C,0xA78BFA,0xFF9F45,0x6FD9A7,0xE86A5A,0x4C8DE2];
const ROOM = {W:34, D:26, H:9};
const SPAWNS = [[-13,-9],[13,-9],[-13,9],[13,9],[0,-10],[0,10],[-14,0],[14,0]];

class GameEngine {
  constructor(canvas, opts){
    this.canvas = canvas;
    this.opts = opts||{};
    this.playerName = this.opts.playerName || 'You';
    this.disposed = false;
    this.state = 'playing'; // playing | dead | shop
    this.keys = {};
    this.yaw = 0; this.pitch = 0;
    this.shake = 0;
    this.bob = 0;
    this.fireCooldown = 0;
    this.reloadTimer = 0;
    this.weaponIdx = 0;
    this.weapons = WEAPONS.map(w=>({...w, ammo:w.maxAmmo, reserve:w.reserve}));
    this.bossTimer = 25; // First boss countdown
    this.boss = null;
    this.bossActive = false;
    this.bots = [];
    this.projectiles = [];
    this.particles = [];
    this.pickups = [];
    this.chatTimer = 4;
    this.leaderboardTimer = 0;
    this.minimapTimer = 0;
    this.hudTimer = 0;
    this.stepTimer = 0;
    this.merchantPos = new THREE.Vector3(0,0,6);
    this.gearPickTimer = 6;
    this.killStreak = 0;

    this.player = {
      pos: new THREE.Vector3(SPAWNS[0][0],0,SPAWNS[0][1]),
      vel: new THREE.Vector3(),
      hp: 150, maxHp: 150, armor: 0,
      gears: 30, batteries: 1, magnets: 0,
      magnetTimer: 0, regenTimer: 0,
      kills: 0, deaths: 0,
      dead: false, respawnTimer: 0,
      radius: 0.45, eye: 1.55,
      onGround: true,
    };

    this._init();
  }

  /* ---------- 初始化 ---------- */
  _init(){
    const canvas = this.canvas;
    this.renderer = new THREE.WebGLRenderer({canvas, antialias:true});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xDFF1FF);
    this.scene.fog = new THREE.Fog(0xDFF1FF, 28, 70);

    this.camera = new THREE.PerspectiveCamera(72, window.innerWidth/window.innerHeight, 0.1, 200);
    this.camera.rotation.order = 'YXZ';

    this._setupLights();
    this._buildRoom();
    this._setupPost();
    this._spawnEntities();
    this._bindInput();

    this.clock = new THREE.Clock();
    this._animate = this._animate.bind(this);
    this.renderer.setAnimationLoop(this._animate);
    this._onResizeBound = this._onResize.bind(this);
    window.addEventListener('resize', this._onResizeBound);

    if (typeof UI !== 'undefined'){
      UI.sysMsg('Welcome to Toy Soldier Battle! Defeat enemies to earn ⚙️ gears.');
      UI.sysMsg('Tip: approach the wind-up music box and press E to buy upgrades.');
    }
  }

  _setupLights(){
    // 半球环境光
    const hemi = new THREE.HemisphereLight(0xCFE8FF, 0xFFE0B8, 0.55);
    this.scene.add(hemi);
    // 窗外冷色主光
    const sun = new THREE.DirectionalLight(0xFFF2D0, 1.15);
    sun.position.set(6,14,-ROOM.D/2-4);
    sun.target.position.set(0,0,2);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048,2048);
    sun.shadow.camera.left=-20; sun.shadow.camera.right=20;
    sun.shadow.camera.top=20; sun.shadow.camera.bottom=-20;
    sun.shadow.camera.far=60; sun.shadow.bias=-0.0004;
    this.scene.add(sun, sun.target);
    // 台灯暖光（点光补）
    const lampLight = new THREE.PointLight(0xFFB347, 0.9, 22, 2);
    lampLight.position.set(-11,4.2,-8);
    this.scene.add(lampLight);
    // 房间暖环境
    const amb = new THREE.AmbientLight(0xFFE8C8, 0.25);
    this.scene.add(amb);
  }

  _buildRoom(){
    this.room = Models.buildRoom();
    this.scene.add(this.room);
    // 高多边形障碍 / 高台（含可攀爬楼梯）
    this.obstacles = [];
    const add = (model, x, z, hw, hd, h, rotY, y)=>{
      model.position.set(x, y||0, z);
      if (rotY) model.rotation.y = rotY;
      this.scene.add(model);
      this.obstacles.push({x, z, hw, hd, h});
    };
    // 楼梯：生成一串台阶（可攀爬）
    const addStairs = (x, z, dx, dz, steps, stepH, stepD, width)=>{
      for (let i=0;i<steps;i++){
        const sh = stepH*(i+1);
        const sx = x + dx*i*stepD, sz = z + dz*i*stepD;
        const stepMesh = new THREE.Mesh(
          new THREE.BoxGeometry(dx?stepD:width, sh, dz?stepD:width),
          new THREE.MeshStandardMaterial({color:i%2?0xC98B5E:0xB5764A, roughness:0.6})
        );
        stepMesh.position.set(sx, sh/2, sz);
        stepMesh.castShadow = stepMesh.receiveShadow = true;
        this.scene.add(stepMesh);
        this.obstacles.push({x:sx, z:sz, hw:(dx?stepD:width)/2, hd:(dz?stepD:width)/2, h:sh});
      }
    };

    /* ===== 高台与障碍布局 ===== */
    // 中央玩具城堡（多层主堡）
    add(Models.buildToyCastle(), 0, -7, 1.7, 1.7, 3.6, 0.3);
    // 西侧大书架（高掩体）
    add(Models.buildBookshelf(3.2, 3.4, 0.9), -12, -3, 1.6, 0.5, 3.4, 0.15);
    // 东侧双层床（高层平台 ~2.0）
    add(Models.buildBunkBed(3.0, 4.0, 3.2), 12, 1, 1.5, 2.0, 2.0, -0.4);
    // 双层床边楼梯（爬升到 2.0）
    addStairs(9.5, 3.5, 1, 0, 5, 0.4, 0.5, 1.4);
    // 置物架（南侧）
    add(Models.buildShelf(2.6, 1.9, 0.8), -8, 7, 1.3, 0.45, 1.9, 0.2);
    // 滑梯（东南高台 3.2）
    add(Models.buildSlide(), 14, 4, 0.9, 0.9, 3.2, 0.5);
    // 滑梯边楼梯（+x 通向平台）
    addStairs(10.5, 4, 1, 0, 7, 0.46, 0.5, 1.2);
    // 木箱堆（多处）
    add(Models.buildCrate(1.4), -5, 2, 0.7, 0.7, 1.4, 0.2);
    add(Models.buildCrate(1.0), -5, 2, 0.5, 0.5, 2.4, 0.5, 1.4); // 叠箱
    add(Models.buildCrate(1.2), 5, -2, 0.6, 0.6, 1.2, -0.3);
    add(Models.buildCrate(0.9), 5.7, -1.5, 0.45, 0.45, 2.1, 0.4, 1.2); // 叠箱
    // 木桶
    add(Models.buildBarrel(0.5, 1.2), -2, -2, 0.5, 0.5, 1.2, 0);
    add(Models.buildBarrel(0.45, 1.1), -1.2, -2.4, 0.45, 0.45, 1.1, 0);
    add(Models.buildBarrel(0.5, 1.2), 3, 6, 0.5, 0.5, 1.2, 0);
    // 积木塔
    add(Models.buildBlockTower(), 0, 3, 0.55, 0.55, 2.6, 0);
    // 矮书堆（低掩体）
    add(Models.buildBook(2.2, 0.7, 1.2, 0xE2574C), -7, -6, 1.1, 0.6, 0.7, 0.1);
    add(Models.buildBook(1.8, 0.6, 1.1, 0x4C8DE2), 7, 5, 0.9, 0.55, 0.6, -0.2);
    add(Models.buildBook(2.0, 0.8, 1.2, 0x6FD9A7), -3, 11, 1.0, 0.6, 0.8, 0.15);
    // 额外木箱散布
    add(Models.buildCrate(0.8), 14, -6, 0.4, 0.4, 0.8, 0.3);
    add(Models.buildCrate(0.8), -14, 5, 0.4, 0.4, 0.8, -0.2);
    add(Models.buildBarrel(0.4, 1.0), 6, -9, 0.4, 0.4, 1.0, 0);
  }

  /* ---------- 倾斜移轴后处理 ---------- */
  _setupPost(){
    const w = window.innerWidth, h = window.innerHeight;
    this.rt = new THREE.WebGLRenderTarget(w, h, {minFilter:THREE.LinearFilter, magFilter:THREE.LinearFilter});
    this.postScene = new THREE.Scene();
    this.postCam = new THREE.OrthographicCamera(-1,1,1,-1,0,1);
    this.postMat = new THREE.ShaderMaterial({
      uniforms:{ tDiffuse:{value:this.rt.texture}, res:{value:new THREE.Vector2(w,h)} },
      vertexShader:`varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }`,
      fragmentShader:`
        uniform sampler2D tDiffuse; uniform vec2 res; varying vec2 vUv;
        void main(){
          float band = 0.30;
          float d = abs(vUv.y - 0.48);
          float blur = smoothstep(band, band+0.26, d);
          vec3 col = vec3(0.0);
          vec2 t = (blur * 14.0) / res;
          col += texture2D(tDiffuse, vUv).rgb * 0.22;
          col += texture2D(tDiffuse, vUv+vec2(t.x,0.0)).rgb * 0.12;
          col += texture2D(tDiffuse, vUv-vec2(t.x,0.0)).rgb * 0.12;
          col += texture2D(tDiffuse, vUv+vec2(0.0,t.y)).rgb * 0.12;
          col += texture2D(tDiffuse, vUv-vec2(0.0,t.y)).rgb * 0.12;
          col += texture2D(tDiffuse, vUv+vec2(t.x,t.y)*0.7).rgb * 0.06;
          col += texture2D(tDiffuse, vUv-vec2(t.x,t.y)*0.7).rgb * 0.06;
          col += texture2D(tDiffuse, vUv+vec2(t.x,-t.y)*0.7).rgb * 0.06;
          col += texture2D(tDiffuse, vUv-vec2(t.x,-t.y)*0.7).rgb * 0.06;
          // 饱和度提升（玩具照片感）
          float l = dot(col, vec3(0.299,0.587,0.114));
          col = mix(vec3(l), col, 1.16);
          // 暖色调
          col.r *= 1.02; col.b *= 0.99;
          // 暗角
          float v = smoothstep(0.92, 0.30, distance(vUv, vec2(0.5)));
          col *= mix(0.78, 1.0, v);
          gl_FragColor = vec4(col, 1.0);
        }`
    });
    this.postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2), this.postMat));
  }

  /* ---------- 实体生成 ---------- */
  _spawnEntities(){
    // 玩家武器视图模型
    this.viewWeapon = Models.buildWeaponModel('blaster');
    this.viewWeapon.position.set(0.34,-0.3,-0.55);
    this.viewWeapon.rotation.y = Math.PI;
    this.viewWeapon.scale.set(1.3,1.3,1.3);
    this.camera.add(this.viewWeapon);
    this.scene.add(this.camera);
    this.muzzleFlash = new THREE.PointLight(0xFFD98A, 0, 6, 2);
    this.muzzleFlash.position.set(0.34,-0.2,-0.9);
    this.camera.add(this.muzzleFlash);

    // AI bots
    const count = 4;
    for (let i=0;i<count;i++){
      this._spawnBot(i);
    }
    // 八音盒商人
    this.merchant = Models.buildMusicBox();
    this.merchant.position.copy(this.merchantPos);
    this.scene.add(this.merchant);
    // 商人光圈
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.4,1.7,32),
      new THREE.MeshBasicMaterial({color:0xFFC93C, transparent:true, opacity:0.5, side:THREE.DoubleSide}));
    ring.rotation.x=-Math.PI/2; ring.position.set(this.merchantPos.x,0.05,this.merchantPos.z);
    this.scene.add(ring);
    this.merchantRing = ring;

    // 纸飞机（观战用）
    this.paperPlane = Models.buildPaperPlane();
    this.paperPlane.visible = false;
    this.scene.add(this.paperPlane);
    this.spectatorAngle = 0;

    // 初始齿轮拾取
    for (let i=0;i<4;i++) this._spawnGearPickup();
  }

  _spawnBot(i){
    const name = BOT_NAMES[i%BOT_NAMES.length];
    const color = BOT_COLORS[i%BOT_COLORS.length];
    const mesh = Models.buildSoldier({uniform:color, helmet:color, knob:0xFFC93C});
    const sp = SPAWNS[(i+1)%SPAWNS.length];
    mesh.position.set(sp[0],0,sp[1]);
    this.scene.add(mesh);
    const weapon = {...WEAPONS[Math.floor(Math.random()*WEAPONS.length)]};
    weapon.damage = Math.max(6, Math.round(weapon.damage*0.5)); // bot 伤害减半
    this.bots.push({
      id:'bot'+i, name, mesh, color,
      pos: mesh.position, vel:new THREE.Vector3(),
      hp:70, maxHp:70, radius:0.45,
      yaw: Math.random()*Math.PI*2,
      weapon, ammo:weapon.maxAmmo, reserve:weapon.reserve,
      fireCooldown: Math.random(), reloadTimer:0, think: Math.random()*0.5,
      target:null, waypoint:new THREE.Vector3(sp[0],0,sp[1]),
      kills:0, deaths:0, alive:true, respawnTimer:0,
      walkPhase: Math.random()*10,
    });
  }

  _spawnGearPickup(pos){
    const p = pos || new THREE.Vector3((Math.random()-0.5)*26, 0.5, (Math.random()-0.5)*18);
    const mesh = Models.buildGearPickup();
    mesh.position.copy(p);
    this.scene.add(mesh);
    this.pickups.push({mesh, pos:mesh.position, value:5, spin:Math.random()*5});
  }

  /* ---------- 输入 ---------- */
  _bindInput(){
    const canvas = this.canvas;
    this._onKeyDown = (e)=>{
      if (document.activeElement === document.getElementById('chat-input')) return;
      this.keys[e.code] = true;
      if (this.state==='shop') return;
      if (e.code==='KeyR') this._startReload();
      if (e.code==='Digit1') this._switchWeapon(0);
      if (e.code==='Digit2') this._switchWeapon(1);
      if (e.code==='Digit3') this._switchWeapon(2);
      if (e.code==='KeyE') this._tryInteract();
      if (e.code==='Space') e.preventDefault();
    };
    this._onKeyUp = (e)=>{ this.keys[e.code]=false; };
    this._onMouseMove = (e)=>{
      if (document.pointerLockElement !== canvas) return;
      const sens = 0.0022;
      this.yaw -= e.movementX * sens;
      this.pitch -= e.movementY * sens;
      this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch));
    };
    this._onMouseDown = (e)=>{
      if (document.pointerLockElement !== canvas) return;
      if (e.button===0) this._shoot();
    };
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);
    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('mousedown', this._onMouseDown);
    this._onCanvasClick = ()=>{
      if (this.state==='shop') return;
      if (document.pointerLockElement !== canvas){
        canvas.requestPointerLock();
        const sp = document.getElementById('start-prompt');
        if (sp) sp.classList.add('hidden');
      }
    };
    this._onPointerLockChange = ()=>{
      const sp = document.getElementById('start-prompt');
      if (sp && this.state!=='shop'){
        if (document.pointerLockElement === canvas) sp.classList.add('hidden');
        else if (!this.player.dead) sp.classList.remove('hidden');
      }
    };
    canvas.addEventListener('click', this._onCanvasClick);
    document.addEventListener('pointerlockchange', this._onPointerLockChange);
  }

  /* ---------- 武器 ---------- */
  _switchWeapon(i){
    if (i===this.weaponIdx || i>=this.weapons.length) return;
    this.weaponIdx = i;
    this.reloadTimer = 0;
    AudioSys.click();
    // 换视图模型
    const w = this.weapons[i];
    this.camera.remove(this.viewWeapon);
    this.viewWeapon = Models.buildWeaponModel(w.id);
    this.viewWeapon.position.set(0.34,-0.3,-0.55);
    this.viewWeapon.rotation.y = Math.PI;
    this.viewWeapon.scale.set(1.3,1.3,1.3);
    this.camera.add(this.viewWeapon);
    this.muzzleFlash.position.set(0.34,-0.2,-0.9);
    this._updateWeaponBar();
  }
  _startReload(){
    const w = this.weapons[this.weaponIdx];
    if (this.reloadTimer>0 || w.ammo>=w.maxAmmo || w.reserve<=0) return;
    this.reloadTimer = 1.4;
    AudioSys.reload();
    const rb = document.getElementById('reload-bar');
    if (rb) rb.classList.remove('hidden');
  }
  _finishReload(){
    const w = this.weapons[this.weaponIdx];
    const need = w.maxAmmo - w.ammo;
    const take = Math.min(need, w.reserve);
    w.ammo += take; w.reserve -= take;
    const rb = document.getElementById('reload-bar');
    if (rb) rb.classList.add('hidden');
    this._updateWeaponBar();
  }

  _shoot(){
    if (this.player.dead || this.state==='shop') return;
    const w = this.weapons[this.weaponIdx];
    if (this.reloadTimer>0 || this.fireCooldown>0) return;
    if (w.ammo<=0){ this._startReload(); return; }
    w.ammo--;
    this.fireCooldown = w.fireRate;
    AudioSys.shoot(w.id);
    // 后坐
    this.pitch += 0.018 + Math.random()*0.01;
    this.shake = Math.max(this.shake, 0.06);
    // 枪口闪光
    this.muzzleFlash.intensity = 2.2;
    // 视图模型后座
    this.viewWeapon.position.z = -0.42;
    // 生成弹丸
    const dir = new THREE.Vector3(0,0,-1).applyQuaternion(this.camera.quaternion);
    dir.x += (Math.random()-0.5)*w.spread;
    dir.y += (Math.random()-0.5)*w.spread;
    dir.z += (Math.random()-0.5)*w.spread;
    dir.normalize();
    const origin = this.camera.position.clone().add(dir.clone().multiplyScalar(0.6));
    origin.y -= 0.12;
    this._spawnProjectile(origin, dir, w, 'player', this.playerName);
    this._updateWeaponBar();
  }

  _spawnProjectile(origin, dir, weapon, owner, ownerName){
    let mesh;
    if (weapon.id==='gyro'){
      mesh = new THREE.Mesh(new THREE.TorusGeometry(0.16,0.07,8,14),
        new THREE.MeshBasicMaterial({color:weapon.color}));
    } else if (weapon.id==='slinger'){
      mesh = new THREE.Mesh(new THREE.SphereGeometry(0.1,8,8),
        new THREE.MeshBasicMaterial({color:0x8B5E3C}));
    } else {
      mesh = new THREE.Mesh(new THREE.SphereGeometry(0.13,10,10),
        new THREE.MeshBasicMaterial({color:0xBFEAFF}));
    }
    mesh.position.copy(origin);
    this.scene.add(mesh);
    this.projectiles.push({
      mesh, pos:mesh.position, vel:dir.clone().multiplyScalar(weapon.speed),
      damage:weapon.damage, splash:weapon.splash||0, owner, ownerName,
      life:2.2, spin:0,
    });
  }

  /* ---------- 玩家伤害 / 死亡 ---------- */
  damagePlayer(amount, fromName, weaponIcon){
    if (this.player.dead) return;
    // 护甲吸收
    if (this.player.armor>0){
      const abs = Math.min(this.player.armor, amount*0.15);
      this.player.armor -= abs; amount -= abs;
    }
    this.player.hp -= amount*0.3;
    this.shake = Math.max(this.shake, 0.14);
    AudioSys.hurt();
    // 红晕
    const v = document.getElementById('damage-vignette');
    if (v){ v.style.opacity='1'; setTimeout(()=>{v.style.opacity='0';},160); }
    // 血条闪
    const hf = document.getElementById('hp-fill');
    if (hf){ hf.classList.remove('hurt'); void hf.offsetWidth; hf.classList.add('hurt'); }
    if (this.player.hp<=0){ this._killPlayer(fromName, weaponIcon); }
  }
  _killPlayer(killerName, weaponIcon){
    this.player.dead = true;
    this.player.deaths++;
    this.player.respawnTimer = 8;
    this.killStreak = 0;
    AudioSys.death();
    // 掉落齿轮
    this._spawnGearPickup(new THREE.Vector3(this.player.pos.x,0.5,this.player.pos.z));
    // 观战：纸飞机
    this.paperPlane.visible = true;
    this.paperPlane.position.set(this.player.pos.x, 3, this.player.pos.z);
    this.spectatorAngle = Math.random()*Math.PI*2;
    if (this.viewWeapon) this.viewWeapon.visible = false;
    if (this.muzzleFlash) this.muzzleFlash.intensity = 0;
    if (typeof UI !== 'undefined') UI.showDeath(killerName, weaponIcon);
    document.exitPointerLock && document.exitPointerLock();
  }
  respawn(){
    const sp = SPAWNS[Math.floor(Math.random()*SPAWNS.length)];
    this.player.pos.set(sp[0],0,sp[1]);
    this.player.vel.set(0,0,0);
    this.player.hp = this.player.maxHp;
    this.player.armor = 0;
    this.player.dead = false;
    this.weapons.forEach(w=>{ w.ammo=w.maxAmmo; });
    this.paperPlane.visible = false;
    if (this.viewWeapon) this.viewWeapon.visible = true;
    AudioSys.respawn();
    if (typeof UI !== 'undefined') UI.hideDeath();
    this._updateWeaponBar();
  }

  /* ---------- BOSS ---------- */
  _spawnBoss(){
    this.bossActive = true;
    const mesh = Models.buildGodzilla();
    mesh.position.set(0,0,-ROOM.D/2+2);
    mesh.scale.set(0.9,0.9,0.9);
    this.scene.add(mesh);
    this.boss = {
      mesh, pos:mesh.position, hp:600, maxHp:600,
      yaw:0, attackCooldown:2, stompCooldown:0, keySpin:0,
      target:null, enterT:0,
    };
    AudioSys.bossRoar();
    if (typeof UI !== 'undefined') UI.bossWarning();
    const bw = document.getElementById('boss-banner');
    if (bw){ bw.classList.remove('hidden'); setTimeout(()=>bw.classList.add('hidden'), 2600); }
    const bh = document.getElementById('boss-hp-wrap');
    if (bh) bh.classList.remove('hidden');
    if (typeof UI !== 'undefined') UI.sysMsg('🦖 Wind-up Godzilla has entered the room! Defeat it together!');
    // 机器人也惊动
    this.bots.forEach(b=>{ b.target = 'boss'; });
  }
  _updateBoss(dt){
    if (!this.bossActive){
      this.bossTimer -= dt;
      if (this.bossTimer<=0){ this._spawnBoss(); }
      return;
    }
    const boss = this.boss;
    boss.enterT += dt;
    boss.keySpin += dt*4;
    boss.mesh.userData.key.rotation.z = boss.keySpin;
    boss.mesh.userData.gearL.rotation.z = -boss.keySpin*0.7;
    boss.mesh.userData.gearR.rotation.z = boss.keySpin*0.7;
    boss.mesh.userData.chestGear.rotation.z = boss.keySpin;

    // 目标：最近存活玩家
    let tgt = null, best=1e9;
    if (!this.player.dead){
      const d = this.player.pos.distanceTo(boss.pos);
      if (d<best){ best=d; tgt=this.player.pos; }
    }
    this.bots.forEach(b=>{
      if (!b.alive) return;
      const d = b.pos.distanceTo(boss.pos);
      if (d<best){ best=d; tgt=b.pos; }
    });
    boss.target = tgt;

    if (tgt){
      const dir = new THREE.Vector3().subVectors(tgt, boss.pos); dir.y=0;
      const dist = dir.length();
      dir.normalize();
      boss.yaw = Math.atan2(dir.x, dir.z);
      boss.mesh.rotation.y = boss.yaw;
      // 移动（入场后前进）
      if (boss.enterT>1.2 && dist>3.5){
        const sp = 2.2*dt;
        boss.pos.x += dir.x*sp; boss.pos.z += dir.z*sp;
        // 腿部动画
        const t = boss.enterT*6;
        boss.mesh.userData.legL.rotation.x = Math.sin(t)*0.5;
        boss.mesh.userData.legR.rotation.x = -Math.sin(t)*0.5;
        boss.mesh.userData.armL.rotation.x = -Math.sin(t)*0.3;
        boss.mesh.userData.armR.rotation.x = Math.sin(t)*0.3;
      }
      // 攻击
      boss.attackCooldown -= dt;
      boss.stompCooldown -= dt;
      if (dist<4.5 && boss.stompCooldown<=0){
        // 践踏 AoE
        boss.stompCooldown = 3;
        AudioSys.stomp();
        this.shake = Math.max(this.shake, 0.3);
        this._spawnParticles(boss.pos.clone().setY(0.3), 0x8FD6A8, 18, 4);
        if (!this.player.dead && this.player.pos.distanceTo(boss.pos)<5){
          this.damagePlayer(16, 'Wind-up Godzilla', '🦖');
        }
        this.bots.forEach(b=>{
          if (b.alive && b.pos.distanceTo(boss.pos)<5) this._damageBot(b, 16, 'Wind-up Godzilla', '🦖');
        });
      } else if (dist>=4.5 && boss.attackCooldown<=0){
        // 能量吐息
        boss.attackCooldown = 2.0;
        AudioSys.spit();
        const origin = boss.pos.clone().setY(3.2).add(dir.clone().multiplyScalar(1.2));
        const d2 = dir.clone();
        d2.y += 0.05;
        this._spawnProjectile(origin, d2.normalize(), {id:'boss',damage:12,speed:16,splash:0,color:0x8FD6A8}, 'boss', 'Wind-up Godzilla');
      }
    }
    // 边界
    boss.pos.x = Math.max(-ROOM.W/2+2, Math.min(ROOM.W/2-2, boss.pos.x));
    boss.pos.z = Math.max(-ROOM.D/2+2, Math.min(ROOM.D/2-2, boss.pos.z));
    // BOSS 血条
    const bf = document.getElementById('boss-hp-fill');
    if (bf) bf.style.width = Math.max(0,boss.hp/boss.maxHp*100)+'%';
  }
  _damageBoss(amount){
    if (!this.bossActive) return;
    this.boss.hp -= amount;
    AudioSys.bossHit();
    if (this.boss.hp<=0){
      // BOSS 击破
      this._spawnParticles(this.boss.pos.clone().setY(2.5), 0xFFC93C, 40, 7);
      this._spawnParticles(this.boss.pos.clone().setY(2.5), 0x8FD6A8, 30, 6);
      AudioSys.explosion();
      this.player.gears += 200;
      this.shake = 0.4;
      if (typeof UI!== 'undefined'){
        UI.killFeed('🦖 Wind-up Godzilla', this.playerName, '💥');
        UI.sysMsg('🎉 Wind-up Godzilla defeated! +200 ⚙️');
      }
      this.scene.remove(this.boss.mesh);
      this.boss = null;
      this.bossActive = false;
      this.bossTimer = 80 + Math.random()*30;
      const bh = document.getElementById('boss-hp-wrap');
      if (bh) bh.classList.add('hidden');
    }
  }

  /* ---------- 商店 ---------- */
  _tryInteract(){
    if (this.player.dead) return;
    const d = this.player.pos.distanceTo(this.merchantPos);
    if (d<2.8){ this._openShop(); }
  }
  _openShop(){
    this.state = 'shop';
    document.exitPointerLock && document.exitPointerLock();
    AudioSys.click();
    if (typeof UI !== 'undefined') UI.openShop();
  }
  closeShop(){
    this.state = 'playing';
    if (typeof UI !== 'undefined') UI.closeShop();
    // 重新锁定
    setTimeout(()=>{ if(!this.player.dead) this.canvas.requestPointerLock(); }, 100);
  }
  buyItem(id){
    const items = this._shopItems();
    const item = items.find(i=>i.id===id);
    if (!item) return;
    if (this.player.gears < item.price){ AudioSys.deny(); return; }
    this.player.gears -= item.price;
    AudioSys.buy();
    // 效果
    if (id==='battery'){ this.player.hp = Math.min(this.player.maxHp, this.player.hp+50); this.player.regenTimer = 5; }
    else if (id==='magnet'){ this.player.magnets++; this.player.magnetTimer = 12; }
    else if (id==='ammo'){ const w=this.weapons[this.weaponIdx]; w.reserve += w.maxAmmo*2; }
    else if (id==='armor'){ this.player.armor = Math.min(100, this.player.armor+50); }
    else if (id==='grenade'){
      // 范围伤害
      this._spawnParticles(this.player.pos.clone().setY(1), 0xFF9F45, 30, 6);
      AudioSys.explosion();
      this.bots.forEach(b=>{ if(b.alive && b.pos.distanceTo(this.player.pos)<7) this._damageBot(b, 70, this.playerName, '💣'); });
      if (this.bossActive && this.boss.pos.distanceTo(this.player.pos)<8) this._damageBoss(90);
      this.shake = 0.3;
    }
    if (typeof UI !== 'undefined'){ UI.updateGearChip(); UI.updateShopGears(); this._updateWeaponBar(); }
  }
  _shopItems(){
    return [
      {id:'battery', icon:'🔋', name:'Wind-up Battery', desc:'Restore 50 health immediately and regenerate health for 5 seconds.', price:40},
      {id:'magnet',   icon:'🧲', name:'Power Magnet', desc:'Automatically attract nearby ⚙️ gears for 12 seconds.', price:60},
      {id:'ammo',     icon:'📦', name:'Ammo Supply', desc:'Double the reserve ammo for your current weapon.', price:20},
      {id:'armor',    icon:'🛡️', name:'Armor Block', desc:'Gain 50 armor that absorbs 60% of incoming damage first.', price:80},
      {id:'grenade',  icon:'💣', name:'Gyro Grenade', desc:'Deal 70 area damage to enemies within 7 meters!', price:50},
    ];
  }

  /* ---------- 粒子 ---------- */
  _spawnParticles(pos, color, count, speed){
    for (let i=0;i<count;i++){
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.12,0.12,0.12),
        new THREE.MeshBasicMaterial({color}));
      m.position.copy(pos);
      this.scene.add(m);
      const v = new THREE.Vector3((Math.random()-0.5),(Math.random()*0.8+0.2),(Math.random()-0.5)).normalize().multiplyScalar(speed*(0.5+Math.random()));
      this.particles.push({mesh:m, pos:m.position, vel:v, life:0.8+Math.random()*0.5, spin:Math.random()*10});
    }
  }

  /* ---------- 碰撞（矩形 AABB + 垂直平台）---------- */
  _collide(pos, radius, stepUp){
    let ground = 0;
    // 房间边界
    pos.x = Math.max(-ROOM.W/2+radius+0.2, Math.min(ROOM.W/2-radius-0.2, pos.x));
    pos.z = Math.max(-ROOM.D/2+radius+0.2, Math.min(ROOM.D/2-radius-0.2, pos.z));
    // 障碍 AABB（支持站立 / 爬楼梯 / 推挤）
    for (const o of this.obstacles){
      const cx = Math.max(o.x-o.hw, Math.min(pos.x, o.x+o.hw));
      const cz = Math.max(o.z-o.hd, Math.min(pos.z, o.z+o.hd));
      const dx = pos.x - cx, dz = pos.z - cz;
      const dist = Math.sqrt(dx*dx+dz*dz);
      if (dist < radius){
        if (pos.y >= o.h - 0.3){
          // 脚在顶部之上 → 站在上面
          if (o.h > ground) ground = o.h;
        } else if (stepUp && (o.h - pos.y) <= 0.5){
          // 矮台阶 → 直接踏上
          pos.y = o.h;
          if (o.h > ground) ground = o.h;
        } else {
          // 太高 → 水平推出
          if (dist > 0.0001){
            const push = radius - dist;
            pos.x += dx/dist*push; pos.z += dz/dist*push;
          } else {
            // 中心在 AABB 内，沿最小穿透方向推出
            const px = (o.hw + radius) - Math.abs(pos.x - o.x);
            const pz = (o.hd + radius) - Math.abs(pos.z - o.z);
            if (px < pz) pos.x += (pos.x>o.x?px:-px);
            else pos.z += (pos.z>o.z?pz:-pz);
          }
        }
      }
    }
    // 八音盒（圆柱，仅水平）
    const mdx = pos.x - this.merchantPos.x, mdz = pos.z - this.merchantPos.z;
    const mdist = Math.sqrt(mdx*mdx+mdz*mdz);
    if (mdist < 1.0+radius && mdist>0.001 && pos.y < 1.0){
      const push = (1.0+radius-mdist);
      pos.x += mdx/mdist*push; pos.z += mdz/mdist*push;
    }
    return ground;
  }
  _lineBlocked(a, b){
    // 粗略视线检测：采样中点是否在障碍内
    const steps = 6;
    for (let i=1;i<steps;i++){
      const t=i/steps;
      const x=a.x+(b.x-a.x)*t, z=a.z+(b.z-a.z)*t, y=a.y+(b.y-a.y)*t;
      for (const o of this.obstacles){
        if (y < o.h && Math.abs(x-o.x)<o.hw && Math.abs(z-o.z)<o.hd) return true;
      }
    }
    return false;
  }

  /* ---------- 主循环 ---------- */
  _animate(){
    if (this.disposed) return;
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this._update(dt);
    this._render();
  }

  _update(dt){
    this.fireCooldown = Math.max(0, this.fireCooldown-dt);
    if (this.muzzleFlash.intensity>0) this.muzzleFlash.intensity = Math.max(0, this.muzzleFlash.intensity-dt*18);
    // 换弹
    if (this.reloadTimer>0){
      this.reloadTimer -= dt;
      const rf = document.getElementById('reload-fill');
      if (rf) rf.style.width = (1-this.reloadTimer/1.4)*100+'%';
      // 换弹动画：枪下沉旋转
      if (this.viewWeapon){
        this.viewWeapon.position.y = -0.3 - Math.sin((1-this.reloadTimer/1.4)*Math.PI)*0.25;
        this.viewWeapon.rotation.x = Math.sin((1-this.reloadTimer/1.4)*Math.PI)*0.6;
      }
      if (this.reloadTimer<=0) this._finishReload();
    } else if (this.viewWeapon){
      // 视图模型归位 + 走路摆动
      const targetY = -0.3 + Math.sin(this.bob)*0.012;
      const targetZ = -0.55;
      this.viewWeapon.position.y += (targetY - this.viewWeapon.position.y)*0.2;
      this.viewWeapon.position.z += (targetZ - this.viewWeapon.position.z)*0.2;
      this.viewWeapon.rotation.x *= 0.8;
    }

    if (this.state==='shop'){ this._updateAmbient(dt); return; }

    if (this.player.dead){
      this._updateSpectator(dt);
      this.player.respawnTimer -= dt;
      const dr = document.getElementById('death-respawn');
      if (dr) dr.textContent = Math.ceil(this.player.respawnTimer);
      if (this.player.respawnTimer<=0) this.respawn();
    } else {
      this._updatePlayer(dt);
    }
    this._updateBots(dt);
    this._updateBoss(dt);
    this._updateProjectiles(dt);
    this._updateParticles(dt);
    this._updatePickups(dt);
    this._updateMerchant(dt);
    this._updateAmbient(dt);

    // HUD 节流更新
    this.hudTimer -= dt;
    if (this.hudTimer<=0){ this.hudTimer=0.1; this._updateHUD(); }
    this.minimapTimer -= dt;
    if (this.minimapTimer<=0){ this.minimapTimer=0.12; this._drawMinimap(); }
    this.leaderboardTimer -= dt;
    if (this.leaderboardTimer<=0){ this.leaderboardTimer=0.5; if(typeof UI!=='undefined') UI.updateLeaderboard(); }
    this.chatTimer -= dt;
    if (this.chatTimer<=0){ this.chatTimer = 6+Math.random()*6; this._botChat(); }
    this.gearPickTimer -= dt;
    if (this.gearPickTimer<=0){ this.gearPickTimer = 8+Math.random()*6; if(this.pickups.length<8) this._spawnGearPickup(); }

    // 衰减抖动
    this.shake *= 0.88;
  }

  _updateAmbient(dt){
    // 商人动画
    const ud = this.merchant.userData;
    ud.crank.rotation.x += dt*2;
    ud.gear.rotation.z += dt*1.5;
    ud.roller.rotation.x += dt*3;
    this.merchantRing.material.opacity = 0.35+Math.sin(performance.now()*0.003)*0.15;
    // 拾取物旋转
    this.pickups.forEach(p=>{ p.spin += dt*3; p.mesh.rotation.z = p.spin; p.mesh.position.y = 0.5+Math.sin(p.spin)*0.1; });
  }

  _updatePlayer(dt){
    const p = this.player;
    const speed = 5.2;
    const forward = new THREE.Vector3(-Math.sin(this.yaw),0,-Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw),0,-Math.sin(this.yaw));
    const move = new THREE.Vector3();
    if (this.keys['KeyW']) move.add(forward);
    if (this.keys['KeyS']) move.sub(forward);
    if (this.keys['KeyD']) move.add(right);
    if (this.keys['KeyA']) move.sub(right);
    const moving = move.lengthSq()>0;
    if (moving) move.normalize();
    // 水平速度
    p.vel.x += (move.x*speed - p.vel.x)*0.25;
    p.vel.z += (move.z*speed - p.vel.z)*0.25;
    // 重力/跳跃
    p.vel.y -= 18*dt;
    if (this.keys['Space'] && p.onGround){ p.vel.y = 6.5; p.onGround=false; AudioSys.jump(); }
    p.pos.addScaledVector(p.vel, dt);
    // 碰撞（水平推挤 + 脚下地面高度，支持高台站立/爬楼梯/跌落）
    const ground = this._collide(p.pos, p.radius, true);
    if (p.pos.y <= ground){
      p.pos.y = ground;
      p.vel.y = 0;
      p.onGround = true;
    } else {
      p.onGround = false;
    }
    // 走路摆动 + 脚步
    if (moving && p.onGround){
      this.bob += dt*10;
      this.stepTimer -= dt;
      if (this.stepTimer<=0){ this.stepTimer=0.32; AudioSys.step(); }
    }
    // 回血 buff
    if (p.regenTimer>0){ p.regenTimer-=dt; p.hp = Math.min(p.maxHp, p.hp+8*dt); }
    // 磁铁
    if (p.magnetTimer>0) p.magnetTimer -= dt;
    // 相机
    const shakeX = (Math.random()-0.5)*this.shake;
    const shakeY = (Math.random()-0.5)*this.shake;
    this.camera.position.set(
      p.pos.x + shakeX,
      p.pos.y + p.eye + Math.sin(this.bob)*0.04 + shakeY,
      p.pos.z
    );
    this.camera.rotation.set(this.pitch, this.yaw, 0);
    // 互动提示
    const near = p.pos.distanceTo(this.merchantPos)<2.8;
    const ip = document.getElementById('interact-prompt');
    if (ip) ip.classList.toggle('hidden', !near);
  }

  _updateSpectator(dt){
    // 纸飞机绕场飞行
    this.spectatorAngle += dt*0.5;
    const r = 9;
    const cx = Math.cos(this.spectatorAngle)*r;
    const cz = Math.sin(this.spectatorAngle)*r;
    const cy = 4.5 + Math.sin(this.spectatorAngle*2)*1.2;
    const prev = this.paperPlane.position.clone();
    this.paperPlane.position.set(cx,cy,cz);
    // 朝向
    const dir = new THREE.Vector3().subVectors(this.paperPlane.position, prev);
    if (dir.lengthSq()>0.0001){
      const look = this.paperPlane.position.clone().add(dir);
      this.paperPlane.lookAt(look);
      this.paperPlane.rotation.z = Math.sin(this.spectatorAngle*3)*0.4;
    }
    // 相机跟随（第三人称）
    const camTarget = this.paperPlane.position.clone();
    const camPos = camTarget.clone().add(new THREE.Vector3(Math.cos(this.spectatorAngle+0.8)*4, 2.5, Math.sin(this.spectatorAngle+0.8)*4));
    this.camera.position.lerp(camPos, 0.05);
    // 看向最近敌人或中心
    let look = new THREE.Vector3(0,1,0);
    let best=1e9;
    this.bots.forEach(b=>{ if(b.alive){ const d=b.pos.distanceTo(camTarget); if(d<best){best=d;look=b.pos.clone().setY(1);} }});
    if (this.bossActive){ const d=this.boss.pos.distanceTo(camTarget); if(d<best){best=d;look=this.boss.pos.clone().setY(2.5);} }
    this.camera.lookAt(look);
  }

  _updateBots(dt){
    this.bots.forEach(bot=>{
      if (!bot.alive){
        bot.respawnTimer -= dt;
        if (bot.respawnTimer<=0){
          const sp = SPAWNS[Math.floor(Math.random()*SPAWNS.length)];
          bot.pos.set(sp[0],0,sp[1]);
          bot.hp = bot.maxHp; bot.alive=true; bot.mesh.visible=true;
          bot.ammo = bot.weapon.maxAmmo; bot.reserve = bot.weapon.reserve;
        }
        return;
      }
      bot.think -= dt;
      bot.fireCooldown -= dt;
      if (bot.reloadTimer>0){
        bot.reloadTimer -= dt;
        if (bot.reloadTimer<=0){ bot.ammo=bot.weapon.maxAmmo; }
      }
      if (bot.think<=0){
        bot.think = 0.35+Math.random()*0.4;
        this._botThink(bot);
      }
      // 移动
      const wp = bot.waypoint;
      const dir = new THREE.Vector3(wp.x-bot.pos.x, 0, wp.z-bot.pos.z);
      const dist = dir.length();
      if (dist>0.4){
        dir.normalize();
        const sp = 3.2*dt;
        bot.pos.x += dir.x*sp; bot.pos.z += dir.z*sp;
        bot.walkPhase += dt*8;
        // 腿部动画
        bot.mesh.userData.legL.rotation.x = Math.sin(bot.walkPhase)*0.5;
        bot.mesh.userData.legR.rotation.x = -Math.sin(bot.walkPhase)*0.5;
        bot.mesh.userData.armL.rotation.x = -Math.sin(bot.walkPhase)*0.3;
      } else {
        bot.mesh.userData.legL.rotation.x *= 0.8;
        bot.mesh.userData.legR.rotation.x *= 0.8;
      }
      this._collide(bot.pos, bot.radius);
      // 朝向移动/目标
      if (bot.target){
        const tp = bot.target==='boss' ? (this.boss?this.boss.pos:null) : bot.target.pos;
        if (tp){
          const d = new THREE.Vector3().subVectors(tp, bot.pos); d.y=0;
          bot.yaw = Math.atan2(d.x, d.z);
          bot.mesh.rotation.y = bot.yaw;
          // 开火
          const tdist = d.length();
          if (tdist<16 && bot.fireCooldown<=0 && bot.reloadTimer<=0 && bot.ammo>0){
            const blocked = this._lineBlocked(bot.pos.clone().setY(1.2), tp.clone().setY(1.2));
            if (!blocked){
              bot.ammo--;
              bot.fireCooldown = bot.weapon.fireRate*2.4;
              const origin = bot.pos.clone().setY(1.3);
              const aim = tp.clone().setY(bot.target==='boss'?2.5:1.1).sub(origin).normalize();
              const acc = 0.14;
              aim.x += (Math.random()-0.5)*acc;
              aim.y += (Math.random()-0.5)*acc;
              aim.z += (Math.random()-0.5)*acc;
              this._spawnProjectile(origin, aim.normalize(), bot.weapon, bot, bot.name);
              if (bot.pos.distanceTo(this.player.pos)<20) AudioSys.shoot(bot.weapon.id);
              if (bot.ammo<=0) bot.reloadTimer = 2.0;
            }
          }
        }
      }
      // 头部朝向
      bot.mesh.userData.head.rotation.y = Math.sin(bot.walkPhase*0.3)*0.2;
    });
  }

  _botThink(bot){
    // 选目标：最近（玩家或其它 bot / boss）
    let best=1e9, tgt=null;
    if (!this.player.dead){
      const d = bot.pos.distanceTo(this.player.pos);
      if (d<best){ best=d; tgt=this.player; }
    }
    this.bots.forEach(o=>{
      if (o===bot || !o.alive) return;
      const d = bot.pos.distanceTo(o.pos);
      if (d<best*0.8){ best=d; tgt=o; }
    });
    if (this.bossActive && this.boss){
      const d = bot.pos.distanceTo(this.boss.pos);
      if (d<best*0.7){ best=d; tgt='boss'; }
    }
    bot.target = tgt;
    // 低血逃跑
    if (bot.hp<35 && tgt && tgt!=='boss'){
      const away = new THREE.Vector3().subVectors(bot.pos, tgt.pos).normalize();
      bot.waypoint.set(bot.pos.x+away.x*8, 0, bot.pos.z+away.z*8);
      return;
    }
    // 选路径点：靠近目标或随机
    if (tgt && tgt!=='boss' && Math.random()<0.6){
      const tp = tgt.pos;
      const ang = Math.random()*Math.PI*2;
      const r = 3+Math.random()*4;
      bot.waypoint.set(tp.x+Math.cos(ang)*r, 0, tp.z+Math.sin(ang)*r);
    } else if (tgt==='boss' && this.boss){
      const dir = new THREE.Vector3().subVectors(this.boss.pos, bot.pos).normalize();
      bot.waypoint.set(this.boss.pos.x-dir.x*6, 0, this.boss.pos.z-dir.z*6);
    } else {
      bot.waypoint.set((Math.random()-0.5)*26, 0, (Math.random()-0.5)*18);
    }
  }

  _updateProjectiles(dt){
    for (let i=this.projectiles.length-1;i>=0;i--){
      const pr = this.projectiles[i];
      pr.life -= dt;
      pr.pos.addScaledVector(pr.vel, dt);
      pr.mesh.rotation.x += dt*10; pr.mesh.rotation.y += dt*8;
      let hit = false;
      // 撞墙/书本
      if (Math.abs(pr.pos.x)>ROOM.W/2 || Math.abs(pr.pos.z)>ROOM.D/2 || pr.pos.y<0 || pr.pos.y>ROOM.H){
        hit = true;
      }
      if (!hit){
        for (const o of this.obstacles){
          if (pr.pos.y<o.h && Math.abs(pr.pos.x-o.x)<o.hw && Math.abs(pr.pos.z-o.z)<o.hd){ hit=true; break; }
        }
      }
      // 命中玩家
      if (!hit && pr.owner!=='player' && !this.player.dead){
        const d = pr.pos.distanceTo(this.player.pos.clone().setY(1.2));
        if (d<0.7){
          this.damagePlayer(pr.damage, pr.ownerName, pr.owner==='boss'?'🦖':(pr.owner.weapon?pr.owner.weapon.icon:'🔫'));
          hit = true;
        }
      }
      // 命中 bots
      if (!hit && pr.owner!=='bot'){
        for (const bot of this.bots){
          if (!bot.alive) continue;
          if (pr.owner===bot) continue;
          const d = pr.pos.distanceTo(bot.pos.clone().setY(1.1));
          if (d<0.7){
            this._damageBot(bot, pr.damage, pr.ownerName, pr.owner==='player'?'🔫':(pr.owner.weapon?pr.owner.weapon.icon:'🔫'));
            hit = true; break;
          }
        }
      }
      // 命中 BOSS
      if (!hit && pr.owner!=='boss' && this.bossActive && this.boss){
        const d = pr.pos.distanceTo(this.boss.pos.clone().setY(2.5));
        if (d<1.6){
          if (pr.owner==='player') this._damageBoss(pr.damage);
          else this._damageBoss(pr.damage*0.5);
          hit = true;
        }
      }
      // 溅射
      if (hit && pr.splash>0){
        this._spawnParticles(pr.pos.clone(), 0xFFC93C, 12, 4);
        if (pr.owner==='player'){
          this.bots.forEach(b=>{ if(b.alive && b.pos.distanceTo(pr.pos)<pr.splash) this._damageBot(b, pr.damage*0.6, this.playerName, '🌀'); });
          if (this.bossActive && this.boss.pos.distanceTo(pr.pos)<pr.splash+1) this._damageBoss(pr.damage*0.6);
        }
      }
      if (hit || pr.life<=0){
        if (hit) this._spawnParticles(pr.pos.clone(), pr.mesh.material.color.getHex(), 5, 2.5);
        this.scene.remove(pr.mesh);
        pr.mesh.geometry.dispose(); pr.mesh.material.dispose();
        this.projectiles.splice(i,1);
      }
    }
  }

  _damageBot(bot, amount, fromName, weaponIcon){
    if (!bot.alive) return;
    bot.hp -= amount;
    AudioSys.hit();
    // 命中标记
    if (fromName===this.playerName){
      const hm = document.getElementById('hitmarker');
      if (hm){ hm.classList.add('show'); setTimeout(()=>hm.classList.remove('show'),120); }
    }
    if (bot.hp<=0){
      this._killBot(bot, fromName, weaponIcon);
    }
  }
  _killBot(bot, fromName, weaponIcon){
    bot.alive = false;
    bot.deaths++;
    bot.mesh.visible = false;
    bot.respawnTimer = 5+Math.random()*3;
    this._spawnParticles(bot.pos.clone().setY(1), bot.color, 16, 4);
    this._spawnGearPickup(new THREE.Vector3(bot.pos.x,0.5,bot.pos.z));
    if (fromName===this.playerName){
      this.player.kills++;
      this.player.gears += 10;
      this.killStreak++;
      AudioSys.gear();
      if (typeof UI!=='undefined'){
        UI.killFeed(this.playerName, bot.name, weaponIcon);
        UI.updateGearChip();
      }
      if (this.killStreak===3 && typeof UI!=='undefined') UI.sysMsg('🔥 Triple kill! Incredible!');
    } else {
      if (typeof UI!=='undefined') UI.killFeed(fromName, bot.name, weaponIcon);
    }
    if (typeof UI!=='undefined') UI.updateLeaderboard();
  }

  _updateParticles(dt){
    for (let i=this.particles.length-1;i>=0;i--){
      const pt = this.particles[i];
      pt.life -= dt;
      pt.vel.y -= 12*dt;
      pt.pos.addScaledVector(pt.vel, dt);
      if (pt.pos.y<0.06){ pt.pos.y=0.06; pt.vel.y*=-0.4; pt.vel.x*=0.7; pt.vel.z*=0.7; }
      pt.mesh.rotation.x += pt.spin*dt;
      pt.mesh.rotation.y += pt.spin*dt;
      const s = Math.max(0.01, pt.life);
      pt.mesh.scale.setScalar(s);
      if (pt.life<=0){
        this.scene.remove(pt.mesh);
        pt.mesh.geometry.dispose(); pt.mesh.material.dispose();
        this.particles.splice(i,1);
      }
    }
  }

  _updatePickups(dt){
    const p = this.player;
    for (let i=this.pickups.length-1;i>=0;i--){
      const pk = this.pickups[i];
      const d = pk.pos.distanceTo(p.pos);
      // 磁铁吸引
      if (p.magnetTimer>0 && d<8 && !p.dead){
        const dir = new THREE.Vector3().subVectors(p.pos.clone().setY(0.5), pk.pos).normalize();
        pk.pos.addScaledVector(dir, 10*dt);
      }
      if (d<1.0 && !p.dead){
        p.gears += pk.value;
        AudioSys.gear();
        if (typeof UI!=='undefined'){ UI.updateGearChip(); UI.sysMsg(`+${pk.value} ⚙️`); }
        this.scene.remove(pk.mesh);
        pk.mesh.traverse(o=>{ if(o.isMesh){o.geometry.dispose();o.material.dispose();} });
        this.pickups.splice(i,1);
      }
    }
  }

  _updateMerchant(dt){
    // 开盖动画：玩家靠近时盖子打开
    const d = this.player.pos.distanceTo(this.merchantPos);
    const ud = this.merchant.userData;
    const target = d<4 ? -1.9 : 0;
    ud.lid.rotation.x += (target - ud.lid.rotation.x)*0.08;
  }

  _botChat(){
    const lines = ['Charge!','Cover me!','Over here!','Hahaha!','Stay back!','Where is the boss?','Yes!','Take this!','Wait for me!','This room is huge'];
    const alive = this.bots.filter(b=>b.alive);
    if (!alive.length) return;
    const b = alive[Math.floor(Math.random()*alive.length)];
    const line = lines[Math.floor(Math.random()*lines.length)];
    if (typeof UI!=='undefined') UI.addChat(b.name, line, b.color);
  }

  /* ---------- HUD ---------- */
  _updateHUD(){
    const p = this.player;
    // 血条
    const hpPct = Math.max(0,p.hp/p.maxHp*100);
    const hf = document.getElementById('hp-fill');
    if (hf) hf.style.width = hpPct+'%';
    const hs = document.getElementById('hp-shield');
    if (hs) hs.style.width = Math.min(100, p.armor)+'%';
    const ht = document.getElementById('hp-text');
    if (ht) ht.textContent = Math.ceil(Math.max(0,p.hp));
    // 弹药
    const w = this.weapons[this.weaponIdx];
    const ac = document.getElementById('ammo-count');
    if (ac){
      ac.innerHTML = `${w.ammo}<span>/${w.reserve}</span>`;
      ac.classList.toggle('low', w.ammo<=Math.ceil(w.maxAmmo*0.25));
    }
    const wn = document.getElementById('weapon-name');
    if (wn) wn.textContent = w.name;
    // 道具
    const cb = document.getElementById('chip-battery');
    if (cb){ cb.querySelector('span').textContent = p.batteries; cb.classList.toggle('flash', p.regenTimer>0); }
    const cm = document.getElementById('chip-magnet');
    if (cm){ cm.querySelector('span').textContent = p.magnets; cm.classList.toggle('flash', p.magnetTimer>0); }
  }

  _updateWeaponBar(){
    const bar = document.getElementById('weapon-bar');
    if (!bar) return;
    bar.innerHTML = '';
    this.weapons.forEach((w,i)=>{
      const slot = document.createElement('div');
      slot.className = 'weapon-slot' + (i===this.weaponIdx?' active':'') + (w.ammo+w.reserve<=0?' empty':'');
      slot.innerHTML = `<span class="wkey">${i+1}</span><div>${w.icon}</div><div class="wname">${w.name}</div>`;
      bar.appendChild(slot);
    });
  }

  _drawMinimap(){
    const cv = document.getElementById('minimap');
    if (!cv) return;
    const x = cv.getContext('2d');
    const W=cv.width, H=cv.height;
    const sx = W/ROOM.W, sz = H/ROOM.D;
    const px = (wx)=> (wx+ROOM.W/2)*sx;
    const pz = (wz)=> (wz+ROOM.D/2)*sz;
    // 底
    x.fillStyle='#F3E3C8'; x.fillRect(0,0,W,H);
    // 边框
    x.strokeStyle='#43302B'; x.lineWidth=4; x.strokeRect(2,2,W-4,H-4);
    // 书本
    x.fillStyle='#C98B5E';
    this.obstacles.forEach(o=>{ x.fillRect(px(o.x)-o.hw*sx, pz(o.z)-o.hd*sz, o.hw*2*sx, o.hd*2*sz); });
    // 商人
    x.fillStyle='#FFC93C';
    x.beginPath(); x.arc(px(this.merchantPos.x), pz(this.merchantPos.z), 5,0,Math.PI*2); x.fill();
    x.strokeStyle='#43302B'; x.lineWidth=1.5; x.stroke();
    // 齿轮
    x.fillStyle='#D8B84A';
    this.pickups.forEach(pk=>{ x.fillRect(px(pk.pos.x)-1.5, pz(pk.pos.z)-1.5, 3,3); });
    // bots
    this.bots.forEach(b=>{
      if (!b.alive) return;
      x.fillStyle = '#'+b.color.toString(16).padStart(6,'0');
      x.beginPath(); x.arc(px(b.pos.x), pz(b.pos.z), 4,0,Math.PI*2); x.fill();
      x.strokeStyle='#43302B'; x.lineWidth=1.2; x.stroke();
    });
    // BOSS
    if (this.bossActive && this.boss){
      x.fillStyle='#3E8E7E';
      x.beginPath(); x.arc(px(this.boss.pos.x), pz(this.boss.pos.z), 7,0,Math.PI*2); x.fill();
      x.strokeStyle='#43302B'; x.lineWidth=2; x.stroke();
    }
    // 玩家（箭头）
    if (!this.player.dead){
      x.save();
      x.translate(px(this.player.pos.x), pz(this.player.pos.z));
      x.rotate(-this.yaw);
      x.fillStyle='#fff';
      x.beginPath(); x.moveTo(0,-7); x.lineTo(5,5); x.lineTo(0,2); x.lineTo(-5,5); x.closePath();
      x.fill(); x.strokeStyle='#43302B'; x.lineWidth=1.5; x.stroke();
      x.restore();
    }
  }

  /* ---------- 渲染 ---------- */
  _render(){
    if (this.renderer && this.rt){
      this.renderer.setRenderTarget(this.rt);
      this.renderer.render(this.scene, this.camera);
      this.renderer.setRenderTarget(null);
      this.renderer.render(this.postScene, this.postCam);
    }
  }

  _onResize(){
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w/h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w,h);
    this.rt.setSize(w,h);
    this.postMat.uniforms.res.value.set(w,h);
  }

  /* ---------- 清理 ---------- */
  dispose(){
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    if (this._onResizeBound) window.removeEventListener('resize', this._onResizeBound);
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('keyup', this._onKeyUp);
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('mousedown', this._onMouseDown);
    if (this._onCanvasClick) this.canvas.removeEventListener('click', this._onCanvasClick);
    if (this._onPointerLockChange) document.removeEventListener('pointerlockchange', this._onPointerLockChange);
    this.scene.traverse(o=>{
      if (o.isMesh){ o.geometry.dispose(); if(o.material.dispose) o.material.dispose(); }
    });
    this.renderer.dispose();
  }
}

window.GameEngine = GameEngine;
window.WEAPONS = WEAPONS;
