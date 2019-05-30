const glMatrix = require('gl-matrix');
const GlFunctionsInstantiator = require('./glFunctions');
const ShaderCode = require('./ShaderCode');
const StaticFunctions = require('./StaticFunctions');

//---------------------------Constants------------------------

const GLSL_PROGRAM_NAME = 'TEXTURE_DRAWER';

//---------------------------GLSL-----------------------------

var vertexShaderSourceImplmntation = `	
	void main(){
		vec4 pos4 = vec4(pos, 1.0);
		gl_Position = pos4;
		
		f_pos = pos;
	}
`;
var fragmentShaderSourceImplmntation = `#version 300 es
	precision mediump float;
	
	in vec3 f_pos;
	uniform sampler2D u_texture;
	
	out vec4 f_col;
	
	vec2 interpolTexPos(vec2 pos){
		return vec2( (pos.x + 1.0) * 0.5,
						 (pos.y + 1.0) * 0.5 );
	}
	
	void main(){
		vec2 texcoor = interpolTexPos(f_pos.xy);
		f_col = texture(u_texture, texcoor);
	}
`;

class TexturePainter{
	constructor(canvasID, texture=null){
		
		this.texture = texture;
		
		this.glVars = {
			vertices:		[],
		}
		
		this.glMeta = {
			instancing: false,
		};
		
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
		
		this.bindTexture();
		
		//	 always unbind VAO:
		this.glFunctions.unbindVAO(null);
	}
	
	setTexture(texture){
		this.texture = texture;
	}
	bindTexture(){
		if(!this.texture){
			return;
		}
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
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
	
	
	paintTexture(){
		if(!this.texture){
			console.log('TexturePainter::paintTexure -> this.texture is null!!!');
			return;
		}
		this.glFunctions.useProgram(GLSL_PROGRAM_NAME);
		
		this.glFunctions.bindVAO(GLSL_PROGRAM_NAME);
		
		this.bindTexture();
		
		this.paintVertices();
		
		this.glFunctions.unbindVAO();
	}
}

module.exports = TexturePainter;

