/*globals Backbone, google, jQuery */

var Yonder = Yonder || {};

(function(Y, $) {
  // Model colors: E41A1C, 377EB8, 4DAF4A, 984EA3, FF7F00, FFFF33, A65628, F781BF, 999999

  Y.GeocoderModel = Backbone.Model.extend({
    // Implement sync to call the geocode method
    sync: function(method, model, options) {
      if (method === 'read') {
        this.clear({silent: true});
        this.geocode(options.address);
      } else {
        throw new Error('Method [' + method + '] is not supported. Geocoders are read-only.');
      }
    }
  });

  Y.geocoderList = [

    // OpenCage
    Y.GeocoderModel.extend({
      //Include a unique geocoder name for display
      type: 'opencage',
      name: 'OpenCage',
      color: '#e0c74d', // yellow-ish
      // Geocode the address and call success or error when complete
      // https://api.opencagedata.com/geocode/v1/format?parameters
      // Key c166308d800a7ccfac4b37506db776c1
      geocode: function(addr) {
        var model = this;
        var encodedAddr = encodeURIComponent(addr);

        try {
          $.ajax({
            url: 'http://api.opencagedata.com/geocode/v1/json?q=' + encodedAddr + '&key=' + Y.config.opencage_id,
            crossDomain: true,
            success: function (res) {
              if (res.results.length) {
                model.set(model.parse(res.results[0]));
              } else {
                model.set({'Error': 'No results.'});
              }
            },
          });
        } catch (e) {
          model.set({'Error': 'Error parsing results.'});
        }

      },
      // Override parse to set normalized attributes for display.
      // The res param is the raw respsone from the geocoder
      parse: function(loc) {
        var normalRes = {
            'Address': loc.formatted,
            'LatLng': [parseFloat(loc.geometry.lat), parseFloat(loc.geometry.lng)],
            'Quality': loc.confidence,
            'Raw': JSON.stringify(loc, null, ' ')
          };

        return normalRes;
      }
    }),

    //Nominatim
    Y.GeocoderModel.extend({
      //Include a unique geocoder name for display
      type: 'nominatim',
      name: 'Nominatim',
      color: '#fd8d3c',
      // Geocode the address and call success or error when complete
      geocode: function(addr) {
        var model = this;

        try {
          $.ajax({
            dataType: 'jsonp',
            data: {
              q: addr,
              format: 'json',
              addressdetails: 1
            },
            jsonp: 'json_callback',
            // Including key in the data object uri encoded the key
            url: 'http://nominatim.openstreetmap.org/search',
            crossDomain: true,
            success: function (res) {
              if (res.length) {
                model.set(model.parse(res[0]));
              } else {
                model.set({'Error': 'No results.'});
              }
            },
          });
        } catch (e) {
          model.set({'Error': 'Error parsing results.'});
        }

      },
      // Override parse to set normalized attributes for display.
      // The res param is the raw respsone from the geocoder
      parse: function(res) {
        var spacesRe = / {2,}/g,
          normalRes = {
            'Address': res.display_name,
            'LatLng': [parseFloat(res.lat), parseFloat(res.lon)],
            'Quality': res.importance,
            'Raw': JSON.stringify(res, null, ' ')
          };

        return normalRes;
      }
    }),

    //Esri
    Y.GeocoderModel.extend({
      //Include a unique geocoder name for display
      type: 'esri',
      name: 'Esri',
      color: '#444',
      // Geocode the address and call success or error when complete
      geocode: function(addr) {
        var model = this;

        try {
          $.ajax({
            dataType: 'jsonp',
            data: {
              text: addr,
              f: 'pjson'
            },
            // Including key in the data object uri encoded the key
            url: 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/find',
            crossDomain: true,
            success: function (res) {
              if (res.locations.length) {
                model.set(model.parse(res.locations[0]));
              } else {
                model.set({'Error': 'No results.'});
              }
            },
          });
        } catch (e) {
          model.set({'Error': 'Error parsing results.'});
        }
      },
      // Override parse to set normalized attributes for display.
      // The res param is the raw respsone from the geocoder
      parse: function(loc) {
        var feature = loc.feature;
        var spacesRe = / {2,}/g,
          normalRes = {
            'Address': loc.name,
            'LatLng': [parseFloat(feature.geometry.y), parseFloat(feature.geometry.x)],
            'Quality': feature.attributes.Score,
            'Raw': JSON.stringify(loc, null, ' ')
          };

        return normalRes;
      }
    }),

    //Gisgraphy
    Y.GeocoderModel.extend({
      //Include a unique geocoder name for display
      type: 'Gisgraphy',
      name: 'Gisgraphy',
      color: '#984EA3',
      // Geocode the address and call success or error when complete
      geocode: function(addr) {
        var model = this;

        try {
          $.ajax({
            dataType: 'jsonp',
            data: {
              address: addr,
              format: 'json',
              country: $('#countrylist').val()
            },
            url: 'https://services.gisgraphy.com/geocoding/geocode',
            success: function (res) {
              if (res.numFound && res.numFound > 0) {
                  model.set(model.parse(res.result[0]));
              } else {
                model.set({'Error': 'No results.'});
              }
            }
          });
        } catch (e) {
          model.set({'Error': 'Error parsing results.'});
        }

      },
      // Override parse to set normalized attributes for display.
      // The res param is the raw respsone from the geocoder
      parse: function(res) {
        var spacesRe = / {2,}/g,
          normalRes = {
            'Address': [res.formatedFull].join(' ').replace(spacesRe, ' ').trim(),
            'LatLng': [parseFloat(res.lat), parseFloat(res.lng)],
            'Quality': res.geocodingLevel,
            'Raw': JSON.stringify(res, null, ' '),
          };

        return normalRes;
      }
    }),

  ];

  Y.GeocoderCollection = Backbone.Collection.extend({
    model: Y.GeocoderModel,
    // Override fetch to delegate to the models
    fetch: function(options) {
      this.each(function(model) {
        model.fetch(options);
      });
    }
  });
}(Yonder, jQuery));
