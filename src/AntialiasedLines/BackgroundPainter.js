const glMatrix = require('gl-matrix');
const GlFunctionsInstantiator = require('./glFunctions');
const ShaderCode = require('./ShaderCode');
const StaticFunctions = require('./StaticFunctions');

//---------------------------Constants------------------------

const GLSL_PROGRAM_NAME = 'BACKGROUND_DRAWER';

//---------------------------GLSL-----------------------------

var vertexShaderSourceImplmntation = `	
	void main(){
		vec4 pos4 = vec4(pos, 1.0);
		gl_Position = pos4;
	}
`;
var fragmentShaderSourceImplmntation = `#version 300 es
	precision mediump float;
	
	uniform vec4 u_backgroundColor;
	
	out vec4 f_col;
	
	void main(){
		f_col = u_backgroundColor;
	}
`;

class BackgroundPainter{
	constructor(canvasID, backgroundColor){
		
		this.backgroundColor = backgroundColor;
		
		this.glVars = {
			vertices: [],
		}
		
		this.genVertices();
		
		if(!canvasID){
			canvasID = 'canvas';
		}
		
		let canvas = document.getElementById(canvasID);
		this.gl = canvas.getContext('webgl2', {antialias: true});
		
		if(!this.gl){
			console.log('no gl-context!');
			return;
		}
		
		this.glFunctions = new GlFunctionsInstantiator(this.gl, true);
		
		this.vertexShaderSource = ShaderCode.vertexShaderSourceBase + vertexShaderSourceImplmntation;
		this.fragmentShaderSource = fragmentShaderSourceImplmntation;
		
/*		console.log('vertexShaderSource:');
		console.log(this.vertexShaderSource);*/
		
		this.initGl();
	}
	
	genVertices(){
		let verts = [];
		const offs = 1;
		verts.push( -offs, -offs, 0,
						-offs,  offs, 0,
						 offs,  offs, 0,
						-offs, -offs, 0,
						 offs,  offs, 0,
						 offs, -offs, 0 );
		this.glVars.vertices = verts;
	}
	
	supportsWebGL2(){
		return !!this.gl;
	}

	//-----------------------------------------------------------------

	
	initGlVars(){	
		this.glFunctions.useProgram(GLSL_PROGRAM_NAME);
		
		this.glFunctions.createVAO(GLSL_PROGRAM_NAME);
		
		let vertices = this.glVars.vertices;
		
		this.glFunctions.evalLayoutLocations( ['pos'] );
		
		console.log('layoutLocations: ', this.glFunctions.layoutLocations);
		
		this.glFunctions.genAndBindVectorVBO(vertices,  3, 'pos');
		
		this.bindBackgroundColor();
		
		//	 always unbind VAO:
		this.glFunctions.unbindVAO(null);
	}
	
	setBackgroundColor(backgroundColor){
		this.backgroundColor = backgroundColor;
	}
	bindBackgroundColor(){
		if(!this.backgroundColor){
			return;
		}
		this.glFunctions.setUniformVector4fv('u_backgroundColor', this.backgroundColor);
	}
	
	
	//-----------------------------------------------------------------
	
	paintVertices(){
		let vertices = this.glVars.vertices;
		
		let primitiveType = this.gl.TRIANGLES;
		let offset = 0;
		let count = Math.floor(vertices.length / 3);
		
		this.gl.drawArrays(primitiveType, offset, count);
	}
	
	//-----------------------------------------------------------------
	
	createAndCompileShaderSrc(){
		let frgmntShrdSrc 		= this.fragmentShaderSource;
		let vertexShaderSource  = this.vertexShaderSource;
	
		var vertexShader   = this.glFunctions.createShader(this.gl.VERTEX_SHADER,   vertexShaderSource);
		var fragmentShader = this.glFunctions.createShader(this.gl.FRAGMENT_SHADER, frgmntShrdSrc);
	
		var program = this.glFunctions.createProgram(GLSL_PROGRAM_NAME, vertexShader, fragmentShader);
		this.glFunctions.useProgram(GLSL_PROGRAM_NAME);
	}
	
	initGl() {
		if (!this.gl) {
			console.log('no gl context!');
			return false;
		}
		
		this.createAndCompileShaderSrc();
		
		this.initGlVars();
		
		return true;
	}
	updateGlVars(){
		
	}
	
	
	paintBackground(){
		if(!this.backgroundColor){
			console.log('BackgroundPainter::paintBackground -> this.backgroundColor is null!!!');
			return;
		}
		this.glFunctions.useProgram(GLSL_PROGRAM_NAME);
		
		this.glFunctions.bindVAO(GLSL_PROGRAM_NAME);
		
		this.bindBackgroundColor();
		
		this.paintVertices();
		
		this.glFunctions.unbindVAO();
	}
}

module.exports = BackgroundPainter;

