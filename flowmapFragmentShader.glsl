const flowmapFs = `
      #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
      #else
      precision mediump float;
      #endif
  
      varying vec3 vVertexPosition;
      varying vec2 vTextureCoord;
  
      uniform sampler2D uFlowMap;
      uniform vec2 uMousePosition;
      uniform float uFalloff;
      uniform float uAlpha;
      uniform float uDissipation;
      uniform float uCursorGrow;
      uniform vec2 uVelocity;
      uniform float uAspect;
  
      void main() {
          vec2 textCoords = vTextureCoord;
          
          // convert to -1 -> 1
          textCoords = textCoords * 2.0 - 1.0;
          
          // make the cursor grow with time
          textCoords /= uCursorGrow;
          // adjust cursor position based on its growth
          textCoords += uCursorGrow * uMousePosition / (1.0 / (uCursorGrow - 1.0) * pow(uCursorGrow, 2.0));
  
          // convert back to 0 -> 1
          textCoords = (textCoords + 1.0) / 2.0;
          
          // Sample previous frame with dissipation
          vec4 color = texture2D(uFlowMap, textCoords) * uDissipation;
  
          // Calculate cursor position and stamp
          vec2 mouseTexPos = (uMousePosition + 1.0) * 0.5;
          vec2 cursor = vTextureCoord - mouseTexPos;
          cursor.x *= uAspect;
  
          // Create stamp from velocity
          vec3 stamp = vec3(uVelocity * vec2(1.0, -1.0), 1.0);
          float falloff = smoothstep(uFalloff, 0.0, length(cursor)) * uAlpha;
          
          // Mix previous frame with new stamp
          color.rgb = mix(color.rgb, stamp, vec3(falloff));
  
          // Ensure we have alpha
          color.a = 1.0;
  
          gl_FragColor = color;
      }
  `;