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

        this.scrollThreshold = options.scrollThreshold || 125
        this.prop = options.prop || "avgPace"
        this.easing = options.easing || 1
        this.frameNum = 0
        this.offsetYTop = options.offsetYTop || 0.2
        this.offsetYBottom = options.offsetYBottom || 0.2
        this.color = options.color || "purple"
        this.fill = options.fill || false
        this.spectrum = options.spectrum || []

        if (this.spectrum.length > 0) {
            this.spectrum.unshift({color: this.spectrum[0].color, value: -99999}) // add this so the loop below would always terminate.
            this.spectrum.push({color: this.spectrum[this.spectrum.length-1].color, value: 99999}) // add this so the loop below would always terminate.
        }
        
        const canvas = document.getElementById("myCanvas");
        ctx = canvas.getContext("2d");
        this.ctx = ctx

        const d = document.createElement('div')
        d.className = 'indivGraphStat'
        d.id = 'graph_' + this.prop

        const valueDisplay = document.createElement('p');
        valueDisplay.className = 'valueDisplay'
        d.appendChild(valueDisplay)

        const valueVariable = document.createElement('p');
        valueVariable.className = 'valueVariable'
        valueVariable.innerHTML = (this.prop).replace(/([a-z])([A-Z])/g, '$1 $2').toUpperCase();
        d.appendChild(valueVariable)

        const numChildren = document.getElementsByClassName('indivGraphStat').length
        d.style.width = (100 / (numChildren + 1)) + "%"

        for (let i = 0; i < numChildren; i++) {
            document.getElementsByClassName('indivGraphStat')[i].style.width = (100 / (numChildren + 1)) + "%"
        }

        document.getElementById('graphStatHolder').appendChild(d)
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
        // console.log(rRes + "," + gRes + "," + bRes)
        return this.rgbToHex(rRes, gRes, bRes)
    }


    drawFrame() {
        // console.log(frameNum)
        this.prevTransX = 0
        this.prevTransY = 0
    
        // console.log(currentIndex)
        let currentIndex = Math.floor(this.frameNum / this.easing)
        let loopBeginFrame = 0
        let scrolling = false
        let graphColor;

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

        for(var subInterval = loopBeginFrame; subInterval < this.frameNum+1; subInterval++){
            
            // calculate X and Y.
            if (subInterval == 0 || subInterval == loopBeginFrame) {
                this.prevTransX = 0
                this.prevTransY = 0
            }

            if (scrolling) {
                this.translatedX = (this.canvasWidth/(this.scrollThreshold * this.easing)) * (subInterval-loopBeginFrame)
            } else {
                this.translatedX = (this.canvasWidth/this.frameNum) * (subInterval)
            }
            
            let currentVal = rawDataList[Math.floor(subInterval/this.easing)][this.prop]

            /*
            if (Math.floor(subInterval/this.easing == 0)) { // if it's the first entry
                currentVal = rawDataList[Math.floor(subInterval/this.easing)+1][this.prop]
            } else {
                
            }*/

            let nextVal = rawDataList[Math.floor(subInterval/this.easing)+1][this.prop]

            const graphAreaHeightInPixels = this.canvasHeight*(1-this.offsetYTop-this.offsetYBottom)
            
            this.translatedY = this.canvasHeight*(1-this.offsetYBottom) - (graphAreaHeightInPixels*((currentVal-this.graphYMin)/(this.graphYMax - this.graphYMin))) - (graphAreaHeightInPixels*((subInterval%this.easing) / this.easing)*((nextVal - currentVal)/(this.graphYMax - this.graphYMin))) 

            // figure out the fill color.

            let variableToUseForColor = (this.prop == "elevation") ? "incline" : this.prop

            let variableReadingForColor = rawDataList[Math.floor(subInterval/this.easing)][variableToUseForColor]
            

            if (this.spectrum.length == 0) {
                graphColor = this.color
            } else if (this.spectrum.length == 2) {
                graphColor = this.getIntermediateColor(this.spectrum[0].color, this.spectrum[1].color, this.spectrum[0].value, this.spectrum[1].value, variableReadingForColor)
            } else {
                

                for (let i = 1; i < this.spectrum.length; i++) {
                    if (variableReadingForColor <= this.spectrum[i].value) {
                        graphColor = this.getIntermediateColor(this.spectrum[i-1].color, this.spectrum[i].color, this.spectrum[i-1].value, this.spectrum[i].value, variableReadingForColor)
                        // console.log(graphColor)
                        break;
                    }
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
        
            if (((Math.floor(subInterval/this.easing) + 1) % 120) == 0) {

                if (subInterval % this.easing == 0) {
                    this.ctx.beginPath();
                    this.ctx.lineWidth = 2;
                    this.ctx.setLineDash([5, 5]);
                    this.ctx.strokeStyle = "gray";
                    this.ctx.moveTo(this.translatedX, 0)
                    this.ctx.lineTo(this.translatedX, this.canvasHeight)
                    this.ctx.stroke(); // Render the path
                    this.ctx.closePath()

                    this.ctx.font = "15px National Park";
                    this.ctx.fillText(convertToHMS(rawDataList[Math.floor(subInterval/this.easing) + 1].time) + " (" + (rawDataList[Math.floor(subInterval/this.easing) + 1].distance/5280).toFixed(3) + "mi)", this.translatedX+10, 20);
                }
                // console.log("minute!")
                // create the scrolling vertical lines.
                
            }
            this.prevTransX = this.translatedX
            this.prevTransY = this.translatedY
            
        }
        // let curr = rawDataList[Math.floor(subInterval/easing)][prop]
        // let next = rawDataList[Math.floor(subInterval/easing) + 1][prop]
        // document.getElementById('prediction').innerHTML = "Current: " + convertToHMS(curr + ((next - curr) *((subInterval%easing) / easing)), 2)
        document.getElementById("graph_" + this.prop).getElementsByClassName('valueDisplay')[0].style.color = graphColor;
        if (this.prop != "elevation") {
            document.getElementById("graph_" + this.prop).getElementsByClassName('valueDisplay')[0].innerHTML = displayDataList[Math.floor(subInterval/this.easing)-1][this.prop] 
        } else {
            
            document.getElementById("graph_" + this.prop).getElementsByClassName('valueDisplay')[0].innerHTML = displayDataList[Math.floor(subInterval/this.easing)-1][this.prop] 
            + "<sup> (" + displayDataList[Math.floor(subInterval/this.easing)-1].incline  + ")</sup>"
        }

        document.getElementById("graph_time").getElementsByClassName('valueDisplay')[0].innerHTML = displayDataList[Math.floor(subInterval/this.easing)-1].time

        document.getElementById("graph_distance").getElementsByClassName('valueDisplay')[0].innerHTML = displayDataList[Math.floor(subInterval/this.easing)-1].distance
        
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
            easing: 1,
            canvasWidth: canvasWidth,
            canvasHeight: canvasHeight,
            fill: false,
            color: "purple"
            /*spectrum: [{color: "#846f8f", value: 7.74}, {color: "#0c050f", value: 8}, {color: "#a903fc", value: 8.88}, {color: "#fc0303", value: 9.32}]*/
        }
    )

    const predBarGraph = new AnimatedLineGraph(
        options = {
            prop: "movingCadence",
            easing: 1,
            canvasWidth: canvasWidth,
            canvasHeight: canvasHeight,
            color: "purple",
            fill: false,
            spectrum: [{color: "#327a11", value: 168}, {color: "#a8a11d", value: 170}, {color: "#eb9234", value: 172}, {color: "#eb5834", value: 174}]
        }
    )

    const elevBarGraph = new AnimatedLineGraph(
        options = {
            prop: "elevation",
            easing: 1,
            canvasWidth: canvasWidth,
            canvasHeight: canvasHeight,
            color: "gray",
            offsetYBottom: 0.05,
            offsetYTop: 0.7,
            fill: true,
            spectrum: [{color: "#19a8a1", value: -5}, {color: "#00db16", value: -2.5}, {color: "#959c94", value: 0}, {color: "#e39f20", value: 2.5}, {color: "#fc0362", value: 5}, {color: "#52195e", value: 8}]
        }
    )

    const graphInterval = setInterval(() => {
        if (userBarGraph.frameNum >= (rawDataList.length - 1) * userBarGraph.easing) {

            clearInterval(graphInterval)
        } else {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);

            elevBarGraph.drawFrame()
            elevBarGraph.frameNum+=1

            userBarGraph.drawFrame()
            userBarGraph.frameNum+=1

            predBarGraph.drawFrame()
            predBarGraph.frameNum+=1
        }
        
    }, Number(document.getElementsByName('frameDuration')[0].value))
}