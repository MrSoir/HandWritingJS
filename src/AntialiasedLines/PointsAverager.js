const StaticFunctions = require('./StaticFunctions');

class PointsAverager{
	constructor(points=[]){
		this.points = points;
		this.avrgdPnts = [];
	}
	addPoints(points){
		this.points.push(points);
	}
	addPoint( pnt ){
		this.points.push( pnt );
	}
	avrgPnts(pnts){
		let pnt = [0,0];
		pnts.forEach(p=>{
			pnt[0] += p[0];
			pnt[1] += p[1];
		});
		pnt[0] /= pnts.length;
		pnt[1] /= pnts.length;
		return pnt;
	}
	reset(){
		this.points = [];
		this.avrgdPnts = [];
	}
	finalize(){
		this.avrgdPnts = [];
		const avrgRng = 5;
		for(let i=avrgRng; i <= this.points.length; ++i){
			const curPnts = this.points.slice(i-avrgRng, i);
			this.avrgdPnts.push( this.avrgPnts(curPnts) );
		}
		return this.avrgdPnts;
	}
	getPoints(){
		return this.avrgdPnts;
	}
}

module.exports = PointsAverager;