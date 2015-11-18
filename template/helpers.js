var _ = require('lodash');

module.exports = {
  marked: require('marked').setOptions({
    gfm: true,
    tables: true,
    breaks: true,
    pedantic: true,
    sanitize: false,
    smartLists: true,
    smartypants: true
  }),
  javaKeywords: ['for', 'switch'], // TODO: if it's necessary add other keywords as well
  findBehavior: function(name) {
    for (var i = 0; name && i < global.parsed.length; i++) {
      var item = global.parsed[i];
      if (this.isBehavior(item) && this.className(item.is) == this.className(name)) {
        return global.parsed[i];
      }
    }
  },
  findElement: function(name) {
    for (var i = 0; name && i < global.parsed.length; i++) {
      var item = global.parsed[i];
      if (!this.isBehavior(item) && this.className(item.is) == this.className(name)) {
        return global.parsed[i];
      }
    }
  },
  isBehavior: function(item) {
    return ((item && item.type) || this.type) == 'behavior';
  },
  getNestedBehaviors: function(item, name) {
    var _this = this;
    var properties = [];

    var events = [];

    var behavior = this.findBehavior(name)
    if (behavior) {
      events = behavior.events;

      behavior.properties.forEach(function(prop) {
        prop.isBehavior = true;
        prop.behavior = _this.className(item.is);
        prop.signature = _this.signParamString(prop);
        properties.push(prop);
      });

      if(behavior.behaviors) {
        behavior.behaviors.forEach(function(b) {
          var nestedBehaviors = _this.getNestedBehaviors(item, b);
          properties = _.union(properties, nestedBehaviors.properties);
          events = _.union(events, nestedBehaviors.events);
        });
      }
    }

    return {properties: properties, events: events};
  },
  className: function (name) {
    return this.camelCase(name || this['name']);
  },
  elementClassName: function(name) {
    return this.className(name) + (this.isBehavior() ? '' : 'Element');
  },
  baseClassName: function () {
    var _this = this;
    // Always extend native HTMLElement
    var e = ['HTMLElement'];
    if (this.behaviors && this.behaviors.length) {
      this.behaviors.forEach(function(name){
        // CoreResizable -> CoreResizableElement, core-input -> CoreInputElment
        if (name && name.match(/[A-Z\-]/)) {
          if (_this.findBehavior(name)) {
            e.push(_this.camelCase(name));
          } else {
            console.log("NOT FOUND: " + name + " " + _this.camelCase(name));
          }
        } else {
          // input -> HTMLInputElement, table -> HTMLTableElement
          e.push('HTML' + _this.elementClassName(name));
        }
      });
    }
    return "extends " + e.join(',');
  },
  camelCase: function(s) {
    return (s || '').replace(/^Polymer\./, '').replace(/[^\-\w\.]/g,'').replace(/(\b|-|\.)\w/g, function (m) {
      return m.toUpperCase().replace(/[-\.]/g, '');
    });
  },
  hyphenize: function(s) {
    return s.replace(/([A-Z])/g, "-$1").toLowerCase();
  },
  computeMethodName: function(s) {
    return (s || '').replace(/-\w/g, function (m) {
      return m.toUpperCase().replace(/-/, '');
    });
  },
  computeName: function(s) {
    return (s || '').replace(/[^\w\-\.:]/g, '');
  },
  computeType: function(t) {
    if (!t) return 'Object';
    // TODO: Sometimes type have a syntax like: (number|string)
    // We should be able to overload those methods instead of using
    // Object, but JsInterop does not support well overloading
    if (/.*\|.*/.test(t)) return 'Object';
    if (/^string/i.test(t)) return 'String';
    if (/^boolean/i.test(t)) return 'boolean';
    if (/^array/i.test(t)) return 'JsArray';
    if (/^element/i.test(t)) return 'Element';
    if (/^number/i.test(t)) return 'double';
    if (/^function/i.test(t)) return 'Function';
    if (this.findBehavior(t)) {
      return this.camelCase(t);
    }
    if (this.findElement(t)) {
      return this.camelCase(t) + 'Element';
    }

    return "JavaScriptObject";
  },
  sortProperties: function(properties) {
  },
  getGettersAndSetters: function(properties) {
    // Sorting properties so no-typed and String methods are at end
    properties.sort(function(a, b) {
      var t1 = this.computeType(a.type);
      var t2 = this.computeType(b.type);
      return t1 == t2 ? 0: !a.type && b.type ? 1 : a.type && !b.type ? -1: t1 == 'String' ? 1 : -1;
    }.bind(this));
    var ret = [];
    // We use done hash to avoid generate same property with different signature (unsupported in JsInterop)
    var done = {};
    // We use cache to catch especial cases of getter/setter no defined in the
    // properties block but as 'set foo:{}, get foo:{}' pairs. The hack is that
    // first we see a method with the a valid type (setter) and then we visit
    // a method with the same name but empty type (getter).
    var cache = {};

    _.forEach(properties, function(item) {
      // We consider as properties:
      if (
          // Items with the published tag (those defined in the properties section)
          item.published ||
          // Non function items
          !item.private && item.type && !/function/i.test(item.type) ||
          // Properties defined with customized get/set syntax
          !item.type && cache[item.name] && cache[item.name].type) {

        // defined with customized get/set, if we are here is because
        // this item.type is undefined and cached one has the correct type
        item = cache[item.name] ? cache[item.name] : item;

        item.getter = item.getter || this.computeGetterWithPrefix(item);
        item.setter = item.setter || (this.computeSetterWithPrefix(item) + '(' + this.computeType(item.type) + ' value)');

        // JsInterop does not support a property with two signatures
        if (!done[item.getter]) {
          ret.push(item);
          done[item.getter] = true;
        }
      } else {
        cache[item.name] = item;
      }
    }.bind(this));
    return ret;
  },
  getStringSetters: function(properties) {
    var ret = [];
    var arr = this.getGettersAndSetters(properties);
    _.forEach(arr, function(item) {
      var itType = this.computeType(item.type) ;
      if (!/(Function|String|boolean)/.test(itType)) {
        for (var j = 0; j< arr.length; j++) {
          if (arr[j].name == item.name && arr[j].type == 'String') {
            return;
          }
        }
        ret.push(item);
      }
    }.bind(this));
    return ret;
  },
  getMethods: function(properties) {
    // Sorting properties so Object methods are at first
    properties.sort(function(a, b) {
      var t1 = this.typedParamsString(a);
      var t2 = this.typedParamsString(b);
      return t1 == t2 ? 0: /^Object/.test(t1) ? -1 : 1;
    }.bind(this));

    // Skip functions with name equal to a getter/setter
    var gsetters = {};
    _.forEach(properties, function(item) {
      if (item.getter) {
        gsetters[item.getter] = true;
        gsetters[item.setter] = true;
        gsetters[item.name] = true;
      }
    }.bind(this));

    var ret = [];
    var done = {};
    _.forEach(properties, function(item) {
      if (!gsetters[item.name] && !item.getter && !item.private && !item.published && /function/i.test(item.type)) {
        item.method = item.method || item.name + '(' + this.typedParamsString(item) + ')';
        // JsInterop + SDM do not support method overloading if one signature is object
        var other = item.method.replace(/String/, 'Object');
        if (!gsetters[item.method] && !done[other] && !done[item.method]) {
          ret.push(item);
          done[item.method] = true;
        }
      }
    }.bind(this));
    return ret;
  },
  removePrivateApi: function(arr, prop) {
    for (var i = arr.length - 1; i >= 0; i--) {
      if (/^(_.*|ready|created)$/.test(arr[i][prop])) {
        arr.splice(i, 1);
      }
    }
  },
  hasItems: function(array) {
    return array && array.length > 0;
  },
  hasEvents: function() {
    return this.hasItems(this.events);
  },
  hasProperties: function() {
    return this.hasItems(this.properties);
  },
  hasParams: function() {
    return this.hasItems(this.params);
  },
  capitalizeFirstLetter: function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  },
  computeGetterWithPrefix: function(item) {
    var name = item.name.replace(/^detail\./,'');
    // replaced isXXX methods with getXXX temporary because of bug in JsInterop
    // because in the case of isNarrow, the JS generated is something like $object.arrow
    //var prefix = /^boolean/i.test(item.type) ? 'is' : 'get';
    var prefix = 'get';
    if (this.startsWith(name, prefix)) {
      return name;
    } else {
      return prefix + this.capitalizeFirstLetter(this.computeMethodName(name));
    }
  },
  computeSetterWithPrefix: function(item) {
    return 'set' + this.capitalizeFirstLetter(this.computeMethodName(item.name));
  },
  startsWith: function (str, substr){
    return str.indexOf(substr) === 0;
  },
  signParamString: function(method) {
    if (method.type != 'Function') {
      return method.type;
    }
    var result = [];
    if (method.params) {
      method.params.forEach(function(param) {
        var type = this.computeType(param.type);
        result.push(type);
      }, this);
    }
    return result.join(',');
  },
  typedParamsString: function(method) {
    var result = [];
    if (method.params) {
      method.params.forEach(function(param) {
        var type = this.computeType(param.type);
        result.push(type + ' ' + this.computeMethodName(param.name));
      }, this);
    }
    return result.join(', ');
  },
  paramsString: function(method) {
    var result = [];
    if (method.params) {
      method.params.forEach(function(param) {
        result.push(this.computeMethodName(param.name));
      }, this);
    }
    return result.join(', ');
  },
  returnString: function(method) {
    if (method['return'] && method['return']['type']) {
      return this.computeType(method['return']['type'])
    }
    return 'void';
  },
  getDescription: function(spaces, o) {
    o = o || this;
    var desc = o.description || o.desc || '';
    desc = this.marked(desc);
    return (desc).trim().split('\n').join('\n' + spaces + '* ').replace(/\*\//g, "* /");
  },
  disclaimer: function() {
    var projectName = this.bowerData.name || "unknown";
    var projectLicense = this.bowerData.license || "unknown";

    var projectAuthors = this.bowerData.authors || this.bowerData.author;
    if (projectAuthors && projectAuthors.map) {
      projectAuthors = projectAuthors.map(function(author) {
        return author.name ? author.name : author;
      }).toString();
    }
    projectAuthors = projectAuthors || "unknown author";

    return "/*\n" +
    " * This code was generated with Vaadin Web Component GWT API Generator, \n" +
    " * from " + projectName + " project by " + projectAuthors + "\n" +
    " * that is licensed with " + projectLicense + " license.\n" +
    " */";
  },
  j2s: function(json, msg) {
    msg = msg || '';
    var cache = [];
    console.log(msg + JSON.stringify(json, function(key, value) {
        if (typeof value === 'object' && value !== null) {
            if (cache.indexOf(value) !== -1) {
                return;
            }
            cache.push(value);
        }
        return value;
    }));
  }
};
