/* ============================================================
   models.js — 3D 模型构建库（塑料 / 哑光 / 金属质感低多边形）
   ============================================================ */
(function(){
  const M = {};

  function mat(color, rough, metal, extra){
    return new THREE.MeshStandardMaterial(Object.assign(
      {color, roughness:rough==null?0.42:rough, metalness:metal||0}, extra||{}));
  }
  function box(w,h,d,material){ return new THREE.Mesh(new THREE.BoxGeometry(w,h,d), material); }
  function cyl(rt,rb,h,seg,material){ return new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg||12), material); }

  /* ---------- 程序化贴图 ---------- */
  M.parquetTexture = function(){
    const c = document.createElement('canvas'); c.width=c.height=512;
    const x = c.getContext('2d');
    x.fillStyle='#D9A066'; x.fillRect(0,0,512,512);
    const tones=['#D9A066','#C98B5E','#E0AC72','#B5764A','#D29A68','#C08050'];
    for (let row=0; row<8; row++){
      for (let col=0; col<4; col++){
        const off = (row%2)*64;
        const px = col*128+off-64, py = row*64;
        x.fillStyle = tones[(row*4+col)%tones.length];
        x.fillRect(px+1,py+1,126,62);
        // 木纹
        x.strokeStyle='rgba(120,70,30,.18)'; x.lineWidth=1;
        for (let g=0; g<4; g++){
          x.beginPath();
          const gy = py+10+g*13;
          x.moveTo(px+4, gy);
          x.bezierCurveTo(px+40, gy+2, px+80, gy-2, px+122, gy);
          x.stroke();
        }
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(4,3);
    return t;
  };
  M.rugTexture = function(){
    const c = document.createElement('canvas'); c.width=c.height=256;
    const x = c.getContext('2d');
    x.fillStyle='#FF9F9F'; x.fillRect(0,0,256,256);
    x.strokeStyle='#FFE08A'; x.lineWidth=10;
    x.strokeRect(14,14,228,228);
    x.strokeStyle='#8AD6FF'; x.lineWidth=6;
    x.strokeRect(34,34,188,188);
    // 中心小星星
    x.fillStyle='#FFF3B0';
    for (let i=0;i<12;i++){
      const a=i/12*Math.PI*2, r=70;
      x.beginPath();
      x.arc(128+Math.cos(a)*r, 128+Math.sin(a)*r, 9, 0, Math.PI*2);
      x.fill();
    }
    x.fillStyle='#FF6B5B';
    x.beginPath(); x.arc(128,128,22,0,Math.PI*2); x.fill();
    const t = new THREE.CanvasTexture(c);
    return t;
  };

  /* ---------- 塑料小人（玩具兵）---------- */
  M.buildSoldier = function(opts){
    opts = opts||{};
    const uniform = mat(opts.uniform||0x5E8C4A, 0.38, 0.05);
    const skin = mat(opts.skin||0xF2C89B, 0.5, 0);
    const helmet = mat(opts.helmet!=null?opts.helmet:(opts.uniform||0x5E8C4A), 0.3, 0.08);
    const gun = mat(0x8A8F98, 0.35, 0.35);
    const dark = mat(0x3A3F46, 0.5, 0.1);
    const g = new THREE.Group();

    // 腿 + 靴
    const legGeo = new THREE.BoxGeometry(0.15,0.4,0.17);
    const legL = new THREE.Mesh(legGeo, uniform); legL.position.set(-0.105,0.2,0);
    const legR = new THREE.Mesh(legGeo, uniform); legR.position.set(0.105,0.2,0);
    const bootGeo = new THREE.BoxGeometry(0.17,0.1,0.24);
    const bootL = new THREE.Mesh(bootGeo, dark); bootL.position.set(-0.105,0.05,0.03);
    const bootR = new THREE.Mesh(bootGeo, dark); bootR.position.set(0.105,0.05,0.03);
    // 腰带
    const belt = box(0.4,0.07,0.28, dark); belt.position.y=0.42;
    // 躯干
    const torso = box(0.42,0.44,0.27, uniform); torso.position.y=0.65;
    // 胸前口袋
    const pocket = box(0.12,0.1,0.03, mat(0x4E7038,0.4)); pocket.position.set(-0.1,0.62,0.145);
    // 手臂
    const armGeo = new THREE.BoxGeometry(0.12,0.36,0.14);
    const armL = new THREE.Mesh(armGeo, uniform); armL.position.set(-0.28,0.68,0);
    const armR = new THREE.Mesh(armGeo, uniform); armR.position.set(0.28,0.68,0);
    // 肩甲
    const padGeo = new THREE.BoxGeometry(0.16,0.08,0.18);
    const padL = new THREE.Mesh(padGeo, helmet); padL.position.set(-0.28,0.88,0);
    const padR = new THREE.Mesh(padGeo, helmet); padR.position.set(0.28,0.88,0);
    // 头
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.165,18,14), skin);
    head.position.y=0.99;
    // 眼睛
    const eyeGeo = new THREE.SphereGeometry(0.024,8,8);
    const eyeMat = mat(0x22262B,0.25);
    const eL = new THREE.Mesh(eyeGeo, eyeMat); eL.position.set(-0.058,0.02,0.148);
    const eR = new THREE.Mesh(eyeGeo, eyeMat); eR.position.set(0.058,0.02,0.148);
    // 微笑
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.05,0.011,6,14,Math.PI), eyeMat);
    smile.position.set(0,-0.035,0.145); smile.rotation.z=Math.PI;
    // 头盔
    const helm = new THREE.Mesh(new THREE.SphereGeometry(0.185,18,10,0,Math.PI*2,0,Math.PI*0.56), helmet);
    helm.position.y=1.0;
    const brim = cyl(0.19,0.19,0.03,18, helmet); brim.position.y=0.99;
    // 头盔上的小积木
    const knob = box(0.07,0.05,0.07, mat(opts.knob||0xFFC93C,0.35)); knob.position.set(0,1.18,0);
    // 枪（右手）
    const gunG = new THREE.Group();
    const gBody = box(0.09,0.11,0.42, gun); gBody.position.z=0.1;
    const gBarrel = cyl(0.028,0.028,0.22,10, gun); gBarrel.rotation.x=Math.PI/2; gBarrel.position.set(0,0.01,0.34);
    const gGrip = box(0.07,0.16,0.09, gun); gGrip.position.set(0,-0.12,0.02); gGrip.rotation.x=0.3;
    const gSight = box(0.03,0.05,0.05, dark); gSight.position.set(0,0.09,0.16);
    gunG.add(gBody,gBarrel,gGrip,gSight);
    gunG.position.set(0.3,0.62,0.18);
    // 左手（持盾牌小圆牌）
    const shield = cyl(0.11,0.11,0.03,14, mat(opts.shield||0xFFC93C,0.35,0.1));
    shield.rotation.x=Math.PI/2; shield.position.set(-0.3,0.6,0.12);

    g.add(legL,legR,bootL,bootR,belt,torso,pocket,armL,armR,padL,padR,head,eL,eR,smile,helm,brim,knob,gunG,shield);
    g.traverse(o=>{ if(o.isMesh){o.castShadow=true;} });
    g.userData = {legL,legR,armL,armR,head,gunG,shield,torso,helm};
    return g;
  };

  /* ---------- 武器（高细节版）---------- */
  M.buildWeaponModel = function(kind){
    const g = new THREE.Group();
    const plastic = mat(0x8A8F98,0.32,0.35);
    const plasticDk = mat(0x5A5F66,0.4,0.3);
    const accent = mat(kind==='gyro'?0x5BB8E8:kind==='slinger'?0x8B5E3C:0xFF6B5B,0.32,0.15);
    const accentDk = mat(kind==='gyro'?0x2E86C1:kind==='slinger'?0x6B4423:0xC73E2A,0.4,0.15);
    const metal = mat(0xD8B84A,0.3,0.6);
    const dark = mat(0x3A3F46,0.5,0.1);
    const rubber = mat(0x43302B,0.7,0);

    if (kind==='slinger'){
      /* 弹弓：木叉 + 皮筋 + 握把 + 弹兜 + 铆钉 */
      const wood = mat(0x9C6B3F,0.55,0.05);
      const woodDk = mat(0x7A5230,0.6,0.05);
      // 握把（带缠绕纹理）
      const handle = cyl(0.032,0.038,0.34,10, wood); handle.position.set(0,-0.12,0);
      const handleCap = cyl(0.042,0.036,0.05,10, woodDk); handleCap.position.set(0,-0.29,0);
      const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.04,10,8), metal); pommel.position.set(0,-0.32,0);
      // 握把缠绕
      for (let i=0;i<5;i++){
        const wrap = cyl(0.036,0.036,0.02,10, rubber);
        wrap.position.set(0,-0.2+i*0.035,0); wrap.rotation.x=0.2;
        g.add(wrap);
      }
      // Y 形主叉（两段）
      const stem = cyl(0.03,0.034,0.16,10, wood); stem.position.set(0,0.08,0);
      const yoke = box(0.07,0.06,0.07, wood); yoke.position.set(0,0.16,0);
      const forkL = cyl(0.018,0.024,0.2,8, wood); forkL.position.set(-0.055,0.26,0); forkL.rotation.z=0.45;
      const forkR = cyl(0.018,0.024,0.2,8, wood); forkR.position.set(0.055,0.26,0); forkR.rotation.z=-0.45;
      const tipL = new THREE.Mesh(new THREE.SphereGeometry(0.022,8,8), metal); tipL.position.set(-0.1,0.35,0);
      const tipR = new THREE.Mesh(new THREE.SphereGeometry(0.022,8,8), metal); tipR.position.set(0.1,0.35,0);
      // 皮筋
      const bandMat = mat(0x6B3B2A,0.6);
      const bandL = box(0.005,0.005,0.18, bandMat); bandL.position.set(-0.05,0.3,0.08); bandL.rotation.x=0.3;
      const bandR = box(0.005,0.005,0.18, bandMat); bandR.position.set(0.05,0.3,0.08); bandR.rotation.x=0.3;
      // 弹兜 + 弹丸
      const pouch = box(0.06,0.03,0.07, rubber); pouch.position.set(0,0.28,0.14);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.022,10,8), accent); ball.position.set(0,0.3,0.16);
      // 装饰齿轮
      const decGear = M.buildGear(0.03, metal, accent); decGear.position.set(0,0.0,0.04); decGear.rotation.x=Math.PI/2;
      g.add(handle,handleCap,pommel,stem,yoke,forkL,forkR,tipL,tipR,bandL,bandR,pouch,ball,decGear);
    } else if (kind==='gyro'){
      /* 陀螺炮：大炮管 + 陀螺仪环 + 齿轮组 + 弹鼓 + 瞄具 */
      const body = cyl(0.1,0.13,0.42,16, plastic); body.rotation.x=Math.PI/2; body.position.z=0.12;
      const bodyBolt = cyl(0.13,0.13,0.06,16, plasticDk); bodyBolt.rotation.x=Math.PI/2; bodyBolt.position.z=-0.05;
      // 炮口（制退器）
      const muzzle = cyl(0.11,0.09,0.12,14, plasticDk); muzzle.rotation.x=Math.PI/2; muzzle.position.z=0.4;
      const muzzleRing = new THREE.Mesh(new THREE.TorusGeometry(0.1,0.018,8,16), metal); muzzleRing.position.z=0.46;
      const muzzleHole = cyl(0.05,0.05,0.04,12, dark); muzzleHole.rotation.x=Math.PI/2; muzzleHole.position.z=0.45;
      // 散热片
      for (let i=0;i<4;i++){
        const vent = box(0.2,0.2,0.02, plasticDk); vent.position.set(0,0,0.18+i*0.05); vent.rotation.z=Math.PI/4;
        g.add(vent);
      }
      // 陀螺仪三环
      const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.14,0.02,10,22), accent); ring1.position.z=0.12;
      const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.17,0.016,10,22), accent); ring2.position.z=0.08; ring2.rotation.y=Math.PI/2;
      const ring3 = new THREE.Mesh(new THREE.TorusGeometry(0.2,0.014,10,22), metal); ring3.position.z=0.04; ring3.rotation.x=Math.PI/2;
      // 内部陀螺核心
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.06,12,10), accent); core.position.z=0.12;
      // 侧面大齿轮
      const gearL = M.buildGear(0.07, metal, accent); gearL.position.set(-0.14,0.02,0.1); gearL.rotation.y=Math.PI/2;
      const gearR = M.buildGear(0.07, metal, accent); gearR.position.set(0.14,0.02,0.1); gearR.rotation.y=Math.PI/2;
      // 弹鼓（侧面）
      const drum = cyl(0.11,0.11,0.06,14, plasticDk); drum.rotation.z=Math.PI/2; drum.position.set(0,-0.12,0.05);
      const drumGear = M.buildGear(0.08, metal, accent); drumGear.position.set(0.04,-0.12,0.05); drumGear.rotation.y=Math.PI/2;
      // 瞄具
      const scopeBody = cyl(0.035,0.035,0.16,12, dark); scopeBody.rotation.x=Math.PI/2; scopeBody.position.set(0,0.15,0.12);
      const scopeLens = cyl(0.032,0.032,0.02,12, accent); scopeLens.rotation.x=Math.PI/2; scopeLens.position.set(0,0.15,0.21);
      const scopeMount = box(0.03,0.06,0.05, plasticDk); scopeMount.position.set(0,0.11,0.12);
      // 握把 + 扳机
      const grip = box(0.08,0.2,0.11, plastic); grip.position.set(0,-0.16,0.0); grip.rotation.x=0.25;
      const gripTex = box(0.085,0.1,0.115, rubber); gripTex.position.set(0,-0.18,0.0); gripTex.rotation.x=0.25;
      const triggerGuard = new THREE.Mesh(new THREE.TorusGeometry(0.04,0.008,6,12,Math.PI), plasticDk);
      triggerGuard.position.set(0,-0.06,0.04); triggerGuard.rotation.x=Math.PI/2;
      const trigger = box(0.015,0.04,0.02, metal); trigger.position.set(0,-0.05,0.04);
      // 枪托
      const stock = box(0.07,0.1,0.16, plastic); stock.position.set(0,-0.02,-0.18);
      const stockPad = box(0.08,0.12,0.03, rubber); stockPad.position.set(0,-0.02,-0.26);
      g.add(body,bodyBolt,muzzle,muzzleRing,muzzleHole,ring1,ring2,ring3,core,gearL,gearR,drum,drumGear,scopeBody,scopeLens,scopeMount,grip,gripTex,triggerGuard,trigger,stock,stockPad);
    } else {
      /* 泡泡枪：机身 + 炮管 + 弹匣 + 瞄具 + 枪托 + 气泡罐 + 齿轮 */
      const body = box(0.11,0.14,0.46, plastic); body.position.z=0.1;
      const bodyTop = box(0.09,0.04,0.4, plasticDk); bodyTop.position.set(0,0.09,0.08);
      // 炮管
      const barrel = cyl(0.034,0.038,0.26,12, plastic); barrel.rotation.x=Math.PI/2; barrel.position.set(0,0.01,0.38);
      const barrelShroud = cyl(0.05,0.05,0.1,12, plasticDk); barrelShroud.rotation.x=Math.PI/2; barrelShroud.position.set(0,0.01,0.32);
      // 炮口（气泡喷口）
      const muzzle = cyl(0.045,0.038,0.06,12, accent); muzzle.rotation.x=Math.PI/2; muzzle.position.set(0,0.01,0.52);
      const muzzleRing = new THREE.Mesh(new THREE.TorusGeometry(0.042,0.01,8,14), metal); muzzleRing.position.set(0,0.01,0.55);
      // 气泡罐（顶部）
      const tank = cyl(0.055,0.055,0.18,14, accent); tank.position.set(0,0.14,0.0);
      const tankCap = cyl(0.03,0.045,0.04,12, metal); tankCap.position.set(0,0.24,0.0);
      const tankWindow = cyl(0.057,0.057,0.06,14, mat(0xBFEAFF,0.2,0,{transparent:true,opacity:0.7})); tankWindow.position.set(0,0.12,0.0);
      // 弹匣
      const mag = box(0.07,0.18,0.1, plasticDk); mag.position.set(0,-0.14,0.06); mag.rotation.x=0.15;
      const magBase = box(0.08,0.03,0.11, accent); magBase.position.set(0,-0.23,0.075); magBase.rotation.x=0.15;
      // 瞄具
      const sightBase = box(0.04,0.03,0.1, plasticDk); sightBase.position.set(0,0.11,0.2);
      const sightPost = cyl(0.008,0.008,0.04,8, dark); sightPost.position.set(0,0.15,0.16);
      const sightRing = new THREE.Mesh(new THREE.TorusGeometry(0.025,0.006,6,14), dark); sightRing.position.set(0,0.15,0.24);
      // 握把 + 扳机
      const grip = box(0.08,0.2,0.11, plastic); grip.position.set(0,-0.14,0.0); grip.rotation.x=0.28;
      const gripTex = box(0.085,0.12,0.115, rubber); gripTex.position.set(0,-0.16,0.0); gripTex.rotation.x=0.28;
      const triggerGuard = new THREE.Mesh(new THREE.TorusGeometry(0.042,0.009,6,12,Math.PI), plasticDk);
      triggerGuard.position.set(0,-0.06,0.05); triggerGuard.rotation.x=Math.PI/2;
      const trigger = box(0.016,0.045,0.022, metal); trigger.position.set(0,-0.05,0.05);
      // 枪托
      const stock = box(0.08,0.11,0.18, plastic); stock.position.set(0,-0.01,-0.2);
      const stockPad = box(0.09,0.13,0.03, rubber); stockPad.position.set(0,-0.01,-0.29);
      // 侧面齿轮 + 通风口
      const gearL = M.buildGear(0.04, metal, accent); gearL.position.set(-0.07,0.02,0.08); gearL.rotation.y=Math.PI/2;
      const gearR = M.buildGear(0.04, metal, accent); gearR.position.set(0.07,0.02,0.08); gearR.rotation.y=Math.PI/2;
      for (let i=0;i<3;i++){
        const vent = box(0.02,0.06,0.02, dark); vent.position.set(0.058,0.02,0.18+i*0.05);
        const vent2 = box(0.02,0.06,0.02, dark); vent2.position.set(-0.058,0.02,0.18+i*0.05);
        g.add(vent,vent2);
      }
      g.add(body,bodyTop,barrel,barrelShroud,muzzle,muzzleRing,tank,tankCap,tankWindow,mag,magBase,sightBase,sightPost,sightRing,grip,gripTex,triggerGuard,trigger,stock,stockPad,gearL,gearR);
    }
    g.traverse(o=>{ if(o.isMesh) o.castShadow=true; });
    return g;
  };

  /* ---------- 发条哥斯拉 BOSS ---------- */
  M.buildGodzilla = function(){
    const scale = mat(0x3E8E7E,0.4,0.15);      // 主身体 青绿塑料
    const belly = mat(0x8FD6A8,0.45,0.05);     // 肚腹
    const plate = mat(0xFF8C42,0.35,0.2);      // 背鳍 橙
    const metal = mat(0x9AA0A8,0.3,0.6);       // 金属件
    const dark = mat(0x2E4A44,0.45,0.1);
    const g = new THREE.Group();

    // 躯干
    const torso = box(1.5,1.7,1.1, scale); torso.position.y=2.6;
    const bellyM = box(1.1,1.3,0.2, belly); bellyM.position.set(0,2.4,0.55);
    // 胸口齿轮（朝 +Z，无需 wrapper）
    const chestGear = M.buildGear(0.35, metal, 0xFFC93C); chestGear.position.set(0,2.9,0.58);
    // 头
    const headG = new THREE.Group();
    const skull = box(0.95,0.8,1.0, scale); skull.position.y=0.4;
    const jaw = box(0.8,0.3,0.9, dark); jaw.position.set(0,-0.05,0.15);
    // 眼睛（发光黄）
    const eyeMat = mat(0xFFE14D,0.2,0,{emissive:0xFFC93C,emissiveIntensity:0.9});
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.12,10,10), eyeMat); eyeL.position.set(-0.3,0.5,0.45);
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.12,10,10), eyeMat); eyeR.position.set(0.3,0.5,0.45);
    // 牙齿
    const toothMat = mat(0xFFF8E8,0.4);
    for (let i=0;i<5;i++){
      const t = new THREE.Mesh(new THREE.ConeGeometry(0.06,0.16,5), toothMat);
      t.position.set(-0.32+i*0.16,0.08,0.55); t.rotation.x=Math.PI;
      headG.add(t);
    }
    // 头顶天线
    const ant = cyl(0.03,0.03,0.5,6, metal); ant.position.set(0,1.0,-0.1); ant.rotation.x=-0.4;
    headG.add(skull,jaw,eyeL,eyeR,ant);
    headG.position.y=4.1;
    // 背鳍（一排橙色板）
    const plates=[];
    for (let i=0;i<6;i++){
      const ph = 0.5+Math.sin(i/5*Math.PI)*0.6;
      const p = box(0.12,ph,0.5, plate);
      p.position.set(0, 3.6-i*0.28, -0.55-i*0.06);
      p.rotation.x = -0.2+i*0.05;
      plates.push(p); g.add(p);
    }
    // 尾巴（3 节渐细）
    const tailSegs=[];
    let tz=-0.6;
    for (let i=0;i<4;i++){
      const s = box(0.7-i*0.13,0.6-i*0.11,0.8, scale);
      s.position.set(0,2.5-i*0.12,tz);
      tz-=0.7;
      tailSegs.push(s); g.add(s);
    }
    // 腿
    const legGeo = new THREE.BoxGeometry(0.5,1.4,0.6);
    const legL = new THREE.Mesh(legGeo, scale); legL.position.set(-0.5,0.9,0);
    const legR = new THREE.Mesh(legGeo, scale); legR.position.set(0.5,0.9,0);
    const footGeo = new THREE.BoxGeometry(0.6,0.25,0.9);
    const footL = new THREE.Mesh(footGeo, dark); footL.position.set(-0.5,0.12,0.1);
    const footR = new THREE.Mesh(footGeo, dark); footR.position.set(0.5,0.12,0.1);
    // 小手
    const armGeo = new THREE.BoxGeometry(0.25,0.8,0.3);
    const armL = new THREE.Mesh(armGeo, scale); armL.position.set(-0.9,2.6,0.2); armL.rotation.z=0.4;
    const armR = new THREE.Mesh(armGeo, scale); armR.position.set(0.9,2.6,0.2); armR.rotation.z=-0.4;
    // 背部发条钥匙（旋转）
    const keyG = new THREE.Group();
    const stem = cyl(0.08,0.08,0.3,8, metal); stem.rotation.x=Math.PI/2;
    const keyRing = new THREE.Mesh(new THREE.TorusGeometry(0.28,0.07,8,16), mat(0xFFC93C,0.3,0.5));
    const keyBar = box(0.7,0.1,0.08, mat(0xFFC93C,0.3,0.5));
    keyG.add(stem,keyRing,keyBar);
    keyG.position.set(0,3.1,-0.62);
    // 侧身齿轮（wrapper 定向：左朝 -X，右朝 +Z→+X）
    const gearWrapL = new THREE.Group(); gearWrapL.position.set(-0.78,2.8,0); gearWrapL.rotation.y=-Math.PI/2;
    const gearL = M.buildGear(0.3, metal, 0xFF8C42); gearWrapL.add(gearL);
    const gearWrapR = new THREE.Group(); gearWrapR.position.set(0.78,2.8,0); gearWrapR.rotation.y=Math.PI/2;
    const gearR = M.buildGear(0.3, metal, 0xFF8C42); gearWrapR.add(gearR);

    g.add(torso,bellyM,chestGear,headG,legL,legR,footL,footR,armL,armR,keyG,gearWrapL,gearWrapR);
    g.traverse(o=>{ if(o.isMesh){o.castShadow=true;o.receiveShadow=true;} });
    g.userData = {key:keyG, gearL, gearR, head:headG, legL, legR, armL, armR, tailSegs, plates, chestGear};
    return g;
  };

  /* ---------- 齿轮（盘面朝 +Z，绕 Z 旋转）---------- */
  M.buildGear = function(radius, metalMat, accentMat){
    const g = new THREE.Group();
    const disc = cyl(radius,radius,0.12,16, metalMat);
    disc.rotation.x = Math.PI/2; // 落入 XY 平面，朝 +Z
    g.add(disc);
    const teeth = 10;
    for (let i=0;i<teeth;i++){
      const a=i/teeth*Math.PI*2;
      const t = box(0.12,0.14,radius*0.5, accentMat||metalMat);
      t.position.set(Math.cos(a)*radius*1.05, Math.sin(a)*radius*1.05, 0);
      t.rotation.z = -a;
      g.add(t);
    }
    const hole = cyl(radius*0.3,radius*0.3,0.16,10, mat(0x43302B,0.5));
    hole.rotation.x = Math.PI/2;
    g.add(hole);
    return g;
  };

  /* ---------- 巨型书本掩体 ---------- */
  M.buildBook = function(w,h,d,color){
    const g = new THREE.Group();
    const cover = mat(color,0.45,0.02);
    const pages = mat(0xFFF6E3,0.75,0);
    const cm = box(w,h,d, cover);
    const pm = box(w*0.94,h*0.94,d*0.86, pages); pm.position.z=0.02;
    // 书脊色条
    const spine = box(w*0.06,h*0.98,d*1.02, mat(0x43302B,0.5)); spine.position.x=-w*0.47;
    // 封面图案小色块
    const patch = box(w*0.3,h*0.2,0.02, mat(0xFFC93C,0.4)); patch.position.set(w*0.2,h*0.25,d/2+0.01);
    g.add(cm,pm,spine,patch);
    g.traverse(o=>{ if(o.isMesh){o.castShadow=true;o.receiveShadow=true;} });
    return g;
  };

  /* ---------- 高多边形障碍 / 高台 ---------- */

  // 木箱（带倒角 + 交叉支撑 + 铁角）
  M.buildCrate = function(size, color){
    const g = new THREE.Group();
    const wood = mat(color||0xC98B5E,0.6,0.05);
    const woodDk = mat(0x8A5A3B,0.65,0.05);
    const metal = mat(0x9AA0A8,0.35,0.6);
    const s = size, t = s*0.08;
    // 六面木板
    const faceF = box(s, s, t, wood); faceF.position.z = s/2-t/2;
    const faceB = box(s, s, t, wood); faceB.position.z = -s/2+t/2;
    const faceL = box(t, s, s, wood); faceL.position.x = -s/2+t/2;
    const faceR = box(t, s, s, wood); faceR.position.x = s/2-t/2;
    const faceT = box(s, t, s, woodDk); faceT.position.y = s/2-t/2;
    const faceBo = box(s, t, s, woodDk); faceBo.position.y = -s/2+t/2;
    // 交叉支撑（两侧斜板）
    const brace1 = box(s*1.3, t*0.8, t*0.6, woodDk);
    brace1.position.set(0,0,s/2+t/2); brace1.rotation.z = 0.7;
    const brace2 = box(s*1.3, t*0.8, t*0.6, woodDk);
    brace2.position.set(0,0,s/2+t/2); brace2.rotation.z = -0.7;
    // 铁角（8 个）
    const corners = [[-1,-1],[1,-1],[-1,1],[1,1]];
    corners.forEach(([sx,sy])=>{
      const c1 = box(t*2,t*2,t*0.6, metal); c1.position.set(sx*s/2, sy*s/2, s/2+t/2);
      const c2 = box(t*2,t*2,t*0.6, metal); c2.position.set(sx*s/2, sy*s/2, -s/2-t/2);
      g.add(c1,c2);
    });
    // 顶部把手
    const handle = new THREE.Mesh(new THREE.TorusGeometry(s*0.12, t*0.4, 6, 12, Math.PI), metal);
    handle.position.set(0, s/2, 0);
    g.add(faceF,faceB,faceL,faceR,faceT,faceBo,brace1,brace2,handle);
    g.traverse(o=>{ if(o.isMesh){o.castShadow=true;o.receiveShadow=true;} });
    return g;
  };

  // 书架（多层 + 摆满书 + 装饰）
  M.buildBookshelf = function(w,h,d){
    const g = new THREE.Group();
    const wood = mat(0xA96F42,0.55,0.05);
    const woodDk = mat(0x8A5A3B,0.6,0.05);
    const shelfColor = 0xFFF6E3;
    const bookColors = [0xE2574C,0x4C8DE2,0x6FD9A7,0xFFC93C,0xA78BFA,0xFF9F45,0x5BB8E8];
    // 两侧立板 + 顶底
    const sideL = box(d*0.5, h, d, wood); sideL.position.set(-w/2, h/2, 0);
    const sideR = box(d*0.5, h, d, wood); sideR.position.set(w/2, h/2, 0);
    const top = box(w, d*0.4, d, woodDk); top.position.set(0, h, 0);
    const bottom = box(w, d*0.4, d, woodDk); bottom.position.set(0, d*0.2, 0);
    const back = box(w, h, d*0.1, woodDk); back.position.set(0, h/2, -d/2);
    g.add(sideL,sideR,top,bottom,back);
    // 层板 + 书
    const levels = Math.max(2, Math.floor(h/0.7));
    for (let i=0;i<levels;i++){
      const ly = (i+1)*(h/(levels+1));
      const shelf = box(w-d*0.5, d*0.15, d*0.9, wood); shelf.position.set(0, ly, 0);
      g.add(shelf);
      // 该层摆书
      let bx = -w/2 + d*0.6;
      while (bx < w/2 - d*0.6){
        const bw = 0.08+Math.random()*0.1;
        const bh = d*0.5+Math.random()*d*0.25;
        const bk = box(bw, bh, d*0.7, mat(bookColors[Math.floor(Math.random()*bookColors.length)],0.5));
        bk.position.set(bx+bw/2, ly+d*0.075+bh/2, 0);
        bk.rotation.z = (Math.random()-0.5)*0.15;
        g.add(bk);
        bx += bw + 0.02;
      }
    }
    // 顶部装饰小物件
    const clock = cyl(0.12,0.12,0.08,12, mat(0xFFC93C,0.4,0.3)); clock.position.set(w*0.3, h+d*0.25, 0);
    const clockFace = cyl(0.1,0.1,0.02,12, mat(0xFFF8E8,0.4)); clockFace.position.set(w*0.3, h+d*0.25, d*0.05);
    const plant = cyl(0.08,0.06,0.18,8, mat(0x8A5A3B,0.6)); plant.position.set(-w*0.3, h+d*0.2, 0);
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.14,8,8), mat(0x6FD9A7,0.6)); leaf.position.set(-w*0.3, h+d*0.35, 0);
    g.add(clock,clockFace,plant,leaf);
    g.traverse(o=>{ if(o.isMesh){o.castShadow=true;o.receiveShadow=true;} });
    return g;
  };

  // 楼梯（阶梯高台）
  M.buildStairs = function(width, steps, stepH, stepD, color){
    const g = new THREE.Group();
    const wood = mat(color||0xC98B5E,0.6,0.05);
    const woodDk = mat(0x8A5A3B,0.6,0.05);
    const metal = mat(0xD8B84A,0.3,0.6);
    for (let i=0;i<steps;i++){
      const sh = stepH*(i+1);
      const step = box(width, sh, stepD, i%2?wood:woodDk);
      step.position.set(0, sh/2, -i*stepD);
      g.add(step);
      // 每级前沿金属条
      const edge = box(width, stepH*0.3, 0.04, metal);
      edge.position.set(0, sh-stepH*0.15, -i*stepD+stepD/2);
      g.add(edge);
    }
    // 两侧扶手
    const railL = box(0.06, 0.06, steps*stepD, woodDk);
    railL.position.set(-width/2, steps*stepH*0.6, -steps*stepD/2+stepD/2); railL.rotation.x = -Math.atan2(steps*stepH, steps*stepD);
    const railR = railL.clone(); railR.position.x = width/2;
    g.add(railL, railR);
    g.traverse(o=>{ if(o.isMesh){o.castShadow=true;o.receiveShadow=true;} });
    return g;
  };

  // 双层床（高层平台 + 梯子 + 护栏）
  M.buildBunkBed = function(w, l, h){
    const g = new THREE.Group();
    const frame = mat(0x5BB8E8,0.5,0.1);
    const frameDk = mat(0x2E86C1,0.5,0.1);
    const mattress = mat(0xFFF6E3,0.8);
    const blanket = mat(0xFF8C94,0.7);
    const pillow = mat(0xFFFFFF,0.8);
    const ladder = mat(0x9AA0A8,0.4,0.5);
    // 四柱
    const ph = h;
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>{
      const post = cyl(0.07,0.07,ph,8, frame);
      post.position.set(sx*w/2, ph/2, sz*l/2);
      g.add(post);
    });
    // 上下铺板
    const topY = h*0.62, botY = h*0.3;
    const topFrame = box(w, 0.12, l, frame); topFrame.position.y = topY;
    const botFrame = box(w, 0.12, l, frame); botFrame.position.y = botY;
    g.add(topFrame, botFrame);
    // 床垫 + 毯子 + 枕头（上下）
    const topMatt = box(w*0.92, 0.16, l*0.92, mattress); topMatt.position.y = topY+0.14;
    const topBlank = box(w*0.92, 0.1, l*0.5, blanket); topBlank.position.set(0, topY+0.24, l*0.2);
    const topPill = box(w*0.3, 0.14, l*0.22, pillow); topPill.position.set(0, topY+0.24, -l*0.32);
    const botMatt = box(w*0.92, 0.16, l*0.92, mattress); botMatt.position.y = botY+0.14;
    const botBlank = box(w*0.92, 0.1, l*0.5, blanket); botBlank.position.set(0, botY+0.24, l*0.2);
    g.add(topMatt,topBlank,topPill,botMatt,botBlank);
    // 上铺护栏
    const rail1 = box(w, 0.08, 0.08, frameDk); rail1.position.set(0, topY+0.3, -l/2);
    const rail2 = box(0.08, 0.3, l, frameDk); rail2.position.set(-w/2, topY+0.15, 0);
    const rail3 = box(0.08, 0.3, l, frameDk); rail3.position.set(w/2, topY+0.15, 0);
    g.add(rail1,rail2,rail3);
    // 梯子（一侧）
    for (let i=0;i<6;i++){
      const rung = cyl(0.03,0.03,0.5,6, ladder);
      rung.rotation.z = Math.PI/2;
      rung.position.set(w/2+0.2, 0.2+i*(topY/6), l/2-0.1);
      g.add(rung);
    }
    const lrail = box(0.05, topY, 0.05, ladder); lrail.position.set(w/2+0.2, topY/2, l/2-0.35);
    const lrail2 = box(0.05, topY, 0.05, ladder); lrail2.position.set(w/2+0.2, topY/2, l/2+0.15);
    g.add(lrail, lrail2);
    g.traverse(o=>{ if(o.isMesh){o.castShadow=true;o.receiveShadow=true;} });
    return g;
  };

  // 滑梯
  M.buildSlide = function(){
    const g = new THREE.Group();
    const metal = mat(0xFF6B5B,0.4,0.3);
    const metalDk = mat(0xC73E2A,0.45,0.3);
    const ladder = mat(0x9AA0A8,0.4,0.5);
    const H = 3.2, W = 1.0;
    // 平台
    const plat = box(W, 0.15, W, metal); plat.position.set(0, H, 0);
    // 护栏
    const prail = box(W, 0.06, 0.06, metalDk); prail.position.set(0, H+0.3, -W/2);
    const prail2 = box(0.06, 0.3, W, metalDk); prail2.position.set(-W/2, H+0.15, 0);
    g.add(plat, prail, prail2);
    // 梯子
    for (let i=0;i<7;i++){
      const rung = cyl(0.025,0.025,0.5,6, ladder);
      rung.rotation.z = Math.PI/2; rung.position.set(0, 0.2+i*(H/7), W/2-0.05);
      g.add(rung);
    }
    // 滑道（斜面 + 两侧）
    const slideLen = 3.6;
    const slope = box(W, 0.08, slideLen, metal);
    slope.position.set(0, H/2, W/2+slideLen/2*0.8);
    slope.rotation.x = -0.5;
    const side1 = box(0.05, 0.25, slideLen, metalDk);
    side1.position.set(-W/2, H/2+0.12, W/2+slideLen/2*0.8); side1.rotation.x = -0.5;
    const side2 = side1.clone(); side2.position.x = W/2;
    g.add(slope, side1, side2);
    g.traverse(o=>{ if(o.isMesh){o.castShadow=true;o.receiveShadow=true;} });
    return g;
  };

  // 玩具城堡（多塔 + 城墙）
  M.buildToyCastle = function(){
    const g = new THREE.Group();
    const stone = mat(0xE8DCC8,0.7,0.02);
    const stoneDk = mat(0xC9B99E,0.7,0.02);
    const roof = mat(0xE2574C,0.5,0.1);
    const roofDk = mat(0xB03A2E,0.5,0.1);
    const flag = mat(0xFFC93C,0.4,0.2);
    // 主堡
    const main = box(2.0, 2.4, 2.0, stone); main.position.y = 1.2;
    const mainRoof = new THREE.Mesh(new THREE.ConeGeometry(1.5, 1.2, 4), roof);
    mainRoof.position.y = 3.0; mainRoof.rotation.y = Math.PI/4;
    g.add(main, mainRoof);
    // 角塔
    const towers = [[-1.1,-1.1],[1.1,-1.1],[-1.1,1.1],[1.1,1.1]];
    towers.forEach(([tx,tz],i)=>{
      const tw = cyl(0.4,0.45,2.8,10, stoneDk); tw.position.set(tx, 1.4, tz);
      const tr = new THREE.Mesh(new THREE.ConeGeometry(0.55,0.9,10), i%2?roofDk:roof);
      tr.position.set(tx, 3.25, tz);
      const twin = cyl(0.06,0.06,0.3,6, stone); twin.position.set(tx, 2.9, tz+0.4);
      g.add(tw, tr, twin);
    });
    // 城门
    const gate = box(0.7, 1.0, 0.2, stoneDk); gate.position.set(0, 0.5, 1.05);
    const door = cyl(0.3,0.3,0.1,12, mat(0x6B4423,0.6)); door.rotation.x=Math.PI/2; door.position.set(0, 0.4, 1.16);
    g.add(gate, door);
    // 雉堞
    for (let i=-2;i<=2;i++){
      const cren = box(0.25,0.3,0.25, stone); cren.position.set(i*0.4, 2.55, 1.0);
      const cren2 = box(0.25,0.3,0.25, stone); cren2.position.set(i*0.4, 2.55, -1.0);
      g.add(cren, cren2);
    }
    // 旗帜
    const pole = cyl(0.03,0.03,0.8,6, stoneDk); pole.position.set(0, 4.0, 0);
    const fl = box(0.4,0.25,0.02, flag); fl.position.set(0.2, 4.2, 0);
    g.add(pole, fl);
    g.traverse(o=>{ if(o.isMesh){o.castShadow=true;o.receiveShadow=true;} });
    return g;
  };

  // 置物架 / 柜
  M.buildShelf = function(w,h,d){
    const g = new THREE.Group();
    const wood = mat(0xD9A066,0.6,0.05);
    const woodDk = mat(0xB5764A,0.6,0.05);
    // 柜体
    const body = box(w, h, d, wood); body.position.y = h/2;
    // 层板
    const sh = h/3;
    for (let i=1;i<3;i++){
      const shelf = box(w*0.96, 0.05, d*0.96, woodDk); shelf.position.set(0, i*sh, 0);
      g.add(shelf);
    }
    // 柜门缝
    const seam = box(0.03, h*0.9, 0.02, woodDk); seam.position.set(0, h/2, d/2+0.01);
    const knob1 = cyl(0.04,0.04,0.05,8, mat(0xD8B84A,0.3,0.6)); knob1.rotation.x=Math.PI/2; knob1.position.set(-w*0.2, h/2, d/2+0.05);
    const knob2 = knob1.clone(); knob2.position.x = w*0.2;
    g.add(body, seam, knob1, knob2);
    g.traverse(o=>{ if(o.isMesh){o.castShadow=true;o.receiveShadow=true;} });
    return g;
  };

  // 木桶
  M.buildBarrel = function(r, h){
    const g = new THREE.Group();
    const wood = mat(0xA96F42,0.6,0.05);
    const hoop = mat(0x9AA0A8,0.35,0.6);
    // 桶身（用圆柱 + 上下箍）
    const body = cyl(r, r*0.85, h, 14, wood);
    body.position.y = h/2;
    const hoop1 = cyl(r*1.05, r*1.05, 0.08, 14, hoop); hoop1.position.y = h*0.2;
    const hoop2 = cyl(r*1.05, r*1.05, 0.08, 14, hoop); hoop2.position.y = h*0.8;
    const top = cyl(r*0.9, r*0.9, 0.06, 14, wood); top.position.y = h;
    g.add(body, hoop1, hoop2, top);
    g.traverse(o=>{ if(o.isMesh){o.castShadow=true;o.receiveShadow=true;} });
    return g;
  };

  // 积木塔（堆叠彩色积木）
  M.buildBlockTower = function(){
    const g = new THREE.Group();
    const colors = [0xFF6B5B,0xFFC93C,0x5BB8E8,0x6FD9A7,0xA78BFA,0xFF9F45];
    let y = 0;
    for (let i=0;i<7;i++){
      const s = 0.7 - i*0.05;
      const b = box(s, s*0.8, s, mat(colors[i%6],0.5));
      b.position.set((Math.random()-0.5)*0.2, y+s*0.4, (Math.random()-0.5)*0.2);
      b.rotation.y = Math.random()*0.5;
      g.add(b);
      // 积木凸点
      for (let dx=-1;dx<=1;dx++) for (let dz=-1;dz<=1;dz++){
        const stud = cyl(0.06,0.06,0.05,8, mat(colors[i%6],0.5));
        stud.position.set(b.position.x+dx*s*0.28, y+s*0.8+0.025, b.position.z+dz*s*0.28);
        g.add(stud);
      }
      y += s*0.8;
    }
    g.traverse(o=>{ if(o.isMesh){o.castShadow=true;o.receiveShadow=true;} });
    return g;
  };

  /* ---------- 台灯（主光源）---------- */
  M.buildLamp = function(){
    const g = new THREE.Group();
    const metal = mat(0xE86A5A,0.35,0.3);
    const base = cyl(0.35,0.4,0.08,16, metal); base.position.y=0.04;
    const pole = cyl(0.05,0.05,1.6,10, metal); pole.position.y=0.85;
    const joint = new THREE.Mesh(new THREE.SphereGeometry(0.1,10,10), metal); joint.position.y=1.65;
    const arm = cyl(0.045,0.045,1.1,10, metal);
    arm.position.set(0.3,2.0,0); arm.rotation.z=-0.9;
    // 灯罩（内发光）
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.42,0.5,16,1,true),
      new THREE.MeshStandardMaterial({color:0xFFB347, roughness:0.4, side:THREE.DoubleSide,
        emissive:0xFF9F45, emissiveIntensity:0.35}));
    shade.position.set(0.62,2.25,0);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12,10,10),
      new THREE.MeshStandardMaterial({color:0xFFF2C8, emissive:0xFFD98A, emissiveIntensity:1.4}));
    bulb.position.set(0.62,2.12,0);
    g.add(base,pole,joint,arm,shade,bulb);
    g.traverse(o=>{ if(o.isMesh) o.castShadow=true; });
    g.userData = {bulb, shade};
    return g;
  };

  /* ---------- 发条八音盒（商人）---------- */
  M.buildMusicBox = function(){
    const g = new THREE.Group();
    const wood = mat(0xC98B5E,0.5,0.05);
    const woodDk = mat(0xA96F42,0.5,0.05);
    const metal = mat(0xD8B84A,0.3,0.6);
    // 盒身
    const body = box(1.2,0.7,0.9, wood); body.position.y=0.35;
    // 盖子（可开）
    const lid = box(1.2,0.12,0.9, woodDk); lid.position.set(0,0.76,-0.42);
    const lidPivot = new THREE.Group();
    lidPivot.position.set(0,0.7,-0.45);
    lid.position.set(0,0.06,0.45);
    lidPivot.add(lid);
    // 正面大齿轮（默认朝 +Z）
    const gear = M.buildGear(0.3, metal, mat(0xFF6B5B,0.35,0.3));
    gear.position.set(0,0.4,0.46);
    // 侧面发条摇把
    const crank = new THREE.Group();
    const cStem = cyl(0.04,0.04,0.25,8, metal); cStem.rotation.z=Math.PI/2; cStem.position.x=0.7;
    const cHandle = cyl(0.07,0.07,0.06,8, mat(0xFF6B5B,0.4)); cHandle.rotation.z=Math.PI/2; cHandle.position.x=0.85;
    crank.add(cStem,cHandle);
    crank.position.y=0.45;
    // 内部八音滚筒（开盖时可见）
    const roller = cyl(0.12,0.12,0.5,10, metal); roller.rotation.z=Math.PI/2; roller.position.set(0,0.55,0);
    // 底座小轮子
    const wheelGeo = new THREE.CylinderGeometry(0.14,0.14,0.08,12);
    const wheelMat = mat(0x8A5A3B,0.5);
    const w1 = new THREE.Mesh(wheelGeo, wheelMat); w1.rotation.z=Math.PI/2; w1.position.set(-0.4,0.14,0.4);
    const w2 = new THREE.Mesh(wheelGeo, wheelMat); w2.rotation.z=Math.PI/2; w2.position.set(0.4,0.14,0.4);
    const w3 = new THREE.Mesh(wheelGeo, wheelMat); w3.rotation.z=Math.PI/2; w3.position.set(-0.4,0.14,-0.4);
    const w4 = new THREE.Mesh(wheelGeo, wheelMat); w4.rotation.z=Math.PI/2; w4.position.set(0.4,0.14,-0.4);

    g.add(body,lidPivot,gear,crank,roller,w1,w2,w3,w4);
    g.traverse(o=>{ if(o.isMesh){o.castShadow=true;o.receiveShadow=true;} });
    g.userData = {lid:lidPivot, gear, crank, roller};
    return g;
  };

  /* ---------- 纸飞机 ---------- */
  M.buildPaperPlane = function(){
    const g = new THREE.Group();
    const paper = mat(0xFFFFFF,0.6,0,{side:THREE.DoubleSide});
    const paperB = mat(0xE8F2FF,0.6,0,{side:THREE.DoubleSide});
    // 两翼三角（机头朝 +Z，配合 lookAt）
    const wingGeo = new THREE.BufferGeometry();
    wingGeo.setAttribute('position', new THREE.Float32BufferAttribute([
      0,0,0.5,  -0.55,0.08,-0.45,  0,0.02,-0.4,
      0,0,0.5,   0,0.02,-0.4,  0.55,0.08,-0.45
    ],3));
    wingGeo.computeVertexNormals();
    const wing = new THREE.Mesh(wingGeo, paper);
    const wing2 = new THREE.Mesh(wingGeo, paperB);
    wing2.scale.set(1,1,1); wing2.rotation.y=0; // 底层
    g.add(wing,wing2);
    g.traverse(o=>{ if(o.isMesh) o.castShadow=true; });
    return g;
  };

  /* ---------- 齿轮拾取物（平躺地面，绕自身法线旋转）---------- */
  M.buildGearPickup = function(){
    const g = M.buildGear(0.22, mat(0xD8B84A,0.3,0.6), mat(0xFFC93C,0.3,0.4));
    g.rotation.x = -Math.PI/2; // 法线 +Z → 朝上 +Y
    return g;
  };

  /* ---------- 儿童房间 ---------- */
  M.buildRoom = function(){
    const group = new THREE.Group();
    const W=34, D=26, H=9;

    // 地板（拼木地板）
    const floorMat = new THREE.MeshStandardMaterial({map:M.parquetTexture(), roughness:0.7, metalness:0.02});
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W,D), floorMat);
    floor.rotation.x=-Math.PI/2; floor.receiveShadow=true;
    group.add(floor);

    // 地毯
    const rug = new THREE.Mesh(new THREE.CircleGeometry(4.5,32),
      new THREE.MeshStandardMaterial({map:M.rugTexture(), roughness:0.85}));
    rug.rotation.x=-Math.PI/2; rug.position.y=0.02; rug.receiveShadow=true;
    group.add(rug);

    // 墙壁（柔和奶油色 + 淡蓝点缀）
    const wallMat = mat(0xFFF3DC,0.85,0);
    const wallMat2 = mat(0xE8F4FF,0.85,0);
    const mkWall=(w,h,px,py,pz,ry,m)=>{
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(w,h), m);
      wall.position.set(px,py,pz); wall.rotation.y=ry; wall.receiveShadow=true;
      group.add(wall);
    };
    mkWall(W,H, 0,H/2,-D/2, 0, wallMat);       // 北（窗）
    mkWall(W,H, 0,H/2, D/2, Math.PI, wallMat2); // 南
    mkWall(D,H, -W/2,H/2,0, Math.PI/2, wallMat2);// 西
    mkWall(D,H,  W/2,H/2,0, -Math.PI/2, wallMat);// 东

    // 踢脚线
    const skirt = mat(0xFFFFFF,0.6,0);
    const sk1 = box(W,0.35,0.08, skirt); sk1.position.set(0,0.17,-D/2+0.04);
    const sk2 = box(W,0.35,0.08, skirt); sk2.position.set(0,0.17,D/2-0.04);
    const sk3 = box(0.08,0.35,D, skirt); sk3.position.set(-W/2+0.04,0.17,0);
    const sk4 = box(0.08,0.35,D, skirt); sk4.position.set(W/2-0.04,0.17,0);
    group.add(sk1,sk2,sk3,sk4);

    // 窗户（北墙）蓝色发光 + 窗框
    const winFrame = mat(0xFFFFFF,0.5,0.05);
    const winGlass = new THREE.Mesh(new THREE.PlaneGeometry(5,4),
      new THREE.MeshStandardMaterial({color:0xBFE6FF, emissive:0x9FD4FF, emissiveIntensity:0.5, roughness:0.2}));
    winGlass.position.set(0,4.5,-D/2+0.06);
    const wf1 = box(5.4,0.25,0.15, winFrame); wf1.position.set(0,6.6,-D/2+0.08);
    const wf2 = box(5.4,0.25,0.15, winFrame); wf2.position.set(0,2.5,-D/2+0.08);
    const wf3 = box(0.25,4.4,0.15, winFrame); wf3.position.set(-2.7,4.55,-D/2+0.08);
    const wf4 = box(0.25,4.4,0.15, winFrame); wf4.position.set(2.7,4.55,-D/2+0.08);
    const wf5 = box(0.12,4.4,0.12, winFrame); wf5.position.set(0,4.55,-D/2+0.08);
    group.add(winGlass,wf1,wf2,wf3,wf4,wf5);
    // 窗台小盆栽
    const pot = cyl(0.25,0.18,0.35,10, mat(0xFF8C42,0.6)); pot.position.set(3.4,2.7,-D/2+0.3);
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.3,10,8), mat(0x6FD9A7,0.6));
    leaf.position.set(3.4,3.1,-D/2+0.3); leaf.scale.y=0.8;
    group.add(pot,leaf);

    // 床（东南角）
    const bedFrame = mat(0xC98B5E,0.6);
    const bed = box(4.5,0.7,6, bedFrame); bed.position.set(10,0.35,7.5);
    const mattress = box(4.2,0.4,5.6, mat(0xFFF6E3,0.8)); mattress.position.set(10,0.85,7.5);
    const blanket = box(4.3,0.25,3.4, mat(0xFF8C94,0.7)); blanket.position.set(10,1.05,8.6);
    const pillow = box(1.6,0.35,1, mat(0xFFFFFF,0.8)); pillow.position.set(10,1.15,5.4);
    group.add(bed,mattress,blanket,pillow);

    // 书桌 + 台灯（西北角）
    const desk = box(5,0.25,2.5, mat(0xD9A066,0.6)); desk.position.set(-11,1.6,-8);
    const dleg1 = box(0.2,1.6,0.2, mat(0xA96F42,0.6)); dleg1.position.set(-13,0.8,-9);
    const dleg2 = box(0.2,1.6,0.2, mat(0xA96F42,0.6)); dleg2.position.set(-9,0.8,-9);
    const dleg3 = box(0.2,1.6,0.2, mat(0xA96F42,0.6)); dleg3.position.set(-13,0.8,-7);
    const dleg4 = box(0.2,1.6,0.2, mat(0xA96F42,0.6)); dleg4.position.set(-9,0.8,-7);
    const lamp = M.buildLamp(); lamp.position.set(-11,1.72,-8);
    group.add(desk,dleg1,dleg2,dleg3,dleg4,lamp);

    // 玩具箱（西南）
    const chest = box(3,1.6,2, mat(0x5BB8E8,0.55,0.05)); chest.position.set(-12,0.8,9);
    const chestLid = box(3.1,0.25,2.1, mat(0x2E86C1,0.5)); chestLid.position.set(-12,1.7,9);
    group.add(chest,chestLid);

    // 泰迪熊（东墙边）
    const bearMat = mat(0xC98B5B,0.7);
    const bearBody = new THREE.Mesh(new THREE.SphereGeometry(0.8,14,12), bearMat); bearBody.position.set(14,0.8,2);
    const bearHead = new THREE.Mesh(new THREE.SphereGeometry(0.55,14,12), bearMat); bearHead.position.set(14,2.0,2);
    const bearEarL = new THREE.Mesh(new THREE.SphereGeometry(0.22,10,8), bearMat); bearEarL.position.set(13.5,2.4,2);
    const bearEarR = new THREE.Mesh(new THREE.SphereGeometry(0.22,10,8), bearMat); bearEarR.position.set(14.5,2.4,2);
    const bearMuzzle = new THREE.Mesh(new THREE.SphereGeometry(0.25,10,8), mat(0xF2D8B0,0.7)); bearMuzzle.position.set(14,1.9,2.5); bearMuzzle.scale.z=0.7;
    group.add(bearBody,bearHead,bearEarL,bearEarR,bearMuzzle);

    // 散落的积木块
    const blockColors=[0xFF6B5B,0xFFC93C,0x5BB8E8,0x6FD9A7,0xA78BFA,0xFF9F45];
    for (let i=0;i<26;i++){
      const s=0.3+Math.random()*0.35;
      const b = box(s,s,s, mat(blockColors[i%6],0.5));
      b.position.set((Math.random()-0.5)*26, s/2, (Math.random()-0.5)*18);
      b.rotation.y=Math.random()*Math.PI;
      group.add(b);
    }
    // 蜡笔
    for (let i=0;i<8;i++){
      const cr = cyl(0.05,0.05,0.5,8, mat(blockColors[i%6],0.5));
      cr.position.set((Math.random()-0.5)*24, 0.05, (Math.random()-0.5)*16);
      cr.rotation.z=Math.PI/2; cr.rotation.y=Math.random()*Math.PI;
      group.add(cr);
    }
    // 皮球
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.5,16,12), mat(0xFF6B5B,0.45));
    ball.position.set(6,0.5,-2); ball.castShadow=true;
    group.add(ball);

    // 墙面装饰画（小相框）
    const frame = mat(0x8A5A3B,0.5);
    const pic1 = box(1.6,1.2,0.06, mat(0xFFE08A,0.6)); pic1.position.set(-6,5.5,-D/2+0.05);
    const fr1 = box(1.8,1.4,0.04, frame); fr1.position.set(-6,5.5,-D/2+0.04);
    const pic2 = box(1.2,1.2,0.06, mat(0x8AD6FF,0.6)); pic2.position.set(6,5.5,-D/2+0.05);
    const fr2 = box(1.4,1.4,0.04, frame); fr2.position.set(6,5.5,-D/2+0.04);
    group.add(fr1,pic1,fr2,pic2);

    group.userData = {W,D,H,lamp};
    return group;
  };

  window.Models = M;
})();
