/*
 * graphics.js
 * 
 * Library of canvas drawing functions
 */

var Graphics = (function() {
    var Graphics = function(context) {
        this.context = context;
        this.defaults = {
            strokeStyle: '#000000',
            fillStyle: '#000000',
            lineWidth: 1
        };
    };
    
    Graphics.prototype = {
        clear: function() {
            this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
        }

        , drawCircle: function(x, y, radius, options) {
            this._applyOptions(options);
            this.context.beginPath();
            this.context.arc(x, y, radius, 0, 2 * Math.PI, false);
            this.context.fill();
            this.context.closePath();
        }

        , drawLine: function(x0, y0, x1, y1, options) {
            this._applyOptions(options);
            this.context.beginPath();
            this.context.moveTo(x0, y0);
            this.context.lineTo(x1, y1);
            this.context.stroke();
            this.context.closePath();
        }

        , setContext: function(context) {
            this.context = context;
        }

        , _applyOptions: function(options) {
            for (var key in this.defaults) {
                this.context[key] = this.defaults[key];
            }
            for (var key in options) {
                if (options.hasOwnProperty(key) && this.context.hasOwnProperty(key)) {
                    this.context[key] = options[key];
                }
            }
        }
    };

    function _restoreContext(gfx) {
        if (!gfx._contextBackup) return;

        for (var key in gfx._contextBackup) {
            if (gfx._contextBackup.hasOwnProperty(key)) {
                gfx.context[key] = gfx._contextBackup[key];
            }
        }
    }

    function _saveContext(gfx) {
        gfx._contextBackup = {};

        for (var key in gfx.context) {
            if (gfx.context.hasOwnProperty(key)) {
                gfx._contextBackup[key] = gfx.context[key];
            }
        }
    }

    // Decorate all graphics functions so they don't persistently
    // alter the context's drawing options.
    for (var key in Graphics.prototype) {
        // ignore private functions (functions prefixed with underscore)
        if (key[0] != '_') {
            (function() {
                var func = Graphics.prototype[key];
                Graphics.prototype[key] = function() {
                    _saveContext(this);
                    func.apply(this, arguments);
                    _restoreContext(this);
                };
            })();
        }
    }

    return Graphics;
})();