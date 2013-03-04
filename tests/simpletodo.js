var Log = Effect(function(v) {
	console.log(v);
});

function View(options) {
	var o = {};
	function each(ƒ) {
		return function parse(v,n,e){
			if (typeof v == "array") {
				for (i in v){
					return ƒ(i,n,e);
				}
			} else {
				return ƒ.call(this, v,n,e);
			}
		}
	}
	for (i in options) {
		if (options[i].isAction) {
			o[i] = options[i].bind(o);
		} else {
			o[i] = options[i];
		}
	}
	return o;
}

var App = View({
	el: $("#app"),
	form: $("form", this.el),
	list: $("#list"),
	counter: $("#counter"),
	todoInput: $(".todoInput", this.el),
	clearButton: $("#clear"),
	error: $(".error", this.el),
	cleanUI: Effect(function() {
		this.todoInput.val("");
		this.error.text("").hide();
	}),
	onError: function(e) {
		this.error.text(e).show();
	},
	submit: Event(function(n) {
		var self = this;
		this.todoInput.focus();
		$("form", this.el).on("submit",function(e) {
			e.preventDefault();
			n([{
				title: self.todoInput.val()
			}]);
			return false;
		});
	}),
	removeItem: Event(function(n) {
		this.list.on("click","li .remove",function() {
			var id = $(this).parent("li").attr("id");
			n([id]);
		});
	}),
	dbclickItem: Event(function(n) {
		this.list.on("change","li .edit",function() {
			var id = $(this).parent("li").attr("id");
			n([id]);
		});
	}),
	toggleDoneItem: Event(function(n) {
		this.list.on("change","li .toggle",function() {
			var id = $(this).parents("li").attr("id");
			n(id);
		});
	}),
	clearCompleted: Event(function(n) {
		this.clearButton.click(n);
	}),
	updateCounter: Effect(function(v) {
		this.counter.text( v.length );
	})
});

// TODO
var TodoView = View({
	el: $("#list"),
	template: function(v) {
		return "<input type='checkbox' class='toggle' value='"+(v.done?"checked":"")+"'> <strong>"+v.title+"</strong><span class='remove'>remove</span><input type='text' value='"+v.title+"' class='edit'>";
	},
	create: Call(function(l) {
		var self = this;
		l.forEach(function(v) {
			v.view = $("<li>").html( self.template(v) ).appendTo(self.el).attr("id", v.id);
		});
		return l;
	}),
	update: Effect(function(l) {
		var self = this;
		l.forEach(function(v) {
			v.view.html( self.template(v) )
		});
	}),
	getEdition: Call(function(l) {
		l.forEach(function(v) {
			v.title = v.view.find(".edit").val();
		});
		return l;
	}),
	remove: Effect(function(l) {
		var self = this;
		l.forEach(function(v) {
			v.view.remove();
		});
	}),
	showEdition: Async(function(v,n) { n(v); }),
	getChanges: Async(function(v,n) { n(v); }),
	get: Async(function(v,n) { n(v); })
});

function uuid() {
	function s4(i) {
		return Math.floor((1 + Math.random()) * 0x10000)
			.toString(16)
			.substring(1);
	}
	return s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4();
}


// TODO
var Todos = View({
	collection: [],
	all: Call(function() {
		return this.collection;
	}),
	create: Call(function(l) {
		l.forEach(function(v) {
			v.id = uuid();
			return v;
		});
		this.update(l);
		this.collection = this.collection.concat(l);
		return l;
	}),
	update: Effect(function(l) {
		l.forEach(function(v) {
			v.done = v.done || false;
			if (!v.title) throw("Ttile required");
		});
	}),
	remove: Call(function(l) {
		var self = this, i;
		l.forEach(function(v) {
			i = self.collection.indexOf(v);
			if (i >= 0) {
				self.collection.splice(i,1);
			}
		});
		return [];
	}),
	get: Async(function(v,n) {
		n(v);
	}),
	toggleDone: Call(function(l) {
		l.forEach(function(v) {
			v.done = !v.done;
		});
		return l;
	}),
	getToDos: Call(function(l) {
		return this.collection.filter(function(v) {
			return v.done != true;
		})
	}),
	getDone: Call(function(l) {
		console.log(this.collection.filter(function(v) {
			return v.done;
		}))
		return this.collection.filter(function(v) {
			return v.done;
		});
	}),
	getByUuids: Call(function(id) {
		var result = [], i = 0;
		while (!result.length) {
			if (this.collection[i].id == id) {
				result.push(this.collection[i]);
			}
			i++;
		}
		return result;
	})
});

// TODO
var Todos2 = Collection({
	model: {
		title: function(t) {
			if (!t) throw "A todo must have a title";
			return t;
		},
		done: false
	},

	toggleDone: Call(function(list) {
		for (i in list) {
			list[i].set("done", !list[i].get("done"));
		}
		return list;
	}),

	getDone: Call(function(value) {
		return this(function(i) { return i.done; });
	}),

	getByUuids: Call(function(value) {
		return this(i);
	})
});


var UpdateCounter = Do(Todos.getToDos, App.updateCounter)

When( App.submit )
	.then(
		Todos.create,
		TodoView.create,
		App.cleanUI,
		UpdateCounter
	)
	.on()

When( App.clearCompleted )
	.then(
		Todos.getDone,
		TodoView.remove,
		Todos.remove,
		UpdateCounter
	)
	.on()

When( App.removeItem )
	.then(
		Todos.getByUuids,
		TodoView.remove,
		Todos.remove,
		UpdateCounter
	)
	.on()

When( App.dbclickItem )
	.then(
		Todos.getByUuids,
		TodoView.getEdition,
		TodoView.update,
		UpdateCounter
	)
	.on()

When( App.toggleDoneItem )
	.then(
		Todos.getByUuids,
		Todos.toggleDone,
		UpdateCounter
	)
	.on()





