<script type="module">
// Import curtains.js
import { 
  Curtains, 
  Plane, 
  Vec2, 
  PingPongPlane 
} from "https://cdn.jsdelivr.net/npm/curtainsjs@7.2.0/src/index.mjs";

window.addEventListener("load", () => {
  // Setup WebGL context
  const curtains = new Curtains({
    container: "canvas",
    pixelRatio: Math.min(1.5, window.devicePixelRatio)
  });

  curtains.onError(() => {
    console.log("There's a problem with WebGL or with the website.");
  });

  // Mouse/touch tracking
  const ww = window.innerWidth;
  const wh = window.innerHeight;

  const mouse = new Vec2(0, 0);
  const lastMouse = mouse.clone();
  const velocity = new Vec2(0, 0);
  let updateVelocity = false;

  function onMouseMove(e) {
    lastMouse.copy(mouse);

    if (e.targetTouches) {
      mouse.set(e.targetTouches[0].clientX, e.targetTouches[0].clientY);
    } else {
      mouse.set(e.clientX, e.clientY);
    }

    // Calculate velocity (pixels per frame, with smoothing)
    velocity.set(
      (mouse.x - lastMouse.x) * 0.5,
      (mouse.y - lastMouse.y) * 0.5
    );

    updateVelocity = true;
  }

  function onMouseLeave() {
    // Gradually reduce velocity when mouse leaves
    velocity.set(0, 0);
  }

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("touchmove", onMouseMove, { passive: true });
  window.addEventListener("mouseleave", onMouseLeave);

  // Get the plane element
  const planeElement = document.getElementById("flowmap");

  // Flowmap parameters
  const flowMapParams = {
    sampler: "uFlowMap",
    vertexShader: flowmapVs,
    fragmentShader: flowmapFs,
    texturesOptions: {
      floatingPoint: "half-float",
      generateMipmap: false,
      wrapS: curtains.gl.REPEAT,
      wrapT: curtains.gl.REPEAT,
      minFilter: curtains.gl.LINEAR,
      magFilter: curtains.gl.LINEAR
    },
    uniforms: {
      mousePosition: {
        name: "uMousePosition",
        type: "2f",
        value: mouse
      },
      falloff: {
        name: "uFalloff",
        type: "1f",
        value: 0.15
      },
      cursorGrow: {
        name: "uCursorGrow",
        type: "1f",
        value: 1.05
      },
      alpha: {
        name: "uAlpha",
        type: "1f",
        value: 0.5
      },
      dissipation: {
        name: "uDissipation",
        type: "1f",
        value: 0.95
      },
      velocity: {
        name: "uVelocity",
        type: "2f",
        value: velocity
      },
      aspect: {
        name: "uAspect",
        type: "1f",
        value: ww / wh
      }
    }
  };

  // Create ping pong plane for flowmap
  const flowMap = new PingPongPlane(curtains, planeElement, flowMapParams);

  flowMap.onLoading(() => {
    console.log("Flowmap plane loading");
  });

  flowMap.onReady(() => {
    console.log("Flowmap plane ready");
  });

  flowMap.onRender(() => {
    // Update mouse position in plane coordinates
    flowMap.uniforms.mousePosition.value = flowMap.mouseToPlaneCoords(mouse);
    
    // Smoothly update velocity
    if (updateVelocity) {
      flowMap.uniforms.velocity.value = velocity;
      updateVelocity = false;
    } else {
      // Gradually reduce velocity when not moving
      velocity.x = curtains.lerp(velocity.x, 0, 0.95);
      velocity.y = curtains.lerp(velocity.y, 0, 0.95);
      flowMap.uniforms.velocity.value = velocity;
    }

    // Update aspect ratio if window resizes
    if (flowMap.uniforms.aspect.value !== window.innerWidth / window.innerHeight) {
      flowMap.uniforms.aspect.value = window.innerWidth / window.innerHeight;
    }
  });

  // Main plane with displacement shader
  const params = {
    vertexShader: displacementVs,
    fragmentShader: displacementFs,
    uniforms: {}
  };

  // Create main plane
  const plane = new Plane(curtains, planeElement, params);

  plane.onLoading(() => {
    console.log("Main plane loading");
  });

  plane.onReady(() => {
    console.log("Main plane ready");
    
    // Create a texture that will hold our flowmap
    const flowTexture = plane.createTexture({
      sampler: "uFlowTexture",
      fromTexture: flowMap.getTexture()
    });

    console.log("Flow texture created:", flowTexture);
  });

  // Handle window resize
  window.addEventListener("resize", () => {
    curtains.resize();
    
    // Update aspect uniform for flowmap
    if (flowMap && flowMap.uniforms.aspect) {
      flowMap.uniforms.aspect.value = window.innerWidth / window.innerHeight;
    }
  });
});
</script>