angular.module("umbraco")
    .controller("routeplanner",
        function ($scope, $timeout, $document, assetsService, notificationsService) {


            $scope.map = null;
            $scope.drawing = false;
            $scope.googlemapsloaded = false;
            $scope.directionsService = null;
            $scope.currentIndex = 0;
            $scope.showDebug = $scope.model.config.showDebug;
            $scope.pointMarkerUrl = $scope.model.config.pointMarker;
            if ($scope.pointMarkerUrl == null)
                $scope.pointMarkerUrl = "/app_plugins/routeplanner/propertyeditors/u-circle.png";
            $scope.pointMarkerSize = 10;
            if ($scope.model.config.pointMarkerSize) {
                $scope.pointMarkerSize = parseInt($scope.model.config.pointMarkerSize);
            }
            $scope.pointMarkerSizeHalf = Math.floor($scope.pointMarkerSize / 2);
            $scope.strokeColor = $scope.model.config.strokeColor;
            if ($scope.strokeColor == null || $scope.strokeColor == "")
                $scope.strokeColor = "#f36f25";


            // the model to save
            $scope.markerModel = {
                // this will contain all points along the path, this is usefull for rendering of the saved route on the frontend
                latLngs: [],
                // points will contain of {marks, latLngs}, a mark is a click on the map, the latLngs is the path to the point form the previous point. It is used in order to get the property editor to remember where the editor has clicked, and thereby draw the route
                points: [],
                // the distance calculated by the google services
                distance: 0,
                // directionsRenderer is a google object, that can show a route between two points. This wont be saved as it is bloated!
                directionsRenderere: [],
                initialMarker: null,
                isKMLimported: false,
                zoom: parseInt($scope.model.config.initialZoom),
                center: null
            };

            // add listener to fileuploader
            document.getElementById("KMLfile").addEventListener("change", LoadKML, false);

            if ($scope.model.value.isKMLImported != null) {
                $scope.markerModel.isKMLimported = $scope.model.value.isKMLImported;
            }
            if ($scope.model.value.zoom != null) {
                $scope.markerModel.zoom = $scope.model.value.zoom;
            }



            // load google map
            assetsService.loadJs('http://www.google.com/jsapi')
            .then(function () {
                google.load("maps", "3",
                            {
                                callback: $scope.initialize,
                                other_params: "&key=" + $scope.model.config.apiKey + "&sensor=false&libraries=geometry"
                            });
            });


            $scope.initialize = function () {
                $scope.googlemapsloaded = true;
                if ($scope.model.value != "" && !$scope.markerModel.isKMLimported) {
                   
                    $scope.convertToGoogleMapsObjects();
                    console.log($scope.markerModel.points);
                    //console.log($scope.markerModel.latLngs);
                }
                if ($scope.model.value.center == null) {
                    $scope.markerModel.center = new google.maps.LatLng($scope.model.config.initialLat, $scope.model.config.initialLng);
                }
                if ($scope.model.value.center != null) {
                    $scope.markerModel.center = new google.maps.LatLng($scope.model.value.center.k, $scope.model.value.center.B);
                }

                var mapOptions = {
                    zoom: $scope.markerModel.zoom,
                    center: $scope.markerModel.center
                };
                var mapDiv = $document.find("#" + $scope.model.alias + '_map');
                $scope.map = new google.maps.Map(mapDiv[0], mapOptions);

                google.maps.event.addListener($scope.map, "click", $scope.mapClicked);
                google.maps.event.addListener($scope.map, 'zoom_changed', function () {
                    $scope.markerModel.zoom = $scope.map.getZoom();
                });
                google.maps.event.addListener($scope.map, 'dragend', function () {
                    $scope.markerModel.center = $scope.map.getCenter();

                });

                $scope.directionsService = new google.maps.DirectionsService();

                $('a[data-toggle="tab"]').on('shown', function (e) {
                    google.maps.event.trigger($scope.map, 'resize');
                    $scope.map.setCenter($scope.markerModel.center);
                });
                if ($scope.markerModel.points.length > 0 && !$scope.markerModel.isKMLimported) {
                    $scope.currentIndex = 0;
                    $scope.addRoutePointToMap(null, false, 0, true);
                }
                //RENDER KML DATA
                if ($scope.model.value != "" && $scope.markerModel.isKMLimported) {

                    for (var i = 0; i < $scope.model.value.latLngs.length; i++) {
                        $scope.markerModel.latLngs.push(new google.maps.LatLng($scope.model.value.latLngs[i].k, $scope.model.value.latLngs[i].B));
                    }
                    RerenderLines();
                }
            };

            // needed to convert the saved json to actual google.maps.LatLng objects, which google maps can utilize
            $scope.convertToGoogleMapsObjects = function () {
                for (var i = 0; i < $scope.model.value.latLngs.length; i++) {
                    $scope.markerModel.latLngs.push({ latLng: new google.maps.LatLng($scope.model.value.latLngs[i].latLng.k, $scope.model.value.latLngs[i].latLng.B) });
                }
                for (var i = 0; i < $scope.model.value.points.length; i++) {
                    var mark = $scope.model.value.points[i].mark;
                    var latLngs = $scope.model.value.points[i].latLngs;
                    var point = {
                        mark: new google.maps.LatLng(mark.k, mark.B),
                        latLngs: []
                    };
                    for (var j = 0; j < latLngs.length; j++) {
                        point.latLngs.push(new google.maps.LatLng(latLngs[j].k, latLngs[j].B));
                    }
                    $scope.markerModel.points.push(point);
                }
            }

            $scope.deleteLast = function () {
                if ($scope.markerModel.points.length <= 1) {
                    $scope.deleteAll();
                    return;
                }
                var point = $scope.markerModel.points.pop();
                var latLngsInLast = point.latLngs.length;
                for (var i = 0; i < latLngsInLast; i++) {
                    $scope.markerModel.latLngs.pop();
                }
                var dr = $scope.markerModel.directionsRenderere.pop();
                $scope.removeOverlayFromMap(dr);
                $scope.distanceChanged();
                $scope.setIsDirty();
            }

            $scope.deleteAll = function () {

                for (var i = 0; i < $scope.markerModel.points.length; i++) {
                    var dr = $scope.markerModel.directionsRenderere[i];
                    $scope.removeOverlayFromMap(dr);
                }
                $scope.removeOverlayFromMap($scope.markerModel.initialMarker);

                $scope.markerModel = {
                    latLngs: [],
                    points: []
                };
                $scope.markerModel.directionsRenderere = [];

                $scope.distance = 0;
                $scope.setIsDirty();
                notificationsService.info("Route removed", "The route has been reset");
            }

            $scope.removeOverlayFromMap = function (overlay) {
                if (overlay != null)
                    overlay.setMap(null);
            }

            $scope.startDraw = function () {
                $scope.drawing = true;
                notificationsService.info("Drawing started", "Start drawing your route");
            }

            $scope.endDraw = function () {
                $scope.drawing = false;
                notificationsService.info("Drawing ended", "The route has ended, you can always start again");
            }

            $scope.addRoutePointToMap = function (latLng, addToModel, myCount, looped) {
                if (latLng == null) {
                    latLng = $scope.markerModel.points[$scope.currentIndex].mark;
                    myCount = $scope.currentIndex;
                    $scope.currentIndex++;
                }
                var previousPoint = null;
                //get latest point
                if (myCount > 0) {
                    previousPoint = $scope.markerModel.points[myCount - 1].mark;
                } else {
                    var marker = new google.maps.Marker({
                        position: latLng,
                        map: $scope.map,
                        title: "Start",
                        icon: {
                            url: $scope.pointMarkerUrl,
                            size: new google.maps.Size($scope.pointMarkerSize, $scope.pointMarkerSize),
                            origin: new google.maps.Point(0, 0),
                            anchor: new google.maps.Point($scope.pointMarkerSizeHalf, $scope.pointMarkerSizeHalf)
                        }
                    });
                    marker.setMap($scope.map);
                    $scope.markerModel.initialMarker = marker;
                    if (addToModel) {
                        $scope.markerModel.latLngs.push({ latLng: latLng });
                        $scope.markerModel.points.push({
                            mark: latLng,
                            latLngs: [latLng]
                        });
                    }
                    $scope.markerModel.directionsRenderere.push(null);
                }
                if (previousPoint != null) {

                    var request = {
                        origin: previousPoint,
                        destination: latLng,
                        travelMode: google.maps.TravelMode.WALKING
                    }

                    $scope.directionsService.route(request, function (result, status) {
                        if (status == google.maps.DirectionsStatus.OK) {
                            var directionsRenderer = new google.maps.DirectionsRenderer();
                            directionsRenderer.setMap($scope.map);
                            directionsRenderer.setOptions({
                                preserveViewport: true,
                                markerOptions: {
                                    icon: {
                                        url: $scope.pointMarkerUrl,
                                        size: new google.maps.Size($scope.pointMarkerSize, $scope.pointMarkerSize),
                                        origin: new google.maps.Point(0, 0),
                                        anchor: new google.maps.Point($scope.pointMarkerSizeHalf, $scope.pointMarkerSizeHalf)
                                    }
                                },
                                polylineOptions: {
                                    strokeColor: $scope.strokeColor,
                                    strokeWeight: 4
                                }
                            });
                            directionsRenderer.setDirections(result);
                            if (result.routes.length > 0) {
                                // take first route
                                var route = result.routes[0];
                                if (addToModel) {
                                    for (var i = 0; i < route.overview_path.length; i++) {
                                        $scope.markerModel.latLngs.push({ latLng: route.overview_path[i] });
                                    }
                                    $scope.markerModel.points.push({
                                        mark: latLng,
                                        latLngs: route.overview_path
                                    });
                                }
                                $scope.markerModel.directionsRenderere.push(directionsRenderer);
                            }
                            $scope.distanceChanged();
                            if (addToModel)
                                $scope.setIsDirty();
                        } else {
                            alert("error getting direction");
                        }
                    });
                }
                if (looped && $scope.currentIndex < $scope.markerModel.points.length)
                    $timeout(function () { $scope.addRoutePointToMap(null, false, 0, true); }, 500);

            }

            $scope.distanceChanged = function () {
                var latLngArray = $scope.markerModel.latLngs.map(function (x) { return x.latLng; });
                $scope.markerModel.distance = google.maps.geometry.spherical.computeLength(latLngArray);
            }

            $scope.mapClicked = function (event) {
                if ($scope.drawing) {
                    $scope.addRoutePointToMap(event.latLng, true, $scope.markerModel.points.length);
                }
                else {
                    notificationsService.info("Drawing not started", "Please click start before drawing you route");
                }
            }
            $scope.$on("formSubmitting", function (ev, args) {
                $scope.model.value = {
                    latLngs: $scope.markerModel.latLngs,
                    points: $scope.markerModel.points,
                    distance: $scope.markerModel.distance,
                    isKMLImported: $scope.markerModel.isKMLimported,
                    zoom: $scope.markerModel.zoom,
                    center: $scope.markerModel.center
                }
            });

            $scope.setIsDirty = function () {
                // get the content item form
                var contentForm = angular.element('form[name=contentForm]').scope().contentForm;
                contentForm.$dirty = true;
            }

            /*KML adding*/
            $scope.uploadKML = function () {
                var fileInput = $('input[class="KMLfile"]');
                fileInput.trigger('click');
            }
            function LoadKML(e) {
                $scope.markerModel.isKMLimported = true;
                var cordinates = [];
                assetsService.loadJs('/App_Plugins/RoutePlanner/external/toGeoJSON.js')
                .then(function () {

                    var files = e.target.files;
                    var reader = new FileReader();

                    reader.onload = function () {


                        var xml = new DOMParser().parseFromString(this.result, "text/xml");

                        $.each(toGeoJSON.kml(xml).features[0].geometry.coordinates, function (index, value) {

                            cordinates.push(new google.maps.LatLng(parseFloat(value[1]), parseFloat(value[0])));


                        });
                        $.each(cordinates, function (key, value) {


                            $scope.markerModel.latLngs.push(value);
                            $scope.markerModel.points.push({
                                mark: value,
                                latLngs: [value]
                            });
                        });
                        CalculateDistance();
                        RerenderLines();
                    };

                    reader.readAsText(files[0]);


                });

            }


            function RerenderLines() {
                var path = new google.maps.Polyline({
                    path: $scope.markerModel.latLngs,
                    geodesic: true,
                    strokeColor: $scope.strokeColor,
                    strokeOpacity: 1.0,
                    strokeWeight: 2
                });
                path.setMap($scope.map);

                $scope.map.setCenter($scope.markerModel.center);

                CalculateDistance();
            }

            function CalculateDistance() {
                var distance = 0;

                if ($scope.markerModel.latLngs.length >= 2) {
                    for (var i = 1; i < $scope.markerModel.latLngs.length; i++) {
                        var distanceBetweenPoints = CalculateDistanceBetweenPoints($scope.markerModel.latLngs[i - 1], $scope.markerModel.latLngs[i]);
                        distance = distance + distanceBetweenPoints;
                    }
                }

                $scope.markerModel.distance = distance.toFixed(2);

            }
            function CalculateDistanceBetweenPoints(a, b) {


                var val = (google.maps.geometry.spherical.computeDistanceBetween(a, b) / 1000);

                return val;
            }

        });