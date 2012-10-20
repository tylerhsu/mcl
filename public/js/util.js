var util = (function() {
    var util = {

        /*
         * Returns the gaussian distribution of x.
         */
        gaussian: function(x, mean, variance) {
            return (1 / (variance * Math.sqrt(2 * Math.PI))) * Math.pow(Math.E, -0.5 * Math.pow(x / variance, 2));
        }

        /*
         * Returns a copy of the given array with its values
         * normalized so they sum to 1.
         */
        , normalize: function(arr) {
            var n
            ,   val
            ,   factor
            ,   sum = this.sum(arr)
            ,   newArr = [];
            for (n = 0; n < arr.length; n++) {
                val = (arr[n] / sum);
                newArr.push(val);
            }
            return newArr;
        }

        /*
         * Returns a random sample from the given set, where the probability of
         * returning set[n] is weighted by weights[n].
         */
        , sample: function(set, weights) {
            var n
            ,   min = 1000
            ,   delta = 1
            ,   rand
            ,   sample
            ,   sum = 0
            ,   cdf = [];

            if (set.length != weights.length) {
                console.error('Warning: number of elements in set (' + set.length + ') differs from number of weights supplied (' + weights.length + ')');
            }

            weights = this.normalize(weights);

            for (n = 0; n < weights.length; n++) {
                cdf[n] = sum;
                sum += weights[n];
            }

            rand = Math.random();
            
            n = 0;
            while (cdf[n] < rand && n < cdf.length) {
                delta = rand - cdf[n];
                if (delta < min) {
                    sample = set[n];
                    min = delta;
                }
                n++;
            }
            
            return sample;
        }

        , testSample: function(set, weights, precision) {
            var n
            ,   counts = {};
            set.forEach(function(el) {
                counts[el.toString()] = 0;
            });
            for (n = 0; n < 100000; n++) {
                counts[util.sample(set, weights, precision).toString()]++;
            }
            return counts;
        }

        /*
         * Returns the sum of the values in the given array
         */
        , sum: function(arr) {
            var n
            ,   sum = 0;
            for (n = 0; n < arr.length; n++) {
                sum += arr[n];
            }
            return sum;
        }

        /*
         * Iterates over the line of pixel coordinates between [x0, y0] and [x1, y1]
         * using Bresenham's algorithm.
         * 
         * Passes each coordinate to the process() callback,
         * stopping when process() returns truthily or when the line's endpoint
         * is reached.
         */
        , traceLine: function(x0, y0, x1, y1, process) {
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