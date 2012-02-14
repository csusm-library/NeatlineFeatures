(function() {

  (function($) {
    return $.widget('nlfeatures.featurewidget', {
      options: {
        mode: 'view',
        id_prefix: null,
        text: null,
        free: null,
        html: null,
        mapon: null,
        map: null,
        map_options: {},
        value: null,
        formats: {
          is_map: false,
          is_html: false
        }
      },
      _create: function() {
        var id, _base, _base2, _base3, _base4, _base5, _base6;
        id = this.element.attr('id');
        if ((_base = this.options).id_prefix == null) {
          _base.id_prefix = '#' + id.substring(0, id.length - 'widget'.length);
        }
        if ((_base2 = this.options).text == null) {
          _base2.text = "" + this.options.id_prefix + "text";
        }
        if ((_base3 = this.options).free == null) {
          _base3.free = "" + this.options.id_prefix + "free";
        }
        if ((_base4 = this.options).html == null) {
          _base4.html = "" + this.options.id_prefix + "html";
        }
        if ((_base5 = this.options).mapon == null) {
          _base5.mapon = "" + this.options.id_prefix + "mapon";
        }
        if ((_base6 = this.options).map == null) {
          _base6.map = "" + this.options.id_prefix + "map";
        }
        this.map = this._initMap();
        if (this.options.mode === 'edit') {
          this._recaptureEditor();
          this._updateFreeText();
          this._addUpdateEvents();
        } else {
          this._fillFreeView();
        }
        if (!this.options.formats.is_map) return this.hideMap();
      },
      destroy: function() {
        return $.Widget.prototype.destroy.call(this);
      },
      _setOptions: function(key, value) {
        return $.Widget.prototype._setOption.apply(this, arguments);
      },
      _initMap: function() {
        var all_options, input, item, local_options, map;
        input = this.parseTextInput(this.options.value);
        map = $(this.options.map);
        item = {
          title: 'Coverage',
          name: 'Coverage',
          id: this.element.attr('id'),
          wkt: input.wkt
        };
        local_options = {
          mode: this.options.mode,
          json: item,
          markup: {
            id_prefix: this.options.id_prefix
          }
        };
        if (input.zoom != null) local_options.zoom = input.zoom;
        if (input.center != null) local_options.center = input.center;
        all_options = $.extend(true, {}, this.options.map_options, local_options);
        return $(this.options.map).nlfeatures(all_options).data('nlfeatures');
      },
      _recaptureEditor: function() {
        var _this = this;
        return this._poll(function() {
          return $('.mceEditor').length > 0;
        }, function() {
          var free;
          if (!_this.usesHtml()) {
            free = _this.options.free.substr(1);
            tinyMCE.execCommand('mceRemoveControl', false, free);
          }
          $(_this.options.mapon).unbind('click').change(function() {
            return _this._onUseMap();
          });
          return $(_this.options.html).change(function() {
            return _this._updateTinyEvents();
          });
        });
      },
      _poll: function(predicate, callback, maxPoll, timeout) {
        var n, pred, _poll;
        if (maxPoll == null) maxPoll = null;
        if (timeout == null) timeout = 100;
        n = 0;
        pred = (maxPoll != null) && maxPoll !== 0 ? function() {
          return predicate() || n >= maxPoll;
        } : predicate;
        _poll = function() {
          if (pred()) {
            return callback();
          } else {
            n++;
            return setTimeout(_poll, timeout);
          }
        };
        return setTimeout(_poll, timeout);
      },
      usesHtml: function() {
        return $(this.options.html).is(':checked');
      },
      usesMap: function() {
        return $(this.options.mapon).is(':checked');
      },
      _onUseMap: function() {
        if (this.usesMap()) {
          this.showMap();
        } else {
          this.hideMap();
        }
        return this.updateTextInput();
      },
      showMap: function() {
        return $(this.element).find('.map-container').show();
      },
      hideMap: function() {
        return $(this.element).find('.map-container').hide();
      },
      _updateTinyEvents: function() {
        var free,
          _this = this;
        if (this.usesHtml()) {
          free = this.options.free.substr(1);
          return this._poll(function() {
            return tinyMCE.get(free) != null;
          }, function() {
            $(_this.options.free).unbind('change');
            return tinyMCE.get(free).onChange.add(function() {
              return _this.updateTextInput();
            });
          });
        } else {
          return $(this.options.free).change(function() {
            return _this.updateTextInput();
          });
        }
      },
      _addUpdateEvents: function() {
        var handler,
          _this = this;
        handler = function() {
          return _this.updateTextInput();
        };
        $(this.options.free).change(handler);
        return $(this.map.element).bind('featureadded.nlfeatures', handler).bind('update.nlfeatures', handler).bind('delete.nlfeatures', handler).bind('saveview.nlfeatures', function() {
          _this.map.saveViewport();
          return _this.updateTextInput();
        });
      },
      updateTextInput: function() {
        var buffer, center, zoom;
        buffer = [];
        if (this.usesMap()) {
          buffer.push("WKT: " + (this.map.getWktForSave()) + "\n");
          zoom = this.map.getSavedZoom();
          if (zoom != null) buffer.push("ZOOM: " + zoom + "\n");
          center = this.map.getSavedCenter();
          if (center != null) {
            buffer.push("CENTER: " + center.lon + "," + center.lat + "\n");
          }
          buffer.push("\n");
        }
        if (this.usesHtml()) {
          buffer.push(tinyMCE.get(this.options.free.substr(1)).getContent());
        } else {
          buffer.push($(this.options.free).val());
        }
        return $(this.options.text).val(buffer.join(''));
      },
      parseTextInput: function(input) {
        var lines, output, prefix, prefixLines, splitAt;
        if (input == null) {
          input = this.options.mode === 'edit' ? $(this.options.text).val() : this.options.value;
        }
        output = {
          wkt: '',
          free: ''
        };
        if (input.substr(0, 5) === 'WKT: ') {
          lines = input.split(/\r\n|\n|\r/);
          splitAt = 0;
          while (splitAt < lines.length && !lines[splitAt].match(/^\s*$/)) {
            splitAt++;
          }
          if (splitAt < lines.length) {
            prefixLines = lines.slice(0, splitAt);
            prefix = this._parseFeatureData(lines.slice(0, splitAt));
            output.wkt = prefix.wkt;
            output.zoom = prefix.zoom;
            output.center = prefix.center;
            output.free = lines.slice(splitAt + 1).join("\n");
          }
        } else {
          output.free = input;
        }
        return output;
      },
      _parseFeatureData: function(lines) {
        var current, data, lat, line, lon, _i, _len, _ref;
        data = {
          wkt: null,
          zoom: null,
          center: null
        };
        current = null;
        for (_i = 0, _len = lines.length; _i < _len; _i++) {
          line = lines[_i];
          line = line.trim();
          if (line.length === 0) {
            continue;
          } else if (line.substr(0, 5) === 'WKT: ') {
            current = 'wkt';
            data.wkt = [];
            data.wkt.push(line.substr(5));
          } else if (line.substr(0, 6) === 'ZOOM: ') {
            current = 'zoom';
            data.zoom = parseInt(line.substr(6));
          } else if (line.substr(0, 8) === 'CENTER: ') {
            current = 'center';
            _ref = line.substr(8).split(','), lon = _ref[0], lat = _ref[1];
            data.center = {
              lon: parseFloat(lon),
              lat: parseFloat(lat)
            };
          } else if (current === 'wkt') {
            data.wkt.push(line);
          }
        }
        if (data.wkt != null) {
          data.wkt = data.wkt.join("\n");
        } else {
          data.wkt = '';
        }
        return data;
      },
      _updateFreeText: function() {
        var output;
        output = this.parseTextInput();
        return $(this.options.free).val(output.free);
      },
      _fillFreeView: function(free) {
        if (free == null) free = this.parseTextInput().free;
        return $(this.options.free).html(free);
      }
    });
  })(jQuery);

}).call(this);
