# node-red-contrib-gpu

[Node Red][1] interface to gpu using [gpu.js][4].
Input is one or more arrays or images that are passed in a message.
An array can represent a 1,2 or 3 dimensional matrix.
Due to the overhead GPU is only efficient where input arrays are of a considerable size.

There is plenty of scope for this node to be enhanced to take advantage of [gpu.js][4] features.
For example, more standard function, dynamic functions, multi function access to minimise externalisation from GPU between functions.

------------------------------------------------------------

# gpu

This node can be found in function and has form below.
Argument 1 is the name of property containing first argument to function.
Argument 2 is the name of property containing second argument to function.
Target Property where the response is place.
Arguments can be numbers or arrays of numbers.
Result will change depending on function and data types passed in arguments.

There are 3 ports. One for success, second for failure and third if GPU not supported by hardware.
The last allows CPU based equivalents to be implemented so flow can be hardware agnostic.

Pipeline allows information to be retained in GPU between nodes minimising overhead of loading and unloading GPU.

![gpu node](documentation/gpu node.jpg "gpu node") 

Functions
* Add Array
* Bitwise And Array
* Bitwise Or Array
* Bitwise XOR Array
* Co-variance 
* Correlation Coefficients (Pearson)
* Divide Array/option>
* Left Shift Array
* Heat Map
* Image to array
* Load array into pipeline
* load array with deltas
* Matrix Multiple Arrays
* Moments average,variance, skewness
* Multiply Array
* Normalise
* Power Array
* Remainder Array
* Right Shift Array
* Right Shift Zero Fill Array
* Statistics average, standard deviation, skewness
* Subtract Array
* Sum Columns
* Sum Rows
* Image To Array
* Transpose

------------------------------------------------------------

# REQUIRE

Can be included and gives access to other functions

* isGPUSupported
* isArray
* arrayCleanse
* arrayDimensions
* checkObject

------------------------------------------------------------

# Install

Run the following command in the root directory of your Node-RED install or via GUI install

	npm install node-red-contrib-gpu

------------------------------------------------------------

# Version

0.4.0 Major re-arrange of code.  Bug fix for rows blocking on norms.  Access to more internal functions.  Add heat map

0.3.0 Fix blocking issues, add normalized data

0.2.1 fix bug with pipeline incorrectly call in certain situations

0.2.0 Load array with deltas and fix bug with blocking

0.1.1 Even more bug fixes, expanded blocking, pipeline, columns/rows and select column scope.

0.1.0 Even more bug fixes added pipelining, load 2d array into 3d using sizing, select columns for stats metrics

0.0.2 Loads of bug fixes. Added more robust tests

0.0.1 base

# Author

[Peter Prib][3]

[1]: http://nodered.org "node-red home page"

[2]: https://www.npmjs.com/package/node-red-contrib-gpu "source code"

[3]: https://github.com/peterprib "base github"

[4]: https://github.com/gpujs/gpu.js "gpu.js"