(function() {
    /*
     * Robot class
     */
    var Robot = function(world) {
        this.world = world;
        this.state = State.generate(world);
        this.radius = 25;
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
        console.log(angle);
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
            context.stroke();
            context.closePath();
        }
    };

    /*
     * World class
     * 
     * Describes the static world.
     */
    var World = function(width, height) {
        this.width = width;
        this.height = height;
    };
    World.prototype = {};

    window.onload = function() {
        var canvas = document.getElementById('canvas');
        var context = canvas.getContext('2d');
        
        var world = new World(canvas.width, canvas.height);
        var robot = new Robot(world);
        robot.draw(context);
    };
}());