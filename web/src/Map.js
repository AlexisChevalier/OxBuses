var $ = require('jquery-browserify'),
    ApiClient = require("./ApiClient"),
    MarkerClusterer = require("../libs/MarkerClusterer"),
    InfoBox = require("../libs/InfoBox");

function Map(lat, lng, mapDomElement, nextBusesDetailsObject) {
    this.nextBusesDetailsObject = nextBusesDetailsObject;
    this.lat = lat;
    this.lng = lng;
    this.mapDomElement = mapDomElement;
    this.mapObject = null;
    this.markerCluster = null;
    this.currentInfoBox = null;
    this.markers = [];
    this.apiClient = new ApiClient("http://localhost:8080/api/");
    this.markerImage = {
        url: 'img/station.png',
        size: new google.maps.Size(20, 20),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(10, 10)
    };
    
    this.initializeMap = function initializeMap() {
        var _this = this;
        this.mapObject = new google.maps.Map(this.mapDomElement, {
            center: { 
                lat: this.lat,
                lng: this.lng
            },
            zoom: 18,
            styles: [
                {
                    featureType: "transit.station.bus",
                    stylers: [
                        {
                            visibility: "off"
                        }
                    ]
                }
            ],
            streetViewControl: false,
            mapTypeControlOptions: {
                mapTypeIds: []
            }
        });

        this.initializeMarkers(function(result) {
            _this.MarkerCluster = new MarkerClusterer(_this.mapObject, _this.markers, {
                gridSize: 50, 
                maxZoom: 15
            }); 
        });
    };
    
    this.initializeMarkers = function initializeMarkers(callback) {
        var _this = this;
        this.apiClient.getStations(function(err, result) {
            var stations = result.stops;
            for (var index in stations) {
                (function(id) {
                    var position = {
                        lat: parseFloat(stations[id].lat),
                        lng: parseFloat(stations[id].long)
                    };

                    var marker = new google.maps.Marker({
                        position: position,
                        map: _this.mapObject,
                        title: stations[id].name + " (" + stations[id].indicator + ")",
                        icon: _this.markerImage
                    });
                    
                    var infoWindowContent = $([
                        "<div>",
                        "<div class='content'>",
                        stations[id].name, 
                        " (",
                        stations[id].indicator,
                        ")",
                        "</div>",
                        "<div class='icon close'>",
                        "<i class='fa fa-times fa-fw'></i>",
                        /*"<div class='icon favorite'><i class='fa fa-star-o fa-fw'></i></div>",*/
                        "</div>",
                        "</div>"
                    ].join(''));
                    
                    infoWindowContent.find(".close").on('click', function() {
                        _this.onMarkerClosedManually();
                    });

                    var boxOptions = {
                        disableAutoPan: false,
                        maxWidth: 0,
                        pixelOffset: new google.maps.Size(-140, 9),
                        zIndex: null,
                        boxClass: "infobox",
                        closeBoxMargin: "",
                        closeBoxURL: "",
                        infoBoxClearance: new google.maps.Size(1, 1),
                        isHidden: false,
                        pane: "floatPane",
                        enableEventPropagation: false
                    };

                    var infoBox = new InfoBox(boxOptions);
                    
                    infoBox.setContent(infoWindowContent.get(0));

                    marker.addListener('click', function() {
                        _this.onMarkerSelected(marker, infoBox, stations[id]);
                    });

                    _this.markers.push(marker);  
                }(index));
            }
            callback(true);
        });
    };
    
    this.onMarkerClosedManually = function() {
        this.nextBusesDetailsObject.setSelectedStation(null);
        
        if (this.currentInfoBox !== null) {
            this.currentInfoBox.close();
            this.currentInfoBox = null;
        }
    }
    
    this.onMarkerSelected = function(marker, infoBox, station) {
        
        this.nextBusesDetailsObject.setSelectedStation(station);
        
        if (this.currentInfoBox !== null) {
            this.currentInfoBox.close();
            this.currentInfoBox = null;
        }

        this.currentInfoBox = infoBox;

        infoBox.open(this.mapObject, marker);
        
        this.mapObject.panTo(marker.position);
    };
    
    this.initializeMap();
}

Map.prototype.getGoogleMapsObject = function() {
    return this.mapObject;
};

module.exports = Map;