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

Input.Form = function(form) {
  this.errors = {};
  this.fields = [];
  this.visitedFields = [];
  var _form = this,
      _formDom = form;
  console.log(_formDom)
  this._addError = function(field, error) {
    console.log(field)
    _form.errors[field] = error;
  };
  
  // Define the rules for a field.
  this.field = function(domElement, rules) {
    var _fieldName = domElement.attr('name') || domElement.attr('id');
    
    // Save references to the rules passed.
    var type = rules.type;
    var allowed = rules.allowed || '';
    var disallowed = rules.disallowed || '';
    var regex = rules.regex;
    
    // Confusion would reign if both `allowed` and `disallowed` were permitted.
    if (allowed !== '' && disallowed !== '') {
      throw new Error('Cannot specify both allowed and disallowed.');
    }
    
    // Types are just shortcuts to pre-defined `allowed` or `regex` values,
    // so insert those values if one was passed.
    if (type) {
      if (defaultAllowedKeys.indexOf(type) > -1) {
        allowed += defaultAllowed[type];
      }
      else if (defaultRegexKeys.indexOf(type) > -1) {
        regex = defaultRegex[type];
      }
    }
    
    // Allowed input
    // ---
    if (allowed !== '') {
      // Knowing that `allowed` is always an array makes our lives easier;
      // we make an assumption that if it's not then it's a string of allowed characters.
      if (!(allowed instanceof Array)) {
        allowed = allowed.split('');
      }
    }
    
    // Disallowed input
    // ---
    if (disallowed !== '') {
      if (!(disallowed instanceof Array)) {
        disallowed = disallowed.split('');
      }
    }
    
    // The `keypress` event
    // ---
    if (allowed !== '' || disallowed !== '') {
      domElement.keypress(function(event) {
        // Get the character from the event. Note that `keypress`,
        // unlike `keydown`, represents actual characters and not
        // arbitrary codes.
        character = String.fromCharCode(event.which);
        if (!event.shiftKey) {
          character = character.toLowerCase();
        }
        
        // Refuse the event if the character violates our rules.
        // `allowed.indexOf(character) > -1` means the character was in the `allowed` set;
        // `disallowed.indexOf(character) === -1` means the character was not in the `disallowed` set.
        return (allowed.indexOf(character) > -1 && disallowed.indexOf(character) === -1);
      });
    }
    
    // The `blur` event
    // ---
    domElement.blur(function(event) {
      var value = $(this).val();
      if (regex && !regex.test(value)) {
        _form._addError(_fieldName, 'regex failure');
      }
    });
  };
  
  // The `submit` event
  // ---
  _formDom.submit(function() {
    console.log('submit');
    return false;
  });
  
  return this;
};
