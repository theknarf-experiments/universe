type Color = any;

const space = Math.pow(10, 0);

export function solarsystem(cxt : any, planets : any)
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
		
		var keys = [];
		
		for(const p in this.planets)
		{
			keys.push(p);
		}
		
		var applyForce = (keys : any, index : any) => {
			var top = keys[index];

			for(let i = 0; i<keys.length; i++) {
				if(top === 'sun')
				this.planets[keys[i]].accelerate(this.planets[top]);
			}
			
			if(index !== keys.length) applyForce(keys, index+1);
		};
		
		applyForce(keys, 0);
		
		for(const p in this.planets)
		{
			if(p !== 'sun')
				this.planets[p].position(this.planets['sun']);
			
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
	
	this.toggleAnimation = function(speed : number)
	{
		if(this.animation == null)
		{
			this.startAnimation(speed);
		} else {
			this.stopAnimation();
		}
	}
	
	this.drawPlanets = function (ps : any, x : number, y : number) {
		const centerX = this.cxt.canvas.width/2;
		const centerY = this.cxt.canvas.height/2;
	
		if(this.zoom==null)	this.zoom=1;
		for(const p in ps)
		{
			const color	= ps[p].color;
			const xpos	= centerX + (x+ps[p].x)*this.zoom;
			const ypos	= centerY + (y+ps[p].y)*this.zoom;
			const radius	= ps[p].r*this.zoom;
			const name	= p;

			this.circle(
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
	
	this.circle = function (color : Color, x: number, y: number, r: number, name: string) {
		this.cxt.fillStyle=color;
		this.cxt.beginPath();
		this.cxt.arc(x,y,r,0,Math.PI*2,true);
		this.cxt.closePath();
		this.cxt.fill();
		
		if(name!=null)
			this.cxt.fillText(name, x,y+r+12);
	}
	
	this.clear = function() {
		this.cxt.clearRect(0, 0, this.cxt.canvas.width, this.cxt.canvas.height);
	}
}

export function planet(radius : number, ms : number, color : Color, mass : number)
{
	this.r = radius;
	this.x = ms * space * Math.pow(10, 9);
	this.y = 0;
	this.color = color;
	this.mass = mass;
	
	this.veloX = 0;
	this.veloY = 0;
	
	this.accelerate = function(o : any, time : number)
	{
		const spacekonst = 1 / space;
		time = 100000; // 1000000 is to much
		
		const masskonst = Math.pow(10, 24);
	
		// (Sun position -current position) * spacekonst
		const deltaX = (o.x-this.x) * spacekonst;
		const deltaY = (o.y-this.y) * spacekonst;
	
		const l = Math.sqrt(deltaX*deltaX+deltaY*deltaY);
		
		const gkonst = 6.67 * Math.pow(10, -11);
		
		const acc = gkonst * o.mass * masskonst / (l*l) * time;
		
		this.veloX += deltaX/l * acc;
		this.veloY += deltaY/l * acc;
	}
	
	this.position = function(time : number)
	{
		const spacekonst = 1 / space;
		time = 100000; // 1000000 is to much
		
		this.x += this.veloX *time/ spacekonst;
		this.y += this.veloY *time/ spacekonst;
	}
}



// Radius, MiddlereSolavstand, COLOR, MASS, OmdreidningsTid i år, Orbital Semimajor axis in au, orbital Eccentricity
const planets = {	
	'sun': 		{'r':695, 'ms': 0    ,'color':'white' ,'mass':1990000,'omt':0 , 'os': 0, 'e': 0},
	'merkur':	{'r':2.44,'ms': 58.6 ,'color':'grey'  ,'mass':0.33 ,'omt':0.24, 'os': 0.387, 'e': 0.206},
	'venus':	{'r':6.05,'ms': 108  ,'color':'yellow','mass':4.9  ,'omt':-0.62, 'os': 0.723, 'e': 0.007},
	'tellus':	{'r':6.38,'ms': 149.6,'color':'blue'  ,'mass':6    ,'omt':1   , 'os': 1    , 'e': 0.017},
	'mars': 	{'r':3.4 ,'ms': 228  ,'color':'red'   ,'mass':0.64 ,'omt':1.88, 'os': 1.524, 'e': 0.093},
	'jupiter':	{'r':71.5,'ms': 778  ,'color':'orange','mass':1900 ,'omt':11.9, 'os': 5.203, 'e': 0.048},
	'saturn':	{'r':60.3,'ms': 1429 ,'color':'orange','mass':568  ,'omt':29.5, 'os': 9.537, 'e': 0.054},
	'uranus':	{'r':25.6,'ms': 2871 ,'color':'yellow','mass':87   ,'omt':-84  , 'os': 19.19, 'e': 0.047},
	'neptun':	{'r':24.8,'ms': 4504 ,'color':'blue'  ,'mass':103  ,'omt':165 , 'os': 30.07, 'e': 0.009}
};

// Orbital Semimajor axis in KM, orbital Eccentricity, Speed in m/s, MASS, Radius
const moons = {
	'tellus':	{
		'the moon':	{'oskm': 384000, 'e': 0.055, 's': 1020, 'mass': 0.0735, 'r': 1.738}
	}
};

export const calculateInitialPlanetData = () => {
	var planetsObj = {};

	Object.keys(planets).forEach((p) => {
		const newPlanet =  new planet(
			planets[p]['r'],
			planets['tellus']['ms']*planets[p]['os']*(1+planets[p]['e']),
			planets[p]['color'],
			planets[p]['mass']
		);

		if(planets[p]['omt'] !== 0)
			newPlanet.veloY = - planets[p]['ms']*Math.pow(10,9)*2*Math.PI / (planets[p]['omt'] * 365 * 24 * 60 * 60);

		planetsObj[p] = newPlanet;
	});

	Object.keys(moons).forEach((p) => {
		Object.keys(moons[p]).forEach(m => {
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
		});
	});

	return planetsObj;
}
