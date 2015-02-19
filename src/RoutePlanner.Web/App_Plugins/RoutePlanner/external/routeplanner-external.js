// The javascript used for the webpage part of the routeplanner.
// The RoutePlanner.settings object will look like this, and is rendered through an htmlhelper @Umbraco.GetRouteJs
//RoutePlanner.settings = {
//    map,
//    routeLine,
//    contentId,
//    divId,
//    propertyAlias,
//    strokeColor,
//    strokeOpacity,
//    strokeWeight,
//    lat,
//    lng,
//    zoom,
//    fitBounds
//}

if (RoutePlanner.settings) {
    RoutePlanner.functions = {
        init: function () {
            google.maps.event.addDomListener(window, 'load', RoutePlanner.functions.initialize);
        },
        initialize: function () {
            var mapOptions = {
                center: { lat: RoutePlanner.settings.lat, lng: RoutePlanner.settings.lng },
                zoom: RoutePlanner.settings.zoom,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };
            RoutePlanner.settings.map = new google.maps.Map(document.getElementById(RoutePlanner.settings.divId),
                mapOptions);
            RoutePlanner.functions.showRoute(RoutePlanner.settings.contentId, RoutePlanner.settings.propertyAlias);
        },
        showRoute: function (id, propertyAlias) {
            jQuery.ajax({
                type: 'GET',
                url: '/umbraco/api/routeplanner/getroute',
                data: { id: id, propertyAlias: propertyAlias }
            }).done(function (data) {
                var bounds = new google.maps.LatLngBounds();
                var routeCoordinates = [];
                for (var i = 0; i < data.Coordinates.length; i++) {
                    var latLng = null;
                    latLng = new google.maps.LatLng(data.Coordinates[i].latLng.k, data.Coordinates[i].latLng.D);
                    routeCoordinates.push(latLng);
                    bounds.extend(latLng);
                }
                if (RoutePlanner.settings.routeLine)
                    RoutePlanner.settings.routeLine.setMap(null);
                RoutePlanner.settings.routeLine = new google.maps.Polyline({
                    path: routeCoordinates,
                    geodesic: true,
                    strokeColor: RoutePlanner.settings.strokeColor,
                    strokeOpacity: RoutePlanner.settings.strokeOpacity,
                    strokeWeight: RoutePlanner.settings.strokeWeight
                });
                RoutePlanner.settings.routeLine.setMap(RoutePlanner.settings.map);
                if(RoutePlanner.settings.fitBounds)
                    RoutePlanner.settings.map.fitBounds(bounds);
            });
        }
    }
    RoutePlanner.functions.init();
}