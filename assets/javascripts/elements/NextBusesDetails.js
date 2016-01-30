var $ = require('jquery-browserify'),
    ApiService = require("../services/ApiService"),
    moment = require("moment");

function NextBusesDetails(rootDomElement) {
    this.apiService = new ApiService("/api/");
    this.rootDomElement = $(rootDomElement);
    this.stationTextElement = $(this.rootDomElement).find(".text");
    this.infoMessageElement = $(this.rootDomElement).find(".message");
    this.infoMessageElementText = $(this.infoMessageElement).find("p");
    this.stationRefreshElement = $(this.rootDomElement).find(".refresh");
    this.listElement = $(this.rootDomElement).find(".content");
    this.stationSelected = null;
    
    this.refreshing = false;
    
    var _this = this;
    
    $(this.stationRefreshElement).click(function() {
        _this.refreshSelectedStation();
    });
    
    this.fetchAndDisplayList = function () {
        var _this = this;

        if (this.stationSelected !== null) {
            var stationAtCall = _this.stationSelected;
            $(_this.stationRefreshElement).addClass("fa-spin");

            this.apiService.getStationsRealTimeData(stationAtCall.atcoCode, function (err, details) {
                if (stationAtCall === _this.stationSelected) {
                    $(_this.listElement).html("");

                    if (details && details.length > 0) {
                        _this.infoMessageElement.hide();
                        for (var i = 0; i < details.length; i++) {
                            $(_this.listElement).append(buildListItem(details[i]));
                        }
                    } else {
                        _this.infoMessageElementText.text("Not any information available for this station at the moment");
                        _this.infoMessageElement.show();
                    }
                    $(_this.stationRefreshElement).removeClass("fa-spin");
                    _this.refreshing = false;
                }
            });
        }
    }
}

function buildListItem(details) {
    return "<li class='result'><span class='time'>" + moment(details.arrivalTime).format('H:mm') + "</span><span class='bus'>" + details.line + "</span> - <span class='destination'>" + details.destination + "</span></li>";
}

NextBusesDetails.prototype.setSelectedStation = function(station, details) {
    var _this = this;
    
    $(_this.listElement).html("");
    
    if (station === null) {
        this.stationSelected = null;
        this.rootDomElement.addClass("noselection");
        this.stationTextElement.text("No station selected");
        this.infoMessageElementText.text("Please select a station on the map");
        this.infoMessageElement.show();
        this.stationRefreshElement.hide();
    } else {
        this.stationSelected = station;
        this.rootDomElement.removeClass("noselection");
        this.stationTextElement.text(station.name + " (" + station.indicator + ")");
        this.stationRefreshElement.show();
        this.infoMessageElementText.text("Loading next buses...");
        this.infoMessageElement.show();
        this.fetchAndDisplayList();
    }
};

NextBusesDetails.prototype.refreshSelectedStation = function() {
    
    if (this.refreshing) {
        return;
    }
    
    this.refreshing = true;
    
    this.fetchAndDisplayList();
};

module.exports = NextBusesDetails;