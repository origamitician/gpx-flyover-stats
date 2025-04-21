const scrollThreshold = 999999
let graphYMin = 99999
let graphYMax = -99999

function removeBoxes () {
    const boxes = document.querySelectorAll('.verticalBars');

    boxes.forEach(box => {
        box.remove();
    });
}

function drawBarGraphFrame(prop, frameNum){
    // removeBoxes()
    console.log(rawDataList)
    console.log("i got here")
    if(frameNum <= scrollThreshold){
        
        if (rawDataList[frameNum][prop] < graphYMin) {
            graphYMin = rawDataList[frameNum][prop]
        }

        if (rawDataList[frameNum][prop] > graphYMax) {
            graphYMax = rawDataList[frameNum][prop]
        }
        console.log(frameNum)
        for(var i = 0; i < frameNum; i++){
            if (i < frameNum - 1) {
                // if the bar was previously rendered, simply adjust the width.
                document.getElementsByClassName('verticalBars')[i].style.width= (100 / frameNum) + '%';
                document.getElementsByClassName('verticalBars')[i].style.height = (200*(rawDataList[i][prop]/(graphYMax - graphYMin))) + 'px';
                document.getElementsByClassName('verticalBars')[i].style.marginTop = (200-(200*(rawDataList[i][prop]/(graphYMax - graphYMin))))+'px';
            } else {
                // if not, add the bar to the end.
                var b = document.createElement('div');
                b.className = 'verticalBars'
                b.style.width = (100 / frameNum) + '%';
                b.style.height = (200*(rawDataList[i][prop]/(graphYMax - graphYMin))) + 'px';
                b.style.marginTop = (200-(200*(rawDataList[i][prop]/(graphYMax - graphYMin))))+'px';
                document.getElementById('animatedChart').appendChild(b);
            }
            
        }
    }
    
    /*else{
        if (rawDataList[frameNum-scrollThreshold-1][prop] <= graphYMin) {
            // if the bar getting kicked out was the minimum value, find thew new minimum value.
            const toLookFor = rawDataList.slice(frameNum, frameNum+scrollThreshold).map(item => item[prop])
            graphYMin = Math.min(...toLookFor)
        }

        if (rawDataList[frameNum-scrollThreshold-1][prop] >= graphYMax) {
            // if the bar getting kicked out was the minimum value, find thew new minimum value.
            const toLookFor = rawDataList.slice(frameNum, frameNum+scrollThreshold).map(item => item[prop])
            graphYMax = Math.max(...toLookFor)
        }

        for(var i = frameNum-scrollThreshold; i < frameNum+scrollThreshold; i++){
            var b = document.createElement('div');
            b.className = 'verticalBars'
            b.style.width = (100/scrollThreshold) + '%';
            b.style.height = 30+(170*((rawDataList[i]-rawDataList[rawDataList.length-1-scrollThreshold])/(rawDataList[rawDataList.length-1]-rawDataList[rawDataList.length-1-scrollThreshold]))) + 'px';
            b.style.marginTop = (200-(170*((rawDataList[i]-rawDataList[rawDataList.length-1-scrollThreshold])/(rawDataList[rawDataList.length-1]-rawDataList[rawDataList.length-1-scrollThreshold]))))-30+'px';
            document.getElementById('lineGraphHolder').appendChild(b);
        }
    }
    */
}

let frame = 0

function startBarGraph(prop) {
    setInterval(() => {
        drawBarGraphFrame(prop, frame)
        frame+=1 // ik this is terrible
        
    }, 50)
}

