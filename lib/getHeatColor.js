function getHeatColor(t) {
	if(t>=0 && t<=0.25)		return [255 + (0 - 255) * t / 0.25, 255 + (0 - 255) * t / 0.25, 255];
	if(t>=0.25 && t<=0.55)	return [0, 255 * (t - 0.25) / 0.3, 255 + (0 - 255) * (t - 0.25) / 0.3];
	if(t>=0.55 && t<= 0.85)	return [255 * (t - 0.55) / 0.3, 255, 0];
	if(t>=0.85 && t<=1)		return [255, 255 + (0 - 255) * (t - 0.85) / 0.15, 0];
	return [255,255,255]; 
}
module.exports=getHeatColor;