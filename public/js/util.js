var util = (function() {
    var util = {
        /*
         * Iterates over the line of pixel coordinates between [x0, y0] and [x1, y1]
         * using Bresenham's algorithm.
         * 
         * Passes each coordinate to the process() callback,
         * stopping when process() returns truthily or when the line's endpoint
         * is reached.
         */
        traceLine: function(x0, y0, x1, y1, process) {
            var temp
            ,   steep = Math.abs(y1 - y0) > Math.abs(x1 - x0)
            ,   movingLeft = false;

            if (steep) {
                temp = x0;
                x0 = y0;
                y0 = temp;

                temp = x1;
                x1 = y1;
                y1 = temp;
            }
            if (x0 > x1) {
                movingLeft = true;
            }

            var deltax = Math.abs(x1 - x0)
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

            while (!ret && (movingLeft ? x >= x1 : x <= x1)) {
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
                movingLeft ? x-- : x++;
            }
        }
    };

    return util;
})();