const glMatrix = require('gl-matrix');
const GlFunctionsInstantiator = require('./glFunctions');
const ShaderCode = require('./ShaderCode');
const StaticFunctions = require('./StaticFunctions');

//---------------------------GLSL-----------------------------

var vertexShaderSourceImplmntation = `	
	uniform float pxs[$!{POINTS_COUNT}!$];
	uniform float pys[$!{POINTS_COUNT}!$];
	uniform float strokeWidth;
	
	out vec4 f_col;
	
	mat4 genLineTransform(){
		int id = gl_InstanceID;
		float idf = float(id);

		vec3 p0 = vec3(pxs[id],
						 	pys[id],
						 	0.0);
		vec3 p1 = vec3(pxs[id + 1],
						 	pys[id + 1],
						 	0.0);
		
		mat4 trnsform = mat4(1.0);
		vec3 cent = (p1 + p0) * 0.5;
		
		float dx = p1.x - p0.x;
		float dy = p1.y - p0.y;
		
		float lineWidth = sqrt(dx*dx + dy*dy);
		
		float scaleX = lineWidth * 0.5;
		float scaleY = strokeWidth * 0.5;
		float scaleZ = 1.0;
		vec3 sclv = vec3(scaleX, scaleY, scaleZ);
		
		float rotAngle = atan(dy, dx);
		
		vec3 trnslv = cent;//vec3(cent, idf * 50.0, 0.0);
		
		mat4 sclm = scaleMat4( sclv );
		mat4 rot = rotateZ( rotAngle );
		mat4 trnsl = translateMat4(trnslv);
		
		return trnsl * rot * sclm;
	}
	
	void main(){
		vec4 pos4 = vec4(pos, 1.0);
		vec4 col = vec4(1.0, 0.0, 1.0, 1.0);
		
		mat4 lneTrnsfrm = genLineTransform();
		
		gl_Position = perspective * modelView * lneTrnsfrm * pos4;
		
		f_pos = pos;
		f_col = col;
	}
`;
var fragmentShaderSourceImplmntation = `#version 300 es
	precision mediump float;
	
	in vec3 f_pos;
	in vec4 f_col;
	
	uniform sampler2D u_backgroundTexture;
	uniform float vpwidth;
	uniform float vpheight;
	
	out vec4 outColor;
	
	vec2 interpolTexPos(vec2 pos){
		return vec2( pos.x / vpwidth,
						 pos.y / vpheight );
	}
	
	vec4 calcAlinedCol(vec3 pos, vec4 col){
		float xoffs = 1.0;
		float yoffs = 0.8;
		if(abs(pos.y) < yoffs && abs(pos.x) < xoffs){
			return col;
		}else{
			float yfrctn = abs(pos.y) - yoffs;
			float xfrctn = abs(pos.x) - xoffs;
			float yalpha = 1.0 - (yfrctn / (1.0 - yoffs));
			float xalpha = 1.0 - (xfrctn / (1.0 - xoffs));
			float alpha = min(xalpha, yalpha);
			return vec4(col.rgb, col.a * alpha);
		}
	}
	
	vec4 composeColor(vec4 foregroundCol, vec4 backgroundCol){
		if(foregroundCol.a >= 1.0){
			return foregroundCol;
		}else{
			float alpha = foregroundCol.a;
			float alphaInvert = 1.0 - alpha;
			return vec4(foregroundCol.r * alpha + backgroundCol.r * alphaInvert,
							foregroundCol.g * alpha + backgroundCol.g * alphaInvert,
							foregroundCol.b * alpha + backgroundCol.b * alphaInvert,
							1.0 );
		}
	}
	
	void main() {
		vec2 bckgrndTxtPos = interpolTexPos(f_pos.xy);
		vec4 bckgrndCol = texture(u_backgroundTexture, bckgrndTxtPos);
		
		vec4 tarCol = calcAlinedCol(f_pos, f_col);
		
		vec4 composedCol = composeColor(tarCol, bckgrndCol);
		
		outColor = composedCol;
	}
`;

class ALinesDrawer{
	constructor(canvasID, camera, linePoints=[], strokeWidth=10){
				
		this.lineData = {
			linePoints: 	[],
			strokeWidth: strokeWidth,
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
		
		this.setPoints_hlpr(linePoints);
		
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
	
	setPoints(linePoints){
		this.setLinePoints(linePoints);
	}
	setLinePoints(linePoints){
		this.setPoints_hlpr(linePoints);
		this.updateGlPointsData();
	}
	
	setPoints_hlpr(linePoints){
		this.lineData.linePoints = linePoints;
		this.glMeta.instanceCount = linePoints.length-2;
	}
	
	setBackgroundTexture(texture){
		this.backgroundTexture = texture;
	}
	bindBackgroundTexture(){
		if(!this.backgroundTexture){
			return;
		}
		this.gl.activeTexture(this.gl.TEXTURE0 + 0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.backgroundTexture);
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
	
	updateGlPointsData(){
		this.glFunctions.useProgram('lines');
		this.glFunctions.bindVAO('lines');
		
		this.updateGlPointsData_hlpr();
		
		this.glFunctions.unbindVAO();
	}
	updateGlPointsData_hlpr(){
		let pxs = [];
		let pys = [];
		
		let lnePnts = this.lineData.linePoints;
		
		for(let i=0; i < lnePnts.length-1; ++i){
			let p = lnePnts[i];
			
			pxs.push( p[0] );
			pys.push( p[1] );
		}
		
		if(pxs.length > 0){
			this.glFunctions.setUniform1fv('pxs', pxs);
		}
		if(pys.length > 0){
			this.glFunctions.setUniform1fv('pys', pys);
		}

		this.glFunctions.setUniform1f('strokeWidth', this.lineData.strokeWidth);
	}
	
	initGlVars(){	
		this.glFunctions.useProgram('lines');
		
		this.glFunctions.createVAO('lines');
		
		let vertices = this.glVars.vertices;
		let norms 	 = this.glVars.norms;
		
		this.glFunctions.evalLayoutLocations( ['pos', 'norm'] );
		
		console.log('layoutLocations: ', this.glFunctions.layoutLocations);
		
		this.glFunctions.genAndBindVectorVBO(vertices,  3, 'pos');
		
		this.glFunctions.setUniformVector3fv('cameraPos', this.camera.cameraPos);
		
		this.updateGlPointsData_hlpr();
		
		this.glFunctions.setModelView(this.camera.cameraPos);
		this.glFunctions.setPerspective();
		
		this.bindBackgroundTexture();
		
		//	 always unbind VAO:
		this.glFunctions.unbindVAO(null);
	}
	
	
	//-----------------------------------------------------------------
	
	paintVertices(){
		let vertices = this.glVars.vertices;
		
		let primitiveType = this.gl.TRIANGLES;
		let offset = 0;
		let count = Math.floor(vertices.length / 3);
		if(this.glMeta.instancing){
			if(this.glMeta.instanceCount > 0){
				this.gl.drawArraysInstanced(primitiveType, offset, count, this.glMeta.instanceCount);
			}else{
				console.log('instanced drawing: count: ', this.glMeta.instanceCount);
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
																		  [Math.max(this.lineData.linePoints.length,500),],
																		  ['POINTS_COUNT',]);
	
		var vertexShader   = this.glFunctions.createShader(this.gl.VERTEX_SHADER,   vertexShaderSource);
		var fragmentShader = this.glFunctions.createShader(this.gl.FRAGMENT_SHADER, frgmntShrdSrc);
	
		var program = this.glFunctions.createProgram('lines', vertexShader, fragmentShader);
		this.glFunctions.useProgram('lines');
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
	
	
	drawLines(){
		this.glFunctions.useProgram('lines');
		
		this.glFunctions.bindVAO('lines');
		
		this.updateGlVars();
		
		this.bindBackgroundTexture();
		
		this.paintVertices();
		
		this.glFunctions.unbindVAO();
	}
}

module.exports = ALinesDrawer;

