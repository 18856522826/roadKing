/**
 * ============================================================================
 * 《地平线狂飙：无尽公路》(Horizon Overdrive) - 28 主题地图路段 Stylized Low-Poly 3D 场景引擎 (drive-maps.js)
 * ============================================================================
 * 模块职责：
 * 1. ROUTE_SEGMENTS         : 统一维护 28 个主题地图路段配置、基础长度、专属地表/路肩/护栏配色方案。
 * 2. shuffleRoute()         : 路线随机洗牌、动态长度分配与 Y 字高速分岔口 (fork) 标记生成器。
 * 3. getSegmentAt()         : 根据行驶总里程实时解算当前所处路段、剩余距离与下一站信息。
 * 4. getSliceIndex()        : 计算 30 个 45m 道路切片的滚动循环索引。
 * 5. getTunnelFactor()      : 计算穿山隧道与深山长隧的进出洞明暗平滑过渡系数。
 * 6. createLandscapeManager : 精致低多边形 (Stylized Low-Poly) 3D 景观预烘焙构建器与动态地表/护栏切换器。
 *
 * 导出约定：
 * 挂载至 window.__HD_MAPS__，供 drive.js 中的正常模式与狂暴模式共同复用，消除双份冗余代码。
 * ============================================================================
 */
"use strict";
(() => {
  const {
    ee,
    ke,
    F,
    ye,
    qe,
    DA,
    tt,
    Wa,
    lt,
    hi,
    Ee,
    tn,
    oe
  } = window.__HD_VENDOR__;

  // ==========================================================================
  // 一、28 个主题地图路段定义与专属地表/路肩/护栏视觉配色表
  // ==========================================================================
  const ROUTE_SEGMENTS = [
    { kind: "mountain",   name: "青岚山道",   nameEn: "Misty Peaks",        length: 540, floor: "#4e6b36", shoulder: "#687a52", rail: "#9aa8a6" },
    { kind: "city",       name: "向晚新城",   nameEn: "Dusk Metro",         length: 630, floor: "#3b424c", shoulder: "#575f6b", rail: "#8ba0b5" },
    { kind: "tunnel",     name: "穿山隧道",   nameEn: "Mountain Tunnel",    length: 360, floor: "#2c3138", shoulder: "#484d54", rail: "#d6a64f" },
    { kind: "coast",      name: "晴海公路",   nameEn: "Sunny Coast",        length: 630, floor: "#d6c18a", shoulder: "#b8a678", rail: "#bfd6de" },
    { kind: "forest",     name: "杉林长路",   nameEn: "Cedar Woods",        length: 450, floor: "#3d592b", shoulder: "#596e46", rail: "#8c6d53" },
    { kind: "desert",     name: "赤岩荒漠",   nameEn: "Redrock Desert",     length: 630, floor: "#c99762", shoulder: "#b38354", rail: "#b86b52" },
    { kind: "farmland",   name: "风车田野",   nameEn: "Windmill Fields",    length: 630, floor: "#6e8a42", shoulder: "#879658", rail: "#a8845e" },
    { kind: "snow",       name: "霜岭雪道",   nameEn: "Frost Ridge",        length: 630, floor: "#dce6ed", shoulder: "#bccbd6", rail: "#8ab4cc" },
    { kind: "bridge",     name: "碧海大桥",   nameEn: "Azure Sea Bridge",   length: 630, floor: "#285f78", shoulder: "#7c8792", rail: "#d8e2e8" },
    { kind: "autumn",     name: "枫叶山谷",   nameEn: "Maple Valley",       length: 540, floor: "#8c5e3c", shoulder: "#9e734e", rail: "#9e7b66" },
    { kind: "harbor",     name: "远湾港区",   nameEn: "Farbay Harbor",      length: 630, floor: "#4b525c", shoulder: "#656d78", rail: "#d9a74a" },
    { kind: "sakura",     name: "樱花大道",   nameEn: "Sakura Avenue",      length: 630, floor: "#6b8558", shoulder: "#9e858d", rail: "#d9bdc8" },
    { kind: "bamboo",     name: "翠竹长廊",   nameEn: "Bamboo Grove",       length: 630, floor: "#44633f", shoulder: "#627858", rail: "#739468" },
    { kind: "wetland",    name: "芦苇湖畔",   nameEn: "Reed Wetland",       length: 630, floor: "#376878", shoulder: "#647a65", rail: "#8f785d" },
    { kind: "vineyard",   name: "葡萄庄园",   nameEn: "Vineyard Hills",     length: 630, floor: "#637d44", shoulder: "#7d8c5a", rail: "#9c9588" },
    { kind: "canyon",     name: "层岩峡谷",   nameEn: "Grand Canyon",       length: 630, floor: "#a86544", shoulder: "#94573b", rail: "#b57453" },
    { kind: "solar",      name: "光伏原野",   nameEn: "Solar Plains",       length: 630, floor: "#b89f72", shoulder: "#968565", rail: "#95adc2" },
    { kind: "village",    name: "山间小镇",   nameEn: "Alpine Village",     length: 630, floor: "#58753e", shoulder: "#74825c", rail: "#9e7f60" },
    { kind: "airport",    name: "空港公路",   nameEn: "Airport Expressway", length: 630, floor: "#525a63", shoulder: "#6c7580", rail: "#9cb3c9" },
    { kind: "flowers",    name: "花海原野",   nameEn: "Blossom Meadow",     length: 630, floor: "#628244", shoulder: "#7d915c", rail: "#d6d2c4" },
    { kind: "redwoods",   name: "红杉林谷",   nameEn: "Redwood Valley",     length: 630, floor: "#5e4332", shoulder: "#6e523f", rail: "#8a5240" },
    { kind: "industrial", name: "工业外环",   nameEn: "Industrial Ring",    length: 630, floor: "#464a52", shoulder: "#5e626b", rail: "#858c96" },
    { kind: "deepTunnel", name: "深山长隧",   nameEn: "Deep Alpine Tunnel", length: 1800, floor: "#22262e", shoulder: "#3b404a", rail: "#d98a3b" },
    { kind: "boulevard",  name: "双向大道",   nameEn: "Twin Boulevard",     length: 1080, floor: "#4a6642", shoulder: "#647560", rail: "#a3b4bd" },
    { kind: "cliff",      name: "绝壁盘山路", nameEn: "Cliffside Pass",     length: 900, floor: "#4e6b36", shoulder: "#6c6a64", rail: "#c97a63" },
    { kind: "seacliff",   name: "悬崖海岸",   nameEn: "Seacliff Drive",     length: 900, floor: "#2b6880", shoulder: "#857b68", rail: "#c2ced4" },
    { kind: "islands",    name: "群岛海堤",   nameEn: "Island Causeway",    length: 900, floor: "#24647d", shoulder: "#828c91", rail: "#d0dce3" },
    { kind: "viaduct",    name: "云际高架",   nameEn: "Skyline Viaduct",    length: 900, floor: "#3b424c", shoulder: "#6e7680", rail: "#98a9b8" }
  ];

  /**
   * 根据当前激活的语言返回赛段的本地化显示名称（保留 seg.name 原始值以维持曲率种子不变）
   * @param {Object} seg 赛段配置对象
   * @returns {string} 本地化赛段名称
   */
  function getSegmentName(seg) {
    if (!seg) return "";
    const isZh =
      window.HorizonI18n && typeof window.HorizonI18n.lang === "function"
        ? window.HorizonI18n.lang() === "zh"
        : document.documentElement.getAttribute("data-lang") === "zh";
    return isZh ? seg.name : (seg.nameEn || seg.name);
  }

  // 允许生成 Y 字高速分岔口的开阔自然路段类型
  const FORKABLE_KINDS = [
    "mountain",
    "desert",
    "farmland",
    "snow",
    "autumn",
    "flowers",
    "redwoods",
    "forest"
  ];

  /**
   * 随机打乱 28 个地图路段并分配随机长度与分岔口标记
   * @param {Function} rng 随机数生成函数（默认 Math.random，联机模式下传入房间种子 PRNG）
   * @returns {Array} 洗牌后的完整路线数组
   */
  function shuffleRoute(rng = Math.random) {
    const route = ROUTE_SEGMENTS.map((seg) => ee({}, seg));
    for (let i = route.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = route[i];
      route[i] = route[j];
      route[j] = tmp;
    }
    for (const seg of route) {
      const slices =
        seg.kind === "deepTunnel"
          ? 32 + Math.floor(rng() * 17)
          : seg.kind === "fork"
          ? 20
          : seg.kind === "boulevard"
          ? 24
          : seg.kind === "tunnel"
          ? 7 + Math.floor(rng() * 3)
          : 10 + Math.floor(rng() * 7);
      seg.length = 45 * slices;
    }
    for (let i = 0; i < route.length; i++) {
      const curr = route[i];
      const prev = route[(i + route.length - 1) % route.length];
      const next = route[(i + 1) % route.length];
      if (
        FORKABLE_KINDS.includes(curr.kind) &&
        !prev.fork &&
        !next.fork &&
        !["tunnel", "deepTunnel"].includes(prev.kind) &&
        !["tunnel", "deepTunnel"].includes(next.kind) &&
        rng() < 0.8
      ) {
        curr.fork = true;
        curr.length = Math.max(900, curr.length);
      }
    }
    return route;
  }

  /**
   * 根据当前行驶距离查询所处路段详情
   * @param {number} distance 当前累计行驶距离 (m)
   * @param {Array} route 路线配置数组
   */
  function getSegmentAt(distance, route = ROUTE_SEGMENTS) {
    const clamped = Math.max(0, distance);
    const totalLength = route.reduce((sum, seg) => sum + seg.length, 0);
    let offset = clamped % totalLength;
    let start = Math.floor(clamped / totalLength) * totalLength;
    for (let i = 0; i < route.length; i++) {
      const seg = route[i];
      if (offset < seg.length) {
        return ke(ee({}, seg), {
          start,
          end: start + seg.length,
          remaining: seg.length - offset,
          progress: offset / seg.length,
          next: route[(i + 1) % route.length]
        });
      }
      offset -= seg.length;
      start += seg.length;
    }
    throw new Error("Invalid route distance");
  }

  /**
   * 计算第 slotIndex 个道路切片对应的全局 45m 网格序号
   */
  function getSliceIndex(distance, slotIndex, backwards = false) {
    const base = Math.floor(distance / 45);
    return base - (backwards ? 22 : 7) + ((slotIndex - (base % 30) + 30) % 30);
  }

  /**
   * 计算当前位置处于隧道内的环境遮蔽系数 (0 ~ 1 平滑过渡)
   */
  function getTunnelFactor(distance, route = ROUTE_SEGMENTS) {
    const seg = getSegmentAt(distance, route);
    if (seg.kind !== "tunnel" && seg.kind !== "deepTunnel") return 0;
    const t = Math.max(0, Math.min(1, (distance - seg.start) / 100, seg.remaining / 100));
    return t * t * (3 - 2 * t);
  }

  // ==========================================================================
  // 二、Three.js BufferGeometry 批量静态合并工具（确保单切片极低 DrawCall）
  // ==========================================================================
  function mergeBufferAttributes(attributes) {
    let ArrayType, itemSize, normalized;
    let gpuType = -1;
    let totalLength = 0;
    for (let i = 0; i < attributes.length; ++i) {
      const attr = attributes[i];
      if (ArrayType === undefined) ArrayType = attr.array.constructor;
      if (ArrayType !== attr.array.constructor) return null;
      if (itemSize === undefined) itemSize = attr.itemSize;
      if (itemSize !== attr.itemSize) return null;
      if (normalized === undefined) normalized = attr.normalized;
      if (normalized !== attr.normalized) return null;
      if (gpuType === -1) gpuType = attr.gpuType;
      if (gpuType !== attr.gpuType) return null;
      totalLength += attr.count * itemSize;
    }
    const mergedArray = new ArrayType(totalLength);
    const result = new qe(mergedArray, itemSize, normalized);
    let offset = 0;
    for (let i = 0; i < attributes.length; ++i) {
      const attr = attributes[i];
      mergedArray.set(attr.array, offset);
      offset += attr.count * itemSize;
    }
    if (gpuType !== undefined) result.gpuType = gpuType;
    return result;
  }

  function mergeGeometries(geometries) {
    if (!geometries || !geometries.length) return null;
    const isIndexed = geometries[0].index !== null;
    const attrKeys = new Set(Object.keys(geometries[0].attributes));
    const attributesMap = {};
    const mergedGeo = new ye();

    for (let i = 0; i < geometries.length; ++i) {
      const geo = geometries[i];
      if (isIndexed !== (geo.index !== null)) return null;
      for (const name in geo.attributes) {
        if (!attrKeys.has(name)) return null;
        if (attributesMap[name] === undefined) attributesMap[name] = [];
        attributesMap[name].push(geo.attributes[name]);
      }
    }

    if (isIndexed) {
      let indexOffset = 0;
      const mergedIndices = [];
      for (let i = 0; i < geometries.length; ++i) {
        const idxAttr = geometries[i].index;
        for (let j = 0; j < idxAttr.count; ++j) {
          mergedIndices.push(idxAttr.getX(j) + indexOffset);
        }
        indexOffset += geometries[i].attributes.position.count;
      }
      mergedGeo.setIndex(mergedIndices);
    }

    for (const name in attributesMap) {
      const mergedAttr = mergeBufferAttributes(attributesMap[name]);
      if (!mergedAttr) return null;
      mergedGeo.setAttribute(name, mergedAttr);
    }
    return mergedGeo;
  }

  // ==========================================================================
  // 三、28 主题路段 Stylized Low-Poly 3D 景观构建与动态地表/护栏管理器
  // ==========================================================================
  function createLandscapeManager(roadSlices, initialRoute = ROUTE_SEGMENTS) {
    let currentRoute = initialRoute;
    const materials = [];
    const geometries = [];

    /**
     * 创建 Flat-Shaded 低多边形材质（支持自发光窗户/灯箱/霓虹色）
     */
    const createMat = (color, emissive, emissiveIntensity = 0.72) => {
      const mat = new Ee(
        ee(
          { color, flatShading: true },
          emissive ? { emissive, emissiveIntensity } : {}
        )
      );
      materials.push(mat);
      return mat;
    };

    // ------------------------------------------------------------------------
    // 1. 精致低多边形调色板材质库 (Stylized Low-Poly Palette)
    // ------------------------------------------------------------------------
    // 自然山体与草木
    const matMeadowGreen   = createMat("#5b7d3e"); // 鲜草甸绿
    const matHillGreen     = createMat("#486832"); // 深山峦绿
    const matAlpineRidge   = createMat("#385233"); // 远山墨绿
    const matPineDark      = createMat("#2d5a40"); // 深针叶松绿
    const matPineMid       = createMat("#3f754e"); // 中层松针绿
    const matPineLight     = createMat("#639656"); // 嫩梢松绿
    const matTrunkBrown    = createMat("#694b37"); // 树干深棕
    const matRedwoodBark   = createMat("#854434"); // 红杉赤褐树皮
    const matBambooStalk   = createMat("#5b8c4a"); // 翠竹竿青绿
    const matBambooNode    = createMat("#8cb369"); // 竹节浅绿
    const matBambooLeaf    = createMat("#78a856"); // 竹叶亮绿

    // 岩石、峡谷、沙漠与土地
    const matRockGray      = createMat("#7a8288"); // 花岗岩灰
    const matRockDark      = createMat("#545b63"); // 深色玄武岩
    const matCliffTan      = createMat("#9e6f52"); // 悬崖暖褐岩
    const matCanyonRed     = createMat("#b35c44"); // 峡谷赤红砂岩
    const matCanyonOrange  = createMat("#d18456"); // 峡谷橙黄岩层
    const matCanyonSand    = createMat("#cfa16c"); // 荒漠沙金
    const matCactusGreen   = createMat("#437d52"); // 仙人掌翠绿
    const matSoilBrown     = createMat("#785c42"); // 耕地土壤褐

    // 四季花木（秋枫、樱花、花海、葡萄园）
    const matMapleGold     = createMat("#e0a643"); // 金秋银杏/黄枫
    const matMapleOrange   = createMat("#cf6a3c"); // 晚秋橙红枫
    const matMapleCrimson  = createMat("#a83c38"); // 深红枫叶
    const matSakuraPink    = createMat("#f2b6c6"); // 樱花粉
    const matSakuraLight   = createMat("#fae1e8"); // 浅樱白粉
    const matSakuraPetal   = createMat("#e398ad"); // 落樱花瓣色
    const matToriiRed      = createMat("#c93b32"); // 鸟居朱红
    const matLavender      = createMat("#8c6bb5"); // 薰衣草紫
    const matSunflower     = createMat("#ebba42"); // 向日葵金黄
    const matTulipCoral    = createMat("#de6478"); // 郁金香珊瑚红
    const matGrapePurple   = createMat("#5e3c6e"); // 酿酒葡萄紫

    // 冰雪与水体
    const matSnowPure      = createMat("#edf4f7"); // 纯净积雪白
    const matSnowShadow    = createMat("#c5d6e0"); // 背光雪坡蓝白
    const matIceLake       = createMat("#90bfd1"); // 冰封湖面青蓝
    const matSeaDeep       = createMat("#265e75", "#102d3b", 0.45); // 深海蔚蓝
    const matSeaShallow    = createMat("#3f8da6", "#1a4857", 0.35); // 近岸浅海碧蓝
    const matWaveFoam      = createMat("#bce3eb"); // 海浪白沫
    const matBeachSand     = createMat("#d9c396"); // 海岸金沙

    // 城市建筑、桥梁、空港与工业
    const matConcreteLight = createMat("#b8bdbd"); // 浅灰混凝土
    const matConcreteMid   = createMat("#8a949e"); // 中灰混凝土/桥墩
    const matBuildingBlue  = createMat("#67798c"); // 现代写字楼蓝灰
    const matBuildingDark  = createMat("#465061"); // 深灰摩天楼/钢结构
    const matTunnelWall    = createMat("#68707a"); // 隧道衬砌灰壁
    const matTunnelArch    = createMat("#464d57"); // 隧道加固拱肋
    const matCottageWall   = createMat("#ebe6d8"); // 小镇白墙/风车塔身
    const matRoofRed       = createMat("#bd5b4a"); // 欧式红瓦屋顶/桥塔红
    const matRoofSlate     = createMat("#425469"); // 蓝灰石板瓦屋顶
    const matCargoBlue     = createMat("#36688f"); // 集装箱海蓝
    const matCargoGreen    = createMat("#3d7a60"); // 集装箱翠绿
    const matCargoOrange   = createMat("#cf6d3e"); // 集装箱橙红
    const matSolarPanel    = createMat("#264466", "#162940", 0.4); // 光伏晶硅深蓝面板

    // 自发光灯效材质（车灯照射与夜景下极具层次感）
    const matWindowCyan    = createMat("#a8dce3", "#5c8c9c", 0.72); // 写字楼冷白/冰蓝窗光
    const matWindowWarm    = createMat("#fae0a0", "#e0ae58", 0.78); // 住宅/小镇温暖黄窗光
    const matLightBright   = createMat("#fff4c7", "#ffe699", 0.92); // 隧道顶灯/灯塔强光芯
    const matReflectAmber  = createMat("#f0c256", "#bf8b2e", 0.75); // 隧道反光带/龙门吊工程黄
    const matNeonPink      = createMat("#ff7aa2", "#e04878", 0.82); // 都市街角霓虹粉招牌
    const matNeonTeal      = createMat("#68f0d8", "#2cb8a0", 0.82); // 都市街角青色灯带

    // ------------------------------------------------------------------------
    // 2. 各路段专属地表 (floor)、路肩 (shoulder) 与护栏 (rail) 材质映射表
    // ------------------------------------------------------------------------
    const floorMatByKind = new Map();
    const shoulderMatByKind = new Map();
    const railMatByKind = new Map();
    for (const seg of ROUTE_SEGMENTS) {
      floorMatByKind.set(seg.kind, createMat(seg.floor));
      shoulderMatByKind.set(seg.kind, createMat(seg.shoulder));
      railMatByKind.set(seg.kind, createMat(seg.rail));
    }
    floorMatByKind.set("fork", floorMatByKind.get("boulevard"));
    shoulderMatByKind.set("fork", shoulderMatByKind.get("boulevard"));
    railMatByKind.set("fork", railMatByKind.get("boulevard"));

    // ------------------------------------------------------------------------
    // 3. 基础低多边形几何体原语库（全部拥有统一的 index + position/normal/uv）
    // ------------------------------------------------------------------------
    const geoBox      = new tt(1, 1, 1);          // 标准立方体
    const geoCone6    = new Wa(1, 1, 6);          // 六棱锥（树冠/尖顶）
    const geoCone5    = new Wa(1, 1, 5);          // 五棱锥（低多边形山峰/冷杉）
    const geoPyr4     = new Wa(0.72, 1, 4);       // 四棱锥（攒尖屋顶/塔尖/金字塔山）
    const geoCyl8     = new lt(0.5, 0.5, 1, 8);   // 八棱圆柱（树干/竹节/烟囱/桥墩/机身）
    const geoTaperCyl = new lt(0.32, 0.5, 1, 8);  // 锥台八棱柱（灯塔塔身/风车塔筒/巨杉）
    const geoBlob     = new hi(0.55, 6, 4);       // 低多边形团簇球体（阔叶树冠/樱花团/山石）
    geometries.push(geoBox, geoCone6, geoCone5, geoPyr4, geoCyl8, geoTaperCyl, geoBlob);

    // 预烘焙网格缓存表：key = `${kind}${variant}${isBranch ? "-branch" : ""}`
    const bakedTemplates = new Map();

    /**
     * 预烘焙指定路段类型与随机变体 (G = 0, 1, 2) 的 45m 切片 3D 景观网格
     */
    const bakeSliceVariant = (kind, G, isBranch = false) => {
      const matBuckets = new Map();
      const dummy = new tn();

      /**
       * 向当前切片添加基础几何体实例
       * @param {Object} mat 材质
       * @param {number} x 横坐标（中心为 0，车道在 [-6.5, 6.5]）
       * @param {number} y 高度坐标（中心点高度）
       * @param {number} z 纵深坐标（切片范围 [0, -45]，中心为 -22.5）
       * @param {number} sx X 轴缩放
       * @param {number} sy Y 轴缩放
       * @param {number} sz Z 轴缩放
       * @param {BufferGeometry} geo 原语几何体（默认 geoBox）
       * @param {number} ry Y 轴旋转弧度
       * @param {number} rz Z 轴旋转弧度
       * @param {number} rx X 轴旋转弧度
       */
      function addMesh(mat, x, y, z, sx, sy, sz, geo = geoBox, ry = 0, rz = 0, rx = 0) {
        const finalX = isBranch && Math.abs(x) > 7 ? x + Math.sign(x) * 145 : x;
        dummy.position.set(finalX, y, z);
        dummy.scale.set(sx, sy, sz);
        dummy.rotation.set(rx, ry, rz);
        dummy.updateMatrix();
        const cloned = geo.clone().applyMatrix4(dummy.matrix);
        const list = matBuckets.get(mat) || [];
        list.push(cloned);
        matBuckets.set(mat, list);
      }

      /**
       * 在空间两点之间架设连杆/斜拉索/管道
       */
      function addStrut(mat, p1, p2, thickness, geo = geoBox) {
        const s1 = isBranch && Math.abs(p1.x) > 7 ? new F(p1.x + Math.sign(p1.x) * 145, p1.y, p1.z) : p1;
        const s2 = isBranch && Math.abs(p2.x) > 7 ? new F(p2.x + Math.sign(p2.x) * 145, p2.y, p2.z) : p2;
        dummy.position.copy(s1).add(s2).multiplyScalar(0.5);
        dummy.scale.set(thickness, s1.distanceTo(s2), thickness);
        dummy.quaternion.setFromUnitVectors(new F(0, 1, 0), s2.clone().sub(s1).normalize());
        dummy.updateMatrix();
        const cloned = geo.clone().applyMatrix4(dummy.matrix);
        const list = matBuckets.get(mat) || [];
        list.push(cloned);
        matBuckets.set(mat, list);
      }

      // ----------------------------------------------------------------------
      // 复合构件 1：精致三层伞状针叶松树 (Stylized Layered Pine Tree)
      // ----------------------------------------------------------------------
      function addPineTree(x, z, height, snowCapped = false) {
        addMesh(matTrunkBrown, x, height * 0.22, z, height * 0.08, height * 0.44, height * 0.08, geoCyl8);
        addMesh(matPineDark,   x, height * 0.48, z, height * 0.34, height * 0.46, height * 0.34, geoCone6, 0.2);
        addMesh(matPineMid,    x, height * 0.72, z, height * 0.26, height * 0.42, height * 0.26, geoCone6, 0.7);
        addMesh(
          snowCapped ? matSnowPure : matPineLight,
          x,
          height * 0.92,
          z,
          height * 0.17,
          height * 0.32,
          height * 0.17,
          geoCone6,
          1.1
        );
      }

      // ----------------------------------------------------------------------
      // 复合构件 2：低多边形多团簇阔叶树（枫树/樱花树/花园树）
      // ----------------------------------------------------------------------
      function addClusterTree(x, z, height, crownMat1, crownMat2, groundMat = null) {
        addMesh(matTrunkBrown, x, height * 0.28, z, height * 0.1, height * 0.56, height * 0.1, geoTaperCyl);
        addMesh(crownMat1, x, height * 0.68, z, height * 0.62, height * 0.52, height * 0.62, geoBlob, x * 0.3);
        addMesh(crownMat2, x + (x > 0 ? -0.9 : 0.9), height * 0.58, z + 0.6, height * 0.44, height * 0.38, height * 0.44, geoBlob, z * 0.2);
        addMesh(crownMat2, x + (x > 0 ? 0.8 : -0.8), height * 0.82, z - 0.5, height * 0.38, height * 0.34, height * 0.38, geoBlob, 1.2);
        if (groundMat) {
          addMesh(groundMat, x, 0.08, z, height * 0.72, 0.06, height * 0.72, geoCyl8);
        }
      }

      // ----------------------------------------------------------------------
      // 复合构件 3：层叠山峰与山脊（带峰顶岩层或雪冠）
      // ----------------------------------------------------------------------
      function addLayeredPeak(x, z, radius, height, baseMat, capMat = null, rotY = 0, baseY = 0) {
        addMesh(baseMat, x, baseY + height * 0.5, z, radius, height, radius * 1.15, geoCone5, rotY);
        if (capMat) {
          addMesh(
            capMat,
            x,
            baseY + height * 0.81,
            z,
            radius * 0.39,
            height * 0.39,
            radius * 0.45,
            geoCone5,
            rotY
          );
        }
      }

      // ----------------------------------------------------------------------
      // 复合构件 4：低多边形路旁山石群
      // ----------------------------------------------------------------------
      function addRockCluster(x, z, scale = 1.8, mat = matRockGray) {
        addMesh(mat, x, scale * 0.35, z, scale * 1.2, scale * 0.75, scale, geoBlob, x * 0.5);
        addMesh(matRockDark, x + Math.sign(x) * scale * 0.65, scale * 0.22, z + scale * 0.4, scale * 0.7, scale * 0.5, scale * 0.65, geoBlob, 1.1);
      }

      // ----------------------------------------------------------------------
      // 复合构件 5：现代多层玻璃幕墙大厦（带退台、发光窗格、屋顶设备层）
      // ----------------------------------------------------------------------
      function addModernBuilding(x, z, width, height, depth, bodyMat, baseY = 0) {
        const side = Math.sign(x) || 1;
        // 主楼体与裙楼底座
        addMesh(matConcreteMid, x, baseY + 1.6, z, width + 1.2, 3.2, depth + 1.2);
        addMesh(bodyMat, x, baseY + height / 2, z, width, height, depth);
        // 顶部女儿墙与退台收分机房
        addMesh(matBuildingDark, x, baseY + height + 0.45, z, width + 0.5, 0.9, depth + 0.5);
        addMesh(bodyMat, x, baseY + height + 2.1, z, width * 0.55, 2.4, depth * 0.55);
        addMesh(matReflectAmber, x, baseY + height + 4.2, z, 0.22, 2.2, 0.22);
        // 面向公路一侧与前后的立体发光窗带
        const winMat = (Math.abs(Math.round(x + z)) + G) % 2 === 0 ? matWindowCyan : matWindowWarm;
        for (let h = 4.2; h < height - 1.5; h += 3.6) {
          addMesh(winMat, x - side * (width / 2 + 0.08), baseY + h, z, 0.14, 1.35, depth * 0.78);
          addMesh(matWindowCyan, x, baseY + h, z + depth / 2 + 0.08, width * 0.76, 1.35, 0.14);
        }
      }

      // ======================================================================
      // 四、28 个主题路段精细化 3D 场景构建逻辑
      // ======================================================================

      // 1. 青岚山道 (mountain) —— 多层青翠远近山峦 + 奇石 + 三层松林
      if (kind === "mountain") {
        for (const side of [-1, 1]) {
          addLayeredPeak(side * 37, -22.5, 24, 19 + G * 2, matHillGreen, matMeadowGreen, G * 0.35);
          addLayeredPeak(side * 68, -20 + G * 3, 35, 36 + G * 3, matAlpineRidge, matRockGray, 0.5 + G * 0.25);
          addLayeredPeak(side * 52, -38, 22, 25, matMeadowGreen, null, 1.1);
          addPineTree(side * 11.5, -9 - G * 2, 6.2);
          addPineTree(side * 15.5, -23 + G, 7.8);
          addPineTree(side * 12.2, -37 + G * 2, 6.8);
          addRockCluster(side * 13.5, -16 - G * 4, 1.5, matRockGray);
        }
      }

      // 2. 绝壁盘山路 / 悬崖海岸 / 群岛海堤 (cliff / seacliff / islands)
      else if (kind === "cliff" || kind === "seacliff" || kind === "islands") {
        // 公路悬挑混凝土托梁底座
        addMesh(matConcreteMid, 0, -1.8, -22.5, 15.6, 3.4, 45);
        addMesh(matBuildingDark, 0, -3.6, -22.5, 12.4, 0.6, 45);

        if (kind === "cliff") {
          // 左侧千仞绝壁与层叠丹霞山体
          addLayeredPeak(-33, -22.5, 22, 30 + G * 5, matCliffTan, matRockGray, 0.25 + G * 0.4, -14);
          addLayeredPeak(-58, -26, 34, 46 + G * 6, matCanyonRed, matCliffTan, G * 0.35, -18);
          addMesh(matRockDark, -15.5, 4.5, -22.5, 9, 13, 45);
          addMesh(matCliffTan, -18.5, 11.5, -22.5, 12, 8, 45);
          addPineTree(-11.2, -11, 7.2);
          addPineTree(-12.5, -33, 6.5);
          // 右侧万丈深渊谷底与云海群峰
          addMesh(matAlpineRidge, 100, -48, -22.5, 175, 8, 45);
          addMesh(matRockDark, 8.6, -24, -22.5, 2.8, 48, 45);
          addLayeredPeak(58, -22, 26, 26, matHillGreen, matMeadowGreen, 0.4, -44);
          addLayeredPeak(86, -34, 32, 34, matAlpineRidge, matSnowShadow, 0.9, -46);
        } else {
          // 悬崖海岸 & 群岛海堤：下方壮阔大海与多层翻滚白浪
          addMesh(matSeaDeep, 95, -28, -22.5, 230, 0.4, 45);
          addMesh(matSeaDeep, -105, -28, -22.5, 195, 0.4, 45);
          addMesh(matSeaShallow, 26, -27.85, -22.5, 32, 0.25, 45);
          for (let i = 0; i < 3; i++) {
            addMesh(matWaveFoam, 22 + i * 22, -27.65, -8 - i * 11, 15, 0.08, 0.65);
            addMesh(matWaveFoam, 32 + i * 18, -27.65, -16 - i * 9, 11, 0.08, 0.45);
          }

          if (kind === "seacliff") {
            // 悬崖海岸：左依险峻红褐海崖，右临深海礁石滩
            addLayeredPeak(-38, -22.5, 24, 34 + G * 6, matCliffTan, matMeadowGreen, G * 0.3, -15);
            addMesh(matRockDark, -16, -2, -22.5, 10, 14, 45);
            addMesh(matConcreteMid, 8.6, -15, -22.5, 2.8, 30, 45);
            addMesh(matBeachSand, 22, -27.2, -22.5, 16, 1.2, 45);
            addRockCluster(28, -14 - G * 8, 3.2, matRockDark);
            addPineTree(-11.5, -18, 6.8);
            addPineTree(-12.8, -36, 6.2);
          } else {
            // 群岛海堤：跨海圆柱桥墩 + 海中翠绿群岛 + 远海红白灯塔与白帆
            for (const zPos of [-11, -34]) {
              addMesh(matConcreteMid, -5.2, -15, zPos, 1.8, 26, 1.8, geoCyl8);
              addMesh(matConcreteMid,  5.2, -15, zPos, 1.8, 26, 1.8, geoCyl8);
              addMesh(matConcreteLight, 0, -4.2, zPos, 13.5, 1.2, 2.2);
            }
            const islSide = G % 2 ? 52 : -48;
            addMesh(matBeachSand, islSide, -27.2, -22, 34, 1.4, 38, geoCyl8);
            addLayeredPeak(islSide, -22, 20, 16, matMeadowGreen, matPineMid, 0.6, -27);
            if (G === 1) {
              // 岛屿上的精致红白海上灯塔
              addMesh(matRockGray, 52, -20, -22, 5.5, 4, 5.5, geoCyl8);
              addMesh(matCottageWall, 52, -12.5, -22, 3.2, 12, 3.2, geoTaperCyl);
              addMesh(matRoofRed, 52, -11.5, -22, 2.9, 3.2, 2.9, geoCyl8);
              addMesh(matLightBright, 52, -5.6, -22, 2.4, 2.0, 2.4, geoCyl8);
              addMesh(matRoofRed, 52, -3.8, -22, 1.8, 2.2, 1.8, geoCone6);
            }
          }
        }
      }

      // 3. 向晚新城 (city) —— 现代摩天楼群、玻璃幕墙、街角霓虹与人行步道
      else if (kind === "city") {
        for (const side of [-1, 1]) {
          // 城市人行道铺装与路缘石
          addMesh(matConcreteLight, side * 19, 0.05, -22.5, 22, 0.22, 45);
          // 近景双栋错落写字楼 + 街角发光霓虹灯牌
          for (let k = 0; k < 2; k++) {
            const h = 16 + ((G * 7 + k * 11 + (side + 1) * 3) % 22);
            const zPos = -11 - k * 23;
            const xPos = side * (17.5 + G * 1.5);
            addModernBuilding(xPos, zPos, 10, h, 14.5, k % 2 ? matBuildingBlue : matConcreteLight);
            // 街角霓虹立柱招牌
            addMesh(
              (k + G) % 2 ? matNeonPink : matNeonTeal,
              xPos - side * 5.2,
              4.2,
              zPos + 5.5,
              0.22,
              3.2,
              1.1
            );
            // 远景高耸摩天大楼天际线
            const backH = h * 1.55 + 6;
            const backX = side * (39 + k * 9);
            addModernBuilding(backX, zPos - 3, 13.5, backH, 16.5, matBuildingDark);
          }
          // 城市行道树与花坛底座
          for (const zTree of [-10, -33]) {
            addMesh(matConcreteMid, side * 10.2, 0.25, zTree, 1.8, 0.45, 1.8);
            addClusterTree(side * 10.2, zTree, 4.6, matPineMid, matPineLight);
          }
        }
      }

      // 4. 穿山隧道 / 深山长隧 (tunnel / deepTunnel) —— 拱肋衬砌、LED 灯带与上方大山
      else if (kind === "tunnel" || kind === "deepTunnel") {
        const isDeep = kind === "deepTunnel";
        for (const side of [-1, 1]) {
          // 隧道厚重侧壁、防撞检修道与反光琥珀色腰线
          addMesh(matTunnelWall, side * 8.8, 6, -22.5, 1.2, 12, 45);
          addMesh(matConcreteLight, side * 8.12, 0.9, -22.5, 0.22, 1.2, 45);
          addMesh(matReflectAmber, side * 8.02, 1.75, -22.5, 0.14, 0.18, isDeep ? 18 : 45);
          addMesh(isDeep ? matNeonTeal : matLightBright, side * 8.03, 3.8, -22.5, 0.1, 0.1, 40);

          // 隧道加固钢拱肋柱与顶部双排照明灯具
          for (const zRib of [-4, -16, -28, -40]) {
            addMesh(matTunnelArch, side * 8.05, 6, zRib, 0.42, 12, 0.55);
            addMesh(
              isDeep ? matReflectAmber : matLightBright,
              side * 5.6,
              11.35,
              zRib,
              1.1,
              0.16,
              3.2
            );
          }
        }
        // 隧道拱顶横梁与封顶盖板
        for (const zRib of [-4, -16, -28, -40]) {
          addMesh(matTunnelArch, 0, 11.45, zRib, 16.5, 0.35, 0.6);
        }
        addMesh(matTunnelArch, 0, 12.1, -22.5, 19, 1.1, 45);
        // 隧道上方的巍峨穿山山体
        addMesh(matHillGreen, 0, 14.2, -22.5, 74, 3.2, 45);
        addLayeredPeak(-2, -22.5, 36, 30 + G * 4, matHillGreen, matAlpineRidge, 0.2, 14);
        for (const side of [-1, 1]) {
          addMesh(matMeadowGreen, side * 25, 6, -22.5, 32, 12, 45);
          addLayeredPeak(side * 36, -22.5, 25, 34, matMeadowGreen, null, side * 0.15);
          addLayeredPeak(side * 64, -22.5, 34, 42 + G * 4, matAlpineRidge, matRockGray, G * 0.2);
        }
      }

      // 5. 云际高架 (viaduct) —— 城市半空高架桥、T 型桥墩与桥下摩天楼森林
      else if (kind === "viaduct") {
        // 高架桥箱梁底板与流线型混凝土护墙
        addMesh(matConcreteLight, 0, -0.85, -22.5, 18.2, 1.6, 45);
        addMesh(matConcreteMid, 0, -2.1, -22.5, 12.5, 1.1, 45);
        for (const side of [-1, 1]) {
          addMesh(matConcreteLight, side * 8.4, 0.7, -22.5, 0.65, 1.4, 45);
          addMesh(matBuildingDark, side * 8.4, 1.48, -22.5, 0.72, 0.2, 45);
          // 高架桥承重立柱与桥墩承台
          addMesh(matConcreteMid, side * 5.2, -10.5, -22.5, 2.6, 17, 2.6, geoCyl8);
          addMesh(matConcreteLight, side * 5.2, -2.8, -22.5, 4.2, 1.4, 3.4);
          addMesh(matConcreteMid, side * 5.2, -19.2, -22.5, 6.8, 1.2, 7.5);
          // 高架桥两侧耸立的都市大厦群（从 y = -20 地面拔地而起）
          for (let k = 0; k < 2; k++) {
            const h = 30 + G * 6 + k * 14;
            const xPos = side * (30 + k * 24);
            const zPos = -10 - k * 24;
            addModernBuilding(xPos, zPos, 12, h, 17, k % 2 ? matBuildingBlue : matBuildingDark, -20);
          }
        }
        // 高架桥下方 20 米处的地面城市基底与下方辅路
        addMesh(matBuildingDark, 0, -20, -22.5, 260, 1, 45);
        addMesh(matConcreteMid, 0, -19.4, -22.5, 14, 0.16, 45);
      }

      // 6. 双向大道 / 分岔口 (boulevard / fork) —— 严守左侧 x∈[-25,-9] 对向车道净空
      else if (kind === "boulevard" || kind === "fork") {
        // 中央分隔带（x = -9.2，介于主路 -6.5 与对向车道 -10.5 之间）修剪绿篱
        if (kind === "boulevard") {
          for (let zPos = -5; zPos >= -41; zPos -= 9) {
            addMesh(matPineMid, -8.8, 0.65, zPos, 1.1, 1.1, 3.2);
            addMesh(matReflectAmber, -8.8, 1.3, zPos, 0.18, 0.35, 0.45);
          }
        }
        // 右侧近景（x >= 11）与左侧对向车道外侧（x <= -28）行道树与远景天际山脉
        for (const zTree of [-9, -23, -37]) {
          addClusterTree(12.5, zTree, 6.2, matPineMid, matPineLight);
          addClusterTree(-29.5, zTree, 6.2, matPineMid, matPineLight);
        }
        for (const side of [-1, 1]) {
          const xMount = side < 0 ? -98 : 88;
          addLayeredPeak(xMount, -22, 34, 16 + G * 3, matHillGreen, matMeadowGreen, G * 0.3);
        }
      }

      // 7. 晴海公路 (coast) —— 阳光金沙滩、碧海白浪、礁石与红白海岸灯塔
      else if (kind === "coast") {
        // 右侧黄金沙滩、浅滩与蔚蓝大海
        addMesh(matBeachSand, 56, -0.02, -22.5, 96, 0.18, 45);
        addMesh(matSeaShallow, 92, 0.05, -22.5, 42, 0.12, 45);
        addMesh(matSeaDeep, 148, 0.08, -22.5, 180, 0.12, 45);
        for (let i = 0; i < 3; i++) {
          addMesh(matWaveFoam, 23 + i * 16, 0.15, -10 - i * 12, 1.4, 0.04, 14 + G * 3);
        }
        // 海岸礁石与海滨松树
        addRockCluster(19, -15 - G * 6, 1.6, matRockGray);
        addLayeredPeak(-44, -22.5, 29, 15 + G * 2, matHillGreen, matMeadowGreen, 0.3);
        addPineTree(-11.5, -11, 6.2);
        addPineTree(-14.5, -25, 7.2);
        addPineTree(-12.2, -38, 6.5);
        // 标志性红白条纹海滨灯塔
        if (G === 1) {
          addMesh(matRockGray, 33, 1.2, -23, 6.5, 2.4, 6.5, geoCyl8);
          addMesh(matCottageWall, 33, 7.5, -23, 3.4, 11, 3.4, geoTaperCyl);
          addMesh(matRoofRed, 33, 7.5, -23, 3.1, 3.2, 3.1, geoCyl8);
          addMesh(matRoofRed, 33, 12.2, -23, 2.6, 2.0, 2.6, geoCyl8);
          addMesh(matConcreteLight, 33, 13.5, -23, 3.8, 0.45, 3.8, geoCyl8);
          addMesh(matLightBright, 33, 14.8, -23, 2.5, 2.2, 2.5, geoCyl8);
          addMesh(matRoofRed, 33, 16.8, -23, 1.9, 2.4, 1.9, geoCone6);
        }
      }

      // 8. 赤岩荒漠 (desert) —— 科罗拉多平顶红岩台地、风蚀岩层与仙人掌群
      else if (kind === "desert") {
        for (const side of [-1, 1]) {
          addMesh(matCanyonSand, side * 110, 0.03, -22.5, 204, 0.2, 45);
          // 远景赤褐山丘与多层平顶红岩台地 (Mesa)
          addLayeredPeak(side * 52, -24, 25, 22 + G * 3, matCliffTan, matCanyonSand, G * 0.3);
          const mesaX = side * (25 + G * 2);
          addMesh(matCanyonRed,    mesaX, 3.2, -29, 10, 6.4, 13);
          addMesh(matCanyonOrange, mesaX, 7.2, -29, 8.8, 2.2, 11.5);
          addMesh(matCanyonRed,    mesaX, 9.4, -29, 7.8, 2.4, 10.2);
          addMesh(matCanyonSand,   mesaX, 10.9, -29, 8.4, 0.7, 10.8);
          // 巨柱仙人掌与荒漠乱石
          for (const zCac of [-9, -24, -37]) {
            const cx = side * (12 + ((G + Math.abs(zCac)) % 4));
            addMesh(matCactusGreen, cx, 2.0, zCac, 0.65, 4.0, 0.65, geoCyl8);
            addMesh(matCactusGreen, cx + side * 0.75, 2.2, zCac, 1.2, 0.48, 0.48);
            addMesh(matCactusGreen, cx + side * 1.25, 2.9, zCac, 0.48, 1.5, 0.48, geoCyl8);
            addMesh(matCactusGreen, cx - side * 0.65, 1.7, zCac, 1.0, 0.42, 0.42);
            addMesh(matCactusGreen, cx - side * 1.05, 2.3, zCac, 0.42, 1.2, 0.42, geoCyl8);
          }
          addRockCluster(side * 15, -16, 1.5, matCliffTan);
        }
      }

      // 9. 风车田野 (farmland) —— 金黄麦浪田垄、三叶大风车、美式红谷仓与储粮筒仓
      else if (kind === "farmland") {
        for (const side of [-1, 1]) {
          addMesh(matMeadowGreen, side * 90, 0.03, -22.5, 164, 0.2, 45);
          // 金黄麦田与褐土交替条带 + 干草垛
          for (let k = 0; k < 4; k++) {
            addMesh(
              k % 2 === 0 ? matMapleGold : matSoilBrown,
              side * (18 + k * 9),
              0.22,
              -22.5,
              6.4,
              0.32,
              43
            );
          }
          // 田园木质围栏
          for (const zPost of [-4, -14, -24, -34, -42]) {
            addMesh(matTrunkBrown, side * 9.8, 0.85, zPost, 0.22, 1.7, 0.22);
          }
          addMesh(matTrunkBrown, side * 9.8, 1.25, -22.5, 0.14, 0.16, 44);
          addMesh(matTrunkBrown, side * 9.8, 0.65, -22.5, 0.14, 0.16, 44);
        }
        // 大型白色风力发电机组（锥形塔筒 + 机舱 + 三片修长风叶）
        const windX = G === 1 ? -32 : 34;
        addMesh(matCottageWall, windX, 11, -25, 1.5, 22, 1.5, geoTaperCyl);
        addMesh(matBuildingDark, windX, 22, -25, 1.6, 1.4, 2.8);
        for (let b = 0; b < 3; b++) {
          const ang = (b * Math.PI * 2) / 3 + G * 0.7;
          addMesh(
            matCottageWall,
            windX - Math.sin(ang) * 4.2,
            22 + Math.cos(ang) * 4.2,
            -23.4,
            0.55,
            8.2,
            0.18,
            geoBox,
            0,
            ang
          );
        }
        // 美式红墙谷仓 (Barn) 与银白圆顶储粮筒仓 (Silo)
        if (G === 1) {
          addMesh(matRoofRed, 22, 2.6, -12, 7.6, 5.2, 10.5);
          addMesh(matBuildingDark, 22, 6.2, -12, 4.8, 3.2, 10.8, geoPyr4, Math.PI / 4);
          addMesh(matCottageWall, 22, 1.9, -6.7, 2.6, 3.4, 0.18);
          addMesh(matWindowWarm, 22, 4.4, -6.7, 1.4, 1.2, 0.18);
          // 筒仓
          addMesh(matConcreteLight, 27.5, 4.5, -14, 3.2, 9.0, 3.2, geoCyl8);
          addMesh(matSnowPure, 27.5, 9.2, -14, 3.2, 2.4, 3.2, geoBlob);
        }
      }

      // 10. 霜岭雪道 (snow) —— 冰封雪山、镜面冰湖、覆雪云杉与温馨雪屋
      else if (kind === "snow") {
        for (const side of [-1, 1]) {
          addMesh(matSnowPure, side * 110, 0.05, -22.5, 204, 0.22, 45);
          // 远景高耸雪峰（深灰蓝山体 + 耀眼白雪山巅）
          addLayeredPeak(side * 60, -24, 35, 36 + G * 3, matBuildingDark, matSnowPure, G * 0.25);
          addLayeredPeak(side * 38, -12, 22, 20, matSnowShadow, matSnowPure, 0.6);
          // 覆雪三层冷杉与路旁雪堆
          for (const zTree of [-10, -23, -35]) {
            const tx = side * (12 + ((G + Math.abs(zTree)) % 3));
            addPineTree(tx, zTree, 7.8, true);
          }
          // 路侧红白防雾积雪标杆
          for (const zPole of [-8, -23, -38]) {
            addMesh(matRoofRed, side * 9.2, 0.9, zPole, 0.16, 1.8, 0.16);
            addMesh(matSnowPure, side * 9.2, 1.4, zPole, 0.18, 0.45, 0.18);
          }
        }
        // 右侧冰封湖面与左侧雪地木屋
        addMesh(matIceLake, 29, 0.18, -22.5, 19, 0.14, 43);
        addMesh(matSnowPure, -23, 1.4, -15, 9, 2.6, 13, geoCone5);
        if (G === 2) {
          addMesh(matTrunkBrown, -22, 2.2, -28, 6.5, 4.2, 8.5);
          addMesh(matSnowPure, -22, 5.2, -28, 5.6, 3.4, 7.2, geoPyr4, Math.PI / 4);
          addMesh(matWindowWarm, -18.7, 2.3, -28, 0.16, 1.4, 3.2);
        }
      }

      // 11. 碧海大桥 (bridge) —— 跨海双塔斜拉索大桥、H 型桥塔与海面远航船只
      else if (kind === "bridge") {
        for (const side of [-1, 1]) {
          addMesh(matSeaDeep, side * 125, 0.08, -22.5, 232, 0.14, 45);
          // 桥面外侧钢箱梁翼缘与双层防撞栏
          addMesh(matConcreteLight, side * 8.5, 0.25, -22.5, 1.5, 0.48, 45);
          addMesh(matBuildingDark, side * 8.8, 1.3, -22.5, 0.2, 0.24, 45);
          addMesh(matBuildingBlue, side * 8.8, 0.8, -22.5, 0.16, 0.18, 45);
          // 主桥塔（G === 0 切片处耸立 H 型高耸跨海桥塔与承台）
          if (G === 0) {
            addMesh(matConcreteMid, side * 9.7, 1.2, -1, 3.8, 2.4, 5.2);
            addMesh(matRoofRed, side * 9.7, 14, -1, 1.6, 28, 2.2);
          }
          // 扇形斜拉钢索与垂直吊杆
          for (let k = 0; k < 3; k++) {
            const z1 = G * 45 + k * 15;
            const z2 = z1 + 15;
            const cableH = (zVal) => 8.5 + 16 * Math.pow((zVal - 67.5) / 67.5, 2);
            addStrut(
              matBuildingDark,
              new F(side * 9.7, cableH(z1), -k * 15),
              new F(side * 9.7, cableH(z2), -(k + 1) * 15),
              0.2
            );
            addMesh(
              matConcreteLight,
              side * 9.7,
              (cableH(z1) + 1) / 2,
              -k * 15,
              0.12,
              cableH(z1) - 1,
              0.12
            );
          }
        }
        // 桥塔双层横梁与塔顶航空障碍警示灯
        if (G === 0) {
          addMesh(matRoofRed, 0, 22, -1, 21, 1.4, 2.2);
          addMesh(matConcreteLight, 0, 14, -1, 19.5, 0.9, 1.6);
          addMesh(matLightBright, -9.7, 28.4, -1, 0.6, 0.5, 0.6);
          addMesh(matLightBright,  9.7, 28.4, -1, 0.6, 0.5, 0.6);
        }
      }

      // 12. 枫叶山谷 (autumn) —— 金黄/橙红/绯红三色团簇枫林与秋日山峦
      else if (kind === "autumn") {
        for (const side of [-1, 1]) {
          addLayeredPeak(side * 48, -23, 25, 20 + G * 2, matCliffTan, matMapleOrange, G * 0.2);
          addLayeredPeak(side * 74, -18, 32, 30, matRockDark, matCliffTan, 0.7);
          for (let k = 0; k < 4; k++) {
            const tx = side * (12 + (k % 2) * 5.5);
            const tz = -5 - k * 11;
            const th = 6.5 + ((k + G) % 3) * 1.2;
            const c1 = (k + G) % 3 === 0 ? matMapleGold : (k + G) % 3 === 1 ? matMapleOrange : matMapleCrimson;
            const c2 = (k + G) % 2 === 0 ? matMapleOrange : matMapleGold;
            addClusterTree(tx, tz, th, c1, c2, matMapleGold);
          }
        }
      }

      // 13. 远湾港区 (harbor) —— 多彩集装箱堆场、岸边龙门吊机、远洋货轮与港区仓库
      else if (kind === "harbor") {
        addMesh(matConcreteLight, 75, 0.06, -22.5, 132, 0.22, 45);
        addMesh(matSeaDeep, 158, 0.1, -22.5, 100, 0.16, 45);
        // 两侧多层彩色集装箱堆场
        const cargoMats = [matCargoBlue, matRoofRed, matReflectAmber, matCargoGreen, matCargoOrange];
        for (const side of [-1, 1]) {
          for (let k = 0; k < 3; k++) {
            const cx = side * (15 + k * 7.2);
            const cz = -12 - (k % 2) * 17;
            addMesh(cargoMats[(k + G) % cargoMats.length], cx, 1.7, cz, 5.6, 3.4, 12.2);
            if ((k + G) % 2 === 0) {
              addMesh(cargoMats[(k + G + 2) % cargoMats.length], cx, 5.1, cz, 5.6, 3.4, 12.2);
            }
          }
        }
        // 右侧大型岸边集装箱龙门吊机与停泊货轮
        if (G === 1) {
          addMesh(matReflectAmber, 43, 13, -20, 1.8, 26, 2.0);
          addMesh(matReflectAmber, 43, 13, -28, 1.8, 26, 2.0);
          addMesh(matReflectAmber, 60, 24.5, -24, 38, 1.5, 8.5);
          addStrut(matBuildingDark, new F(43, 29.5, -24), new F(76, 24.5, -24), 0.28);
          addMesh(matBuildingDark, 71, 16.5, -24, 0.22, 15, 0.22);
          addMesh(matCargoOrange, 71, 8.5, -24, 2.8, 2.6, 6.2);
          // 岸边停泊的集装箱货轮
          addMesh(matRoofRed, 118, 2.2, -22, 16, 4.5, 38);
          addMesh(matCottageWall, 118, 8.5, -34, 13, 8.5, 8);
          addMesh(matWindowCyan, 118, 11.2, -29.8, 11, 1.4, 0.2);
        }
        // 左侧大型港区物流仓库
        addMesh(matBuildingBlue, -48, 5.5, -23, 19, 11, 36);
        addMesh(matBuildingDark, -48, 11.4, -23, 20, 0.8, 37);
      }

      // 14. 樱花大道 / 翠竹长廊 (sakura / bamboo) —— 浪漫樱花鸟居 vs 幽篁翠竹林
      else if (kind === "sakura" || kind === "bamboo") {
        for (const side of [-1, 1]) {
          addMesh(
            kind === "sakura" ? matSakuraPetal : matMeadowGreen,
            side * 35,
            0.04,
            -22.5,
            52,
            0.14,
            45
          );
          for (let k = 0; k < 6; k++) {
            const tx = side * (12 + (k % 2) * 4.5);
            const tz = -4 - k * 7;
            const th = 7.2 + ((k + G) % 3) * 1.1;
            if (kind === "sakura") {
              addClusterTree(tx, tz, th, matSakuraPink, matSakuraLight, matSakuraPetal);
              // 日式庭院石灯笼与朱红鸟居点缀
              if (k === 2 && G === 1) {
                addMesh(matToriiRed, side * 10.5, 2.4, tz, 0.35, 4.8, 0.35, geoCyl8);
                addMesh(matLightBright, side * 10.5, 5.0, tz, 0.65, 0.75, 0.65);
                addMesh(matBuildingDark, side * 10.5, 5.6, tz, 0.9, 0.45, 0.9, geoPyr4, Math.PI / 4);
              }
            } else {
              // 翠竹长廊：分节圆竹竿 + 多层竹叶华盖
              addMesh(matBambooStalk, tx, th * 0.5, tz, 0.36, th, 0.36, geoCyl8);
              addMesh(matBambooNode,  tx, th * 0.35, tz, 0.44, 0.14, 0.44, geoCyl8);
              addMesh(matBambooNode,  tx, th * 0.68, tz, 0.42, 0.14, 0.42, geoCyl8);
              addMesh(matBambooLeaf,  tx + side * 0.9, th * 0.82, tz, 3.2, 1.9, 2.2, geoBlob, 0.5);
              addMesh(matBambooStalk, tx + side * 7.5, (th + 3) * 0.5, tz - 2, 0.44, th + 3, 0.44, geoCyl8);
              addMesh(matBambooLeaf,  tx + side * 7.5, th + 1.2, tz - 2, 3.8, 2.6, 2.8, geoBlob, 1.1);
            }
          }
          addLayeredPeak(side * 66, -22.5, 28, 18 + G * 2, matHillGreen, null, G * 0.25);
        }
      }

      // 15. 芦苇湖畔 (wetland) —— 镜面湿地、香蒲芦苇丛、木栈桥与湖畔水榭
      else if (kind === "wetland") {
        for (const side of [-1, 1]) {
          addMesh(matSeaDeep, side * 72, 0.08, -22.5, 126, 0.14, 45);
          addMesh(matMeadowGreen, side * 14, 0.18, -22.5, 8.5, 0.22, 45);
          // 摇曳的芦苇秆与香蒲棒
          for (let k = 0; k < 8; k++) {
            const rx = side * (11.5 + (k % 3) * 2.2);
            const rz = -3 - k * 5.2;
            addMesh(matMapleGold, rx, 1.2, rz, 0.16, 2.4, 0.16, geoCyl8);
            addMesh(matTrunkBrown, rx, 2.2, rz, 0.34, 0.68, 0.34, geoCyl8);
          }
        }
        // 延伸入湖的木质亲水栈桥与观景凉亭
        if (G === 1) {
          addMesh(matTrunkBrown, 28, 0.85, -22, 24, 0.35, 3.4);
          for (const px of [18, 25, 32, 39]) {
            addMesh(matTrunkBrown, px, 0.45, -20.5, 0.35, 1.4, 0.35, geoCyl8);
            addMesh(matTrunkBrown, px, 0.45, -23.5, 0.35, 1.4, 0.35, geoCyl8);
          }
          addMesh(matRoofRed, 40, 4.2, -22, 5.2, 2.4, 5.2, geoPyr4, Math.PI / 4);
          addMesh(matWaveFoam, -34, 0.2, -24, 6, 0.1, 14);
        }
      }

      // 16. 葡萄庄园 (vineyard) —— 成排葡萄藤架、饱满紫葡萄簇与法式红瓦酒庄
      else if (kind === "vineyard") {
        for (const side of [-1, 1]) {
          addMesh(matMeadowGreen, side * 80, 0.04, -22.5, 144, 0.2, 45);
          for (let k = 0; k < 4; k++) {
            const vx = side * (13.5 + k * 7);
            addMesh(matPineMid, vx, 1.65, -22.5, 2.2, 2.3, 42);
            for (const vz of [-5, -16, -27, -38]) {
              addMesh(matTrunkBrown, vx, 1.4, vz, 0.24, 2.8, 0.24);
              addMesh(matGrapePurple, vx - side * 1.15, 1.35, vz, 0.65, 0.85, 0.65, geoBlob);
            }
          }
          addLayeredPeak(side * 66, -22.5, 24, 15 + G * 2, matHillGreen, matMeadowGreen, 0.3);
        }
        // 法式酒庄主楼点缀
        if (G === 0) {
          addMesh(matCottageWall, -44, 3.8, -22, 11, 7.6, 15);
          addMesh(matRoofRed, -44, 9.2, -22, 9.2, 4.2, 12.5, geoPyr4, Math.PI / 4);
          addMesh(matWindowWarm, -38.4, 3.8, -22, 0.2, 1.8, 8.5);
        }
      }

      // 17. 层岩峡谷 (canyon) —— 高耸阶梯状红砂岩大峡谷与多彩沉积岩层
      else if (kind === "canyon") {
        for (const side of [-1, 1]) {
          addMesh(matCanyonSand, side * 70, 0.03, -22.5, 124, 0.2, 45);
          const wallH = 24 + G * 4;
          addMesh(matCliffTan, side * 25, wallH / 2, -22.5, 22, wallH, 45);
          // 阶梯状五彩沉积岩色带
          for (let k = 0; k < 5; k++) {
            addMesh(
              k % 2 === 0 ? matCanyonOrange : matCanyonRed,
              side * (23.5 - (k % 2) * 0.8),
              3.5 + k * 5.2,
              -22.5,
              23.5,
              1.5,
              45
            );
          }
          addLayeredPeak(side * 46, -22.5, 24, wallH + 14, matCanyonRed, matCanyonOrange, G * 0.15);
          addRockCluster(side * 12.5, -14 - G * 8, 1.8, matCanyonRed);
        }
      }

      // 18. 光伏原野 (solar) —— 晶硅光伏矩阵、铝合金边框与逆变器变电站
      else if (kind === "solar") {
        for (const side of [-1, 1]) {
          addMesh(matCanyonSand, side * 85, 0.03, -22.5, 154, 0.2, 45);
          for (let k = 0; k < 4; k++) {
            for (const sz of [-10, -32]) {
              const sx = side * (15 + k * 10);
              addMesh(matConcreteLight, sx, 1.1, sz, 0.45, 2.2, 0.45, geoCyl8);
              addMesh(matConcreteLight, sx, 2.15, sz, 8.4, 0.16, 15.4, geoBox, 0, side * 0.22);
              addMesh(matSolarPanel,    sx, 2.28, sz, 8.0, 0.18, 14.8, geoBox, 0, side * 0.22);
            }
          }
        }
        if (G === 1) {
          addMesh(matConcreteLight, -64, 3.2, -22, 9, 6.4, 13);
          addMesh(matReflectAmber, -64, 6.7, -22, 9.6, 0.6, 13.6);
          addMesh(matWindowCyan, -59.4, 3.5, -22, 0.2, 1.6, 7.5);
        }
      }

      // 19. 山间小镇 (village) —— 阿尔卑斯式斜顶小屋、暖黄窗户、烟囱与尖顶教堂
      else if (kind === "village") {
        for (const side of [-1, 1]) {
          addLayeredPeak(side * 64, -22.5, 32, 22 + G * 2, matHillGreen, matMeadowGreen, 0.2);
          for (let k = 0; k < 2; k++) {
            const hx = side * (16.5 + G * 1.2);
            const hz = -11 - k * 23;
            // 小屋白墙主体、红/蓝斜坡屋顶、烟囱、木门与暖光窗户
            addMesh(matCottageWall, hx, 2.5, hz, 7.2, 5.0, 10.2);
            addMesh((k + G) % 2 ? matRoofRed : matRoofSlate, hx, 6.0, hz, 6.2, 3.8, 8.4, geoCone6, Math.PI / 4);
            addMesh(matRoofRed, hx + side * 1.8, 6.8, hz - 2.0, 0.85, 2.2, 0.85);
            addMesh(matTrunkBrown, hx, 1.25, hz + 5.15, 1.5, 2.5, 0.14);
            addMesh(matWindowWarm, hx - side * 3.65, 2.9, hz, 0.14, 1.6, 5.4);
            addPineTree(side * 10.8, hz + 7, 4.8);
          }
        }
      }

      // 20. 花海原野 (flowers) —— 薰衣草紫/向日葵黄/郁金香粉多彩花田与远山
      else if (kind === "flowers") {
        const flowerPalette = [matSakuraPink, matSunflower, matLavender, matTulipCoral];
        for (const side of [-1, 1]) {
          addMesh(matMeadowGreen, side * 38, -0.02, -22.5, 60, 0.16, 45);
          for (let col = 0; col < 5; col++) {
            const fMat = flowerPalette[(col + G) % flowerPalette.length];
            for (let row = 0; row < 6; row++) {
              addMesh(fMat, side * (11.5 + col * 7.8), 0.55, -3.5 - row * 7, 5.2, 0.8, 3.4, geoCone6);
            }
          }
          addLayeredPeak(side * 78, -22.5, 36, 17 + G * 2, matHillGreen, matMeadowGreen, 0.35);
          addClusterTree(side * 12, -22, 5.2, matPineMid, matPineLight);
        }
      }

      // 21. 红杉林谷 (redwoods) —— 参天巨型红杉木群与多层浓密树冠
      else if (kind === "redwoods") {
        for (const side of [-1, 1]) {
          for (let k = 0; k < 4; k++) {
            const rx = side * (12.5 + (k % 2) * 9);
            const rz = -5 - k * 11;
            const rh = 22 + ((k + G) % 3) * 4.5;
            addMesh(matRedwoodBark, rx, rh * 0.36, rz, 2.1, rh * 0.72, 2.1, geoTaperCyl);
            addMesh(matPineDark, rx, rh * 0.68, rz, 5.4, rh * 0.55, 5.4, geoCone6, 0.2);
            addMesh(matPineMid,  rx, rh * 0.86, rz, 3.8, rh * 0.42, 3.8, geoCone6, 0.8);
            addMesh(matPineLight, rx, rh * 0.98, rz, 2.4, rh * 0.28, 2.4, geoCone6, 1.3);
            addLayeredPeak(side * 50, rz, 22, 25, matAlpineRidge, null, 0.4);
          }
        }
      }

      // 22. 工业外环 (industrial) —— 大型厂房、高耸红白烟囱、储气球罐与跨路管道廊架
      else if (kind === "industrial") {
        for (const side of [-1, 1]) {
          addMesh(matConcreteLight, side * 34, 0, -22.5, 52, 0.22, 45);
          // 工业重型厂房与天窗带
          addMesh(matBuildingBlue, side * 30, 5.2, -22, 24, 10.4, 30);
          addMesh(matBuildingDark, side * 30, 10.7, -22, 25, 0.7, 31);
          for (let k = 0; k < 4; k++) {
            addMesh(matWindowWarm, side * 17.9, 5.5, -9 - k * 7.2, 0.18, 2.2, 4.4);
          }
          // 高耸红白警示烟囱与白色球形储气罐
          addMesh(matConcreteLight, side * 46, 14, -12, 4.2, 28, 4.2, geoTaperCyl);
          addMesh(matRoofRed, side * 46, 24, -12, 3.4, 2.4, 3.4, geoCyl8);
          addMesh(matSnowPure, side * 46, 6.2, -32, 9.5, 9.5, 9.5, geoBlob);
          // 路侧黄黑警示防撞立柱与厂区架空输气管道
          for (let k = 0; k < 3; k++) {
            addMesh(matReflectAmber, side * 10, 0.7, -6 - k * 15, 0.25, 1.4, 0.45);
          }
          addStrut(matConcreteLight, new F(side * 17, 3.8, -38), new F(side * 50, 3.8, -38), 0.85, geoCyl8);
        }
      }

      // 23. 空港公路 (airport) —— 机场跑道、航站楼、空管塔台与精细化宽体客机
      else if (kind === "airport") {
        // 右侧停机坪、主跑道与跑道白色中线/接地带标线
        addMesh(matConcreteLight, 72, 0.03, -22.5, 128, 0.16, 45);
        addMesh(matBuildingDark, 48, 0.16, -22.5, 24, 0.1, 45);
        for (const rz of [-8, -22, -36]) {
          addMesh(matSnowPure, 48, 0.23, rz, 0.65, 0.04, 8.5);
        }
        // 跑道助航边灯与进近引导灯杆
        for (const lz of [-5, -20, -35]) {
          addMesh(matReflectAmber, 13, 1.5, lz, 0.22, 3.0, 0.22);
          addMesh(matLightBright, 35, 0.35, lz, 0.35, 0.35, 0.35);
        }
        addMesh(matBuildingDark, 13, 2.4, -22.5, 0.14, 0.14, 45);
        // 左侧现代航站楼与发光玻璃幕墙
        addMesh(matBuildingBlue, -29, 4.5, -22.5, 28, 9.0, 36);
        addMesh(matConcreteLight, -29, 9.3, -22.5, 30, 0.7, 38);
        addMesh(matWindowCyan, -14.9, 4.5, -22.5, 0.16, 3.8, 31);

        // 空管指挥塔台 (ATC Tower) 与宽体客机 (Airliner)
        if (G === 1) {
          addMesh(matConcreteLight, -44, 11, -22, 4.4, 22, 4.4, geoTaperCyl);
          addMesh(matWindowCyan,    -44, 22.8, -22, 9.2, 3.2, 9.2, geoCyl8);
          addMesh(matBuildingDark,  -44, 24.8, -22, 10.4, 0.8, 10.4, geoCyl8);
          addMesh(matLightBright,   -44, 26.2, -22, 0.5, 1.8, 0.5);
          // 宽体客机：圆柱机身 + 机鼻 + 机翼 + 翼下双发涡扇引擎 + 垂直尾翼
          addMesh(matSnowPure, 75, 2.6, -23, 3.2, 28, 3.2, geoCyl8, 0, 0, Math.PI / 2);
          addMesh(matWindowCyan, 75, 3.1, -23, 3.3, 0.45, 22);
          addMesh(matSnowPure, 75, 2.4, -21, 26, 0.38, 5.2);
          addMesh(matBuildingBlue, 69, 1.6, -20, 1.4, 3.2, 1.4, geoCyl8, 0, 0, Math.PI / 2);
          addMesh(matBuildingBlue, 81, 1.6, -20, 1.4, 3.2, 1.4, geoCyl8, 0, 0, Math.PI / 2);
          addMesh(matSnowPure, 75, 5.2, -10.5, 0.48, 5.6, 4.4);
          addMesh(matRoofRed,  75, 7.6, -10.5, 0.52, 1.2, 3.4);
        }
      }

      // 24. 杉林长路 (forest) —— 密林草甸与高低错落的多层松树海
      else {
        for (const side of [-1, 1]) {
          addLayeredPeak(side * 52, -22.5, 34, 12 + G * 2, matHillGreen, matMeadowGreen, 0.3);
          for (let k = 0; k < 4; k++) {
            addPineTree(side * (11.2 + (k % 2) * 4.2), -5 - k * 11, 7.2 + ((k + G) % 4));
            addPineTree(side * (24.5 + (k % 2) * 5.5), -7 - k * 11, 11.5 + ((k + G) % 5));
          }
          addRockCluster(side * 14, -18 - G * 5, 1.4, matRockGray);
        }
      }

      // ----------------------------------------------------------------------
      // 将当前切片内相同材质的几何体合并为单一 BufferGeometry，极致降低 DrawCall
      // ----------------------------------------------------------------------
      const mergedList = [];
      matBuckets.forEach((geoList, mat) => {
        const merged = mergeGeometries(geoList);
        geoList.forEach((g) => g.dispose());
        if (merged) {
          geometries.push(merged);
          mergedList.push({ geometry: merged, material: mat });
        }
      });
      bakedTemplates.set(kind + G + (isBranch ? "-branch" : ""), mergedList);
    };

    // 预烘焙全部 29 种标识（28 主题路段 + fork）× 3 种变体 + 8 种分岔支路变体
    const allKinds = [
      "mountain", "city", "tunnel", "deepTunnel", "boulevard", "fork",
      "cliff", "seacliff", "islands", "viaduct", "coast", "forest",
      "desert", "farmland", "snow", "bridge", "autumn", "harbor",
      "sakura", "bamboo", "wetland", "vineyard", "canyon", "solar",
      "village", "airport", "flowers", "redwoods", "industrial"
    ];
    for (const kind of allKinds) {
      for (let G = 0; G < 3; G++) {
        bakeSliceVariant(kind, G, false);
      }
    }
    for (const kind of FORKABLE_KINDS) {
      for (let G = 0; G < 3; G++) {
        bakeSliceVariant(kind, G, true);
      }
    }

    // 计算单个切片所需的最大材质槽位数并挂载到 30 个道路切片上
    let maxMeshSlots = 0;
    bakedTemplates.forEach((list) => {
      maxMeshSlots = Math.max(maxMeshSlots, list.length);
    });

    const sliceHolders = roadSlices.map((sliceGroup, idx) => {
      const group = new oe();
      group.name = "landscape-" + idx;
      sliceGroup.add(group);
      const meshes = Array.from({ length: maxMeshSlots }, () => {
        const mesh = new DA(geoBox, matHillGreen);
        mesh.visible = false;
        group.add(mesh);
        return mesh;
      });
      return { group, meshes, index: NaN };
    });

    /**
     * 每帧根据行驶距离更新 30 个道路切片的 3D 景观、地表底色、路肩配色与护栏材质
     */
    function update(distance, backwards = false) {
      roadSlices.forEach((sliceGroup, slotIdx) => {
        const sliceIdx = getSliceIndex(distance, slotIdx, backwards);
        sliceGroup.position.z = distance - sliceIdx * 45;
        const holder = sliceHolders[slotIdx];
        if (holder.index === sliceIdx) return;
        holder.index = sliceIdx;

        const seg = getSegmentAt(sliceIdx * 45, currentRoute);
        const kind = seg.kind;
        const variant = ((sliceIdx * 7) % 3 + 3) % 3;
        const template =
          bakedTemplates.get(kind + variant + (seg.fork ? "-branch" : "")) ||
          bakedTemplates.get(kind + variant);

        holder.group.userData.kind = kind;
        holder.group.userData.routeIndex = sliceIdx;

        if (template) {
          holder.meshes.forEach((mesh, i) => {
            mesh.visible = i < template.length;
            if (i < template.length) {
              mesh.geometry = template[i].geometry;
              mesh.material = template[i].material;
            }
          });
        }

        // 1. 动态切换当前切片的地表底板显隐与专属地貌材质
        const terrainFloor = sliceGroup.getObjectByName("terrain-floor");
        if (terrainFloor) {
          terrainFloor.visible = !["cliff", "seacliff", "islands", "viaduct"].includes(kind);
          const customFloorMat = floorMatByKind.get(kind);
          if (customFloorMat) terrainFloor.material = customFloorMat;
        }

        // 2. 动态切换当前切片的路肩边缘材质（第二个子网格为宽 15m 的路肩层）
        const roadSurface = sliceGroup.getObjectByName("road-surface");
        const customShoulderMat = shoulderMatByKind.get(kind);
        if (roadSurface && customShoulderMat && roadSurface.children.length > 1) {
          const shoulderMesh = roadSurface.children[1];
          if (shoulderMesh && shoulderMesh.isMesh) {
            shoulderMesh.material = customShoulderMat;
          }
        }

        // 3. 动态切换当前切片的高速护栏材质
        const highwayEdges = sliceGroup.getObjectByName("highway-edges");
        const customRailMat = railMatByKind.get(kind);
        if (highwayEdges && customRailMat) {
          highwayEdges.children.forEach((child) => {
            if (child && child.isMesh) child.material = customRailMat;
          });
        }

        // 4. 隧道内自动隐藏常规高杆路灯
        const streetFurniture = sliceGroup.getObjectByName("street-furniture");
        if (streetFurniture) {
          streetFurniture.visible = kind !== "tunnel" && kind !== "deepTunnel";
        }
      });
    }

    update(0);

    return {
      update,
      setRoute(newRoute) {
        currentRoute = newRoute;
        sliceHolders.forEach((h) => {
          h.index = NaN;
        });
      },
      dispose() {
        sliceHolders.forEach((h) => h.group.removeFromParent());
        geometries.forEach((g) => g.dispose());
        materials.forEach((m) => m.dispose());
      }
    };
  }

  // 挂载导出至全局命名空间 window.__HD_MAPS__
  window.__HD_MAPS__ = {
    ROUTE_SEGMENTS,
    getSegmentName,
    shuffleRoute,
    getSegmentAt,
    getSliceIndex,
    getTunnelFactor,
    createLandscapeManager
  };
})();
