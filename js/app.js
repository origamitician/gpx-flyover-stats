const d = haversineDistanceFT(42.806911, -71.290611, 42.741, -71.3161);
console.log(d)

// thank you stack overflow
function haversineDistanceFT(lat1Deg, lon1Deg, lat2Deg, lon2Deg) {
    function toRad(degree) {
        return degree * Math.PI / 180;
    }
    
    const lat1 = toRad(lat1Deg);
    const lon1 = toRad(lon1Deg);
    const lat2 = toRad(lat2Deg);
    const lon2 = toRad(lon2Deg);
    
    const { sin, cos, sqrt, atan2 } = Math;
    
    const R = 6371; // earth radius in km 
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    const a = sin(dLat / 2) * sin(dLat / 2)
            + cos(lat1) * cos(lat2)
            * sin(dLon / 2) * sin(dLon / 2);
    const c = 2 * atan2(sqrt(a), sqrt(1 - a)); 
    const d = R * c;
    return d*3280; // distance in ft
}

const GPXArray = GPXInput.split('\n').map((item) => item.trim())
const GPXData = []
const cadenceData = []
let trkID = 0
const obj = {}

GPXArray.forEach((item) => {
    // when the line opens up with "<trkpt", it must be a datapoint. Extract the datapoint info until it hits the closing "</trkpt> line."
    let tempTime = null
    if (item.substring(0, 6) == "<trkpt") { // instead of using item.includes, item.substring should be much faster.
        obj.lat = Number(item.substring(item.indexOf('lat=')+5, item.indexOf('" lon=')))
        obj.long = Number(item.substring(item.indexOf('lon=')+5, item.indexOf('">')))
    }

    if (item.substring(0, 12) =="<gpxtpx:cad>") {
        obj.cadence = Number(item.substring(item.indexOf('<gpxtpx:cad>')+12, item.indexOf('</gpxtpx:cad>')))*2
    }

    if (item.substring(0, 5) =="<ele>") {
        obj.elev = Number(item.substring(item.indexOf('<ele>')+5, item.indexOf('</ele>')))
    }

    if (item.substring(0, 6) =="<time>") {
        tempTime = new Date(item.substring(item.indexOf('<time>')+6, item.indexOf('</time>')))
        obj.currPointTime = Date.parse(tempTime)/1000
        
        if (trkID == 0) {
            obj.timeFromPreviousPoint = null
        } else {
            obj.timeFromPreviousPoint = obj.currPointTime - GPXData[GPXData.length - 1].currPointTime
        }
    }

    if (item.substring(0, 7) =="</trkpt") {
        obj.isDefault=true
        unlinkedObj = {...obj}

        GPXData.push(unlinkedObj)
        trkID++;

        obj.lat = null
        obj.long = null
        obj.cadence = null
        obj.elev = null
        obj.timeFromPreviousPoint = null

    }
})

function convertToHMS(seconds, decimalPlaces){
    let numOfDecimals;
    if (!decimalPlaces) {
        numOfDecimals = 0;
    } else {
        numOfDecimals = decimalPlaces;
    }

    if(seconds >= 3600){
        if(seconds % 3600 >= 600) {
            return Math.floor(seconds / 3600) + ":" +convertToHMS(seconds % 3600)
        }else{
            return Math.floor(seconds / 3600) + ":0" +convertToHMS(seconds % 3600)
        }
        
    }
    if(seconds % 60 >= 10){
        return Math.floor(seconds / 60) + ":" + (seconds % 60).toFixed(numOfDecimals);
    }else{
        return Math.floor(seconds / 60) + ":0" + (seconds % 60).toFixed(numOfDecimals);
    }
}

const splits = [
    {label: '1K', distance: 3280, fastestSplit: 99999, movingDist: null, startDist: null, endDist: null},
     {label: '1mi', distance: 5280, fastestSplit: 99999, movingDist: null, startDist: null, endDist: null},
    {label: '2K', distance: 6560, fastestSplit: 99999, movingDist: null, startDist: null, endDist: null},
    {label: '3K', distance: 9840, fastestSplit: 99999, movingDist: null, startDist: null, endDist: null},
    {label: '2mi', distance: 10560, fastestSplit: 99999, movingDist: null, startDist: null, endDist: null},
    {label: '5K', distance: 16400, fastestSplit: 99999, movingDist: null, startDist: null, endDist: null},
    {label: '10K', distance: 32800, fastestSplit: 99999, movingDist: null, startDist: null, endDist: null},
    {label: '15K', distance: 49200, fastestSplit: 99999, movingDist: null, startDist: null, endDist: null},
    {label: '10mi', distance: 52800, fastestSplit: 99999, movingDist: null, startDist: null, endDist: null},
    {label: '20K', distance: 65600, fastestSplit: 99999, movingDist: null, startDist: null, endDist: null},
    {label: 'HM', distance: 69168, fastestSplit: 99999, movingDist: null, startDist: null, endDist: null},
    {label: '30K', distance: 96840, fastestSplit: 99999, movingDist: null, startDist: null, endDist: null},
    {label: '40K', distance: 131200, fastestSplit: 99999, movingDist: null, startDist: null, endDist: null},
    {label: 'M', distance: 138336, fastestSplit: 99999, movingDist: null, startDist: null, endDist: null},
    {label: 'whatevercomesafter26.2', distance: 31.1, fastestSplit: 99999, movingDist: null},
]

let currentSplitIndex = 0

let totalDist = 0
let totalInstDist = 0
let totalMovingDist = 0
let totalMovingCadence = 0
let distanceOfTrack = 0
let increment = 5
let movingSeconds = 60
let rawDataList = []
let displayDataList = []

// preprocess the GPX data by calculating full distance and checking for any gaps that are >1 second between datapoints.
let i = 0
while (i < GPXData.length-1) {
    let dist = haversineDistanceFT(GPXData[i].lat, GPXData[i].long, GPXData[i+1].lat, GPXData[i+1].long);
    distanceOfTrack += dist

    if (GPXData[i+1].timeFromPreviousPoint > 1) {
        console.log("BAD at " + i)
        
        let count = 0
        while (count < GPXData[i+1].timeFromPreviousPoint - 1) {
            const GPXDataEntryCopy = {...GPXData[i]}
            GPXDataEntryCopy.currPointTime += (count+1)
            GPXDataEntryCopy.isDefault = false
            GPXData.splice(i+count, 0, GPXDataEntryCopy)
            i++
            count++
        }
    }
    i++
}

console.log(GPXData)

for (let i = 0; i < GPXData.length-1; i++) {
    let dist = haversineDistanceFT(GPXData[i].lat, GPXData[i].long, GPXData[i+1].lat, GPXData[i+1].long);
    
    totalDist += dist
    totalInstDist += dist
    totalMovingCadence += GPXData[i+1].cadence
    
    if (i < movingSeconds) {
        totalMovingDist += dist
    } else {
        totalMovingDist += (dist - haversineDistanceFT(GPXData[i-movingSeconds].lat, GPXData[i-movingSeconds].long, GPXData[i-movingSeconds+1].lat, GPXData[i-movingSeconds+1].long))
    }

    if (i % increment == 0 && i > 0) {
        // every X seconds
        let movPace;
        if (i < movingSeconds) {
            movPace = i / (totalMovingDist / 5280)
        } else {
            movPace = movingSeconds / (totalMovingDist / 5280)
        }

        rawDataList.push({
            time: i,
            distance: totalDist, // in inches
            distanceDiff: (rawDataList.length == 0) ? totalDist : (totalDist - rawDataList[rawDataList.length - 1].distance),
            pace: 3600 / (i / (totalDist / 5280)),
            instPace: 3600 / (increment / (totalInstDist / 5280)),
            movingPace: 3600 / movPace,
            projFinish: i * (distanceOfTrack / totalDist),
            cadence: totalMovingCadence / increment,
            elevation: GPXData[i].elev
        })

        /*

        for (let j = 0; j < splits.length; j++) {
            if (totalDist > splits[j].distance) {
                if (!splits[j].movingDist) {
                    splits[j].movingDist = totalDist;
                    splits[j].fastestSplit = i;
                    splits[j].endDist = totalDist
                    splits[j].startDist = 0
                } else {
                    let headVal = rawDataList[rawDataList.length - 1].distanceDiff
                    let tailVal = rawDataList[rawDataList.length - Math.round(splits[j].fastestSplit / increment)].distanceDiff
                    splits[j].movingDist += headVal - tailVal 

                    while (splits[j].movingDist > splits[j].distance) {
                        // move the tail forward.
                        let tailIndex = rawDataList.length - 1 - Math.round(splits[j].fastestSplit / increment)
                        splits[j].fastestSplit -= increment
                        splits[j].movingDist -= rawDataList[tailIndex].distanceDiff
                        splits[j].endDist = rawDataList[rawDataList.length - 1].distance
                        splits[j].startDist = splits[j].endDist - splits[j].distance

                    }
                }
            }
        }

       */ 

        console.log(JSON.stringify(splits[3]))

        if (totalDist > splits[currentSplitIndex].distance) {
            currentSplitIndex++;
        }

        displayDataList.push({
            time: convertToHMS(i),
            distance: (totalDist / 5280).toFixed(3),
            pace: convertToHMS(i / (totalDist / 5280), 2) + "/mi",
            instPace: convertToHMS(increment / (totalInstDist / 5280), 2) + "/mi",
            movingPace: convertToHMS(movPace, 2) + "/mi",
            projFinish: convertToHMS(i * (distanceOfTrack / totalDist)),
            splitPrediction: splits[currentSplitIndex].label + " - " + convertToHMS(i * (splits[currentSplitIndex].distance / totalDist)),
            cadence: (totalMovingCadence / increment).toFixed(1) + " spm",
            elevation: (GPXData[i].elev*3.28).toFixed(1) + "ft"
        })
        totalInstDist = 0
        totalMovingCadence = 0
    }
}

splits.forEach((item) => {
    if (item.movingDist) {
        const text = document.createElement('p')
        text.innerHTML = `Fastest ${item.label} - <b>${convertToHMS(item.fastestSplit)}</b> (from ${(item.startDist / 5280).toFixed(3)} to ${(item.endDist / 5280).toFixed(3)} miles)`
        document.getElementById("predictionDivs").appendChild(text)
    }
    
})


displayDataList.forEach((item) => {
    const trow = document.createElement('tr')
    Object.keys(item).forEach((key) => {
        let cell = document.createElement('td')
        cell.innerHTML = item[key]
        trow.appendChild(cell)
    })
    document.getElementById('data').appendChild(trow)
})