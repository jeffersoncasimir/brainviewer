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

    handleSliderChange = (plane, newValue) => {
        const newState = {};
        newState[plane] = newValue;
        this.setState(newState);

        requestAnimationFrame(() => this.drawPanel('x'));
        requestAnimationFrame(() => this.drawPanel('y'));
        requestAnimationFrame(() => this.drawPanel('z'));
    };

    drawPanel = (plane) => {
      const xsize = this.props.headers.xspace.space_length;
      const ysize = this.props.headers.yspace.space_length;
      const zsize = this.props.headers.zspace.space_length;
      const intensities = [];
      let intensityUniformLocation;
      switch (plane) {
        case 'x':
          intensityUniformLocation = this.state.intensityUniformLocationX; 
          for (let y = 0; y < ysize; y++) {
            for(let z = 0; z < zsize; z++) {
              const i = y*zsize + z;
              // FIXME: Put the raw values on the GPU and do the lookup
              // of the value there.
              const intensity = this.arrayValue(this.state.xVal, y, z);
              this.state.glX.uniform1f(intensityUniformLocation, intensity);

              this.state.glX.drawArrays(this.state.glX.POINTS, i, 1);
            }
          }
          this.state.glX.flush();
          this.state.glX.endFrameEXP();
          break;
        case 'y':
          intensityUniformLocation = this.state.intensityUniformLocationY; 
          for (let x = 0; x < xsize; x++) {
            for(let z = 0; z < zsize; z++) {
              // FIXME: Put the raw values on the GPU and do the lookup
              // of the value there.
              const i = x*zsize + z;
              const intensity = this.arrayValue(x, this.state.yVal, z);
              this.state.glY.uniform1f(intensityUniformLocation, intensity);

              this.state.glY.drawArrays(this.state.glY.POINTS, i, 1);
            }
          }
          this.state.glY.flush();
          this.state.glY.endFrameEXP();
          break;
        case 'z':
          intensityUniformLocation = this.state.intensityUniformLocationZ; 
          for (let x = 0; x < xsize; x++) {
            for(let y = 0; y < ysize; y++) {
              const i = x*ysize + y;
              // FIXME: Put the raw values on the GPU and do the lookup
              // of the value there.
              const intensity = this.arrayValue(x, y, this.state.zVal);
              this.state.glZ.uniform1f(intensityUniformLocation, intensity);
              this.state.glZ.drawArrays(this.state.glZ.POINTS, i, 1);
            }
          }
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

        console.log('rendering');///, this.state);

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
                            requestAnimationFrame(() => this.drawPanel('x'));
                            requestAnimationFrame(() => this.drawPanel('y'));
                            requestAnimationFrame(() => this.drawPanel('z'));
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
                            console.log(nativeEvent.locationX, nativeEvent.locationZ, scaledX, scaledZ);
                            requestAnimationFrame(() => this.drawPanel('x'));
                            requestAnimationFrame(() => this.drawPanel('y'));
                            requestAnimationFrame(() => this.drawPanel('z'));
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
                            console.log(nativeEvent.locationX, nativeEvent.locationY, scaledX, scaledY);
                            requestAnimationFrame(() => this.drawPanel('x'));
                            requestAnimationFrame(() => this.drawPanel('y'));
                            requestAnimationFrame(() => this.drawPanel('z'));
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
        if (!this.state.dataview) {
            // console.log('No dataview');
            return;
        }
        if (!this.props.headers.xspace) {
            console.warn('No xspace');
            return;
        }
        const idx = this.arrayIndex(x, y, z);
        return this.state.dataview.getFloat32(idx*4, true);
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

    onContextCreate = (gl, plane) => {
        const data = this.preprocess(this.props.rawData);
        switch (plane) {
          case 'x':
            this.setState({data: data, glX: gl, dataview: new DataView(this.props.rawData)});
            break;
          case 'y':
            this.setState({data: data, glY: gl, dataview: new DataView(this.props.rawData)});
            break;
          case 'z':
            this.setState({data: data, glZ: gl, dataview: new DataView(this.props.rawData)});
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
          attribute vec2 a_pos;
          uniform vec2 u_resolution;
          uniform float u_pixelsize;
          void main(void) {
            vec2 normalize_to_one = a_pos / u_resolution;
            vec2 normalize_to_two = normalize_to_one * 2.0;
            vec2 normalize_to_clipspace = normalize_to_two - 1.0;

            gl_Position = vec4(normalize_to_clipspace * vec2(1, -1), 0, 1);
            gl_PointSize = u_pixelsize; 
          }
        `
        );
            // gl_Position = vec4(normalize_to_clipspace, 0, 1);
        gl.compileShader(vert);

        // Create fragment shader (color)
        const frag = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(
          frag,
          `
          precision mediump float;

          uniform float u_intensity;
          uniform vec2 u_datarange;
          void main(void) {
              float min = u_datarange.x;
              float max = u_datarange.y;
              float val = (u_intensity - min) / (max-min);

            gl_FragColor = vec4(val, val, val, 1.0);
          }
        `
        );
        gl.compileShader(frag);

        // Link together into a program
        const program = gl.createProgram();

        let positionAttributeLocation = gl.getAttribLocation(program, "a_pos");

        
        let positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        let positions = [];
        let xspace;
        let yspace;
        let zspace;
        switch (plane) {
          case 'x':
            ysize = this.props.headers.yspace.space_length;
            zsize = this.props.headers.zspace.space_length;
            for (let y = 0; y < ysize; y++) {
                for(let z = 0; z < zsize; z++) {
                    positions.push(y);
                    positions.push(z);
                }
            }
            break;
          case 'y':
            xsize = this.props.headers.xspace.space_length;
            zsize = this.props.headers.zspace.space_length;
            for (let x = 0; x < xsize; x++) {
                for(let z = 0; z < zsize; z++) {
                    positions.push(x);
                    positions.push(z);
                }
            }
            break;
          case 'z':
            xsize = this.props.headers.xspace.space_length;
            ysize = this.props.headers.yspace.space_length;
            for (let x = 0; x < xsize; x++) {
                for(let y = 0; y < ysize; y++) {
                    positions.push(x);
                    positions.push(y);
                }
            }
            break;
        }
        //gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
        //console.log('u_resolition', xsize, ysize);
        
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, data.floats);
        gl.bufferData(gl.ARRAY_BUFFER, data.floats, gl.STATIC_DRAW);


        gl.attachShader(program, vert);
        gl.attachShader(program, frag);
        gl.linkProgram(program);
        gl.useProgram(program);
        let resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
        let pixelSizeUniformLocation = gl.getUniformLocation(program, "u_pixelsize");
        switch (plane) {
          case 'x':
            gl.uniform2f(resolutionUniformLocation, ysize, zsize);
            console.log('pointuniform', pixelSizeUniformLocation, resolutionUniformLocation);
            gl.uniform1f(pixelSizeUniformLocation, 10 );
            break;
          case 'y':
            gl.uniform2f(resolutionUniformLocation, xsize, zsize);
            console.log('pointuniform', pixelSizeUniformLocation, resolutionUniformLocation);
            gl.uniform1f(pixelSizeUniformLocation, gl.drawingBufferWidth / xsize );
            break;
          case 'z':
            gl.uniform2f(resolutionUniformLocation, xsize, ysize);
            console.log('pointuniform', pixelSizeUniformLocation, resolutionUniformLocation);
            gl.uniform1f(pixelSizeUniformLocation, gl.drawingBufferWidth / xsize );
            break;
        }

        gl.enableVertexAttribArray(positionAttributeLocation);

        // Bind the position buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        var size = 2;          // 2 components per iteration
        var type = gl.FLOAT;   // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(
           positionAttributeLocation, size, type, normalize, stride, offset)

        gl.clear(gl.COLOR_BUFFER_BIT);
        var intensityUniformLocation = gl.getUniformLocation(program, "u_intensity");
        var datarangeUniformLocation = gl.getUniformLocation(program, "u_datarange");
        gl.uniform2f(datarangeUniformLocation, data.min, data.max);
        switch (plane) {
          case 'x': 
            this.setState({intensityUniformLocationX: intensityUniformLocation});
            break;
          case 'y': 
            this.setState({intensityUniformLocationY: intensityUniformLocation});
            break;
          case 'z': 
            this.setState({intensityUniformLocationZ: intensityUniformLocation});
            break;
        }
        return;
    }
}
