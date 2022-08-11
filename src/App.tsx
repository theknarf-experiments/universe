import React, { useEffect, useState, useRef, useCallback } from 'react';
import { solarsystem, calculateInitialPlanetData } from './initialData';

const animationSpeed = 1;

const useInitSolarsystemRef = (solarsystemRef : any) => {
	const myCanvas = useRef(null);

	const setRef = useCallback(node => {
		myCanvas.current = node as any;
		var cxt=(myCanvas.current as any).getContext("2d");

		cxt.canvas.width  = window.innerWidth;
		cxt.canvas.height = window.innerHeight;

		solarsystemRef.current = new solarsystem(
			cxt,
			calculateInitialPlanetData()
		);
		solarsystemRef.current.startAnimation(animationSpeed);
	}, []);

	return [setRef, solarsystemRef];
}

const App : React.FC = () => {
	const solarsystemRef = useRef(null);
	const [ myCanvas ] = useInitSolarsystemRef(solarsystemRef);
	const [ planetinfo, setPlanetInfo ] = useState([]);
	const [ tick, setTick ] = useState(0);

	const frame = useRef(null);

	const animate = () => {
		setTick(tick => tick + 1);
		solarsystemRef.current.clear();
		solarsystemRef.current.drawPlanets(
			solarsystemRef.current.planets,
			solarsystemRef.current.x,
			solarsystemRef.current.y
		);
		frame.current = requestAnimationFrame(animate);
	};

	useEffect(() => {
		frame.current = requestAnimationFrame(animate);
		return () => cancelAnimationFrame(frame.current);
	}, []);


	const drag = useRef({ initialX: 0, initialY: 0, down: false });

	const startStop = () => {
		solarsystemRef.current?.toggleAnimation(animationSpeed);
	}

	const planetnameOnChange = (event) => {
		solarsystemRef.current.focusOnPlanet(event.target.value);

		solarsystemRef.current.hooks['planetinfo'] = {
			'run': function(that) {
				setPlanetInfo([
					'VeloX: ' + Math.floor(that.veloX),
					'VeloY: ' + Math.floor(that.veloY),
					'X: ' + Math.floor(that.x),
					'Y: ' + Math.floor(that.y),
				]);

			},

			'clean': function() {
				setPlanetInfo([]);
			}
		};	
	}

	const zoomOnChange = (event) => {
		const zoomK = 100 / solarsystemRef.current.initialZoom;

		if(event.target.value !== '') {
			solarsystemRef.current.zoom = event.target.value / zoomK
		}
	}

	const onmousedown = (e) => {
		drag.current = {
			initialX: e.clientX,
			initialY: e.clientY,
			down: true,
		};
	};

	const onmouseup = (e) => {
		drag.current = {
			...drag.current,
			down: false
		};
	};

	const onmousemove = (e) => {
		if(drag.current.down)
		{
			solarsystemRef.current.x = solarsystemRef.current.x + (e.clientX-drag.current.initialX) / solarsystemRef.current.zoom;
			solarsystemRef.current.y = solarsystemRef.current.y + (e.clientY-drag.current.initialY) / solarsystemRef.current.zoom;

			drag.current = {
				...drag.current,
				initialX: e.clientX,
				initialY: e.clientY,
			};
		}
	};

	return (
		<>
			<style>
			{`
				html, body {
					margin: 0;
					padding: 0;
					width: 100%;
					height: 100%;
					color: white;
				}

				canvas {
					background-color: black;
					position: fixed;
				}
			`}
			</style>
			<canvas ref={myCanvas} id="myCanvas" onMouseUp={onmouseup} onMouseMove={onmousemove} onMouseDown={onmousedown} />

			<div style={{ right: '0', position: 'fixed', margin: '50px' }} className="panel">
				<input placeholder="Planet name OR sun" onChange={planetnameOnChange} />
				<div>{(planetinfo||[]).map((info,i) => (
					<div key={i}>{info}</div>
				))}</div>
			</div>

			<div style={{ bottom: '0', right: '0', position: 'fixed', margin: '50px' }}>
				<div>
					<input placeholder="zoom" defaultValue={100} onChange={zoomOnChange} />
				</div>
				<div>
					<input type="button" value="Start/Stop" onClick={startStop} />
				</div>
				<div>
					<div>X: {-Math.floor(solarsystemRef.current?.x)}</div>
					<div>Y: { Math.floor(solarsystemRef.current?.y)}</div>
				</div>
				<div>
					Frame: {solarsystemRef.current?.frames}
				</div>
			</div>
		</>
	);
}

export default App;
