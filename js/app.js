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
const GPXCoords = []
GPXArray.forEach((item) => {
    if (item.includes("<trkpt")) {
        GPXCoords.push({
            lat: Number(item.substring(item.indexOf('lat=')+5, item.indexOf('" lon='))), 
            long: Number(item.substring(item.indexOf('lon=')+5, item.indexOf('">'))), 
        })
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
    {label: '5K', distance: 3.107},
    {label: '10K', distance: 6.214},
    {label: '15K', distance: 9.320},
    {label: '10mi', distance: 10},
    {label: '20K', distance: 12.427},
    {label: 'HM', distance: 13.109},
    {label: 'M', distance: 26.218},
]

let currentSplitIndex = 0

console.log(GPXCoords)
let totalDist = 0
let totalMovingDist = 0
let distanceOfTrack = 0
let increment = 15

for (let i = 0; i < GPXCoords.length-1; i++) {
    let dist = haversineDistanceFT(GPXCoords[i].lat, GPXCoords[i].long, GPXCoords[i+1].lat, GPXCoords[i+1].long);
    distanceOfTrack += dist

}


for (let i = 0; i < GPXCoords.length-1; i++) {
    let dist = haversineDistanceFT(GPXCoords[i].lat, GPXCoords[i].long, GPXCoords[i+1].lat, GPXCoords[i+1].long);
    console.log(dist)
    
    totalDist += dist
    totalMovingDist += dist
    if (i % increment == 0) {
        // every X seconds
        const trow = document.createElement('tr')

        let cell = document.createElement('td')
        cell.innerHTML = convertToHMS(i, 0)
        trow.appendChild(cell)

        cell = document.createElement('td')
        cell.innerHTML = (totalDist / 5280).toFixed(3)
        trow.appendChild(cell)

        cell = document.createElement('td')
        cell.innerHTML = convertToHMS(i / (totalDist / 5280), 2) + "/mi"
        trow.appendChild(cell)

        cell = document.createElement('td')
        cell.innerHTML = convertToHMS(increment / (totalMovingDist / 5280), 2) + "/mi"
        trow.appendChild(cell)

        cell = document.createElement('td')
        cell.innerHTML = convertToHMS(i * (distanceOfTrack / totalDist))
        trow.appendChild(cell)

        cell = document.createElement('td')
        if (totalDist > splits[currentSplitIndex].distance * 5280) {
            currentSplitIndex++;
        }
        cell.innerHTML = splits[currentSplitIndex].label + " - " + convertToHMS(i * (splits[currentSplitIndex].distance * 5280 / totalDist))
        trow.appendChild(cell)

        document.getElementById('data').appendChild(trow)
        totalMovingDist = 0
    }
}