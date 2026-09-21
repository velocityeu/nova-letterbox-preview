
/* Three.js ultra-realistic instrument dials */
(function (global) {
  function createDial(container, opts) {
    opts = opts || {};
    const max = opts.max || 100;
    const size = container.clientWidth || 220;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(size, size, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
    camera.position.set(0, 0.15, 4.2);
    camera.lookAt(0, 0, 0);

    // Lighting — show metal
    const hemi = new THREE.HemisphereLight(0xdde7ff, 0x1a120c, 0.55);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xfff2e0, 1.35);
    key.position.set(-2.5, 3.5, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x88a0c0, 0.35);
    fill.position.set(3, -1, 2);
    scene.add(fill);
    const rim = new THREE.PointLight(0xffb070, 0.8, 12);
    rim.position.set(0, 0, 2.5);
    scene.add(rim);

    const dial = new THREE.Group();
    scene.add(dial);

    // Outer bezel — thick torus + tube look via lathe-ish cylinder stack
    const copperMat = new THREE.MeshStandardMaterial({
      color: 0xb87333, metalness: 0.95, roughness: 0.28,
      envMapIntensity: 1.2,
    });
    const darkCopper = new THREE.MeshStandardMaterial({
      color: 0x5a3a1e, metalness: 0.9, roughness: 0.4,
    });
    const faceMat = new THREE.MeshStandardMaterial({
      color: 0x0c1016, metalness: 0.2, roughness: 0.85,
    });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x1a2230, metalness: 0, roughness: 0.05, transmission: 0.15,
      transparent: true, opacity: 0.35, roughness: 0.1,
    });

    const outer = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.14, 24, 96), copperMat);
    outer.rotation.x = Math.PI / 2;
    dial.add(outer);

    const lip = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.06, 16, 80), darkCopper);
    lip.rotation.x = Math.PI / 2;
    lip.position.z = 0.05;
    dial.add(lip);

    const face = new THREE.Mesh(new THREE.CircleGeometry(1.12, 64), faceMat);
    face.position.z = 0.02;
    dial.add(face);

    // Tick marks as thin boxes
    const tickGroup = new THREE.Group();
    dial.add(tickGroup);
    const start = -Math.PI * 0.75;
    const end = Math.PI * 0.75;
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      const a = start + (end - start) * t;
      const major = i % 2 === 0;
      const geo = new THREE.BoxGeometry(major ? 0.035 : 0.02, major ? 0.16 : 0.09, 0.02);
      const mat = new THREE.MeshStandardMaterial({
        color: major ? 0xe0a066 : 0x8a97a8, metalness: 0.4, roughness: 0.5,
        emissive: major ? 0x3a2010 : 0x000000, emissiveIntensity: major ? 0.2 : 0,
      });
      const tick = new THREE.Mesh(geo, mat);
      const r = 0.92;
      tick.position.set(Math.sin(a) * r, Math.cos(a) * r, 0.06);
      tick.rotation.z = -a;
      tickGroup.add(tick);
    }

    // Needle
    const needlePivot = new THREE.Group();
    needlePivot.position.z = 0.1;
    dial.add(needlePivot);
    const needleMat = new THREE.MeshStandardMaterial({
      color: 0xff8a2b, metalness: 0.7, roughness: 0.25,
      emissive: 0xff6a00, emissiveIntensity: 0.45,
    });
    const needle = new THREE.Mesh(new THREE.ConeGeometry(0.05, 1.05, 12), needleMat);
    needle.position.y = 0.42;
    needlePivot.add(needle);
    const needleTail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.03), needleMat);
    needleTail.position.y = -0.12;
    needlePivot.add(needleTail);

    // Hub
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.1, 32), copperMat);
    hub.rotation.x = Math.PI / 2;
    hub.position.z = 0.12;
    dial.add(hub);
    const hubCap = new THREE.Mesh(new THREE.SphereGeometry(0.07, 24, 16), darkCopper);
    hubCap.position.z = 0.18;
    dial.add(hubCap);

    // Glass disc
    const glass = new THREE.Mesh(new THREE.CircleGeometry(1.15, 64), glassMat);
    glass.position.z = 0.22;
    dial.add(glass);

    // Slight tilt for 3D read
    dial.rotation.x = -0.18;
    dial.rotation.y = 0.12;

    let display = 0;
    let target = 0;
    let vel = 0;

    function setValue(v) {
      target = Math.max(0, Math.min(max, v));
    }

    function valueToAngle(v) {
      const t = v / max;
      // map 0..max to visual needle angle (Three Y-up): start left-bottom to right-bottom
      return start + (end - start) * t;
    }

    function renderFrame(dt) {
      // spring/damper needle physics
      const err = target - display;
      const accel = err * 28 - vel * 8;
      vel += accel * dt;
      display += vel * dt;

      const a = valueToAngle(display);
      // needle points along +Y at 0; rotate around Z
      needlePivot.rotation.z = -a;

      // subtle idle shimmer on lights
      rim.intensity = 0.7 + Math.sin(performance.now() / 900) * 0.08;
      renderer.render(scene, camera);
    }

    function resize() {
      const s = container.clientWidth || size;
      renderer.setSize(s, s, false);
    }

    return { setValue, renderFrame, resize, max, get display() { return display; } };
  }

  global.NovaDials = { createDial };
})(window);
