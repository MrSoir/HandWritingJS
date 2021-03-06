import React, { Component } from 'react';
import AntialiasedLines from '../AntialiasedLines/AntialiasedLines';
import './LineDrawer.css';
	
class LineDrawer extends Component{
	constructor(args){
		super(args);
		
		this.initPoints = this.initPoints.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
		this.onTouchMove = this.onTouchMove.bind(this);
		this.finalizePoints = this.finalizePoints.bind(this);
	}
	componentDidMount(){ 
		let genPoint = (i)=>{
			const ystart = 500;
			const xstart = 30;
			const offsx = 50;
			const offsy = 50;
			const maxi = 5;
			const pot = 1.2 ** i;
			if( i >= maxi ){
				return [xstart + offsx * i * pot, ystart + maxi * offsy - offsy * (i - maxi) * pot];
			}else {
				return [xstart + offsx * i * pot, ystart + offsy * i * pot];
			}
		};
		let linePoints = [[0,0]];
		for(let i=0; i < 10; ++i){
			linePoints.push( genPoint(i) );
		}
		
	   this.alines  = new AntialiasedLines('alinesCanvas', linePoints);
	   this.alines.drawLines();
	}
	initPoints(e){
		if(!this.alines){
			return;
		}
		this.alines.initPoints(e.clientX, e.clientY);
	}
	onMouseMove(e){
		if(!this.alines){
			return;
		}
		if(e.buttons === 1){
			this.alines.addPoint(e.clientX, e.clientY);
		}
	}
	onTouchMove(e){
		if(!this.alines){
			return;
		}
		this.alines.addPoint(e.clientX, e.clientY);
	}
	finalizePoints(e){
		if(!this.alines){
			return;
		}
		this.alines.finalizePoints();
	}
	render()
	{
		return (
			<div id="canvasDiv">
				<canvas id="alinesCanvas"
						  width="640"
						  height="480"

							onMouseDown={this.initPoints}
							onTouchDown={this.initPoints}
							
							onMouseMove={this.onMouseMove}
							onTouchMove={this.onTouchMove}
							
							onMouseUp={this.finalizePoints}
							onTouchUp={this.finalizePoints}
				/>
			</div>
		);
	}
}

export default LineDrawer;
