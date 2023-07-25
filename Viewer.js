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
        return;
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
        const sliceNoUniformLocation = this.state.xSliceNoUniform;
        if (sliceNoUniformLocation) {

            console.log('set slice no uniform', newValue);
            this.state.glX.uniform1i(
                sliceNoUniformLocation,
                newValue,
            );

        var primitiveType = this.state.glX.TRIANGLES;
        var offset = 0;
        var count = 6;
        this.state.glX.drawArrays(primitiveType, offset, count);
            this.state.glX.flush();
            this.state.glX.endFrameEXP();
        }
        const newState = {};
        newState[plane] = newValue;
        this.setState(newState);
        // this.refreshAllPanels();
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

        let maxValX = 100;
        let maxValY = 100;
        let maxValZ = 100;

        if (this.props.headers.xspace) {
            maxValX = this.props.headers.xspace.space_length;
        }

        if (this.props.headers.yspace) {
            maxValY = this.props.headers.yspace.space_length;
        }

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

    arrayValue = (x, y, z, d) => {
        console.log(d);
        const dat = d || this.state.data;
        if (!dat) {
            console.log('No data');
            return;
        }
        if (!this.props.headers.xspace) {
            console.warn('No xspace');
            return;
        }
        const idx = this.arrayIndex(x, y, z, dat);
        return dat[idx];
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

    loadIntensityTexture = (gl, data) => {
        // Create a texture.
      const xsize = this.props.headers.xspace.space_length;
      const ysize = this.props.headers.yspace.space_length;
      const zsize = this.props.headers.zspace.space_length;
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_3D, texture);

        const values = new Uint8Array(data.floats.length*4);
        for(i = 0; i < data.floats.length; i++) {
            const val = ((data.floats[i] -data.min) / (data.max -data.min)) * 255;
            values[(i*3)] = val;
            values[(i*3)+1] = val;
            values[(i*3)+2] = val;
        }
        /*
        for(let x = 0; x < xsize; x++) {
            for(let y = 0; y < ysize; y++) {
                for(let z = 0; z < zsize; z++) {
                    const val = ((this.arrayValue(x, y, z, data) - data.min) / (data.max - data.min)) * 256;
                    const i = this.arrayIndex(x, y, z, data);
                    // console.log(i, val, this.arrayValue(x, y, z, data));
                    values[(i*3)] = val;
                    values[(i*3)+1] = val;
                    values[(i*3)+2] = val;
                }

            }
        }
        */

        // Set the parameters so we can render any size image.
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
       
          // Upload the image into the texture.
          console.log('x', xsize, 'y', ysize, 'z', zsize);


      gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGB, zsize, ysize, xsize, 0, gl.RGB, gl.UNSIGNED_BYTE, values);

    }
    calculateDisplayUniforms = (gl, program, plane) => {
        const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
        const pixelSizeUniformLocation = gl.getUniformLocation(program, "u_pixelsize");
        const spaceSizeUniformLocation = gl.getUniformLocation(program, "u_spacesize");
        if (spaceSizeUniformLocation) {
            gl.uniform3f(
                spaceSizeUniformLocation,
                this.props.headers.xspace.space_length,
                this.props.headers.yspace.space_length,
                this.props.headers.zspace.space_length,
            );
            console.log('set space size uniform');
        } else {
            console.log('no space size uniform');
        }
        const sliceNoUniformLocation = gl.getUniformLocation(program, "u_sliceno");
        if (sliceNoUniformLocation) {

            this.setState({xSliceNoUniform: sliceNoUniformLocation});
            console.log('set slice no uniform');
            gl.uniform1i(
                sliceNoUniformLocation,
                50,
            );
        }
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

        /*
        // this.setState({ctx: ctx, dataview: new DataView(this.props.rawData), minIntensity: min, maxIntensity: max, gl: gl});
        console.log('draw frame');
        console.log('on context create');
        */
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clearColor(0, 1, 0, 1);

        // Create vertex shader (shape & position)
        const vert = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(
          vert,
          `
          attribute vec2 a_position;
          uniform int u_sliceno;
          uniform vec2 u_resolution;
          uniform vec3 u_spacesize;
          varying vec3 texCoord;


          void main(void) {
            vec2 normalize_to_one = a_position / u_resolution;
            vec2 normalize_to_two = normalize_to_one * 2.0;
            vec2 normalize_to_clipspace = normalize_to_two - 1.0;

            gl_Position = vec4(normalize_to_clipspace * vec2(1, -1), 0, 1);
            // screen x = yspace, screen y = zspace
            // order in file is x, z, y
            // This means the texture coordinate is:
            // (x [calculated], zspace = screen y, yspace = screen x)

            // NOTE: TRIAL AND ERROR
            float aplane = normalize_to_one.x;
            float bplane = normalize_to_one.y;
            float cplane = float(u_sliceno) / float(u_spacesize.x);
            texCoord = vec3(float(u_sliceno) / float(u_spacesize.x), normalize_to_one.yx);
            /*
            gl_PointSize = u_pixelsize; 
            // v_worldpos = a_worldpos.xyz;
            v_intensity = a_intensity;
            v_crosshairs = a_crosshairs;
            */
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
          #extension GL_OES_texture_3D : enable
          precision mediump sampler3D;
          precision mediump float;
          uniform sampler3D u_image;

          varying vec3 texCoord;
          void main(void) {
              gl_FragColor = texture3D(u_image, texCoord).rgba;
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
                       
        gl.clear(gl.COLOR_BUFFER_BIT);

        const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        const positions = [
            0, 0,
            0, this.props.headers.yspace.space_length,
            this.props.headers.zspace.space_length, 0,

            this.props.headers.zspace.space_length, 0,
            this.props.headers.zspace.space_length, this.props.headers.yspace.space_length,
            0, this.props.headers.yspace.space_length,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        gl.useProgram(program);
        gl.enableVertexAttribArray(positionAttributeLocation);
        this.calculateDisplayUniforms(gl, program, plane);
        // Bind the position buffer.
         
            // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        var size = 2;          // 2 components per iteration
        var type = gl.FLOAT;   // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(
                positionAttributeLocation, size, type, normalize, stride, offset)

        this.loadIntensityTexture(gl, data);
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 6;
        gl.drawArrays(primitiveType, offset, count);
        gl.flush();
        gl.endFrameEXP();
        /*

        this.populateScreenPosAttribute(gl, program, plane);

        gl.clear(gl.COLOR_BUFFER_BIT);
        var datarangeUniformLocation = gl.getUniformLocation(program, "u_datarange");
        gl.uniform2f(datarangeUniformLocation, data.min, data.max);

        const worldPositionAttributeLocation = gl.getAttribLocation(program, "a_intensity");
        const worldPosBuffer = gl.createBuffer();
        const crosshairsAttributeLocation = gl.getAttribLocation(program, "a_crosshairs");
        const crosshairsBuffer = gl.createBuffer();
        console.log('setting locations', plane, worldPositionAttributeLocation);

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
        */
        return;
    }
}
