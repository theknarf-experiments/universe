import {
  createWorld,
  addEntity,
  removeEntity,

  Types,

  defineComponent,
  addComponent,
  removeComponent,
  hasComponent,

  defineQuery,
  Changed,
  Not,
  enterQuery,
  exitQuery,

  defineSerializer,
  defineDeserializer,

  pipe,
} from 'bitecs';

const space = Math.pow(10, 0);

/* Type definitions */
enum Color {
	White = 0,
	Grey = 1,
	Yellow = 2,
	Blue = 3,
	Red = 4,
	Orange = 5,
};
const colorToString = (color: Color) => {
	switch(color) {
		case(Color.White):  return 'white';
		case(Color.Grey):   return 'grey';
		case(Color.Yellow): return 'yellow';
		case(Color.Blue):   return 'blue';
		case(Color.Red):    return 'red';
		case(Color.Orange): return 'orange';
	}
}

const Vector2 = { x: Types.f32, y: Types.f32 }
const Circle  = { r: Types.f32, color: Types.i8 };
const Mass1   = { mass: Types.f32 };

/* Component definitions */
const Position = defineComponent(Vector2);
const Velocity = defineComponent(Vector2);
const RenderCircle = defineComponent(Circle);
const Mass = defineComponent(Mass1);

export function solarsystem(cxt : any, planets : any, world : any)
{
	this.x = 0;
	this.y = 0;
	this.initialZoom = Math.pow(10, Math.abs(Math.log(space)/Math.log(10)) - 9);
	this.zoom = this.initialZoom;
	this.cxt = cxt;
	this.planets = planets;
	this.planetToFocusOn = null;
	this.frames = 0;
	this.hooks = {};
	this.animation = null;
	
	this.update = function()
	{
		// calls the claer function on each of the hook
		for(const f in this.hooks) {
			if(typeof this.hooks[f]['clean'] == 'function')
				this.hooks[f]['clean']();
		}

		physics(world, this);
		
		for(const p in this.planets)
		{
			if(p === this.planetToFocusOn && p != null)
			{
				this.x = -this.planets[p].x;
				this.y = -this.planets[p].y;
				
				// Run throu hooks
				for(const f in this.hooks) {
					if(typeof this.hooks[f]['run'] == 'function')
						this.hooks[f]['run'](this.planets[p]);
				}
				
			} else if(this.planetToFocusOn === 'sun') {
				this.x = 0;
				this.y = 0;
				this.planetToFocusOn = '';
			}
		}
		
		this.frames++;
	}
	
	this.focusOnPlanet = function(planetName : string)
	{
		this.planetToFocusOn = planetName;
	}
	
	this.startAnimation = function(animationspeed : number)
	{
		this.animation = setInterval(() => {this.update()}, animationspeed);
		return this.animation;
	}
	
	this.stopAnimation = function()
	{
		clearInterval(this.animation);
		this.animation = null;
	}
	
	this.setAnimation = function(running : boolean, speed : number = 1)
	{
		if(running) {
			// Check that this.animation is null so that we don't start it twice
			if(this.animation === null)
				this.startAnimation(speed);
		} else {
			this.stopAnimation();
		}
	}
	
	this.drawPlanets = function (ps : any, x : number, y : number) {
		const center = {
			x: this.cxt.canvas.width/2,
			y: this.cxt.canvas.height/2,
		}
	
		const zoom = this.zoom ? this.zoom : 1;

		for(const p in ps)
		{
			const color	= ps[p].color;
			const xpos	= center.x + (x+ps[p].x) * zoom;
			const ypos	= center.y + (y+ps[p].y) * zoom;
			const radius	= ps[p].r * zoom;
			const name	= p;

			drawCircle(
				this.cxt,
				color,
				xpos,
				ypos,
				radius,
				name
			);
		}
	}	
	
	this.addPlanet = function(name: string, planet: string)
	{
		this.planets[name] = planet;
	}
	
	
	this.clear = function() {
		this.cxt.clearRect(0, 0, this.cxt.canvas.width, this.cxt.canvas.height);
	}
}

const drawCircle = (context : any, color : string, x: number, y: number, r: number, name: string) => {
	context.fillStyle=color;
	context.beginPath();
	context.arc(x,y,r,0,Math.PI*2,true);
	context.closePath();
	context.fill();
	
	if(name!=null)
		context.fillText(name, x,y+r+12);
}

export function planet(radius : number, ms : number, color : string, mass : number)
{
	this.r = radius;
	this.x = ms * space * Math.pow(10, 9);
	this.y = 0;
	this.color = color;
	this.mass = mass;
	
	this.veloX = 0;
	this.veloY = 0;
	

	this.updateVelocity = function(x: number, y: number) {
		this.veloX = x;
		this.veloY = y;
	}
	
	this.updatePosition = function(x : number, y : number) {
		this.x = x;
		this.y = y;
	}
}

const physics = (world : any, legacy : any) => {
	const spacekonst = 1 / space;
	const time = 100000; // 1000000 is to much

	var keys = Object.keys(legacy.planets);
	keys.forEach(key => {
		for(let i = 0; i<keys.length; i++) {
			if(key === 'sun' && key !== keys[i]) {
				const celestialBody = legacy.planets[keys[i]];
				const o = legacy.planets[key];

				const masskonst = Math.pow(10, 24);

				// (Sun position -current position) * spacekonst
				const deltaX = (o.x-celestialBody.x) * spacekonst;
				const deltaY = (o.y-celestialBody.y) * spacekonst;

				const l = Math.sqrt(deltaX*deltaX+deltaY*deltaY);
				
				const gkonst = 6.67 * Math.pow(10, -11);
				
				const acc = gkonst * o.mass * masskonst / (l*l) * time;
				
				celestialBody.updateVelocity(
					celestialBody.veloX + deltaX / l * acc,
					celestialBody.veloY + deltaY / l * acc,
				);
			}
		}
	});

	Object.keys(legacy.planets).forEach(key => {
		const celestialBody = legacy.planets[key];
		if(key !== 'sun') {
			celestialBody.updatePosition(
				celestialBody.x + celestialBody.veloX * time / spacekonst,
				celestialBody.y + celestialBody.veloY * time / spacekonst,
			);
		}
	});
}


// Radius, MiddlereSolavstand, COLOR, MASS, OmdreidningsTid i år, Orbital Semimajor axis in au, orbital Eccentricity
const planets = {	
	sun: 		{ r:695,  ms: 0,     color: Color.White,  mass:1990000, omt:0,     os: 0,     e: 0},
	merkur:	{ r:2.44, ms: 58.6,  color: Color.Grey,   mass:0.33,    omt:0.24,  os: 0.387, e: 0.206},
	venus:	{ r:6.05, ms: 108,   color: Color.Yellow, mass:4.9,     omt:-0.62, os: 0.723, e: 0.007},
	tellus:	{ r:6.38, ms: 149.6, color: Color.Blue,   mass:6,       omt:1,     os: 1,     e: 0.017},
	mars: 	{ r:3.4 , ms: 228,   color: Color.Red,    mass:0.64,    omt:1.88,  os: 1.524, e: 0.093},
	jupiter:{ r:71.5, ms: 778,   color: Color.Orange, mass:1900,    omt:11.9,  os: 5.203, e: 0.048},
	saturn:	{ r:60.3, ms: 1429,  color: Color.Orange, mass:568,     omt:29.5,  os: 9.537, e: 0.054},
	uranus:	{ r:25.6, ms: 2871,  color: Color.Yellow, mass:87,      omt:-84,   os: 19.19, e: 0.047},
	neptun:	{ r:24.8, ms: 4504,  color: Color.Blue,   mass:103,     omt:165,   os: 30.07, e: 0.009},
};

const moons = {
	tellus:	{
		'the moon':	{
			oskm: 384000, // Orbital semimajor axis in KM
			e: 0.055,     // Orbital eccentricity
			s: 1020,      // Speed in m/s
			mass: 0.0735, // MASS
			r: 1.738,     // Redius
		},
	},
};

export const calculateInitialPlanetData = () => {
	var planetsObj = {};
	const world = createWorld();

	const addCelestialBody = (
		radius : number,
		ms : number,
		color : Color,
		mass : number,
		velocityX : number,
		velocityY : number
	) => {
		const eid = addEntity(world);
		addComponent(world, Position, eid);
		addComponent(world, Velocity, eid);
		addComponent(world, RenderCircle, eid);
		addComponent(world, Mass, eid);

		Position.x[eid] = ms * space * Math.pow(10, 9);
		Position.y[eid] = 0;

		Velocity.x[eid] = velocityX;
		Velocity.y[eid] = velocityY;

		RenderCircle.r[eid] = radius;
		RenderCircle.color[eid] = color;

		Mass.mass[eid] = mass;
		return eid;
	}

	Object.keys(planets).forEach((p) => {
		/* old pre-ecs setup*/
		const newPlanet =  new planet(
			planets[p]['r'],
			planets['tellus']['ms']*planets[p]['os']*(1+planets[p]['e']),
			colorToString(planets[p]['color']),
			planets[p]['mass']
		);

		if(planets[p]['omt'] !== 0)
			newPlanet.veloY = - planets[p]['ms']*Math.pow(10,9)*2*Math.PI / (planets[p]['omt'] * 365 * 24 * 60 * 60);

		planetsObj[p] = newPlanet;

		/* ecs setup */
		const velocityY = (planets[p]['omt'] !== 0) ?
			- planets[p]['ms']*Math.pow(10,9)*2*Math.PI / (planets[p]['omt'] * 365 * 24 * 60 * 60) :
			0;

		addCelestialBody(
			planets[p]['r'],
			planets['tellus']['ms']*planets[p]['os']*(1+planets[p]['e']),
			planets[p]['color'],
			planets[p]['mass'],
			0,
			velocityY,
		);
	});

	Object.keys(moons).forEach((p) => {
		Object.keys(moons[p]).forEach(m => {
			/* old pre-ecs setup */
			const getPos = function(p) {
				return planets['tellus']['ms']*planets[p]['os']*(1+planets[p]['e']);
			};

			const newPlanet = new planet(
				moons[p][m]['r'],
				getPos(p) + moons[p][m]['oskm'] / Math.pow(10, 9) * (1+moons[p][m]['e']),
				'grey',
				moons[p][m]['mass']
			);

			newPlanet.veloY = - planets[p]['ms']*Math.pow(10,9)*2*Math.PI / (planets[p]['omt'] * 365 * 24 * 60 * 60);
			planetsObj[m] = newPlanet;

			/* ecs setup */
			//addCelestialBody();
		});
	});

	return {
		initData: planetsObj,
		world,
	};
}
