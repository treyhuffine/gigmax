//https://github.com/bmorelli25/JavaScript-HeatMap-Creator/blob/master/index.html
const axios = require('axios');
const fs = require('fs');

const API_KEY='AIzaSyBN6ZGt3-5bZdvyIsYSYFZtcsq9dBduZ7g';
const deliveries = JSON.parse( fs.readFileSync('./deliveries-data.json') )

function convertDeliveriesToLatLongWeight(json) {
  gMapsFormattedData = [];
  for (var i = 0; i < json.items.length ; i++) {
    var address = encodeURI( json.items[i].startingPoint );   
    var weight = json.items[i].tip;
    addressToGpsCoordinates(address) 
      .then(data => {
        var entry = {
          location: new google.maps.LatLng(data.lat, data.lng),
          weight: weight
        };
        gMapsFormattedData.push(entry);
       
      })
      .catch(error => {
        console.log(error);
      });

  }

  return gMapsFormattedData;
  
}



function addressToGpsCoordinates(address) {
  var GEOCODING_URL = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${API_KEY}`

  return getHttpResponse(GEOCODING_URL)
    .then(gpsData => {
      return gpsData;
    })
    .catch(error => {
      console.log(error);
    });
}

function getHttpResponse(url) {
  return axios.get(url)
    .then(response => {
      var gpsData = response.data.results[0].geometry.location;
      return gpsData;
    })
    .catch(error => {
      console.log(error);
    });
}

function writeDataToFile(data) {
  fs.writeFile('deliveriesFormattedForGmaps.json', data, (err) => {
      // throws an error, you could also catch it here
      if (err) throw err;
  
      // success case, the file was saved
      console.log('success!');
  });
}
writeDataToFile( convertDeliveriesToLatLongWeight(deliveries) );
