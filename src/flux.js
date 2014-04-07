function Flux() {

  function noop() {}

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

    var Chain = Flux.Chain = function(value, next) {
      var _call = next ? callbacks.concat([next]) : callbacks;
      Execution(_call)(value);
    }

    Chain.run = function() {
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
      var _call = a instanceof Array ? a : [].slice.call(arguments);
      return Wrapper(callbacks.concat( _call ));
    }

    Chain.await = function(a) {
      var _call = a instanceof Array ? AwaitWrapper(a) : AwaitWrapper([].slice.call(arguments));
      return Wrapper(callbacks.concat( _call ));
    }

    Chain.either = function(a) {
      var _call = a instanceof Array ? EitherWrapper(a) : EitherWrapper([].slice.call(arguments));
      return Wrapper(callbacks.concat( _call ));
    }

    Chain.defer = function(t) {
      var _call = function(v,n) {
        setTimeout(n,(t || 0),v);
      }
      return Wrapper(callbacks.concat( _call ));
    }

    // -------------------------
    // Manage the FLOW of values
    // -------------------------
    Chain.each = function(process) {
      var _call = function(value, next) {
        process(value);
        next(value);
      }
      return Wrapper(callbacks.concat([ _call ]));
    }

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
        value.forEach(process);
        next(value);
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

    return Chain;
  }

  // ---------------
  // Inner functions
  // ---------------
  function EitherWrapper(funcs) {
    return function(value, next, error){
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

  function AwaitWrapper(funcs) {
    return function(value, next, error){
      var results = [],
        done = 0;
      function notifier(i) {
        return function(result) {
          done ++;
          results[i] = result;
          if (done === funcs.length) {
            next(results);
          }
        }
      }
      for (var i = 0; i < funcs.length; i++) {
        funcs[i].call(this,value, notifier(i), error);
      }
    }
  }

  return Wrapper([]);
}


function When(func) {
  return Flux().then(func);
}
function Do() {
  return Flux().then([].slice.call(arguments));
}
function Await() {
  return Flux().await([].slice.call(arguments));
}
function Either() {
  return Flux().either([].slice.call(arguments));
}

// -------------------------
// Manage the ACTIONS
// -------------------------
function Action(func) {
  function ActionWrapper(value, next){
    return func.call((ActionWrapper.context || this),value, next, this.errorHandler);
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
function Async(func) {
  return Action(func);
}
function Call(func) {
  return Action(function(value, next, error) {
    var _result = func.call(this, value, error);
    if(next) next( _result );
    return _result;
  });
}
function Effect(func) {
  return Action(function(value, next, error) {
    func.call(this,value, error);
    if(next) next( value );
  });
}
function Event(func) {
  return Action(function(value, next, error) {
    func.call(this, next, error);
  });
}
