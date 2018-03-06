//Create the Leaflet map
function createMap(){
//make map and layer variables
let myMap = L.map('map').setView([51.1657, 10.4515], 4);
let total = new L.geoJson().addTo(myMap);
let capita = new L.geoJson();

//create layer object for switching
let dataLayers={
  "Total Carbon": total,
  "Per Capita Carbon": capita
}
//filler variable for toggleable layers option
let none;
//functions to create layers
getCapitaData(myMap, capita, total);
getTotalData(myMap, total);
//set basemap
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
	       attribution: 'Tiles &copy; Esri; Data: MDGI'
    }).addTo(myMap);

myMap.locate({setView: true, maxZoom: 10, minZoom: 4});
//add layer toggle to map
L.control.layers(dataLayers, none, {collapsed:false}).addTo(myMap);
};

function pointToLayer(feature, latlng, attributes){
//initial marker symbol properties
let marker = {
  radius: 8,
  fillColor: "#31a354",
  color: "#f5f5f5",
  weight: 1,
  opacity: 1,
  fillOpacity: 0.8
};
//Determine which attribute to visualize with proportional symbols
let attribute = attributes[0];
//For each feature, determine its value for the selected attribute
let attValue = feature.properties[attribute];

//check if per capita series, if so multiply attValue so it shows on the map
if(feature.properties["SeriesCode"] === 751){
  attValue *=400000;
}

//Give each feature's circle marker a radius based on the  scaled attribute value
marker.radius = calcPropRadius(attValue);
//create circle marker layer
let layer = L.circleMarker(latlng, marker);
//create popup
createPopup(feature.properties, attribute, layer, marker.radius);
//event listeners to open popup on hover
layer.on({
  mouseover: function(e){
    this.openPopup();
  },
  mouseout: function(e){
    this.closePopup();
  }
});
//return the circle marker
return layer;
};

//create popup content
function createPopup(properties, attribute, layer, radius){
//add city to popup content string
let popupContent = "<p><b>Country:</b> " + properties.Country + "</p>";
//add formatted attribute to panel content string
let year = attribute.split("_")[0];
if(properties.SeriesCode===751){
  popupContent += "<p><b>CO2 per capita in " + year + ":</b> " + properties[attribute] + " pounds</p>";
} else{
  popupContent += "<p><b>Total CO2 in " + year + ":</b> " + properties[attribute] + " pounds</p>";
}
//add content to the popup and function to have it show up outside the popup to avoid wierd behavior
layer.bindPopup(popupContent, {
      offset: new L.Point(0,-(radius-7))
  });
};

//updates the popup info when you click through time
function updatePropSymbols(map, attribute){
//for each feature in the map layer
map.eachLayer(function(layer){
  //if the feature exists and has properties
  if (layer.feature && layer.feature.properties[attribute]){
    //access feature properties
    let props = layer.feature.properties;
    //update each feature's radius based on new attribute values
    let attValue = props[attribute];
    //check if per capita series, if so multiply attValue so it shows on the map
    if(props["SeriesCode"] === 751){
      attValue *=400000;
    }
    //calulate and set the radius and
    let radius = calcPropRadius(attValue);
    layer.setRadius(radius);
    //add info to popup content string
    createPopup(props, attribute, layer, radius);
  };
});
};

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
//scale factor to being the symbol size way down
let scaleFactor = .002;
//area based on attribute value and scale factor
let area = attValue * scaleFactor;
//radius calculated based on area
let radius = Math.sqrt(area/Math.PI);
return radius;
};

//Add circle markers for point features to the map
function createTotalSymbols(data, total, attributes){
//create a Leaflet GeoJSON layer and add it to the map
L.geoJson(data, {
  pointToLayer: function(feature, latlng){
    return pointToLayer(feature, latlng, attributes);
  }
}).addTo(total);
};

//Add circle markers for point features to the map
function createCapitaSymbols(data, capita, attributes){
//create a Leaflet GeoJSON layer and add it to the map
L.geoJson(data, {
  pointToLayer: function(feature, latlng){
    return pointToLayer(feature, latlng, attributes);
  }
}).addTo(capita);
};

//Create new sequence controls within map
function createSequenceControls(map, capita, total, attributes){
let SequenceControl = L.control({ position: 'bottomleft'} );
SequenceControl.onAdd = function(map) {
  // create the control container with a particular class name
  let container = L.DomUtil.create('div', 'sequence-container');
  //create timestamp container
  let stamp = L.DomUtil.create('div', 'timestamp-container');
  //create slider and buttons to progress time, add to container
  let slider = L.DomUtil.create("input", "range-slider");
  let forward = L.DomUtil.create("button", "skip");
  let back = L.DomUtil.create("button","skip");
  $(forward).text("Forward");
  $(back).text("Back");
  $(container).append(stamp).append(slider).append(back).append(forward);
  //stop the map from being dragged aroundwhen you interact with the slider
  L.DomEvent.on(container, 'mousedown touchstart touchmove dblclick pointerdown', function(e) {
    L.DomEvent.stopPropagation(e);
  });
  //index tracking variable
  let index = 0;

  //selector for the year slider
  $(slider)
  //set attributes
  .attr({'type':'range', 'max': 17, 'min': 0, 'step': 1,'value': 0})
  .on('input change', function() {
    index = $(this).val();
    updateLegend(map, attributes[index]);
    updatePropSymbols(map, attributes[index]);
  });
  //update index, legend, and map symbols from slider
  $(forward).on("click", function(){
       index++
       //cycle index around if we click forward at the edge of timetamp
       index = index > 17 ? 0 : index;
     $('.range-slider').val(index);
     updateLegend(map, attributes[index]);
     updatePropSymbols(map, attributes[index]);
  });
  $(back).on("click", function(){
     index--;
        //cycle index around if we click backward at the edge of timetamp
       index = index < 0 ? 17 : index;
     $('.range-slider').val(index);
     updateLegend(map, attributes[index]);
     updatePropSymbols(map, attributes[index]);
  });
  updateLegend(map, attributes[index]);
  return container;

}
SequenceControl.addTo(map);
};

function createLegend(map, attributes){
let LegendControl = L.control({ position: 'bottomright'} );
LegendControl.onAdd = function (map) {
  // create the control container with a particular class name
  let container = L.DomUtil.create('div', 'legend-control-container');
  let title = L.DomUtil.create('div', 'title-container');
  $(container).append(title);
  //start attribute legend svg string
  let svg = '<svg id="attribute-legend" width="160px" height="160px">';

  //array of circle names to base loop on
  let circles = ["max", "mean", "min"];

  //add each circle and text to svg string
  for (let i=0; i<circles.length; i++){
    //circle string
    svg += '<circle class="legend-circle" id="' + circles[i] +
    '" fill="#31a354" fill-opacity="0.8" stroke="#f5f5f5" cx="75"/>';
    //text string
    svg += '<text class="circle-text" id="' + circles[i] + '-text" x="60"></text>';
  };
  //close svg string
  svg += "</svg>";
  //add attribute legend svg to container
  $(container).append(svg);
  //$(legend).append('<div id="timestamp-container">');
  return container;
}
LegendControl.addTo(map);
updateLegend(map, attributes[0]);

};

//Calculate the max, mean, and min values for a given attribute
function getCircleValues(map, attribute){
//start with min at highest possible and max at lowest possible number
let min = Infinity,
max = -Infinity;
//base change listener that ensures updated circle labels
  map.on("baselayerchange", function(){
    updateLegend(map, attribute);
    updatePropSymbols(map, attribute);
  });
map.eachLayer(function(layer){
  //get the attribute value
  if (layer.feature){
    let attributeValue = Number(layer.feature.properties[attribute]);
    //check if per capita series, if so multiply attValue so it shows on the map
    if(layer.feature.properties["SeriesCode"] === 751){
      attributeValue *=400000;
    }
    //test for min
    if (attributeValue < min){
      min = attributeValue;
    };
    //test for max
    if (attributeValue > max){
      max = attributeValue;
    };
  };
});
//set mean
let mean = (max + min) / 2;
//return values as an object
return {
  max: max,
  mean: mean,
  min: min
};
};

function updateLegend(map, attribute){
//extract year from attribute name
let year = attribute.split("_")[0];
//make year label
let content = "<b>Carbon year:</b> " + year;
//add it to the timestap container as html tag
$(".timestamp-container").html(content);
//interate overr every feature
map.eachLayer(function(layer){
  //get the attribute value
  if (layer.feature){
    //set legelnd title to current series
    $(".title-container").html(layer.feature.properties["Series"]);
  };
});
//set title of current series to letiable for later
let code = $(".title-container").text();
//get the max, mean, and min values as an object
let circleValues = getCircleValues(map, attribute);
for (let key in circleValues){
  //get the radius
  let radius = calcPropRadius(circleValues[key]);
  //assign the cy and r attributes
  $('#'+key).attr({
    cy: 160 - radius,
    r: radius
  });
  //assign label text position
  $('#'+key+'-text').attr({
    y: 160 - (radius*2)-4
  });
  //check if value is per capita and needs de-scaling for label
  if(code ==="Per Capita CO2"){
    let val =Math.round(circleValues[key]);
    $('#'+key+'-text').text((val/400000) + " pounds");
  }else{
    $('#'+key+'-text').text(Math.round(circleValues[key]) + " pounds");
  }
};
};

//build an attributes array from the data
function processData(data){
//empty array to hold attributes
let attributes = [];
//properties of the first feature in the dataset
let properties = data.features[0].properties;
for (let attribute in properties){
  //only take attributes with population values
  if (attribute.indexOf("1") === 0 || attribute.indexOf("1") === 5 || attribute.indexOf("0") === 1){
    attributes.push(attribute);
  };
};
return attributes;
};

//Import GeoJSON data
function getTotalData(map, total){
//load the data
$.ajax("doc/Total_Carbon_Countries.geojson", {
  dataType: "json",
  success: function(response){
    //create an attributes array
    let attributes = processData(response);
    //call function to create proportional symbols
    createTotalSymbols(response, total, attributes);
    //createSequenceControls(map, attributes);
    createLegend(map, attributes);
  }
});
};
function getCapitaData(map, capita, total){
//load the data
$.ajax("doc/PerCapita_Carbon_Countries.geojson", {
  dataType: "json",
  success: function(response){
    //create an attributes array
    let attributes = processData(response);
    //call function to create proportional symbols
    createCapitaSymbols(response, capita, attributes);
    //create the controls for timestamp
    createSequenceControls(map, capita, total, attributes);
  }
});
};
$(document).ready(createMap);
