(function(worldMap) {

    /*
     * Robot class
     */
    var Robot = function(world) {
        this.world = world;
        this.state = State.generate(world);
        this.radius = 25;
        this.scanDistance = 1000;
    };

    Robot.prototype = {
        draw: function(context) {
            context.beginPath();
            context.arc(this.state.x, this.state.y, this.radius, 2 * Math.PI, false);
            context.fillStyle = '#8ED6FF';
            context.fill();
            context.closePath();
            this.state.draw(context);
        }

        /*
         * Returns the euclidean distance to the nearest obstacle in the
         * given direction from the robot, or undefined if no obstacle is found.
         */
        , castRay: function(imageData, angle, maxDistance) {
            var x0 = this.state.x
            ,   y0 = this.state.y
            ,   x1 = this.state.x + Math.cos(angle) * maxDistance
            ,   y1 = this.state.y + Math.sin(angle) * maxDistance
            ,   distance;
            this._traceLine(x0, y0, x1, y1, function(x, y) {
                var pixelOffset = (x + y * imageData.width) * 4
                ,   red = imageData.data[pixelOffset]
                ,   green = imageData.data[pixelOffset + 1]
                ,   blue = imageData.data[pixelOffset + 2];

                // wall pixel?
                if (red > 240 && green < 5 && blue < 5) {
                    // 'distance' refers to the outer scope
                    // distance = Math.sqrt(Math.pow(x - x0, 2) + Math.pow(y - y0, 2));
                    distance = [x, y];
                    return true;
                };
                return false;
            });

            return distance;
        }

        /*
         * Casts _resolution_ rays, radially equidistant, from the robot's center.
         * Returns an array containing the distances reported by each of the rays
         * to the nearest obstacle in that direction, starting from the ray cast at
         * 0 radians (directly to the right/east) and moving clockwise.
         */
        , scan: function(context, resolution) {
            var increment = (2 * Math.PI) / resolution
            ,   angle = 0
            ,   imageData = context.getImageData(0, 0, context.canvas.width, context.canvas.height)
            ,   distances = [];

            for (var n = 0; n < resolution; n++) {
                // distances.push(this.castRay(imageData, angle, this.scanDistance));
                var point = this.castRay(imageData, angle, this.scanDistance);
                if (point) {
                    context.beginPath();
                    context.moveTo(this.state.x, this.state.y);
                    context.lineTo(point[0], point[1]);
                    context.strokeStyle = '#0000FF';
                    context.stroke();
                    context.closePath();
                }
                angle += increment;
            }

            return distances;
        }

        /*
         * Iterates over the pixel coordinates between [x0, y0] and [x1, y1]
         * using Bresenham's algorithm.
         * 
         * Passes each coordinate to the process() callback,
         * stopping when process() returns truthily or when the line's endpoint
         * is reached.
         */
        , _traceLine: function(x0, y0, x1, y1, process) {
            var temp
            ,   steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);

            if (steep) {
                temp = x0;
                x0 = y0;
                y0 = temp;

                temp = x1;
                x1 = y1;
                y1 = temp;
            }
            if (x0 > x1) {
                temp = x0;
                x0 = x1;
                x1 = temp;

                temp = y0;
                y0 = y1;
                y1 = temp;
            }

            var deltax = x1 - x0
            ,   deltay = Math.abs(y1 - y0)
            ,   error = 0
            ,   ystep
            ,   y = y0
            ,   x = x0
            ,   ret;

            if (y0 < y1) {
                ystep = 1;
            } else {
                ystep = -1;
            }

            while (!ret && x <= x1) {
                if (steep) {
                    ret = process(y, x);
                }
                else {
                    ret = process(x, y);
                }
                error += deltay;
                if (2 * error >= deltax) {
                    y += ystep;
                    error -= deltax;
                }
                x++;
            }
        }
    };

    /*
     * State class
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
        draw: function(context) {
            context.beginPath();
            // draw the dot
            context.arc(this.x, this.y, this.dotRadius, 0, 2 * Math.PI, false);
            context.fillStyle = '#000000';
            context.fill();
            // draw the ray
            context.moveTo(this.x, this.y);
            context.lineTo(
                this.x + Math.cos(this.angle) * this.rayLength,
                this.y + Math.sin(this.angle) * this.rayLength
            );
            context.strokeStyle = '#000000';
            context.stroke();
            context.closePath();
        }
    };

    /*
     * World class
     * 
     * Describes the static world.
     */
    var World = function(width, height, worldMap) {
        this.width = width;
        this.height = height;
        this.map = worldMap;
    };
    World.prototype = {
        draw: function(context) {
            context.beginPath();
            for (var n = 0; n < this.map.length; n++) {
                var line = this.map[n];
                context.moveTo(line[0][0], line[0][1]);
                context.lineTo(line[1][0], line[1][1]);
            }
            context.strokeStyle = '#FF0000';
            context.lineWidth = 2;
            context.stroke();
            context.closePath();
        }
    };

    window.onload = function() {
        var canvas = document.getElementById('canvas');
        var context = canvas.getContext('2d');
        
        var world = new World(canvas.width, canvas.height, worldMap);
        world.draw(context);
        var robot = new Robot(world);
        robot.draw(context);
        robot.scan(context, 20);
    };
}(worldMap));