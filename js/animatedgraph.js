const scrollThreshold = 250
let graphYMin = 99999
let graphYMax = -99999

let canvasWidth = 1000
let canvasHeight = 400
let easing = 10

const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");


function drawBarGraphFrame(prop, frameNum, offsetFrames, clr, easing){
    // console.log(frameNum)
    let prevTransX = 0
    let prevTransY = 0
   
    // console.log(currentIndex)
    let currentIndex = Math.floor(frameNum / easing)
    let loopBeginFrame = 0
    let scrolling = false

    if (currentIndex+(offsetFrames/easing) >= rawDataList.length) {
        clearInterval(graphInterval)
        return 0 // exit immediately
    }

    // script to change max/min
    if(Math.floor(frameNum / easing) <= scrollThreshold){
        
        if (rawDataList[currentIndex+offsetFrames][prop] < graphYMin) {
            graphYMin = rawDataList[currentIndex+offsetFrames][prop]
        }

        if (rawDataList[currentIndex+offsetFrames][prop] > graphYMax) {
            graphYMax = rawDataList[currentIndex+offsetFrames][prop]
        }

        loopBeginFrame = 0
        scrolling = false

    } else {
        if (rawDataList[currentIndex][prop] <= graphYMin) {
            graphYMin = rawDataList[currentIndex][prop]
        } else if (rawDataList[currentIndex-scrollThreshold-1][prop] <= graphYMin) {
            const toLookFor = rawDataList.slice(currentIndex-scrollThreshold, currentIndex).map(item => item[prop])
            graphYMin = Math.min(...toLookFor)
        }

        if (rawDataList[currentIndex][prop] >= graphYMax) {
            graphYMax = rawDataList[currentIndex][prop]
        } else if (rawDataList[currentIndex-scrollThreshold-1][prop] >= graphYMax) {
            const toLookFor = rawDataList.slice(currentIndex-scrollThreshold, currentIndex).map(item => item[prop])
            graphYMax = Math.max(...toLookFor)
        }

        loopBeginFrame = frameNum - (scrollThreshold * easing)
        scrolling = true
    }

    for(var frame = loopBeginFrame; frame < frameNum; frame++){
            // Start a new path
        // ctx.moveTo(30, 50); // Move the pen to (30, 50)
        if (frame == 0) {
            prevTransX = 0
            prevTransY = canvasHeight
        }

        if (scrolling) {
            translatedX = (canvasWidth/(scrollThreshold * easing)) * (frame-loopBeginFrame)
        } else {
            translatedX = (canvasWidth/frameNum) * (frame)
        }
        
        let currentVal = rawDataList[Math.floor(frame/easing)][prop]
        let nextVal = rawDataList[Math.floor(frame/easing) + 1][prop]
        
        translatedY = canvasHeight*0.8 - ((canvasHeight*0.6)*((currentVal-graphYMin)/(graphYMax - graphYMin))) - ((canvasHeight*0.6)*((frame%easing) / easing)*((nextVal - currentVal)/(graphYMax - graphYMin))) 
        ctx.beginPath();

        // console.log(translatedX + " " +translatedY)
        ctx.setLineDash([]);
        ctx.lineWidth = 4;
        ctx.strokeStyle = "purple";
        ctx.moveTo(prevTransX, prevTransY)
        ctx.lineTo(translatedX, translatedY) // consider quadraticCurvTo
        ctx.stroke(); // Render the path
        ctx.closePath()

        if (((Math.floor(frame/easing) + 1) % 60) == 0) {

            if (frame % easing == 0) {
                ctx.beginPath();
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.strokeStyle = "gray";
                ctx.moveTo(translatedX, 0)
                ctx.lineTo(translatedX, canvasHeight)
                ctx.stroke(); // Render the path
                ctx.closePath()

                ctx.font = "15px National Park";
                ctx.fillText(convertToHMS(rawDataList[Math.floor(frame/easing) + 1].time) + " (" + (rawDataList[Math.floor(frame/easing) + 1].distance/5280).toFixed(3) + "mi)", translatedX+10, 20);
            }
            // console.log("minute!")
            // create the scrolling vertical lines.
            
        }
        prevTransX = translatedX
        prevTransY = translatedY
        
    }
    let curr = rawDataList[Math.floor(frame/easing)][prop]
    let next = rawDataList[Math.floor(frame/easing) + 1][prop]
    // document.getElementById('prediction').innerHTML = "Current: " + convertToHMS(curr + ((next - curr) *((frame%easing) / easing)), 2)
    document.getElementById('prediction').innerHTML = displayDataList[Math.floor(frame/easing)][prop]
    document.getElementById('minY').innerHTML = "minimum Y: " + graphYMin
    document.getElementById('maxY').innerHTML = "maximum Y: " + graphYMax
    
}

let frame = 0
let offset = 0
let elevationArr = rawDataList.map(a => a.elevation)
let minElev = Math.min(...elevationArr)
let maxElev = Math.max(...elevationArr)
let graphInterval;
function startBarGraph(prop) {
    graphInterval = setInterval(() => {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        drawBarGraphFrame(prop, frame, offset, "purple", 3)
        frame+=1 // ik this is terrible
    }, 30)
}

