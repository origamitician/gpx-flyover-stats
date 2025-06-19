class AnimatedLineGraph {
    constructor (options) {
        this.graphYMin = 99999
        this.graphYMax = -99999
        this.canvasWidth = 1000
        this.canvasHeight = 400
        this.translatedX = -1
        this.translatedY = -1
        this.prevTransX = -1
        this.prevTransY = -1

        this.scrollThreshold = options.scrollThreshold || 150
        this.prop = options.prop || "avgPace"
        this.easing = options.easing || 1
        this.frameNum = 0
        this.offsetYTop = options.offsetYTop || 0.2
        this.offsetYBottom = options.offsetYBottom || 0.2
        this.color = options.color || "purple"
        this.fill = options.fill || false
        this.spectrum = options.spectrum || []

        const canvas = document.getElementById("myCanvas");
        ctx = canvas.getContext("2d");
        this.ctx = ctx
    }

    hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
    
    rgbToHex(r, g, b) {
        return "#" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
    }

    getIntermediateColor(c1, c2, minVal, maxVal, val) {
        const percentage = (val - minVal) / (maxVal - minVal)
        const clr1 = this.hexToRgb(c1)
        const clr2 = this.hexToRgb(c2)
        if (percentage <= 0) {
            return clr1;
        } else if (percentage >= 100) {
            return clr2;
        } 
        
        const rRes = Math.round(clr1.r + (clr2.r - clr1.r) * percentage)
        const gRes = Math.round(clr1.g + (clr2.g - clr1.g) * percentage)
        const bRes = Math.round(clr1.b + (clr2.b - clr1.b) * percentage)
        console.log(rRes + "," + gRes + "," + bRes)
        return this.rgbToHex(rRes, gRes, bRes)
    }


    drawFrame(rawDataList, displayDataList) {
        // console.log(frameNum)
        this.prevTransX = 0
        this.prevTransY = 0
    
        // console.log(currentIndex)
        let currentIndex = Math.floor(this.frameNum / this.easing)
        let loopBeginFrame = 0
        let scrolling = false

        // script to change max/min
        if(Math.floor(this.frameNum / this.easing) <= this.scrollThreshold){
            
            if (rawDataList[currentIndex][this.prop] < this.graphYMin) {
                this.graphYMin = rawDataList[currentIndex][this.prop]
            }

            if (rawDataList[currentIndex][this.prop] > this.graphYMax) {
                this.graphYMax = rawDataList[currentIndex][this.prop]
            }

            loopBeginFrame = 0
            scrolling = false

        } else {
            if (rawDataList[currentIndex][this.prop] <= this.graphYMin) {
                this.graphYMin = rawDataList[currentIndex][this.prop]
            } else if (rawDataList[currentIndex-this.scrollThreshold-1][this.prop] <= this.graphYMin) {
                const toLookFor = rawDataList.slice(currentIndex-this.scrollThreshold, currentIndex).map(item => item[this.prop])
                this.graphYMin = Math.min(...toLookFor)
            }

            if (rawDataList[currentIndex][this.prop] >= this.graphYMax) {
                this.graphYMax = rawDataList[currentIndex][this.prop]
            } else if (rawDataList[currentIndex-this.scrollThreshold-1][this.prop] >= this.graphYMax) {
                const toLookFor = rawDataList.slice(currentIndex-this.scrollThreshold, currentIndex).map(item => item[this.prop])
                this.graphYMax = Math.max(...toLookFor)
            }

            loopBeginFrame = this.frameNum - (this.scrollThreshold * this.easing)
            scrolling = true
        }

        for(var frame = loopBeginFrame; frame < this.frameNum; frame++){
            
            // calculate X and Y.
            if (frame == 0) {
                this.prevTransX = 0
                this.prevTransY = this.canvasHeight
            }

            if (scrolling) {
                this.translatedX = (this.canvasWidth/(this.scrollThreshold * this.easing)) * (frame-loopBeginFrame)
            } else {
                this.translatedX = (this.canvasWidth/this.frameNum) * (frame)
            }
            
            let currentVal = rawDataList[Math.floor(frame/this.easing)][this.prop]
            let nextVal = rawDataList[Math.floor(frame/this.easing) + 1][this.prop]

            const graphAreaHeightInPixels = this.canvasHeight*(1-this.offsetYTop-this.offsetYBottom)
            
            this.translatedY = this.canvasHeight*(1-this.offsetYBottom) - (graphAreaHeightInPixels*((currentVal-this.graphYMin)/(this.graphYMax - this.graphYMin))) - (graphAreaHeightInPixels*((frame%this.easing) / this.easing)*((nextVal - currentVal)/(this.graphYMax - this.graphYMin))) 

            // figure out the fill color.

            let variableToUseForColor = (this.prop == "elevation") ? "incline" : this.prop

            let variableReadingForColor = rawDataList[Math.floor(frame/this.easing) + 1][variableToUseForColor]
            let graphColor;

            if (this.spectrum.length == 0) {
                graphColor = this.color
            } else if (this.spectrum.length == 2) {
                graphColor = this.getIntermediateColor(this.spectrum[0].color, this.spectrum[1].color, this.spectrum[0].value, this.spectrum[1].value, variableReadingForColor)
            } else if (this.spectrum.length == 3) {
                if (variableReadingForColor <= this.spectrum[1].value) {
                    graphColor = this.getIntermediateColor(this.spectrum[0].color, this.spectrum[1].color, this.spectrum[0].value, this.spectrum[1].value, variableReadingForColor)
                } else {
                    graphColor = this.getIntermediateColor(this.spectrum[1].color, this.spectrum[2].color, this.spectrum[1].value, this.spectrum[2].value, variableReadingForColor)
                }
            }
            
            // now that translatedX and translatedY is calculated + color is identified, draw.
            this.ctx.beginPath();
            if (!this.fill) { // if the line graph is not supposed to be filled.
                
                // console.log(this.translatedX + " " +this.translatedY)
                this.ctx.setLineDash([]);
                this.ctx.lineWidth = 4;
                this.ctx.strokeStyle = graphColor
                this.ctx.moveTo(this.prevTransX, this.prevTransY)
                this.ctx.lineTo(this.translatedX, this.translatedY) // consider quadraticCurvTo
                this.ctx.stroke(); // Render the path
                
            } else { // if must be filled, fill a trapezoidal curve.
                this.ctx.moveTo(this.prevTransX, this.prevTransY)
                this.ctx.lineTo(this.prevTransX, this.canvasHeight)
                this.ctx.lineTo(this.translatedX, this.canvasHeight)
                this.ctx.lineTo(this.translatedX, this.translatedY)
                this.ctx.fillStyle = graphColor
                this.ctx.fill()
            }
            this.ctx.closePath()
        
            if (((Math.floor(frame/this.easing) + 1) % 60) == 0) {

                if (frame % this.easing == 0) {
                    this.ctx.beginPath();
                    this.ctx.lineWidth = 2;
                    this.ctx.setLineDash([5, 5]);
                    this.ctx.strokeStyle = "gray";
                    this.ctx.moveTo(this.translatedX, 0)
                    this.ctx.lineTo(this.translatedX, this.canvasHeight)
                    this.ctx.stroke(); // Render the path
                    this.ctx.closePath()

                    this.ctx.font = "15px National Park";
                    this.ctx.fillText(convertToHMS(rawDataList[Math.floor(frame/this.easing) + 1].time) + " (" + (rawDataList[Math.floor(frame/this.easing) + 1].distance/5280).toFixed(3) + "mi)", this.translatedX+10, 20);
                }
                // console.log("minute!")
                // create the scrolling vertical lines.
                
            }
            this.prevTransX = this.translatedX
            this.prevTransY = this.translatedY
            
        }
        // let curr = rawDataList[Math.floor(frame/easing)][prop]
        // let next = rawDataList[Math.floor(frame/easing) + 1][prop]
        // document.getElementById('prediction').innerHTML = "Current: " + convertToHMS(curr + ((next - curr) *((frame%easing) / easing)), 2)
        document.getElementById('prediction').innerHTML = displayDataList[Math.floor(frame/this.easing)][this.prop]
        document.getElementById('minY').innerHTML = "minimum Y: " + this.graphYMin
        document.getElementById('maxY').innerHTML = "maximum Y: " + this.graphYMax
    }
}

function startAnimation() {

    const canvas = document.getElementById("myCanvas");
    ctx = canvas.getContext("2d");
    canvasWidth = 1000
    canvasHeight = 400

    const userBarGraph = new AnimatedLineGraph(
        options = {
            prop: "movingPace",
            easing: 3,
            canvasWidth: canvasWidth,
            canvasHeight: canvasHeight
        }
    )

    const elevBarGraph = new AnimatedLineGraph(
        options = {
            prop: "elevation",
            easing: 3,
            canvasWidth: canvasWidth,
            canvasHeight: canvasHeight,
            color: "lightgray",
            offsetYBottom: 0.05,
            offsetYTop: 0.7,
            fill: true,
            spectrum: [{color: "#509c44", value: -2}, {color: "#959c94", value: 0}, {color: "#bf1b41", value: 2}]
        }
    )

    const graphInterval = setInterval(() => {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        

        elevBarGraph.drawFrame(rawDataList, displayDataList)
        elevBarGraph.frameNum+=1

        userBarGraph.drawFrame(rawDataList, displayDataList)
        userBarGraph.frameNum+=1
    }, 30)
}