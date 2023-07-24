import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { GLView } from 'expo-gl';
import Expo2DContext from "expo-2d-context";
import { SegmentSlider } from './SegmentSlider';


export class Viewer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            dataview: null,
            xVal: 100,
            yVal: 100,
            zVal: 100,
            maxIntensity: null,
            minIntensity: null,
        };

        if (!props.headers) {
            console.log('No headers');
            return;
        }
        let dv;
        console.log('setting state');
        this.setState({dataview: new DataView(props.rawData)});

        this.onContextCreateX = this.onContextCreateX.bind(this);
        this.onContextCreateY = this.onContextCreateY.bind(this);
        this.onContextCreateZ = this.onContextCreateZ.bind(this);
    }

    refreshAllPanels = () => {
        this.populateWorldPosAttribute(
              this.state.glX,
              this.state.worldPositionAttributeLocationX,
              'x',
              this.state.worldPosBufferX,
              this.state.crosshairsAttributeLocationX,
              this.state.crosshairsBufferX
        );
        this.populateWorldPosAttribute(
              this.state.glY,
              this.state.worldPositionAttributeLocationY,
              'y',
              this.state.worldPosBufferY,
              this.state.crosshairsAttributeLocationY,
              this.state.crosshairsBufferY,
        );
        this.populateWorldPosAttribute(
              this.state.glZ,
              this.state.worldPositionAttributeLocationZ,
              'z',
              this.state.worldPosBufferZ,
              this.state.crosshairsAttributeLocationZ,
              this.state.crosshairsBufferZ,
        );

        requestAnimationFrame(() => this.drawPanel('x'));
        requestAnimationFrame(() => this.drawPanel('y'));
        requestAnimationFrame(() => this.drawPanel('z'));
    }
    handleSliderChange = (plane, newValue) => {
        const newState = {};
        newState[plane] = newValue;
        this.setState(newState);
        this.refreshAllPanels();
    };

    drawPanel = (plane) => {
      const xsize = this.props.headers.xspace.space_length;
      const ysize = this.props.headers.yspace.space_length;
      const zsize = this.props.headers.zspace.space_length;
      switch (plane) {
        case 'x':
          this.state.glX.drawArrays(this.state.glX.POINTS, 0, ysize*zsize);
          this.state.glX.flush();
          this.state.glX.endFrameEXP();
          break;
        case 'y':
          this.state.glY.drawArrays(this.state.glY.POINTS, 0, xsize*zsize);
          this.state.glY.flush();
          this.state.glY.endFrameEXP();
          break;
        case 'z':
          this.state.glZ.drawArrays(this.state.glZ.POINTS, 0, xsize*ysize);
          this.state.glZ.flush();
          this.state.glZ.endFrameEXP();
          break;
      }
    }

    render() {
        if( !this.props.headers) {
            return <View><Text>Loading headers..</Text></View>;
        }
        if (!this.props.rawData){
            return <View><Text>Loading raw data..</Text></View>
        }

        var maxValX = 100;
        if (this.props.headers.xspace) {
            maxValX = this.props.headers.xspace.space_length;
        }

        var maxValY = 100;
        if (this.props.headers.yspace) {
            maxValY = this.props.headers.yspace.space_length;
        }

        var maxValZ = 100;
        if (this.props.headers.zspace) {
            maxValZ = this.props.headers.zspace.space_length;
        }

        //console.log('rendering');///, this.state);

        // FIXME: Make this dynamic
        const viewWidth = 350;
        const viewHeight = 400;
        return (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <View style={{width: 350, height: 400, backgroundColor: 'pink'}}>
                    <Pressable onPress={
                        ({nativeEvent}) => {
                            const ysize = this.props.headers.yspace.space_length;
                            const zsize = this.props.headers.zspace.space_length;
                            const scaledY = nativeEvent.locationX / viewWidth;
                            const scaledZ = nativeEvent.locationY / viewHeight;
                            this.setState({
                                yVal: Math.round(scaledY * ysize),
                                zVal: Math.round(scaledZ * zsize),
                            });
                            console.log(nativeEvent.locationY, nativeEvent.locationZ, scaledY, scaledZ);
                            this.refreshAllPanels();
                        }
                    }>
                    <GLView style={{ width: viewWidth, height: viewHeight, borderWidth: 2, borderColor: 'green' }} onContextCreate={this.onContextCreateX} />
                    </Pressable>
                </View>
                <SegmentSlider
                  val={this.state.xVal}
                  valName={'xVal'}
                  max={maxValX}
                  label='Sagittal:'
                  onSliderChange={this.handleSliderChange}
                />
                <View style={{width: 350, height: 400, backgroundColor: 'pink'}}>
                    <Pressable onPress={
                        ({nativeEvent}) => {
                            const xsize = this.props.headers.xspace.space_length;
                            const zsize = this.props.headers.zspace.space_length;
                            const scaledX = nativeEvent.locationX / viewWidth;
                            const scaledZ = nativeEvent.locationY / viewHeight;
                            this.setState({
                                xVal: Math.round(scaledX * xsize),
                                zVal: Math.round(scaledZ * zsize),
                            });
                            this.refreshAllPanels();
                        }
                    }>
                    <GLView style={{ width: viewWidth, height: viewHeight, borderWidth: 2, borderColor: 'green' }} onContextCreate={this.onContextCreateY} />
                    </Pressable>
                </View>
                <SegmentSlider
                  val={this.state.yVal}
                  valName={'yVal'}
                  max={maxValY}
                  label='Coronal:'
                  onSliderChange={this.handleSliderChange}
                />
                <View style={{width: 350, height: 400, backgroundColor: 'pink'}}>
                    <Pressable onPress={
                        ({nativeEvent}) => {
                            const xsize = this.props.headers.xspace.space_length;
                            const ysize = this.props.headers.yspace.space_length;
                            const scaledX = nativeEvent.locationX / viewWidth;
                            const scaledY = nativeEvent.locationY / viewHeight;
                            this.setState({
                                xVal: Math.round(scaledX * xsize),
                                yVal: Math.round(scaledY * ysize),
                            });
                            this.refreshAllPanels();
                        }
                    }>
                    <GLView style={{ width: viewWidth, height: viewHeight, borderWidth: 2, borderColor: 'green' }} onContextCreate={this.onContextCreateZ} />
                    </Pressable>
                </View>
                <SegmentSlider
                  val={this.state.zVal}
                  valName={'zVal'}
                  max={maxValZ}
                  label='Axial:'
                  onSliderChange={this.handleSliderChange}
                />
                </View>
               );
    }

    arrayIndex = (x, y, z) => {
        if (!this.props.headers.xspace) {
            return;
        }
        const ySize = this.props.headers.yspace.space_length;
        const xSize = this.props.headers.xspace.space_length;
        const zSize = this.props.headers.zspace.space_length;
        // slice order is x, z, y in our test file. This should
        // be based on the headers and not hardcoded.
        return y + 
            zSize * z + 
            zSize * x * ySize
    }

    arrayValue = (x, y, z) => {
        if (!this.state.data) {
            // console.log('No dataview');
            return;
        }
        if (!this.props.headers.xspace) {
            console.warn('No xspace');
            return;
        }
        const idx = this.arrayIndex(x, y, z);
        return this.state.data.floats[idx];
    }

    preprocess = (rawdata) => {
        const dv = new DataView(rawdata);
        const floatArray = new Float32Array(this.props.rawData.byteLength / 4);
        let min = null;
        let max = null;
        for(let i = 0; i < this.props.rawData.byteLength; i += 4) {
          const val = dv.getFloat32(i, true);
          if (min == null || val < min) {
            min = val;
          }
          if (max == null || val > max) {
            max = val;
          }
          floatArray[i / 4] = val;
        }
        console.log('min, max', min, max, floatArray.byteLength);
        return {
            min: min,
            max: max,
            floats: floatArray,
        }
    }
    onContextCreateX = (gl) => {
      this.onContextCreate(gl, 'x');
    }

    onContextCreateY = (gl) => {
      this.onContextCreate(gl, 'y');
    }

    onContextCreateZ = (gl) => {
      this.onContextCreate(gl, 'z');
    }

    populateWorldPosAttribute = (gl, worldattrib, plane, worldbuffer, crosshairsattrib, crosshairsbuffer) => {
      if (!gl) return;

      const xsize = this.props.headers.xspace.space_length;
      const ysize = this.props.headers.yspace.space_length;
      const zsize = this.props.headers.zspace.space_length;
      let worldpos;

      switch (plane) {
      case 'x':
          worldpos = this.state.worldposX;
          crosshairs = this.state.crosshairsX;
          if (!worldpos) {
              worldpos = new Float32Array(ysize*zsize);
              crosshairs = new Float32Array(ysize*zsize);
              this.setState({worldPosX: worldpos, crosshairsX: crosshairs});
          }
          for (let y = 0; y < ysize; y++) {
            for(let z = 0; z < zsize; z++) {
              const i = y*zsize + z;
              // FIXME: Put the raw values on the GPU and do the lookup
              // of the value there.
              const intensity = this.arrayValue(this.state.xVal, y, z);
              worldpos[i] = intensity;
              crosshairs[i] = (y == this.state.yVal || z == this.state.zVal) ? 1.0 : -1.0;
            }
          }
          break;
      case 'y':
          worldpos = this.state.worldposY;
          crosshairs = this.state.crosshairsY;
          if (!worldpos) {
              worldpos = new Float32Array(xsize*zsize);
              crosshairs = new Float32Array(xsize*zsize);
              this.setState({worldPosY: worldpos, crosshairsY: crosshairs});
          }
          for (let x = 0; x < xsize; x++) {
            for(let z = 0; z < zsize; z++) {
              // FIXME: Put the raw values on the GPU and do the lookup
              // of the value there.
              const i = x*zsize + z;
              const intensity = this.arrayValue(x, this.state.yVal, z);
              worldpos[i] = intensity;
              crosshairs[i] = (x == this.state.xVal || z == this.state.zVal) ? 1.0 : -1.0;
            }
          }
          break;
      case 'z':
          worldpos = this.state.worldposZ;
          crosshairs = this.state.crosshairsZ;
          if (!worldpos) {
              worldpos = new Float32Array(ysize*zsize);
              crosshairs = new Float32Array(ysize*zsize);
              this.setState({worldPosZ: worldpos, crosshairsZ: crosshairs});
          }
          for (let x = 0; x < xsize; x++) {
            for(let y = 0; y < ysize; y++) {
              const i = x*ysize + y;
              // FIXME: Put the raw values on the GPU and do the lookup
              // of the value there.
              const intensity = this.arrayValue(x, y, this.state.zVal);
              worldpos[i] = intensity;
              crosshairs[i] = (x == this.state.xVal || y == this.state.yVal) ? 1.0 : -1.0;
            }
          }
      }


      gl.bindBuffer(gl.ARRAY_BUFFER, worldbuffer);
      gl.bufferData(gl.ARRAY_BUFFER, worldpos, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(worldattrib);
      gl.vertexAttribPointer(worldattrib, 1, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, crosshairsbuffer);
      gl.bufferData(gl.ARRAY_BUFFER, crosshairs, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(crosshairsattrib);
      gl.vertexAttribPointer(crosshairsattrib, 1, gl.FLOAT, false, 0, 0);
    }

    populateScreenPosAttribute = (gl, program, plane) => {
        const positionAttributeLocation = gl.getAttribLocation(program, "a_screenpos");

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);



        let positions = [];
        const xsize = this.props.headers.xspace.space_length;
        const ysize = this.props.headers.yspace.space_length;
        const zsize = this.props.headers.zspace.space_length;
        switch (plane) {
          case 'x':
            for (let y = 0; y < ysize; y++) {
                for(let z = 0; z < zsize; z++) {
                    positions.push(y);
                    positions.push(z);
                }
            }
            break;
          case 'y':
            for (let x = 0; x < xsize; x++) {
                for(let z = 0; z < zsize; z++) {
                    positions.push(x);
                    positions.push(z);
                }
            }
            break;
          case 'z':
            for (let x = 0; x < xsize; x++) {
                for(let y = 0; y < ysize; y++) {
                    positions.push(x);
                    positions.push(y);
                }
            }
            break;
        }
        
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(positionAttributeLocation);

        // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        const size = 2;          // 2 components per iteration == vec2 = (x, y)
        const type = gl.FLOAT;   // the data is 32bit floats
        const normalize = false; // don't normalize the data
        const stride = 0;
        const offset = 0;
        gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);
        return;
    }

    calculateDisplayUniforms = (gl, program, plane) => {
        const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
        const pixelSizeUniformLocation = gl.getUniformLocation(program, "u_pixelsize");
        switch (plane) {
          case 'x':
            gl.uniform2f(
                resolutionUniformLocation,
                this.props.headers.yspace.space_length,
                this.props.headers.zspace.space_length,
            );
                
            console.log('pointuniform', pixelSizeUniformLocation, resolutionUniformLocation);
            gl.uniform1f(pixelSizeUniformLocation, 10 );
            break;
          case 'y':
            gl.uniform2f(
                resolutionUniformLocation,
                this.props.headers.xspace.space_length,
                this.props.headers.zspace.space_length,
            );
            console.log('pointuniform', pixelSizeUniformLocation, resolutionUniformLocation);
            gl.uniform1f(pixelSizeUniformLocation, gl.drawingBufferWidth / this.props.headers.xspace.space_length);
            break;
          case 'z':
            gl.uniform2f(
                resolutionUniformLocation,
                this.props.headers.xspace.space_length,
                this.props.headers.yspace.space_length,
            );
            console.log('pointuniform', pixelSizeUniformLocation, resolutionUniformLocation);
            gl.uniform1f(pixelSizeUniformLocation, gl.drawingBufferWidth / this.props.headers.xspace.space_length);
            break;
        }
    }
    
    onContextCreate = (gl, plane) => {
        const data = this.preprocess(this.props.rawData);
        switch (plane) {
          case 'x':
            this.setState({data: data, glX: gl});
            break;
          case 'y':
            this.setState({data: data, glY: gl});
            break;
          case 'z':
            this.setState({data: data, glZ: gl});
            break;
        }

        // this.setState({ctx: ctx, dataview: new DataView(this.props.rawData), minIntensity: min, maxIntensity: max, gl: gl});
        console.log('draw frame');
        console.log('on context create');
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clearColor(0, 1, 1, 1);

        // Create vertex shader (shape & position)
        const vert = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(
          vert,
          `
          attribute vec2 a_screenpos;
          uniform vec2 u_resolution;
          uniform float u_pixelsize;

          attribute float a_intensity; 

          attribute float a_crosshairs;
          varying float v_crosshairs;

          // send (x, y, z) and (intensity)
          // to the fragment shader
          varying vec3 v_worldpos;
          varying float v_intensity;


          void main(void) {
            vec2 normalize_to_one = a_screenpos / u_resolution;
            vec2 normalize_to_two = normalize_to_one * 2.0;
            vec2 normalize_to_clipspace = normalize_to_two - 1.0;

            gl_Position = vec4(normalize_to_clipspace * vec2(1, -1), 0, 1);
            gl_PointSize = u_pixelsize; 
            // v_worldpos = a_worldpos.xyz;
            v_intensity = a_intensity;
            v_crosshairs = a_crosshairs;
          }
        `
        );
            // gl_Position = vec4(normalize_to_clipspace, 0, 1);
        gl.compileShader(vert);
        var success = gl.getShaderParameter(vert, gl.COMPILE_STATUS);
        if (!success) {
            msg = gl.getShaderInfoLog(vert);
            gl.deleteShader(vert);
            throw new Error("Could not compile shader:" + msg);
        }

        // Create fragment shader (color)
        const frag = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(
          frag,
          `
          precision mediump float;

          uniform vec2 u_datarange;

          uniform vec3 u_spacesize;

          varying float v_intensity;

          // location of the crosshairs in clipspace
          varying float v_crosshairs;

          void main(void) {
              float min = u_datarange.x;
              float max = u_datarange.y;
              float val = (v_intensity - min) / (max-min);

              if (v_crosshairs > 0.0) {
                  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
              } else {
                  gl_FragColor = vec4(val, val, val, 1.0);
              }

          }
        `
        );
        gl.compileShader(frag);
        var success = gl.getShaderParameter(frag, gl.COMPILE_STATUS);
        if (!success) {
            msg = gl.getShaderInfoLog(frag);
            gl.deleteShader(frag);
            throw new Error("Could not compile shader:" + msg);
        }

        // Link together into a program
        const program = gl.createProgram();


        gl.attachShader(program, vert);
        gl.attachShader(program, frag);
        gl.linkProgram(program);
        var success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!success) {
            const msg = gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            throw new Error("Could not link program: " + msg);
        }
                       
        gl.useProgram(program);

        this.populateScreenPosAttribute(gl, program, plane);
        this.calculateDisplayUniforms(gl, program, plane);

        gl.clear(gl.COLOR_BUFFER_BIT);
        var datarangeUniformLocation = gl.getUniformLocation(program, "u_datarange");
        gl.uniform2f(datarangeUniformLocation, data.min, data.max);

        const worldPositionAttributeLocation = gl.getAttribLocation(program, "a_intensity");
        const worldPosBuffer = gl.createBuffer();
        const crosshairsAttributeLocation = gl.getAttribLocation(program, "a_crosshairs");
        const crosshairsBuffer = gl.createBuffer();
        console.log('setting locations', plane, worldPositionAttributeLocation);

        /*
        const worldBufferBuffer = gl.createBuffer();

        const worldAttributeLocation = gl.getAttribLocation(program, "a_worldpos");
        gl.bufferData(gl.ARRAY_BUFFER, [], gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(worldAttributeLocation);
        */

        switch (plane) {
          case 'x': 
            this.setState({
                worldPositionAttributeLocationX: worldPositionAttributeLocation,
                worldPosBufferX: worldPosBuffer,
                crosshairsAttributeLocationX: crosshairsAttributeLocation,
                crosshairsBufferX: crosshairsBuffer,
            });
            break;
          case 'y': 
            this.setState({
                worldPositionAttributeLocationY: worldPositionAttributeLocation,
                worldPosBufferY: worldPosBuffer,
                crosshairsAttributeLocationY: crosshairsAttributeLocation,
                crosshairsBufferY: crosshairsBuffer,
            });
            break;
          case 'z': 
            this.setState({
                worldPositionAttributeLocationZ: worldPositionAttributeLocation,
                worldPosBufferZ: worldPosBuffer,
                crosshairsAttributeLocationZ: crosshairsAttributeLocation,
                crosshairsBufferZ: crosshairsBuffer,
            });
            break;
        }

        this.refreshAllPanels();
        return;
    }
}
