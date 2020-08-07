'use strict';

window.onload = () => {

    if (document.getElementById('mapbox') !== null) {

        let lat = parseFloat(document.getElementById('mapbox').dataset.latitude);
        let lon = parseFloat(document.getElementById('mapbox').dataset.longitude);
        let dest = [lat, lon];

        // let bounds = [
        //     [31.729167, 35.156611],
        //     [31.809167, 35.276611]
        // ];

        // initialize the map on the "map" div with a given center and zoom
        var tilesDb = {
            getItem: function (key) {
                return localforage.getItem(key);
            },

            saveTiles: function (tileUrls) {
                var self = this;

                var promises = [];

                for (var i = 0; i < tileUrls.length; i++) {
                    var tileUrl = tileUrls[i];

                    (function (i, tileUrl) {
                        promises[i] = new Promise(function (resolve, reject) {
                            var request = new XMLHttpRequest();
                            request.open('GET', tileUrl.url, true);
                            request.responseType = 'blob';
                            request.onreadystatechange = function () {
                                if (request.readyState === XMLHttpRequest.DONE) {
                                    if (request.status === 200) {
                                        resolve(self._saveTile(tileUrl.key, request.response));
                                    } else {
                                        reject({
                                            status: request.status,
                                            statusText: request.statusText
                                        });
                                    }
                                }
                            };
                            request.send();
                        });
                    })(i, tileUrl);
                }

                return Promise.all(promises);
            },

            clear: function () {
                return localforage.clear();
            },

            _saveTile: function (key, value) {
                return this._removeItem(key).then(function () {
                    return localforage.setItem(key, value);
                });
            },

            _removeItem: function (key) {
                return localforage.removeItem(key);
            }
        };
        

        var map = L.map('mapbox', {
            center: dest,
            zoom: 15,
            minZoom: 14,
            maxZoom: 18,
        });

        L.marker(dest).addTo(map);

        var offlineLayer = L.tileLayer.offline('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', tilesDb, {
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            subdomains: 'abc',
            minZoom: 14,
            maxZoom: 18,
            crossOrigin: true
        });
        var offlineControl = L.control.offline(offlineLayer, tilesDb, {
            saveButtonHtml: '<i class="fa fa-download" aria-hidden="true"></i>',
            removeButtonHtml: '<i class="fa fa-trash" aria-hidden="true"></i>',
            confirmSavingCallback: function (nTilesToSave, continueSaveTiles) {
                //if (window.confirm('Save ' + nTilesToSave + '?')) {
                continueSaveTiles();
                //}
            },
            confirmRemovalCallback: function (continueRemoveTiles) {
                //if (window.confirm('Remove all the tiles?')) {
                continueRemoveTiles();
                //}
            },
            minZoom: 14,
            maxZoom: 18
        });

        offlineLayer.addTo(map);
        offlineControl.addTo(map);

        offlineLayer.on('offline:below-min-zoom-error', function () {
            console.log('Can not save tiles below minimum zoom level.');
        });

        offlineLayer.on('offline:save-start', function (data) {
            console.log('Saving ' + data.nTilesToSave + ' tiles.');
        });

        offlineLayer.on('offline:save-end', function () {
            console.log('All the tiles were saved.');
        });

        offlineLayer.on('offline:save-error', function (err) {
            console.error('Error when saving tiles: ' + err);
        });

        offlineLayer.on('offline:remove-start', function () {
            console.log('Removing tiles.');
        });

        offlineLayer.on('offline:remove-end', function () {
            alert('All the tiles were removed.');
        });

        offlineLayer.on('offline:remove-error', function (err) {
            console.error('Error when removing tiles: ' + err);
        });

        map.locate({ setView: true, watch: true, maxZoom: 18 });
        var marker;

        map.on('locationfound', function (ev) {
            if (!marker) {
                marker = L.marker(ev.latlng).addTo(map);
                L.Routing.control({
                    waypoints: [
                      L.latLng(ev.latlng),
                      L.latLng(dest)
                    ]
                  }).addTo(map);
            } else {
                marker.setLatLng(ev.latlng);
                L.Routing.control({
                    waypoints: [
                      L.latLng(ev.latlng),
                      L.latLng(dest)
                    ]
                  })
            }
            
        })

        var lc = L.control.locate({
            locateOptions: {
                enableHighAccuracy: true
            }
        });

        map.addControl(lc);

        document.querySelectorAll('.fa-fw.fas.fa-map-pin').forEach((item) => [
            item.addEventListener('click', () => {
                setTimeout(() => {
                    map.invalidateSize();
                })
            })
        ])
    }
}