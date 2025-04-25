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
GPXArray.forEach((item) => {
    if (item.includes("<trkpt")) {
        GPXData.push({
            lat: Number(item.substring(item.indexOf('lat=')+5, item.indexOf('" lon='))), 
            long: Number(item.substring(item.indexOf('lon=')+5, item.indexOf('">'))), 
        })
    }

    if (item.includes("<gpxtpx:cad>")) {
        cadenceData.push(Number(item.substring(item.indexOf('<gpxtpx:cad>')+12, item.indexOf('</gpxtpx:cad>')))*2)
    }
})


for (let i = 0; i < GPXData.length; i++) {
    GPXData[i].cadence = cadenceData[i]
}

console.log(GPXData)


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
    {label: '5K', distance: 3.107},
    {label: '10K', distance: 6.214},
    {label: '15K', distance: 9.320},
    {label: '10mi', distance: 10},
    {label: '20K', distance: 12.427},
    {label: 'HM', distance: 13.109},
    {label: '30K', distance: 18.640},
    {label: '40K', distance: 24.856},
    {label: 'M', distance: 26.218},
    {label: 'whatevercomesafter26.2', distance: 31.1},
]

let currentSplitIndex = 0

let totalDist = 0
let totalMovingDist = 0
let totalMovingCadence = 0
let distanceOfTrack = 0
let increment = 15
let rawDataList = []
let displayDataList = []

for (let i = 0; i < GPXData.length-1; i++) {
    let dist = haversineDistanceFT(GPXData[i].lat, GPXData[i].long, GPXData[i+1].lat, GPXData[i+1].long);
    distanceOfTrack += dist
}

for (let i = 0; i < GPXData.length-1; i++) {
    let dist = haversineDistanceFT(GPXData[i].lat, GPXData[i].long, GPXData[i+1].lat, GPXData[i+1].long);
    
    totalDist += dist
    totalMovingDist += dist
    totalMovingCadence += GPXData[i+1].cadence

    if (i % increment == 0 && i > 0) {
        // every X seconds
        rawDataList.push({
            time: i,
            distance: (totalDist / 5280),
            pace: i / (totalDist / 5280),
            instPace: increment / (totalMovingDist / 5280),
            projFinish: i * (distanceOfTrack / totalDist),
            cadence: totalMovingCadence / increment
        })

        if (totalDist > splits[currentSplitIndex].distance * 5280) {
            currentSplitIndex++;
        }

        displayDataList.push({
            time: convertToHMS(i),
            distance: (totalDist / 5280).toFixed(3),
            pace: convertToHMS(i / (totalDist / 5280), 2) + "/mi",
            instPace: convertToHMS(increment / (totalMovingDist / 5280), 2) + "/mi",
            projFinish: convertToHMS(i * (distanceOfTrack / totalDist)),
            splitPrediction: splits[currentSplitIndex].label + " - " + convertToHMS(i * (splits[currentSplitIndex].distance * 5280 / totalDist)),
            cadence: (totalMovingCadence / increment).toFixed(1) + " spm"
        })
        totalMovingDist = 0
        totalMovingCadence = 0
    }
}

displayDataList.forEach((item) => {
    const trow = document.createElement('tr')
    Object.keys(item).forEach((key) => {
        let cell = document.createElement('td')
        cell.innerHTML = item[key]
        trow.appendChild(cell)
    })
    document.getElementById('data').appendChild(trow)
})