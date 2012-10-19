(function(worldMap, Graphics, util) {

    // global keyboard manager
    var keysPressed = {};

    /**
     * Mcl
     * 
     * Monte Carlo localizer
     */
    var Mcl = function(agent) {
        this.agent = agent;
        this.belief = [];
        this.numberOfSamples = 100;

        this.initialize();
    };

    Mcl.prototype = {
        initialize: function() {
            var n, x, y, angle;
            for (n = 0; n < this.numberOfSamples; n++) {
                x = Math.random() * this.agent.world.width;
                y = Math.random() * this.agent.world.height;
                angle = Math.random() * 2 * Math.PI;
                this.belief.push(new State(x, y, angle));
            }
        }

        , tick: function() {
            var n
            ,   totalWeight
            ,   weights = new Array(this.belief.length)
            ,   newBelief = new Array(this.belief.length);

            for (n = 0; n < this.belief.length; n++) {
                this.belief[n] = this.agent.predict(this.belief[n]);
                weights[n] = this.agent.updateBelief(this.belief[n]);
            }

            // resample
            for (n = 0; n < this.belief.length; n++) {
                newBelief[n] = util.sample(this.belief, weights);
            }

            this.belief = newBelief;
        }

        , draw: function(gfx) {
            var n, state;
            for (n = 0; n < this.belief.length; n++) {
                state = this.belief[n];
                state.dotRadius = 1;
                state.rayLength = 0;
                state.draw(gfx);
            }
        }
    };

    var Rangefinder = function() {
        this.maxDistance = 1000;
        this.resolution = 20;
        this.noise = 5;
    };
    
    Rangefinder.prototype = {

        /*
         * Returns the euclidean distance to the nearest obstacle in the
         * given direction from the robot, up to maxDistance.  A return value
         * of maxDistance implies that no obstacle was encountered.
         */
        castRay: function(map, state, angle) {
            var x0 = state.x
            ,   y0 = state.y
            ,   x1 = state.x + Math.cos(angle) * this.maxDistance
            ,   y1 = state.y + Math.sin(angle) * this.maxDistance
            ,   distance = this.maxDistance;
            util.traceLine(x0, y0, x1, y1, function(x, y) {
                var pixelOffset = (x + y * map.width) * 4
                ,   red = map.data[pixelOffset]
                ,   green = map.data[pixelOffset + 1]
                ,   blue = map.data[pixelOffset + 2];

                // wall pixel?
                if (red > 240 && green < 5 && blue < 5) {
                    // 'distance' refers to the outer scope
                    distance = Math.sqrt(Math.pow(x - x0, 2) + Math.pow(y - y0, 2));
                    return true;
                };
                return false;
            });

            return distance;
        }

        /*
         * Casts _resolution_ rays, radially equidistant, from the given state.
         * Returns an array containing the distances reported by each of the rays
         * to the nearest obstacle in that direction, starting from the ray cast forward,
         * relative to the state's heading, and moving clockwise.
         */
        , scan: function(map, state, noise) {
            var increment = (2 * Math.PI) / this.resolution
            ,   noise = noise || this.noise
            ,   angle = state.angle
            ,   distances = []
            ,   dist;

            for (var n = 0; n < this.resolution; n++) {
                dist = this.castRay(map, state, angle);
                dist *= Math.random() * noise + (1 - noise / 2);
                distances.push(dist);
                angle += increment;
            }

            return distances;
        }
    };

    /**
     * Robot
     */
    var Robot = function(world) {
        this.world = world;
        this.map = this.world.context.getImageData(0, 0, this.world.context.canvas.width, this.world.context.canvas.height);
        this.sensor = new Rangefinder();
        this.state = State.generate(world);
        this.odometer = { dx: 0, dy: 0, dangle: 0 };
        this.radius = 25;
        this.driveSpeed = 2;
        this.rotateSpeed = 0.1;
        this.odometerNoise = 5;
    };

    Robot.prototype = {
        draw: function(gfx) {
            gfx.drawCircle(this.state.x, this.state.y, this.radius, { fillStyle: '#8ED6FF' });
            this.state.draw(gfx);
        }

        /*
         * Given a previous state, predicts & returns a new state based on odometry since the
         * last tick.
         */
        , predict: function(state) {
            var newState = new State(
                state.x + this.odometer.dx,
                state.y + this.odometer.dy,
                state.angle + this.odometer.dangle
            );
            return newState;
        }

        , resetOdometer: function() {
            this.odometer.dx = 0;
            this.odometer.dy = 0;
            this.odometer.dangle = 0;
        }

        /*
         * Record odometry data, introducing optional noise.
         */
        , recordOdometry: function(dx, dy, dangle) {
            // apply noise
            dx = dx * (Math.random() * this.odometerNoise + (1 - this.odometerNoise / 2));
            dy = dy * (Math.random() * this.odometerNoise + (1 - this.odometerNoise / 2));
            dangle = dangle * (Math.random() * this.odometerNoise + (1 - this.odometerNoise / 2));

            //record readings
            this.odometer.dx += dx;
            this.odometer.dy += dy;
            this.odometer.dangle += dangle;
        }

        , scan: function() {
            this.sensor.scan(this.map, this.state);
        }

        /*
         * Simulate one physics timestep
         */
        , simulate: function() {
            var newX, newY, newAngle;

            this.ddrive = 0;
            this.drotate = 0;

            // w
            if (keysPressed['87']) {
                this.ddrive = this.driveSpeed;
            }
            // s
            if (keysPressed['83']) {
                this.ddrive = -this.driveSpeed;
            }
            // a
            if (keysPressed['65']) {
                this.drotate = -this.rotateSpeed;
            }
            // d
            if (keysPressed['68']) {
                this.drotate = this.rotateSpeed;
            }

            // calculate new position
            newX = this.state.x + Math.cos(this.state.angle) * this.ddrive;
            newY = this.state.y + Math.sin(this.state.angle) * this.ddrive;
            newAngle = this.state.angle + this.drotate;

            this.recordOdometry(
                newX - this.state.x,
                newY - this.state.y,
                newAngle - this.state.angle
            );

            // update position
            this.state.x = newX;
            this.state.y = newY;
            this.state.angle = newAngle;
        }

        /*
         * Given a predicted state, returns a weighting coefficient
         * that expresses the likelihood of the state given current sensory information.
         */
        , weightBelief: function(state) {
            // 'true' scan, done by ray tracing on a known map
            var mapScan = this.sensor.scan(this.map, state, 0);
        }
    };

    /**
     * State
     * 
     * Represents a robot pose consisting of coordinates and heading.
     */
    var State = function(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        
        // Drawing options
        this.dotRadius = 2;
        this.rayLength = 10;
    };

    /*
     * Generates a random state within the given World.
     */
    State.generate = function(world) {
        var x = Math.floor(Math.random() * world.width)
        ,   y = Math.floor(Math.random() * world.height)
        ,   angle = Math.random() * 2 * Math.PI;

        return new State(x, y, angle);
    };

    State.prototype = {
        draw: function(gfx, options) {
            var options = options || {};
            // draw the dot
            gfx.drawCircle(this.x, this.y, this.dotRadius, options);
            // draw the ray
            gfx.drawLine(
                this.x,
                this.y,
                this.x + Math.cos(this.angle) * this.rayLength,
                this.y + Math.sin(this.angle) * this.rayLength,
                options
            );
        }
    };

    /**
     * World
     * 
     * Describes the static world.
     */
    var World = function(width, height, worldMap, context) {
        this.context = context;
        this.width = width;
        this.height = height;
        this.map = worldMap;
    };
    World.prototype = {
        draw: function(gfx) {
            for (var n = 0; n < this.map.length; n++) {
                var line = this.map[n];
                gfx.drawLine(line[0][0], line[0][1], line[1][0], line[1][1], { strokeStyle: '#FF0000', lineWidth: 2 });
            }
        }
    };

    /**
     * Entry point
     */
    window.onload = function() {
        var canvas = document.getElementById('canvas')
        ,   context = canvas.getContext('2d')
        ,   gfx = new Graphics(context)
        ,   world = new World(canvas.width, canvas.height, worldMap, context)
        ,   robot = new Robot(world)
        ,   localizer = new Mcl(robot);

        // keyboard listeners
        document.onkeydown = function(e) {
            keysPressed[e.keyCode.toString()] = true;
        };

        document.onkeyup = function(e) {
            keysPressed[e.keyCode.toString()] = false;
        };

        document.onkeypress = function(e) {
            // space bar
            if (e.keyCode === 32) {
                tick();
            }
        };

        setInterval(function() {
            simulate();
            draw();
        }, 25);

        // simulate one universal timestep
        function simulate() {
            robot.simulate();
        }

        // execute one algorithmic timestep
        function tick() {
            localizer.tick();
            robot.resetOdometer();
        }

        function draw() {
            gfx.clear();
            world.draw(gfx);
            robot.draw(gfx);
            localizer.draw(gfx);
        }
    };
}(worldMap, Graphics, util));