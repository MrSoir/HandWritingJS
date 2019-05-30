const glMatrix = require('gl-matrix');

//-----------------------------------------------------------------

var vertexShaderSourceBase = `#version 300 es
	precision mediump float;
	
	//-------constants-----------
	
	const float PI  = 3.1415926535897932384626433832795;
	const float TAU = 6.2831853071795864769252867665590;
	
	//-------attributes-----------
	
	layout (location = 0) in vec3 pos;
	layout (location = 1) in vec3 norm; // normal
	
	//-------uniforms-----------
	
	uniform vec3 cameraPos;
	
	uniform mat4 modelView;
	uniform mat4 perspective;
	
	//-------out-variables-------
	
	out vec3 f_pos;
	
	//-------some useful functions-------
	
	// rotateX, rotateY, rotateZ: OpenGL/WebGL uses columns-first vectors
	// -> results in transposed matrices in contrast to the usual row-first notation:
	
	mat4 scaleMat4(vec3 scaleVec){
		mat4 m = mat4(1.0);
		m[0][0] = scaleVec.x;
		m[1][1] = scaleVec.y;
		m[2][2] = scaleVec.z;
		return m;
	}
	mat4 translateMat4(vec3 translVec){
		mat4 m = mat4(1.0);
		m[3][0] = translVec.x;
		m[3][1] = translVec.y;
		m[3][2] = translVec.z;
		return m;
	}
		
	mat4 rotateX(float rad){
		mat4 m = mat4(1.0);
		float c = cos(rad);
		float s = sin(rad);
		m[1][1] =  c;
		m[2][1] = -s;
		m[1][2] =  s;
		m[2][2] =  c;
		return m;
	}
	mat4 rotateY(float rad){
		mat4 m = mat4(1.0);
		float c = cos(rad);
		float s = sin(rad);		
		m[0][0] =  c;
		m[2][0] =  s;
		m[0][2] = -s;
		m[2][2] =  c;
		return m;
	}
	mat4 rotateZ(float rad){
		mat4 m = mat4(1.0);
		float c = cos(rad);
		float s = sin(rad);
		m[0][0] =  c;
		m[1][0] = -s;
		m[0][1] =  s;
		m[1][1] =  c;
		return m;
	}
	
	vec4 getQuaternion(vec3 ax, float rad){
		float radHalf = rad * 0.5;
		float rhs = sin(radHalf);
		float rhc = cos(radHalf);
		vec4 q = vec4(rhc, ax.x * rhs, ax.y * rhs, ax.z * rhs);
		return q;
	}
	mat4 rotationAroundAxis(vec3 ax, float rad){
		// rotationAroundAxis using qaternions: http://www.euclideanspace.com/maths/geometry/rotations/conversions/quaternionToMatrix/index.htm (great website!!!)
		// m[i][j] is already transposed (OpenGL/WebGL: column-first notation!)
		vec4 q = getQuaternion(ax, rad);
		mat4 m = mat4(1.0);
		float qw = q[0];
		float qx = q[1];
		float qy = q[2];
		float qz = q[3];
		float qxx = qx*qx;
		float qyy = qy*qy;
		float qzz = qz*qz;
		m[0][0] = 1.0 - 2.0 * qyy - 2.0 * qzz;
		m[1][0] = 2.0 * qx * qy - 2.0 * qz * qw;
		m[2][0] = 2.0 * qx * qz + 2.0 * qy * qw;
		m[0][1] = 2.0 * qx * qy + 2.0 * qz * qw;
		m[1][1] = 1.0 - 2.0 * qxx - 2.0 * qzz;
		m[2][1] = 2.0 * qy * qz - 2.0 * qx * qw;
		m[0][2] = 2.0 * qx * qz - 2.0 * qy * qw;
		m[1][2] = 2.0 * qy * qz + 2.0 * qx * qw;
		m[2][2] = 1.0 - 2.0 * qxx - 2.0 * qyy;
		return m;
	}
`;

var fragmentShaderSource = `#version 300 es
	precision mediump float;
	
	in vec3 f_pos;
	
	out vec4 outColor;
	
	void main() {
		outColor = vec4(0.0, 1.0, 0.0, 1.0);
	}
`;

var ShaderCode = {
	vertexShaderSourceBase: vertexShaderSourceBase,
	fragmentShaderSource: fragmentShaderSource,
};

module.exports = ShaderCode;

//-----------------------------------------------------------------