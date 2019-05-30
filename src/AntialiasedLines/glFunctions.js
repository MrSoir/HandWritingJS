var glMatrix = require('gl-matrix');

//-----------------------------------------------------------------

class GlFunctionsInstantiator{
	constructor(gl, orthographic = false){
		// programs: every shaderProgram is saved by a name in a map -> every entry contains: 
		// 	1. program: the shaderProgram
		//		2. vertexShader: the compiled vertex shader
		// 	3. fragmentShader: the compiled fragment shader
		this.programs = new Map();
		// shaderMeta: whenever a program is bound to the current GL-state, the current shaderProgram is bound to shaderMeta -> currentShaderProgram is one of the entries of the programs-Map
		this.shaderMeta = { curShaderProgram: null };
		// uniforms: uniforms contains the layoutLocation for every uniform (data will be bound to the uniforms, no information needed how to read the data)
		this.uniforms = new Map();
		// vboMeta: contains all vbo-related infos: 
		//		1. the vbo-buffer itself
		//		2. the data that is bound to the vbo
		//		3. the vboName: the name of the buffer/attribute-variable used in the vertex-shader
		// 	4. stride
		//		5. offset
		this.vboMeta = new Map();
		// layoutLocations: all layoutLocations of the VBOs/Attributes in the vertex-shader mapped against ther vboNames
		this.layoutLocations = new Map();
		this.VAOs = new Map();
		this.textures = new Map();
		this.gl =  gl;
		this.orthographic = orthographic;
	}
	
	createShader(type, source) {
		var shader = this.gl.createShader(type);
		this.gl.shaderSource(shader, source);
		this.gl.compileShader(shader);
		var success = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
		if (success) {
			return shader;
		}
	
		console.log(this.gl.getShaderInfoLog(shader));	// eslint-disable-line
		this.gl.deleteShader(shader);
		return undefined;
	}
	
	//-----------------------
	
	createProgram(name, vertexShader, fragmentShader) {	
		var program = this.gl.createProgram();
		
		this.gl.attachShader(program, vertexShader);
		this.gl.attachShader(program, fragmentShader);
		
		this.gl.linkProgram(program);
		
		var success = this.gl.getProgramParameter(program, this.gl.LINK_STATUS);
		
		if (success) {
			this.gl.useProgram(program);
			
			this.programs.set(name, {
				program: program, 
				vertexShader: vertexShader,
				fragmentShader: fragmentShader
			});
			return program;
		}
	
		console.log(this.gl.getProgramInfoLog(program));	// eslint-disable-line
		this.gl.deleteProgram(program);
		return undefined;
	}
	
	useProgram(name){
		let program = this.programs.get(name);
		if(program){
			this.gl.useProgram(program.program);
			this.shaderMeta.curShaderProgram = program;
		}else{
			console.log(`program ${name} invalid!`);
		}
	}
	useCurProgram(){
		let program = this.shaderMeta.curShaderProgram.program;
		if(!!program){
			this.gl.useProgram(program);
		}else{
			console.log('not able to set program! (useCurProgram)');
		}
	}
	
	//-----------------------------------------------------------------
	
	evalUniformLayoutLocation(name, data){
		let shaderLoc = this.gl.getUniformLocation(this.shaderMeta.curShaderProgram.program, name);
		
		if(!data && this.uniforms.get(name)){
			this.uniforms.get(name).shaderLoc = shaderLoc;
		}else{
			this.uniforms.set(name, {shaderLoc: shaderLoc, data: data});
		}
		return this.uniforms.get(name);
	}
	
	//---------------
	
	_setUniform(name, data, glFunc){
		let uniform = this.uniforms.get(name);
		
//		if(!uniform){
			uniform = this.evalUniformLayoutLocation(name, data);
//		}
		
		// check, if data is provided. if so, update. if no data is provided, then use the data that was bound to the uniform the last time:
		if(!!data){
			uniform.data = data;
		}
		glFunc( [uniform.shaderLoc, uniform.data] );
	}
	
	//---------------
	
	setUniformMatrix2fv(name, data){
		this._setUniform(name, data, (args)=>{this.gl.uniformMatrix2fv(args[0], false, args[1])});
	}
	setUniformMatrix3fv(name, data){
		this._setUniform(name, data, (args)=>{this.gl.uniformMatrix3fv(args[0], false, args[1])});
	}
	setUniformMatrix4fv(name, data){
		this._setUniform(name, data, (args)=>{this.gl.uniformMatrix4fv(args[0], false, args[1])});
	}
	
	setUniformMatrix2iv(name, data){
		this._setUniform(name, data, (args)=>{this.gl.uniformMatrix2iv(args[0], false, args[1])});
	}
	setUniformMatrix3iv(name, data){
		this._setUniform(name, data, (args)=>{this.gl.uniformMatrix3iv(args[0], false, args[1])});
	}
	setUniformMatrix4iv(name, data){
		this._setUniform(name, data, (args)=>{this.gl.uniformMatrix4iv(args[0], false, args[1])});
	}
	
	//---------------
	setUniform1f(name, data){
		this._setUniform(name, data, (args)=>{this.gl.uniform1f(...args)});
	}
	setUniform1fv(name, data){
		this._setUniform(name, data, (args)=>{this.gl.uniform1fv(...args)});
	}
	setUniformVector2fv(name, data){
		this._setUniform(name, data, (args)=>{this.gl.uniform2fv(...args)});
	}
	setUniformVector3fv(name, data){
		this._setUniform(name, data, (args)=>{this.gl.uniform3fv(...args)});
	}
	setUniformVector4fv(name, data){
		this._setUniform(name, data, (args)=>{this.gl.uniform4fv(...args)});
	}
	
	setUniform1i(name, data){
		this._setUniform(name, data, (args)=>{this.gl.uniform1i(...args)});
	}
	setUniform1iv(name, data){
		this._setUniform(name, data, (args)=>{this.gl.uniform1iv(...args)});
	}
	setUniformVector2iv(name, data){
		this._setUniform(name, data, (args)=>{this.gl.uniform2iv(...args)});
	}
	setUniformVector3iv(name, data){
		this._setUniform(name, data, (args)=>{this.gl.uniform3iv(...args)});
	}
	setUniformVector4iv(name, data){
		this._setUniform(name, data, (args)=>{this.gl.uniform4iv(...args)});
	}
	
	//-----------------------------------------------------------------
	
	
	genPerspective(){
		const projectionMatrix = glMatrix.mat4.create();
		console.log('clientWidth: ', this.gl.canvas.clientWidth);
		console.log('clientHeight: ', this.gl.canvas.clientHeight);
		if(this.orthographic){
			const w = this.gl.canvas.clientWidth;
			const h = this.gl.canvas.clientHeight;
			const left = 0;
			const right = w;
			const bottom = 0;
			const top = h;
			const near = 0.1;
			const far = 100.0;
			glMatrix.mat4.ortho(projectionMatrix, 
									  left, right,
									  bottom, top,
									  near, far);
		}else{
			const fieldOfView = 45 * Math.PI / 180;	 // in radians
			const aspect = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight;
			const zNear = 0.1;
			const zFar = 1000.0;
			
		
			// note: glmatrix.js always has the first argument
			// as the destination to receive the result.
			glMatrix.mat4.perspective(projectionMatrix,
											  fieldOfView,
											  aspect,
											  zNear,
											  zFar);
		}
		return projectionMatrix;
	}
	setPerspective(){
		if (!this.uniforms.get('perspective')){
			let perspMatrix = this.genPerspective();
			this.evalUniformLayoutLocation('perspective', perspMatrix);
		}else{
			this.evalUniformLayoutLocation('perspective');
		}
		this.setUniformMatrix4fv('perspective');
	}
	
	//-----------------------------------------------------------------
	
	genModelView(cameraPos){
		const modelViewMatrix = glMatrix.mat4.create();
	
		// Now move the drawing position a bit to where we want to
		// start drawing the square.
	
		glMatrix.mat4.translate(modelViewMatrix,		 // destination matrix
									   modelViewMatrix,		 // matrix to translate
									   cameraPos);	 // amount to translat
	
		return modelViewMatrix;
	}
	setModelView(cameraPos){
		if (!this.uniforms.get('modelView')){
			let modelViewMatrix = this.genModelView(cameraPos);
			this.evalUniformLayoutLocation('modelView', modelViewMatrix);
		}else{
			this.evalUniformLayoutLocation('modelView');
		}
		this.setUniformMatrix4fv('modelView');
	}
	
	//-----------------------------------------------------------------
	
	createVBO(data){
		let vbo = this.gl.createBuffer();
	   this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo);
	   this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(data), this.gl.STATIC_DRAW);
	   return vbo;
	}
	
	genAndBindVectorVBO(data, size, vboName, stride=0, offset=0){	
		let shaderProgram = this.shaderMeta.curShaderProgram.program;
		
		let vbo = this.createVBO(data);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo); // wird bereits in createVBO beim erzeugen gebunden
		
		let layoutLoc = this.layoutLocations.get(vboName);
		if(layoutLoc < 0){
			console.log(`\nlayoutLoc < 0!!! -> layoutLoc: ${layoutLoc}!!! - getAttribLocation did not find vboName: ${vboName}`);
		}

		this.gl.vertexAttribPointer(layoutLoc, size, this.gl.FLOAT, false, stride, offset) ;
		this.gl.enableVertexAttribArray(layoutLoc);
		
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
		
		let shaderData = {
	   	vbo: vbo,
		   data: data,
		   vboName: vboName,
		   stride: stride,
		   offset: offset
		};
		this.vboMeta.set(vboName, shaderData);
		return shaderData;
	}
	genAndBindMatrixVBO(data, size, vboName){
		let shaderProgram = this.shaderMeta.curShaderProgram.program;
		
		let vbo = this.createVBO(data);
		
		let dataSizes;
		if(size === 16){
			dataSizes = [4,4,4,4];
		}else if(size === 9){
			dataSizes = [3,3,3];
		}else if(size === 4){
			dataSizes = [2,2];
		}else{
			throw "genAndBindMatrixVBO:  size -> {0} -> must be 16, 9 or 4!!!".format(size);
			return;
		}
		
		let stride = dataSizes.reduce((total, val)=>total+val);
		
		let offset = 0;
		
		let layoutLoc = this.layoutLocations.get(vboName);
		if(layoutLoc < 0){
			console.log(`\nlayoutLoc < 0!!! -> layoutLoc: ${layoutLoc}!!! - getAttribLocation did not find vboName: ${vboName}`);
		}
		
		for (let i=0; i < dataSizes.length; ++i){			
			this.gl.vertexAttribPointer(layoutLoc + i, dataSizes[i], this.gl.FLOAT, false, stride * 4, offset * 4);
			this.gl.enableVertexAttribArray(layoutLoc + i);
			
			offset += dataSizes[i];
		}
		
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
		
		let shaderData = {
	   	vbo: vbo,
		   data: data,
		   vboName: vboName,
		   dataSizes: dataSizes,
		   stride: stride
		};
		this.vboMeta.set(vboName, shaderData);
		return shaderData;
	}
	
	evalLayoutLocations(vboNames){
		let shaderProgram = this.shaderMeta.curShaderProgram.program;
		
		for(let vboName of vboNames){
			this.layoutLocations.set(vboName, this.gl.getAttribLocation(shaderProgram, vboName));
		}
	}
	
	loadTextureImage(name, imgFilePath, glslName = undefined, textureID = 0, onImageLoaded){
		let shaderProgram = this.shaderMeta.curShaderProgram.program;
		
		var texture = this.gl.createTexture();
		this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
		 
		// fake-texture-image: just lime-pixels that will be rendered until the image is loaded)
		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE,
		              new Uint8Array([0, 0, 0, 255]));
		
		// following code necessary for multiple textures:
		if(!glslName){
			glslName = 'u_texture';
		}
		let textLoc = this.gl.getUniformLocation(shaderProgram, glslName);
		this.gl.uniform1i(textLoc, textureID);
		
		this.textures.set(name, {
			texture,
			imgFilePath,
			textLoc
		});
		 
		// Asynchronously load an image
		var image = new Image();
		image.src = imgFilePath;
		image.addEventListener('load', function(evnt) {
		  	// Now that the image has loaded make copy it to the texture.
		  	this.gl.activeTexture(this.gl.TEXTURE0 + textureID);
		  	this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
		  	
		  	// Set the parameters so we can render any size image.
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
		   
		  	this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA,this.gl.UNSIGNED_BYTE, image);
			this.gl.generateMipmap(this.gl.TEXTURE_2D);
			
			if(!!onImageLoaded){
				onImageLoaded();
			}
		}.bind(this));
	}
	
	setTextureImage(name, img, glslName = undefined, textureID = 0){
		let shaderProgram = this.shaderMeta.curShaderProgram.program;
		
		// following code necessary for multiple textures:
		if(!glslName){
			glslName = 'u_texture';
		}
		
		let textLoc = this.gl.getUniformLocation(shaderProgram, glslName);
		this.gl.uniform1i(textLoc, textureID);
		 
	  	// Now that the image has loaded make copy it to the texture.
	  	this.gl.activeTexture(this.gl.TEXTURE0 + textureID);
	  	var texture = this.gl.createTexture();
	  	this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
	  	
	  	this.textures.set(name, {
			texture,
			textLoc
		});
	  	
	  	// Set the parameters so we can render any size image.
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
	   
	  	this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA,this.gl.UNSIGNED_BYTE, img);
		this.gl.generateMipmap(this.gl.TEXTURE_2D);
	}
	
	createEmptyTexture(targetTextureWidth, targetTextureHeight){
		const gl = this.gl;
		const targetTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, targetTexture);
		
		const level = 0;
		const internalFormat = gl.RGBA;
		const border = 0;
		const format = gl.RGBA;
		const type = gl.UNSIGNED_BYTE;
		const data = null;
		gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
							targetTextureWidth, targetTextureHeight, border,
							format, type, data);
	 	
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		
		return targetTexture;
	}
	bindTexture(texture, textureID=0){
		this.gl.activeTexture(this.gl.TEXTURE0 + textureID);
		this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
	}
	createFrameBuffer(targetTexture){
		const gl = this.gl;
		
		const fb = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
		
		const attachmentPoint = gl.COLOR_ATTACHMENT0;
		const level = 0;
		gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, level);
		return fb;
	}
	
	createVAO(name){
		let vao = this.gl.createVertexArray();
		this.gl.bindVertexArray(vao);
		this.VAOs.set('name', vao);
	}
	bindVAO(name){
		let vao = this.VAOs.get('name');
		if(!vao){
			console.log(`VAO ${name} does not exist - creating it!`);
			this.createVAO(name); // at creation, it will also bind the VAO
			return;
		}
		this.gl.bindVertexArray(vao);
	}
	unbindVAO(){
		this.gl.bindVertexArray(null);
	}
}

module.exports = GlFunctionsInstantiator;

