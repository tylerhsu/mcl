(function(worldMap, Graphics, util) {

    // global keyboard manager
    var keysPressed = {};

    /**
     * Robot
     */
    var Robot = function(world) {
        this.world = world;
        this.state = State.generate(world);
        this.radius = 25;
        this.scanDistance = 1000;
        this.driveSpeed = 2;
        this.rotateSpeed = 0.1;
    };

    Robot.prototype = {
        draw: function(gfx) {
            gfx.drawCircle(this.state.x, this.state.y, this.radius, { fillStyle: '#8ED6FF' });
            this.state.draw(gfx);
        }

        /*
         * Returns the euclidean distance to the nearest obstacle in the
         * given direction from the robot, up to maxDistance.  A return value
         * of maxDistance implies that no obstacle was encountered.
         */
        , castRay: function(imageData, angle, maxDistance) {
            var x0 = this.state.x
            ,   y0 = this.state.y
            ,   x1 = this.state.x + Math.cos(angle) * maxDistance
            ,   y1 = this.state.y + Math.sin(angle) * maxDistance
            ,   distance = maxDistance;
            util.traceLine(x0, y0, x1, y1, function(x, y) {
                var pixelOffset = (x + y * imageData.width) * 4
                ,   red = imageData.data[pixelOffset]
                ,   green = imageData.data[pixelOffset + 1]
                ,   blue = imageData.data[pixelOffset + 2];

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
         * Casts _resolution_ rays, radially equidistant, from the robot's center.
         * Returns an array containing the distances reported by each of the rays
         * to the nearest obstacle in that direction, starting from the ray cast forward,
         * relative to the robot's heading, and moving clockwise.
         */
        , scan: function(resolution) {
            var increment = (2 * Math.PI) / resolution
            ,   angle = this.state.angle
            ,   imageData = this.world.context.getImageData(0, 0, this.world.context.canvas.width, this.world.context.canvas.height)
            ,   distances = [];

            for (var n = 0; n < resolution; n++) {
                distances.push(this.castRay(imageData, angle, this.scanDistance));
                angle += increment;
            }

            return distances;
        }

        /*
         * Simulate one physics timestep
         */
        , simulate: function() {
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

            // update position
            this.state.x = this.state.x + Math.cos(this.state.angle) * this.ddrive;
            this.state.y = this.state.y + Math.sin(this.state.angle) * this.ddrive;
            this.state.angle = this.state.angle + this.drotate;
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
        draw: function(gfx) {
            // draw the dot
            gfx.drawCircle(this.x, this.y, this.dotRadius);
            // draw the ray
            gfx.drawLine(
                this.x,
                this.y,
                this.x + Math.cos(this.angle) * this.rayLength,
                this.y + Math.sin(this.angle) * this.rayLength
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
        ,   robot = new Robot(world);

        // keyboard listeners
        document.onkeydown = function(e) {
            keysPressed[e.keyCode.toString()] = true;
        };

        document.onkeyup = function(e) {
            keysPressed[e.keyCode.toString()] = false;
        };

        setInterval(function() {
            simulate();
            draw();
        }, 25);

        function simulate() {
            robot.simulate();
        }

        function draw() {
            gfx.clear();
            world.draw(gfx);
            robot.draw(gfx);
        }
    };
}(worldMap, Graphics, util));