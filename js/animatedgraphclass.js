class AnimatedLineGraph {
    constructor (options) {
        const canvas = document.getElementById("myCanvas");
        this.ctx = canvas.getContext("2d");
        this.graphYMin = 99999
        this.graphYMax = -99999
        this.canvasWidth = 1000
        this.canvasHeight = 400
        this.translatedX = -1
        this.translatedY = -1
        this.prevTransX = -1
        this.prevTransY = -1

        this.scrollThreshold = options.scrollThreshold || 250
        this.prop = options.prop || "avgPace"
        this.easing = options.easing || 1
        this.frameNum = 0
        
    }

    startAnimation() {
        const graphInterval = setInterval(() => {
            // ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            this.drawFrame(rawDataList, displayDataList)
            this.frameNum+=1
        }, 30)
    }

    

    drawFrame(rawDataList, displayDataList) {
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
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
            } else if (rawDataList[currentIndex-scrollThreshold-1][this.prop] >= this.graphYMax) {
                const toLookFor = rawDataList.slice(currentIndex-this.scrollThreshold, currentIndex).map(item => item[this.prop])
                this.graphYMax = Math.max(...toLookFor)
            }

            loopBeginFrame = this.frameNum - (this.scrollThreshold * this.easing)
            scrolling = true
        }

        for(var frame = loopBeginFrame; frame < this.frameNum; frame++){
                // Start a new path
            // ctx.moveTo(30, 50); // Move the pen to (30, 50)
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
            
            this.translatedY = this.canvasHeight*0.8 - ((this.canvasHeight*0.6)*((currentVal-this.graphYMin)/(this.graphYMax - this.graphYMin))) - ((this.canvasHeight*0.6)*((frame%this.easing) / this.easing)*((nextVal - currentVal)/(this.graphYMax - this.graphYMin))) 
            this.ctx.beginPath();

            // console.log(this.translatedX + " " +this.translatedY)
            this.ctx.setLineDash([]);
            this.ctx.lineWidth = 4;
            this.ctx.strokeStyle = "purple";
            this.ctx.moveTo(this.prevTransX, this.prevTransY)
            this.ctx.lineTo(this.translatedX, this.translatedY) // consider quadraticCurvTo
            this.ctx.stroke(); // Render the path
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

function startBarGraph() {
    const userBarGraph = new AnimatedLineGraph(
        options = {
            prop: "movingPace",
            easing: 3
        }
    )

    userBarGraph.startAnimation()
}