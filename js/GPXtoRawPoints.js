const GPXData = []

document.getElementById('gpxFileInput').addEventListener('change', function (evt) {
    const file = evt.target.files[0];
    if (!file) {
        alert("Error reading file")
    } else {
        console.log("done")
        const reader = new FileReader();
        
        // thank you chatGPT
        reader.onload = function () {
            const gpxText = reader.result;
            const p = new DOMParser() ;
            const gpxDocument = p.parseFromString(gpxText, "text/xml")
            const trkpts = gpxDocument.getElementsByTagName('trkpt');

            for (let i = 0; i < trkpts.length; i++) {
                let obj = {}
                obj.lat = trkpts[i].getAttribute('lat');
                obj.long = trkpts[i].getAttribute('lon');
                obj.elev = Number(trkpts[i].getElementsByTagName('ele')[0]?.textContent)*3.28;
                obj.currPointTime = Date.parse(new Date(trkpts[i].getElementsByTagName('time')[0]?.textContent))/1000;
                obj.cadence = Number(trkpts[i].getElementsByTagName('gpxtpx:cad')[0]?.textContent)*2;
                
                if (i == 0) {
                    obj.timeFromPreviousPoint = null
                } else {
                    obj.timeFromPreviousPoint = obj.currPointTime - GPXData[GPXData.length - 1].currPointTime
                }
                GPXData.push(obj)
            }
            processRawPoints(GPXData) // call on the processing function in rawPointsProcess.js.
        }

        reader.readAsText(file)
    }
})

