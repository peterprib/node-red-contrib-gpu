function imageToArray(image) {
	const kernel=this.gpu.createKernel(function(image) {
		const pixel=image[this.thread.y][this.thread.x];
		this.color(pixel.r, pixel.g, pixel.b, pixel.a);
	}, {
		output: [image.width, image.height],
		graphical: true,
		pipeline: true,
	});
	kernel(image);
	const result=kernel.getPixels(true);
	kernel.destroy();
	return result;
}
module.exports=imageToArray;