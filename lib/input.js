// Copyright 2012 [Josh Leitzel](http://joshleitzel.com).

// Freely distributable under the MIT license.

// Initial Setup
// ---

// Global namespace
var Input = {};

// A default suite of character inputs to allow.
var defaultAllowed = {
    'alpha'         : 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
    'alphanumeric'  : 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    'integer'       : '0123456789'
  },
  defaultRegex = {
    'email' : /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  },
  specialKeys = {
  	8: "backspace", 9: "tab", 13: "return", 16: "shift", 17: "ctrl", 18: "alt", 19: "pause",
  	20: "capslock", 27: "esc", 32: "space", 33: "pageup", 34: "pagedown", 35: "end", 36: "home",
  	37: "left", 38: "up", 39: "right", 40: "down", 45: "insert", 46: "del", 
  	96: "0", 97: "1", 98: "2", 99: "3", 100: "4", 101: "5", 102: "6", 103: "7",
  	104: "8", 105: "9", 106: "*", 107: "+", 109: "-", 110: ".", 111 : "/", 
  	112: "f1", 113: "f2", 114: "f3", 115: "f4", 116: "f5", 117: "f6", 118: "f7", 119: "f8", 
  	120: "f9", 121: "f10", 122: "f11", 123: "f12", 144: "numlock", 145: "scroll", 188: ",", 190: ".",
  	191: "/", 224: "meta"
  },
  shiftNums = {
  	"`": "~", "1": "!", "2": "@", "3": "#", "4": "$", "5": "%", "6": "^", "7": "&", 
  	"8": "*", "9": "(", "0": ")", "-": "_", "=": "+", ";": ": ", "'": "\"", ",": "<", 
  	".": ">",  "/": "?",  "\\": "|"
  };

// Save the keys for later.
var defaultAllowedKeys = Object.keys(defaultAllowed);
var defaultRegexKeys = Object.keys(defaultRegex);

// Unfancy function to bind a callback to an event.
Input._bind = function(element, event, callback) {
  element['on' + event] = callback;
};

// Unfancy function to retrieve an attribute from an element.
Input._attr = function(domNode, attr) {
  var attrs = domNode.attributes;
  for (var i = 0; i < attrs.length; i++) {
    if (attrs[i].name === attr) {
      return attrs[i].nodeValue;
    }
  }
  return null;
};

// Retreives the DOM element representing a form field.
// `descriptor` is either a jQuery object, the `name` of a form field,
// or the `id` of a form field (prepended with `#`).
Input._getFormElement = function(descriptor) {
  if (jQuery && descriptor.context) {
    return descriptor[0];
  }
  
  if (descriptor[0] === '#') {
    return document.getElementById(descriptor.substr(1, descriptor.length));
  }
  
  return forms[0][descriptor];
};

// `Form` is the father of the library, and has a one-to-one
// relationship with actual HTML `<form>`s.
Input.Form = function(form, options) {
  this.errors = {};
  this.fields = [];
  this.visitedFields = [];
  this.attemptedFields = [];
  var _form = this,
      _formDom = form,
      _errorCallback;
  
  // Save references to `options` for later.
  this.preventInvalidInput = options.preventInvalidInput;
  
  // Under the hood methods for adding errors to fields.
  this._addError = function(field, error) {
    _form.errors[field] = error;
    _errorCallback(field, error);
  };
  
  this._addErrors = function(field, errors) {
    errors.forEach(function(error) {
      _form._addError(field, error);
    });
  }
  
  // Serialize and return all the current errors on this form.
  this.errors = function() {
    return this.errors;
  };
  
  // `callback` will be called anytime a new error occurs.
  this.error = function(callback) {
    _errorCallback = callback;
  }
  
  // Define the rules for a field.
  this.field = function(descriptor, rules) {
    // Save a reference to the field name.
    var _fieldDom = Input._getFormElement(descriptor),
        _fieldName = Input._attr(_fieldDom, 'name') || Input._attr(_fieldDom, 'id'),
        _field = this;
    
    // Save references to the rules passed.
    var type = rules.type,
        allowed = rules.allowed || '',
        disallowed = rules.disallowed || '',
        regex = rules.regex,
        size = rules.size,
        range = rules.range,
        min = rules.min,
        max = rules.max,
        lengthRange = rules.lengthRange,
        minLength = rules.minLength,
        maxLength = rules.maxLength,
        validateInline = rules.validateInline,
        preventInvalidInput = rules.preventInvalidInput === undefined ? _form.preventInvalidInput : rules.preventInvalidInput,
        cajole = rules.cajole;
    
    // Does not compute.
    if (allowed !== '' && disallowed !== '') {
      throw new Error('Cannot specify both allowed and disallowed.');
    }
    
    // Types are just shortcuts to pre-defined `allowed` or `regex` values,
    // so insert those values if one was passed.
    if (type) {
      if (defaultAllowedKeys.indexOf(type) > -1) {
        allowed += defaultAllowed[type];
      } else if (defaultRegexKeys.indexOf(type) > -1) {
        regex = defaultRegex[type];
      }
    }
    
    // Allowed & disallowed input
    // ---
    // Knowing that `allowed` and `disallowed` are always arrays will make our
    // lives easier. We make an assumption that if they aren't arrays, then they
    // are strings of allowed characters; so we turn those into arrays.
    if (allowed !== '') {
      if (!(allowed instanceof Array)) {
        allowed = allowed.split('');
      }
    }
    
    if (disallowed !== '') {
      if (!(disallowed instanceof Array)) {
        disallowed = disallowed.split('');
      }
    }
    
    // Ranges
    // ---
    // Ranges are just shortcuts for defining both a `min` and `max`.
    // They can be in either `[min, max]` or `[max, min]` order, so
    // we figure out which order they're in and pass the baton on to
    // `min` and `max`.
    if (range) {
      if (range[0] < range[1]) {
        min = range[0];
        max = range[1];
      } else {
        min = range[1];
        max = range[0];
      }
    }
    
    // Length ranges are just shortcuts for defining both a `minLength` and `maxLength`.
    // It is not useful to accept them in `[maxLength, minLength]` order, so we don't
    // support that.
    if (lengthRange) {
      minLength = lengthRange[0];
      maxLength = lengthRange[1];
    }
    
    // The `focus` event
    // ---
    // Record that this field has been visited.
    Input._bind(_fieldDom, 'focus', function(event) {
      _form.visitedFields.push(_fieldName);
    });
    
    // The `keypress` event
    // ---
    if (validateInline || allowed !== '' || disallowed !== '') {
      Input._bind(_fieldDom, 'keypress', function(event) {
        var val = _fieldDom.value,
            sizeOkay,
            allowedOkay,
            disallowedOkay;
        
        // Get the character from the event. Note that `keypress`,
        // unlike `keydown`, represents actual characters and not
        // arbitrary codes.
        character = String.fromCharCode(event.which);
        if (!event.shiftKey) {
          character = character.toLowerCase();
        }
        
        // If `validateInline` is set, we validate on each keypress.
        if (validateInline) {
          _validate();
        }
        
        // A `keypress` means the user has attempted to fill this field.
        _form.attemptedFields.push(_fieldName);
        
        if (cajole) {
          console.log('cajoling')
        }
        
        if (preventInvalidInput) {
          // If there is a `size` rule, decide whether the character will make the
          // value too long.
          sizeOkay = size ? val.length < size : true;
          
          // If there is an `allowed` rule, decide whether the character is inside
          // the allowed set. 
          allowedOkay = allowed !== '' ? allowed.indexOf(character) > -1 : true;
          
          // If there is a `disallowed` rule, decide whether the character is outside
          // the disallowed set.
          disallowedOkay = disallowed !== '' ? disallowed.indexOf(character) === -1 : true;
          
          // Refuse the event (i.e., the insertion of the character in the field)
          // if the character violates any of those rules.
          return (sizeOkay && allowedOkay && disallowedOkay);
        }
      });
    }
    
    // Field validation
    // ---
    // Fields validate themselves for against rules passed. If there are rules
    // present in the form `options` and absent in the field rules, they are
    // respected. If the field specifies rules also specified by the form,
    // the field's rules take precedence.
    var _validate = function() {
      var value = _fieldDom.value,
          intValue = parseInt(value),
          errors = [];
      
      if (regex && !regex.test(value)) {
        errors.push('regex failure');
      }
      if (min && intValue < min) {
        errors.push('below min');
      }
      if (max && intValue > max) {
        errors.push('above max');
      }
      if (minLength && value.length < minLength) {
        errors.push('too short');
      }
      if (maxLength && value.length > maxLength) {
        errors.push('too long');
      }
      
      _form._addErrors(_fieldName, errors);
    }
    
    // The `blur` event
    // ---
    Input._bind(_fieldDom, 'blur', function(event) {
      _validate();
    });
  };
  
  // The `submit` event
  // ---
  Input._bind(_formDom, 'submit', function() {
    return false;
  });
  
  return this;
};
