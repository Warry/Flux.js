function noop(){}

function isFunction(f) {
	return f && {}.toString.call(f) === '[object Function]';
}

function isArray(a) {
	return a && {}.toString.call(a) === '[object Array]';
}

function extend(obj) {
	[].slice.call(arguments, 1).forEach(function(source) {
		if (source) {
			for (var prop in source) {
				obj[prop] = source[prop];
			}
		}
	});
	return obj;
}

function Flux(first) {

	function Execution(callbacks) {
		return function(value) {
			if (callbacks.length > 1) {
				callbacks[0].call(this, value, Execution(callbacks.slice(1)));
			} else {
				callbacks[0].call(this, value, noop);
			}
		}
	}

	function Wrapper(callbacks) {

		function Chain(value, next) {
			var _call = next ? callbacks.concat([next]) : callbacks;
			Execution(_call)(value);
		}

		Chain.on = function() {
			this();
		}

		Chain.onfail = function(error) {
			var previous = callbacks.pop(),
				_call = function(value, next){
				previous(value, next, error);
			}
			return Wrapper(callbacks.concat([ _call ]));
		}

		// ----------------------------
		// Manage the FLOW of functions
		// ----------------------------
		Chain.then = function(a) {
			if (!a && (!isFunction(a) || a[0])) throw ".then needs an Action";
			var _call = a instanceof Array ? a : [].slice.call(arguments);
			return Wrapper(callbacks.concat( _call ));
		}

		Chain.await = function(a) {
			if (!a && (!isFunction(a) || a[0])) throw ".await needs an Action";
			var _call = a instanceof Array ? MultipleWrapper(a) : MultipleWrapper([].slice.call(arguments));
			return Wrapper(callbacks.concat( _call ));
		}

		Chain.either = function(a) {
			if (!a && (!isFunction(a) || a[0])) throw ".either needs an Action";
			var _call = a instanceof Array ? EitherWrapper(a) : EitherWrapper([].slice.call(arguments));
			return Wrapper(callbacks.concat( _call ));
		}

		// -------------------------
		// Manage the FLOW of values
		// -------------------------
		Chain.map = function(process) {
			var _call = function(value, next) {
				next(process(value));
			}
			return Wrapper(callbacks.concat([ _call ]));
		}

		Chain.filter = function(process) {
			var _call = function(value, next) {
				if (process(value)) next(value);
			}
			return Wrapper(callbacks.concat([ _call ]));
		}

		Chain.eachVal = function(process) {
			var _call = function(value, next) {
				next(value.map(process));
			}
			return Wrapper(callbacks.concat([ _call ]));
		}

		Chain.mapVal = function(process) {
			var _call = function(value, next) {
				next(value.map(process));
			}
			return Wrapper(callbacks.concat([ _call ]));
		}

		Chain.filterVal = function(process) {
			var _call = function(value, next) {
				next(value.filter(process));
			}
			return Wrapper(callbacks.concat([ _call ]));
		}

		Chain.trigger = function(process) {
			var _call = function(value, next) {
				process(value);
				next(process(value));
			}
			return Wrapper(callbacks.concat([ _call ]));
		}

		// -------------------------
		// Manage the FLOW of results
		// -------------------------
		// Force the value passed to next function
		Chain.force = function(forced) {
			var _call = function(passed, next) {
				return next(forced);
			}
			return Wrapper(callbacks.concat([ _call ]));
		}

		Chain.silent = function() {
			var previous = callbacks.pop(),
				_call = function(value, next){
					previous(value, function(){ next(value) }, error);
				}
			return Wrapper(callbacks.concat([ _call ]));
		}

		Chain.match = function() {
			return Wrapper(callbacks);
		}

		Chain.ifelse = function() {
			return Wrapper(callbacks);
		}

		return Chain;
	}

	// ---------------
	// Inner functions
	// ---------------
	function EitherWrapper(funcs) {
		return function(next, value, error){
			var done;
			function notifier(value) {
				if (done) return false;
				next(value);
				done = true;
			}
			for (var i = 0; i < funcs.length; i++) {
				funcs[i].call(this,notifier,value, error);
			}
		}
	}

	function MultipleWrapper(funcs) {
		return function(next, value, error){
			var results = [],
				done = 0;
			function notifier(i) {
				return Flux(function(_ignore,result) {
					done ++;
					results[i] = result;
					if (done === funcs.length) {
						next(results);
					}
				},onfail);
			}
			for (var i = 0; i < funcs.length; i++) {
				funcs[i].call(this,notifier(i),value, error);
			}
		}
	}

	return Wrapper([]);
}
function When(ƒ) {
	return Flux([]).then(ƒ);
}
function Do() {
	return Flux([]).then([].slice.call(arguments));
}
function Await() {
	return Flux([]).await([].slice.call(arguments));
}
function Either() {
	return Flux([]).either([].slice.call(arguments));
}

// -------------------------
// Manage the ACTIONS
// -------------------------
function Action(ƒ) {
	function ActionWrapper(value, next){
		return ƒ.call((ActionWrapper.context || this),value, next, this.errorHandler);
	}
	ActionWrapper.onfail = function(errorHandler) {
		this.errorHandler = errorHandler;
		return this;
	}
	ActionWrapper.isAction = true;
	ActionWrapper.bind = function(ctx) {
		this.context = ctx;
		return this;
	}
	return ActionWrapper;
}
function Async(ƒ) {
	return Action(ƒ);
}
function Call(ƒ) {
	return Action(function(value, next, error) {
		var _result = ƒ.call(this, value, error);
		if(next) next( _result );
		return _result;
	});
}
function Effect(ƒ) {
	return Action(function(value, next, error) {
		ƒ.call(this,value, error);
		if(next) next( value );
	});
}
function Event(ƒ) {
	return Action(function(value, next, error) {
		ƒ.call(this, next, error);
	});
}

// Async[ position of value , position of next ]
function Async12(ƒ, f1, f2) {	return Action(function(value,next){ ƒ.call(this, value, next, f1, f2) }) }
function Async13(ƒ, f1, f2) {	return Action(function(value,next){ ƒ.call(this, value, f1, next, f2) }) }
function Async14(ƒ, f1, f2) {	return Action(function(value,next){ ƒ.call(this, value, f1, f2, next) }) }
function Async21(ƒ, f1, f2) {	return Action(function(value,next){ ƒ.call(this, next, value, f1, f2) }) }
function Async23(ƒ, f1, f2) {	return Action(function(value,next){ ƒ.call(this, f1, value, next, f2) }) }
function Async24(ƒ, f1, f2) {	return Action(function(value,next){ ƒ.call(this, f1, value, f2, next) }) }
function Async31(ƒ, f1, f2) {	return Action(function(value,next){ ƒ.call(this, next, f1, value, f2) }) }
function Async32(ƒ, f1, f2) {	return Action(function(value,next){ ƒ.call(this, f1, next, value, f2) }) }
function Async34(ƒ, f1, f2) {	return Action(function(value,next){ ƒ.call(this, f1, f2, value, next) }) }
function Async41(ƒ, f1, f2) {	return Action(function(value,next){ ƒ.call(this, next, f1, f2, value) }) }
function Async42(ƒ, f1, f2) {	return Action(function(value,next){ ƒ.call(this, f1, next, f2, value) }) }
function Async43(ƒ, f1, f2) {	return Action(function(value,next){ ƒ.call(this, f1, f2, next, value) }) }

function Call1(ƒ, f1, f2, f3) {	return Call(function(value){ ƒ.call(this, value, f1, f2, f3) }) }
function Call2(ƒ, f1, f2, f3) {	return Call(function(value){ ƒ.call(this, f1, value, f2, f3) }) }
function Call3(ƒ, f1, f2, f3) {	return Call(function(value){ ƒ.call(this, f1, f2, value, f3) }) }
function Call4(ƒ, f1, f2, f3) {	return Call(function(value){ ƒ.call(this, f1, f2, f3, value) }) }

function Effect1(ƒ, f1, f2, f3) {	return Effect(function(value){ ƒ.call(this, value, f1, f2, f3) }) }
function Effect2(ƒ, f1, f2, f3) {	return Effect(function(value){ ƒ.call(this, f1, value, f2, f3) }) }
function Effect3(ƒ, f1, f2, f3) {	return Effect(function(value){ ƒ.call(this, f1, f2, value, f3) }) }
function Effect4(ƒ, f1, f2, f3) {	return Effect(function(value){ ƒ.call(this, f1, f2, f3, value) }) }

function JqueryAsync(ƒ, options) {
	return Action(function(value, next, error){
		ƒ.call(this, extend({ success: next, error: error}), options);
	})
}


// -------------------------
// Manage the FLOW of values
// -------------------------
// Merge function result object (passed) with forced object
Flux.merge = function(self, forced) {
	return function(passed){
		return self(extend(forced, passed));
	}
}

// Tuple function result object with forced
Flux.tuple = function(self, forced) {
	return function(passed){
		return self([forced, passed]);
	}
}

// Force the value passed to the function
Flux.force = function(self, forced) {
	return function(){
		return self(forced);
	}
}


