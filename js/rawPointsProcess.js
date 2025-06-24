let rawDataList = []
let displayDataList = []

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
    {label: 'whatevercomesafter26.2', distance: 9999999, fastestSplit: 99999, movingDist: null},
]

function processRawPoints(rawGPXPoints) {
    rawDataList = []
    displayDataList = []
    let currentSplitIndex = 0

    let totalDist = 0
    let totalInstDist = 0
    let totalMovingDist = 0
    let totalMovingCadence = 0
    let totalInstElevGain = 0
    let distanceOfTrack = 0
    let increment = 5
    let movingSeconds = 60

    // preprocess the GPX data by calculating full distance and checking for any gaps that are >1 second between datapoints.
    let i = 0
    while (i < rawGPXPoints.length-1) {
        let dist = haversineDistanceFT(rawGPXPoints[i].lat, rawGPXPoints[i].long, rawGPXPoints[i+1].lat, rawGPXPoints[i+1].long);
        distanceOfTrack += dist

        if (rawGPXPoints[i+1].timeFromPreviousPoint > 1) {
            console.log("BAD at " + i)
            
            let count = 0
            while (count < rawGPXPoints[i+1].timeFromPreviousPoint - 1) {
                const GPXDataEntryCopy = {...rawGPXPoints[i]}
                GPXDataEntryCopy.currPointTime += (count+1)
                GPXDataEntryCopy.isDefault = false
                rawGPXPoints.splice(i+count, 0, GPXDataEntryCopy)
                i++
                count++
            }
        }
        i++
    }

    console.log(rawGPXPoints)

    for (let i = 0; i < rawGPXPoints.length-1; i++) {
        let dist = haversineDistanceFT(rawGPXPoints[i].lat, rawGPXPoints[i].long, rawGPXPoints[i+1].lat, rawGPXPoints[i+1].long);
        totalDist += dist
        totalInstDist += dist
        totalMovingCadence += rawGPXPoints[i+1].cadence
        totalInstElevGain += (rawGPXPoints[i+1].elev - rawGPXPoints[i].elev)
        
        if (i < movingSeconds) {
            totalMovingDist += dist
        } else {
            totalMovingDist += (dist - haversineDistanceFT(rawGPXPoints[i-movingSeconds].lat, rawGPXPoints[i-movingSeconds].long, rawGPXPoints[i-movingSeconds+1].lat, rawGPXPoints[i-movingSeconds+1].long))
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
                distance: totalDist, // in feet
                distanceDiff: (rawDataList.length == 0) ? totalDist : (totalDist - rawDataList[rawDataList.length - 1].distance),
                pace: 3600 / (i / (totalDist / 5280)),
                instantaneousPace: 3600 / (increment / (totalInstDist / 5280)),
                movingPace: 3600 / movPace,
                projectedFinish: i * (distanceOfTrack / totalDist),
                cadence: totalMovingCadence / increment,
                elevation: rawGPXPoints[i].elev,
                incline: (totalInstElevGain / totalInstDist) * 100
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
                distance: (totalDist / 5280).toFixed(3) + "mi",
                pace: convertToHMS(i / (totalDist / 5280), 2) + "/mi",
                instantaneousPace: convertToHMS(increment / (totalInstDist / 5280), 2) + "/mi",
                movingPace: convertToHMS(movPace, 2) + "/mi",
                projectedFinish: convertToHMS(i * (distanceOfTrack / totalDist)),
                splitPrediction: splits[currentSplitIndex].label + " - " + convertToHMS(i * (splits[currentSplitIndex].distance / totalDist)),
                cadence: (totalMovingCadence / increment).toFixed(1) + " spm",
                elevation: (rawGPXPoints[i].elev).toFixed(1) + "ft",
                incline: ((totalInstElevGain / totalInstDist) * 100).toFixed(2) + "%"
            })
            totalInstDist = 0
            totalMovingCadence = 0
            totalInstElevGain = 0
        }
    }

    console.log(rawDataList)

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
}