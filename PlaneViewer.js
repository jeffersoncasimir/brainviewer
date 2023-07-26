import React, {useState, useCallback, useEffect} from 'react';
import { Pressable, View, Text } from 'react-native';
import { GLView } from 'expo-gl';
import Expo2DContext from "expo-2d-context";
import { SegmentSlider } from './SegmentSlider';

function getScreenPlanes(plane, headers) {
  switch (plane) {
  case 'x':
    return {
      screenX: headers.yspace.space_length,
      screenY: headers.zspace.space_length
    };
  case 'y':
    return {
      screenX: headers.xspace.space_length,
      screenY: headers.zspace.space_length
    };
  case 'z':
    return {
      screenX: headers.xspace.space_length,
      screenY: headers.yspace.space_length
    };
  default:
    throw new Error("Unhandled plane");
  }
}

function loadIntensityTexture(gl, headers, data) {
      const xsize = headers.xspace.space_length;
      const ysize = headers.yspace.space_length;
      const zsize = headers.zspace.space_length;
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_3D, texture);

      const values = new Uint8Array(data.floats.length);
      for(i = 0; i < data.floats.length; i++) {
        const val = ((data.floats[i] -data.min) / (data.max -data.min)) * 255;
        values[i] = val;
      }

      // Set the parameters so we can render any size image.
      gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
       
      // Upload the image into the texture.
      // We use an R8 image so that one byte per voxel is sent
      // to the GPU, and then set the green and blue channels
      // in the vertex shader.
      // XXX: This needs to be tested with files that have the
      // x, y, and z order in different orders as per MincLoader.js.
      // console.log('xsize, ysize, zsize = ', xsize, ysize, zsize);
      gl.texImage3D(gl.TEXTURE_3D, 0, gl.R8, ysize, zsize, xsize, 0, gl.RED, gl.UNSIGNED_BYTE, values);
    }

function useGLCanvas(viewWidth, viewHeight, headers, data, plane) {
    const [gl, setGl] = useState(null);
    const draw = useCallback(() => {
        if (!gl) {
            // console.warn('No gl');
            return;
        } 
        // We draw the 1 square which consists of 2 triangles
        // covering the whole viewport. The program set up
        // a_position in onContextCreate
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.flush();
        gl.endFrameEXP();
    }, [gl]);
    const [sliceNumUniform, setSliceNumUniform] = useState(null);
    const [crosshairsUniform, setCrosshairsUniform] = useState(null);
    const onContextCreate = useCallback( (gl) => {
        setGl(gl);

        const compileShader = (type, src) => {
          const shader = gl.createShader(type);
          gl.shaderSource(shader, src);

          gl.compileShader(shader);
          const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
          if (!success) {
            msg = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error("Could not compile shader:" + msg);
          }
          return shader;
        };

        const linkProgram = (vertex, fragment) => {
          const program = gl.createProgram();
          gl.attachShader(program, vert);
          gl.attachShader(program, frag);
          gl.linkProgram(program);
          const success = gl.getProgramParameter(program, gl.LINK_STATUS);
          if (!success) {
            const msg = gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            throw new Error("Could not link program: " + msg);
          }
          return program;
        };

        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clearColor(0, 1, 0, 1);

        // Create the vertex shader (position & size)
        const vert = compileShader(gl.VERTEX_SHADER, 
          `
          // We draw 2 triangles that cover the entire viewport. a_position
          // is the screen coordinate of the vertex for the triangle passed
          // by drawarray with gl.TRIANGLES
          attribute vec2 a_position;

          // The slice number that we're looking that.
          uniform int u_sliceno;

          // The resolution of the screen in terms of number of voxels in the
          // current dimension.
          uniform vec2 u_resolution;

          // a vector where x, y, and z are the lengths of the respective
          // space_length
          uniform vec3 u_spacesize;

          // The texture coordinate to pass to the fragment shader
          varying vec3 texCoord;

          // The plane we're currently looking at.
          uniform int u_plane;

          uniform vec2 u_crosshairs;

          varying vec2 v_crosshairs;


          void main(void) {
            vec2 normalize_to_one = a_position / u_resolution;
            vec2 normalize_to_two = normalize_to_one * 2.0;
            vec2 normalize_to_clipspace = normalize_to_two - 1.0;


            gl_Position = vec4(normalize_to_clipspace * vec2(1, -1), 0, 1);

            float fixed_plane = float(u_sliceno) / float(u_spacesize.` + plane + `);
            // XXX: Decide if we should have u_plane or if we should
            // just dynamically generate the texCoord part of the shader
            // code based on this.props.plane
            v_crosshairs = u_crosshairs / u_resolution;
            if (u_plane == 1) {
                // u_plane 1 == xplane is fixed.
                // normalized_to_one.x = screenX = y plane in texture
                // normalized_to_one.y = screenY = z plane in texture
                // we swap x/y in the texture to mirror the orientation
                // of brainbrowser in our sample file.
                texCoord = vec3(fixed_plane, normalize_to_one.yx);
            } else if (u_plane == 2) {
                // u_plane 2 == yplane is fixed
                // normalized_to_one.x = screenX = x plane in texture
                // normalized_to_one.y = screenY = z plane in texture
                // we swap x/y to mirror the orientation of brainbrowser
                // on our sample file
                texCoord = vec3(normalize_to_one.y, fixed_plane, normalize_to_one.x);
            } else if (u_plane == 3) {
                // plane 3 == zplane is fixed
                // normalized_to_one.x = screenX = x plane in texture
                // normalized_to_one.y = screenY = z plane in texture
                // we flip left/right one the x-axis to mirror the 
                // orientation of brainbrowser with our sample file.
                texCoord = vec3(1.0 - normalize_to_one.x, normalize_to_one.y, fixed_plane);
            } else {
                // Make it obvious there's an error if
                // the plane isn't set.
                texCoord = vec3(1.0, 1.0, 0.0);
            }
          }
        `
        );

        // Create fragment shader (color)
        const texCoordSrc = (plane) => {
            switch(plane) {
            case 'x':
                return `
                float delta = ` + (1 / headers.yspace.space_length) +  ` / 2.0;
                if (
                  ((texCoord.y > (v_crosshairs.x - delta)) &&
                  (texCoord.y < (v_crosshairs.x + delta)))
                  ||
                  ((texCoord.z > (v_crosshairs.y - delta)) &&
                  (texCoord.z < (v_crosshairs.y + delta)))

                ) {
                  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
                } else {
                  intensityColor();
                }
                `;
            case 'y':
                return `
                float delta = ` + (1 / headers.xspace.space_length) +  ` / 2.0;
                if (
                  ((texCoord.x > (v_crosshairs.x - delta)) &&
                  (texCoord.x < (v_crosshairs.x + delta)))
                  ||
                  ((texCoord.z > (v_crosshairs.y - delta)) &&
                  (texCoord.z < (v_crosshairs.y + delta)))

                ) {
                  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
                } else {
                  intensityColor();
                }
                `;
            case 'z':
                return `
                float delta = ` + (1 / headers.xspace.space_length) +  ` / 2.0;
                if (
                  ((texCoord.x > (v_crosshairs.x - delta)) &&
                  (texCoord.x < (v_crosshairs.x + delta)))
                  ||
                  ((texCoord.y > (v_crosshairs.y - delta)) &&
                  (texCoord.y < (v_crosshairs.y + delta)))

                ) {
                  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
                } else {
                  intensityColor();
                }
                `;
                return 'intensityColor();';

            }
            return ' BAD PLANE' ;
        }

        const frag= compileShader(gl.FRAGMENT_SHADER, 
          `
          #extension GL_OES_texture_3D : enable
          precision mediump sampler3D;
          precision mediump float;
          uniform sampler3D u_image;
          uniform int u_plane;
          varying vec2 v_crosshairs;

          varying vec3 texCoord;

          void intensityColor(void) {
              // We uploaded the image to the GPU as a 3D texture with
              // a single red channel. The vertex shader calculated
              // the texture coordinates within the texture, so all we
              // need to do is get the value and convert it to to greyscale
              // by setting the green and blue channels.
              float red = texture3D(u_image, texCoord).r;
              gl_FragColor = vec4(red, red, red, 1.0);
          }

          void main(void) {
              ` + texCoordSrc(plane) + `;
          }
        `
        );

        const program = linkProgram(vert, frag);
        gl.clear(gl.COLOR_BUFFER_BIT);

        const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        const {screenX, screenY} = getScreenPlanes(plane, headers);
        console.log('Screen X/Y:', screenX, screenY);
        // FIXME: These are plane dependent. Switch on this.props.plane
        const positions = [
            0, 0,
            0, screenY,
            screenX, 0,

            screenX, 0,
            screenX, screenY,
            0, screenY,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        gl.useProgram(program);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(
            positionAttributeLocation,
            2,
            gl.FLOAT,
            false,
            0,
            0,
        );


        // Calculate display uniforms
        const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
        const spaceSizeUniformLocation = gl.getUniformLocation(program, "u_spacesize");
        if (spaceSizeUniformLocation) {
            // FIXME: Determine if these should pivot around the plane we're looking at.
            gl.uniform3f(
                spaceSizeUniformLocation,
                headers.xspace.space_length,
                headers.yspace.space_length,
                headers.zspace.space_length,
            );
        } 
        const sliceNoUniformLocation = gl.getUniformLocation(program, "u_sliceno");
        if (sliceNoUniformLocation) {
            setSliceNumUniform(sliceNoUniformLocation);
            // FIXME: Use the middle slice of the plane we're looking at.
            gl.uniform1i(
                sliceNoUniformLocation,
                50,
            );
        }

        // Set the resolution for the x and y axis of the
        // screen based on the plane that we're rendering.
        gl.uniform2f(
          resolutionUniformLocation,
          screenX,
          screenY,
        );
        const crosshairsUniformLocation = gl.getUniformLocation(program, "u_crosshairs");
        if (crosshairsUniformLocation) {
            setCrosshairsUniform(crosshairsUniformLocation)
        }

        loadIntensityTexture(gl, headers, data);

        const planeLocation = gl.getUniformLocation(program, "u_plane");
        if (planeLocation) {
            switch(plane) {
            case 'x':
                gl.uniform1i(planeLocation, 1);
                break;
            case 'y':
                gl.uniform1i(planeLocation, 2);
                break;
            case 'z':
                gl.uniform1i(planeLocation, 3);
                break;
            default:
                throw new Error('Invalid plane');
            }
        }

        draw();

    }, [headers, data, plane, draw]);
    const setSliceNum = useCallback( (newValue) => {
        if (gl && sliceNumUniform) {
          gl.uniform1i(
            sliceNumUniform,
            newValue,
          );
        }
        draw();
    }, [gl, sliceNumUniform, draw]);
    const setCrosshairs = useCallback( (crosshairs) => {
        if (!gl) {
            console.warn('No gl set for crosshairs');
            return;
        }
        if (!crosshairsUniform) {
            console.warn('No crosshairs uniform set');
            return;
        }
        gl.uniform2f(crosshairsUniform, crosshairs.x, crosshairs.y);
        draw();
    }, [gl, draw, crosshairsUniform]);
    return {
        setSliceNum: setSliceNum,
        setCrosshairs: setCrosshairs,
        canvas:  <GLView style={{ width: viewWidth, height: viewHeight, borderWidth: 2, borderColor: 'green' }}
                onContextCreate={onContextCreate} />
    };
}
export function PlaneViewer({headers, data, plane, SliceNo, label, onSliceChange, crosshairs}) {
    // FIXME: Width and height shouldn't be fixed values
    const {setSliceNum, canvas, setCrosshairs}  = useGLCanvas(350, 400, headers, data, plane);
    const onSliderChange = useCallback( (newValue) => {
        onSliceChange(newValue);

        setSliceNum(newValue);

    }, [setSliceNum]);
    if (!headers || !data) {
        return <View><Text>Loading..</Text></View>;
    }
    useEffect( () => {
        setCrosshairs(crosshairs);
    }, [crosshairs, setCrosshairs]);

    let sliderMax = 100;
    switch(plane) {
    case 'x':
      sliderMax = headers.xspace.space_length;
      break;
    case 'y':
      sliderMax = headers.yspace.space_length;
      break;
    case 'z':
      sliderMax = headers.zspace.space_length;
      break;
    default:
      throw new Error("Invalid plane");
    }
    return (

      <View style={{flex: 1, justifyContent: 'center', flexDirection: 'column', alignItems: 'center', margin: 20,}}>
         <Text>{label} (Size: {sliderMax})</Text>
         {canvas}
         <SegmentSlider
           val={SliceNo}
           max={sliderMax}
           onSliderChange={onSliderChange}
         />
      </View>
    );
}
