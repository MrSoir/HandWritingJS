const glMatrix = require('gl-matrix');
const GlFunctionsInstantiator = require('./glFunctions');
const ShaderCode = require('./ShaderCode');
const StaticFunctions = require('./StaticFunctions');

//---------------------------GLSL-----------------------------

const CIRCLE_FRGMNT_CNT = 50;

//---------------------------GLSL-----------------------------

var vertexShaderSourceImplmntation = `	
	uniform float pxs[$!{POINTS_COUNT}!$];
	uniform float pys[$!{POINTS_COUNT}!$];
	uniform float radii[$!{POINTS_COUNT}!$];
	
	out vec4 f_col;
	
	mat4 genPointTransform(){
		vec3 cent = vec3(pxs[gl_InstanceID],
						 	  pys[gl_InstanceID],
						 	  0.0);
		
		mat4 trnsform = mat4(1.0);
		
		float radius = radii[gl_InstanceID];
		
		float scaleX = radius;
		float scaleY = radius;
		float scaleZ = 1.0;
		vec3 sclv = vec3(scaleX, scaleY, scaleZ);
		
		mat4 sclm = scaleMat4( sclv );
		mat4 trnsl = translateMat4(cent);
		
		return trnsl * sclm;
	}
	
	void main(){
		vec4 pos4 = vec4(pos, 1.0);
		vec4 col = vec4(1.0, 0.0, 1.0, 1.0);
		
		mat4 pntTrnsfrm = genPointTransform();
		
		gl_Position = perspective * modelView * pntTrnsfrm * pos4;
		
		f_col = col;
	}
`;
var fragmentShaderSourceImplmntation = `#version 300 es
	precision mediump float;
	
	in vec4 f_col;
	
	out vec4 outColor;
	
	void main() {
		outColor = f_col;
	}
`;

class APointsDrawer{
	constructor(canvasID, camera, points=[], radius=1){
		
		let radii = [];
		for(let i=0; i < points.length; ++i){
			radii.push( radius+i*3 );
		}
		this.pointData = {
			points: 	[],
			pointsChanged: false,
			radii: radii,
		};
		
		this.glVars = {
			vertices:		[],
			norms: 			[], // normals
		}
		
		this.glMeta = {
			instancing: true,
			instanceCount: 0,
		};
		
		this.genVertices();
		
		this.setPoints(points);
		
		this.camera = camera;
		
		if(!canvasID){
			canvasID = 'canvas';
		}
		
		var canvas = document.getElementById(canvasID);
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
	
	setPoints(points){
		this.pointData.points = points;
		this.pointData.pointsChanged = true;
		this.glMeta.instanceCount = points.length; 
	}
	
	genVertices(){
		let verts = [];
		
		const offs = Math.PI * 2 / CIRCLE_FRGMNT_CNT;
		
		for(let i=0; i < CIRCLE_FRGMNT_CNT; ++i){
			let curoffs = offs * i;
			let op1 = curoffs + offs;
			
			let p0 = [0, 0, 0];
			let p1 = [Math.cos(curoffs),
						 Math.sin(curoffs),
						 0.0];
			let p2 = [Math.cos(op1),
						 Math.sin(op1),
						 0.0];
			verts.push( p0[0], p0[1], p0[2],
						   p1[0], p1[1], p1[2],
						   p2[0], p2[1], p2[2] );
		}
		
		this.glVars.vertices = verts;
		
		this.genNorms();
	}
	genNorms(){
		let norms = []
		for(let i=0; i < this.glVars.vertices.length / 3; ++i){
			norms.push( 0,0,1 );
		}
		this.glVars.norms = norms;
	}
	
	
	supportsWebGL2(){
		return !!this.gl;
	}

	//-----------------------------------------------------------------
	
	initGlVars(){	
		this.glFunctions.useProgram('points');
		
		this.glFunctions.createVAO('points');
		
		let vertices = this.glVars.vertices;
		let norms 	 = this.glVars.norms;
		
		let pxs = [];
		let pys = [];
		let radii = [];
		
		let pnts = this.pointData.points;
		
		for(let i=0; i < pnts.length-1; ++i){
			let p = pnts[i];
			
			pxs.push( p[0] );
			pys.push( p[1] );
			radii.push( this.pointData.radii[i] );
		}
		
		this.glFunctions.evalLayoutLocations( ['pos', 'norm'] );
		
		console.log('layoutLocations: ', this.glFunctions.layoutLocations);
		
		this.glFunctions.genAndBindVectorVBO(vertices,  3, 'pos');
		
		this.glFunctions.useProgram('points');
		
		this.glFunctions.setUniformVector3fv('cameraPos', this.camera.cameraPos);
		
		this.glFunctions.setUniform1fv('pxs', pxs);
		this.glFunctions.setUniform1fv('pys', pys);
		this.glFunctions.setUniform1fv('radii', radii);
		
		this.glFunctions.setModelView(this.camera.cameraPos);
		this.glFunctions.setPerspective();
		
		//	 always unbind VAO:
		this.glFunctions.unbindVAO(null);
	}
	
	
	//-----------------------------------------------------------------
	
	paintVertices(){
		let vertices = this.glVars.vertices;
		
		let primitiveType = this.gl.TRIANGLES;
		let offset = 0;
		let count = Math.floor(vertices.length / 3);
		let instanceCount = this.glMeta.instanceCount;
		if(this.glMeta.instancing){
			if(instanceCount > 0){
				this.gl.drawArraysInstanced(primitiveType, offset, count, instanceCount);
			}else{
				console.log('instanced drawing: count: ', instanceCount);
			}
		}else{
			this.gl.drawArrays(primitiveType, offset, count);
		}
	}
	
	//-----------------------------------------------------------------
	
	createAndCompileShaderSrc(){
		let frgmntShrdSrc 		= this.fragmentShaderSource;
		let vertexShaderSource  = this.vertexShaderSource;
		
		vertexShaderSource = StaticFunctions.replaceString(vertexShaderSource, 
																		  [Math.max(this.pointData.points.length, 500),],
																		  ['POINTS_COUNT',]);
	
		var vertexShader   = this.glFunctions.createShader(this.gl.VERTEX_SHADER,   vertexShaderSource);
		var fragmentShader = this.glFunctions.createShader(this.gl.FRAGMENT_SHADER, frgmntShrdSrc);
	
		var program = this.glFunctions.createProgram('points', vertexShader, fragmentShader);
		this.glFunctions.useProgram('points');
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
	
	
	drawPoints(){
		this.glFunctions.useProgram('points');
		
		this.glFunctions.bindVAO('points');
		
		this.updateGlVars();
		
		this.paintVertices();
		
		this.glFunctions.unbindVAO();
	}
}

module.exports = APointsDrawer;



