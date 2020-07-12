const assert=require('assert');
const {GPU}=require('gpu.js');
const gpu = new GPU();
const a3=[1,2,3];
const a33=[[11,21],[12,21],[13,23]];
const a=[0,1,2,3,4,5,6,7,8,9];
const b=a.map(c=>c+10);
const c=b.map(c=>c+10);

describe('destructuring', function() {
	it('supported', function(done) {
		assert.equal(GPU.isGPUSupported, true);
		done();
	});
});

describe('destructuring', function() {
	it('object x12', function(done) {
		const kernel = gpu.createKernel(function() {
			const { thread: {x, y} } = this;
			 return x;
			}, { output:{ x: 12 } });
		console.log(kernel());
		done();
	});
	it('object x2,y2 x', function(done) {
		const kernel = gpu.createKernel(function() {
			const { thread: {x, y} } = this;
			 return x;
			}, { output:{ x: 2, y:2 } });
		console.log(kernel());
		done();
	});
	it('object x2,y2 y', function(done) {
		const kernel = gpu.createKernel(function() {
			const { thread: {x, y} } = this;
			 return y;
			}, { output: {x:2,y:2} });
		console.log(kernel());
		done();
	});
	it('object x2,y2 x,y' , function(done) {
		const kernel = gpu.createKernel(function() {
			const { thread: {x, y} } = this;
			 return [x,y];
			}, { output: {x:2,y:2} });
		console.log(kernel());
		done();
	});
	it('object x2,y2 t', function(done) {
		const kernel = gpu.createKernel(function(t) {
			const { thread: {x, y} } = this;
			 return [x,y,t];
			}, { output: {x:2,y:2} });
		console.log(kernel(1));
		done();
	});
	
	it('array 2 x2,y2 ax', function(done) {
		const kernel = gpu.createKernel(function(array) {
				const [ax, ay] = array;
				return ax;
			}, {
  				output: {x:2,y:2},
  				argumentTypes: { array: 'Array(2)' }
			});
		console.log(kernel(a33));
		done();
	});
	it('array 2 x2,y2 x', function(done) {
		const kernel = gpu.createKernel(function(array) {
				const { thread: {x, y} } = this;
				const [ax, ay] = array;
				return x; 
			}, {
  				output: {x:2,y:2},
  				argumentTypes: { array: 'Array(2)' }
			});
		console.log(kernel(a33));
		done();
	});
	it('array 2 x2,y2 y ', function(done) {
		const kernel = gpu.createKernel(function(array) {
				const { thread: {x, y} } = this;
				const [ax, ay] = array;
				return y; 
			}, {
  				output: {x:2,y:2},
  				argumentTypes: { array: 'Array(2)' }
			});
		console.log(kernel(a33));
		done();
	});
	it('array 3 x2,y2 ', function(done) {
		const kernel = gpu.createKernel(function(array) {
				const { thread: {x, y} } = this;
				const [ax, ay] = array;
				return x; 
			}, {
  				output: {x:2,y:2},
  				argumentTypes: { array: 'Array(3)' }
			});
		console.log(kernel(a33));
		done();
	});
	it('array 4 x2,y2 ', function(done) {
		const kernel = gpu.createKernel(function(array) {
				const { thread: {x, y} } = this;
				const [ax, ay] = array;
				return x; 
			}, {
  				output: {x:2,y:2},
  				argumentTypes: { array: 'Array(4)' } 
			});
		console.log(kernel(a3));
		done();
	});
	
	it('array 2 x3,y2 [x,y]', function(done) {
		const kernel = gpu.createKernel(function(array) {
				const { thread: {x, y} } = this;
				const [ax, ay] = array;
				return [x,y]; 
			}, {
  				output: {x:3,y:2},
  				argumentTypes: { array: 'Array(2)' }
			});
		console.log(kernel(a33));
		done();
	});
	it('array 2 x3,y2 [ax,ay]', function(done) {
		const kernel = gpu.createKernel(function(array) {
				const { thread: {x, y} } = this;
//				const [ax, ay] = array;
				return [x,array[x],y,array[y]]; 
			}, {
  				output: {x:3,y:2},
  				argumentTypes: { array: 'Array(2)' }
			});
		console.log(kernel(a33));
		done();
	});
});

describe('createKernelMap', function(){
	const add = gpu.createKernel(function(a, b) {
		return a[this.thread.x] + b[this.thread.x];
	}).setOutput([10]);

	const multiply = gpu.createKernel(function(a, b) {
 		return a[this.thread.x] * b[this.thread.x];
	}).setOutput([10]);

	const superKernel = gpu.combineKernels(add, multiply, (a, b, c)=>{
		return multiply(add(a, b), c);
	});
	it("t1", function(done) {
		console.log(superKernel(a,b,c));
		done();
	});
});

describe('combineKernels', function(){
	const megaKernel = gpu.createKernelMap({
			addResult: function add(a, b) {return a + b;},
			multiplyResult: function multiply(a, b) {return a * b; },
		},
		function(a, b, c) {
			return multiply(add(a[this.thread.x], b[this.thread.x]), c[this.thread.x]);
		}, 
		{output:[10]
	});
	it("t1", function(done) {
		console.log(megaKernel(a,b,c));
		done();
	});
});