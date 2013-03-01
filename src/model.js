(function() {

	function uuid() {
		function s4(i) {
			return Math.floor((1 + Math.random()) * 0x10000)
				.toString(16)
				.substring(1);
		}
		return s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4();
	}

	function isFunction(f) {
		return f && {}.toString.call(f) === '[object Function]';
	}

	function Shell(model) {

		function item(properties) {
			var id = uuid();
			var __ = {};

			function shell(newProperties) {
				if (newProperties){
					var allProperties = {};
					for (i in newProperties) {
						allProperties[i] = newProperties[i];
					}
					// Validate
					for (i in model) {
						if (isFunction(model[i])) {
							allProperties[i] = model[i]( newProperties[i] );
						} else if (!allProperties[i] && !properties[i]) {
							// Default values
							allProperties[i] = model[i];
						}
					}
					for (i in allProperties) {
						properties[i] = allProperties[i];
					}
				} else {
					return properties;
				}
			}

			shell.set = function(key, value) {
				properties[key] = value;
				return shell;
			}

			shell.get = function(key) {
				return properties[key];
			}

			shell.view = function(view) {
				if (view) {
					__.view = view;
				} else {
					return __.view;
				}
			}

			shell.id = id;
			shell.properties = properties;
			shell(properties);

			shell.toString = function() {
				return JSON.stringify(properties);
			}

			return shell;
		}

		return function(properties) {
			return item(properties);
		}
	}

	var Collection = function(desc){
		var collection = {};
		model = Shell(desc.model);

		function C(id) {
			if (!id) {
				return collection;
			} else if (isFunction(id)) {
				return C.filter(id);
			} else if (typeof id == 'string' || id instanceof String) {
				return collection[id];
			} else {
				throw "not implemented yet";
			}
		}

		C.forEach = C.each = function(iterator) {
			for (i in collection) {
				iterator(collection[i]())
			}
		}

		C.filter = function(filter) {
			var result = [];
			for (i in collection) {
				if (filter(collection[i]())) result.push(collection[i]);
			}
			return result;
		}

		C.map = C.collect = function(shell) {}
		C.reduce = C.foldl = C.inject = function(shell) {}
		C.reduceRight = C.foldr = function(shell) {}
		C.find = C.detect = function(shell) {}
		C.filter = C.select = function(shell) {}
		C.reject = function(shell) {}
		C.every = C.all = function(shell) {}
		C.some = C.any = function(shell) {}
		C.include = C.contains = function(shell) {}
		C.invoke = function(shell) {}
		C.sortBy = function(shell) {}
		C.groupBy = function(shell) {}
		C.sortedIndex = function(shell) {}
		C.shuffle = function(shell) {}
		C.toArray = function(shell) {}
		C.size = function(shell) {}
		C.first = C.head = C.take = function(shell) {}
		C.initial = function(shell) {}
		C.rest = C.tail = function(shell) {}
		C.last = function(shell) {}
		C.without = function(shell) {}
		C.indexOf = function(shell) {}
		C.lastIndexOf = function(shell) {}
		C.isEmpty = function(shell) {}

		C.create = function(value) {
			var shell = model(value);
			collection[shell.id] = shell;
			return shell;
		}

		C.remove = function(shell) {
			delete collection[shell.id];
			return [];
		}

		C.reset = function(shell) {}
		C.add = function(shell) {}
		C.remove = function(shell) {}
		C.reset = function(shell) {}
		C.update = function(shell) {}
		C.get = function(shell) {}
		C.at = function(shell) {}
		C.push = function(shell) {}
		C.pop = function(shell) {}
		C.unshift = function(shell) {}
		C.shift = function(shell) {}
		C.slice = function(shell) {}
		C.length = function(shell) {}
		C.comparator = function(shell) {}
		C.sort = function(shell) {}
		C.pluck = function(shell) {}
		C.where = function(shell) {}
		C.parse = function(shell) {}

		C.collection = function(){
			return collection;
		}

		C.toJSON = function(){
			var result = [];
			for (i in collection) {
				result.push(collection[i]());
			}
			return result;
		}

		desc.toString = C.toString = function() {
			return JSON.stringify(collection);
		}

		for (i in desc) {
			C[i] = desc[i]
		}

		return C;
	}

	window.Collection = Collection;

}());
