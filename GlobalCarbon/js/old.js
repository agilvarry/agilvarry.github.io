//Create the Leaflet map
function createMap(){
  var myMap = L.map('map').setView([40.76, -111.89], 3);


  L.tileLayer('https://api.mapbox.com/styles/v1/agilvarry/cjapm97ck36sh2rqoibdx95g5/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYWdpbHZhcnJ5IiwiYSI6ImNqNmZqaWV6dTBoYXAzMm11NDJhbmFsaW0ifQ.XaYLUqcCpgz6Y17ygK4lZA',{
    minZoom: 3,
    maxZoom: 16
  }).addTo(myMap);

  myMap.locate({setView: true, maxZoom: 16});

  getData(myMap);
};

// function onEachFeature(feature, layer) {
//   //no property named popupContent; instead, create html string with all properties
//   var popupContent = "";
//   if (feature.properties) {
//     //loop to add feature property names and values to html string
//     for (var property in feature.properties){
//       popupContent += "<p>" + property + ": " + feature.properties[property] + "</p>";
//     }
//     layer.bindPopup(popupContent);
//   };
// };

function pointToLayer(feature, latlng, attributes){
  //create marker options
  var marker = {
    radius: 8,
    fillColor: "#ff7800",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
  };
  //Determine which attribute to visualize with proportional symbols
  var attribute = attributes[0];
  //For each feature, determine its value for the selected attribute
  var attValue = feature.properties[attribute];
  //Give each feature's circle marker a radius based on its attribute value
  marker.radius = calcPropRadius(attValue);
  //create circle marker layer
  var layer = L.circleMarker(latlng, marker);
  //create popup
  createPopup(feature.properties, attribute, layer, marker.radius);
  //event listeners to open popup on hover
  layer.on({
    mouseover: function(){
      this.openPopup();
    },
    mouseout: function(){
      this.closePopup();
    }
  });
  //return the circle marker to the L.geoJson pointToLayer option
  return layer;
};

//create popup content
function createPopup(properties, attribute, layer, radius){
    //add city to popup content string
    var popupContent = "<p><b>Country:</b> " + properties.Country + "</p>";
    //add formatted attribute to panel content string
    var year = attribute.split("_")[0];
    popupContent += "<p><b>Carbon output in " + year + ":</b> " + properties[attribute] + " pounds</p>";
    //need to add offset but example in lecture doesn't work, or add a separate panel for imformation
    //event listeners to open popup on hover
    //if i can't fix this we don't actually need the radius
    layer.bindPopup(popupContent);
};

//updates the popup info when you click through time
function updatePropSymbols(map, attribute){
  map.eachLayer(function(layer){
    if (layer.feature && layer.feature.properties[attribute]){
      //access feature properties
      var props = layer.feature.properties;
      //update each feature's radius based on new attribute values
      var radius = calcPropRadius(props[attribute]);
      layer.setRadius(radius);
      //add city to popup content string
      createPopup(props, attribute, layer, radius);
    };
  });
};

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
  //scale factor to adjust symbol size evenly
  var scaleFactor = .005;
  //area based on attribute value and scale factor
  var area = attValue * scaleFactor;
  //radius calculated based on area
  var radius = Math.sqrt(area/Math.PI);
  return radius;
};

//Add circle markers for point features to the map
function createPropSymbols(data, map, attributes){
  //create a Leaflet GeoJSON layer and add it to the map
  L.geoJson(data, {
    pointToLayer: function(feature, latlng){
      return pointToLayer(feature, latlng, attributes);
    }
  }).addTo(map);
};

//Create new sequence controls within map
function createSequenceControls(map, attributes){

  var SequenceControl = L.control({ position: 'bottomleft'} );

    SequenceControl.onAdd = function(map) {

      var slider = L.DomUtil.create("input", "range-slider");

      L.DomEvent.on(slider, 'mousedown dblclick pointerdown', function(e) {
        console.log("down");
        L.DomEvent.stopPropagation(e);
      });

      $(slider)
        .attr({'type':'range', 'max': 15, 'min': 0, 'step': 1,'value': 0})
            .on('input change', function() {
              var index = $(this).val();
              updateLegend(map, attributes[index]);
              updatePropSymbols(map, attributes[index]);
            });

            L.DomEvent.addListener(slider, 'input', function(e) {
              L.DomEvent.stopPropagation(e);


            });
      return slider;
    }

  // var SequenceControl = L.Control.extend({
  //       options: {
  //           position: 'bottomleft'
  //       },
  //
  //       onAdd: function (map) {
  //           // create the control container div with a particular class name
  //           var container = L.DomUtil.create('div', 'sequence-control-container');
  //
  //           // ... initialize other DOM elements, add listeners, etc.
  //
  //           //set slider attributes
  //           $('.range-slider').attr({
  //             max: 15,
  //             min: 0,
  //             value: 0,
  //             step: 1
  //           });
  //           //click listener for buttons
  //           // $('.skip').click(function(){
  //           //   //get the old index value
  //           //   var index = $('.range-slider').val();
  //           //   //increment or decrement depending on button clicked
  //           //   if ($(this).attr('id') == 'forward'){
  //           //     index++;
  //           //     //if past the last attribute, wrap around to first attribute
  //           //     index = index > 15 ? 0 : index;
  //           //   } else if ($(this).attr('id') == 'reverse'){
  //           //     index--;
  //           //     //Step 7: if past the first attribute, wrap around to last attribute
  //           //     index = index < 0 ? 15 : index;
  //           //   };
  //           //   //update slider
  //           //   $('.range-slider').val(index);
  //           //   updatePropSymbols(map, attributes[index]);
  //           // });
  //           //Resize proportional symbols according to new attribute values
  //           //input listener for slider
  //           $('.range-slider').on('input', function(){
  //             //sequence
  //             var index = $(this).val();
  //             console.log(index);
  //             updatePropSymbols(map, attributes[index]);
  //           });
  //             //add container to the map
  //            $(container).append('<input class="range-slider" type="range">');
  //
  //            //kill any mouse event listeners on the map
  //           $(container).on('mousedown dblclick', function(e){
  //               L.DomEvent.stopPropagation(e);
  //           });
  //
  //           return container;
  //       }
  //   });
    //   map.addControl(new SequenceControl());

    SequenceControl.addTo(map);
};

function createLegend(map, attributes){
    var LegendControl = L.control({ position: 'bottomright'} );

        LegendControl.onAdd = function (map) {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');
          //PUT YOUR SCRIPT TO CREATE THE TEMPORAL LEGEND HERE
          var legend = L.DomUtil.create('div', 'timestamp-container');
          //add temporal legend div to container
          $(container).append(legend);

          //start attribute legend svg string
        var svg = '<svg id="attribute-legend" width="230px" height="230px">';


        //array of circle names to base loop on
        var circles = ["max", "mean", "min"];

        //Step 2: loop to add each circle and text to svg string
        for (var i=0; i<circles.length; i++){
            //circle string
            svg += '<circle class="legend-circle" id="' + circles[i] +
            '" fill="#F47821" fill-opacity="0.8" stroke="#000000" cx="115"/>';
            //text string
            svg += '<text class="circle-text" id="' + circles[i] + '-text" x="90"></text>';
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
    var min = Infinity,
        max = -Infinity;

    map.eachLayer(function(layer){
        //get the attribute value
        if (layer.feature){
            var attributeValue = Number(layer.feature.properties[attribute]);

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
    var mean = (max + min) / 2;

    //return values as an object
    return {
        max: max,
        mean: mean,
        min: min
    };
};

function updateLegend(map, attribute){
    var year = attribute.split("_")[0];
    var content = "<b>Carbon year:</b> " + year;
    $(".timestamp-container").html(content);
    //get the max, mean, and min values as an object
var circleValues = getCircleValues(map, attribute);
for (var key in circleValues){
       //get the radius
       var radius = calcPropRadius(circleValues[key]);

       //Step 3: assign the cy and r attributes
       $('#'+key).attr({
           cy: 230 - radius,
           r: radius
       });
       $('#'+key+'-text').attr({
           y: 230 - radius*2
       });
       $('#'+key+'-text').text(Math.round(circleValues[key]) + " pounds");

   };

};

//build an attributes array from the data
function processData(data){
  //empty array to hold attributes
  var attributes = [];

  //properties of the first feature in the dataset
  var properties = data.features[0].properties;

  for (var attribute in properties){
    //only take attributes with population values
    if (attribute.indexOf("1") === 0 || attribute.indexOf("1") === 5){
      attributes.push(attribute);
    };
  };
  //check result
  console.log(attributes);
  return attributes;
};

//Import GeoJSON data
function getData(map){
  //load the data
  $.ajax("doc/Total_Carbon_Countries.geojson", {
    dataType: "json",
    success: function(response){
      //create an attributes array
      var attributes = processData(response);
      //call function to create proportional symbols
      createPropSymbols(response, map, attributes);
      createSequenceControls(map, attributes);
      createLegend(map, attributes);
    }
  });
};
$(document).ready(createMap);
