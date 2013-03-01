var Log = Effect(function(v) {
	console.log(v);
});
var Fake = Async(function(v,n) {
	setTimeout(function() {
		n(v);
	}, 500);
})

function View(options) {
	var o = {};
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
	list: $("#list"),
	value: $(".input", this.el),
	clearButton: $(".clear", this.el),
	error: $(".error", this.el),
	cleanUI: Effect(function() {
		this.value.val("");
		this.error.text("").hide();
		this.el.find(".title").focus();
	}),
	onError: function(e) {
		this.error.text(e).show();
	},
	submit: Event(function(n) {
		$("form", this.el).submit(function(e) {
			e.preventDefault();
			n({
				title: $("form", this.el).find(".title").val()
			});
			return false;
		});
	}),
	removeItem: Event(function(n) {
		this.list.on("click","li .remove",function() {
			var id = $(this).parent("li").attr(id);
			n([id]);
		});
	}),
	dbclickItem: Event(function(n) {
		this.list.on("click","li .edit",function() {
			var id = $(this).parent("li").attr(id);
			n([id]);
		});
	}),
	toggleDoneItem: Event(function(n) {
		this.list.on("click","li .toggle",function() {
			var id = $(this).parent("li").attr(id);
			n([id]);
		});
	}),
	clearCompleted: Event(function(n) {
		this.clearButton.click(n);
	})
});

// TODO
var TodoService = {
	post: Fake,
	put: Fake,
	del: Fake,
	get: Fake
}

// TODO
var TodoView = {
	create: Async(function(v,n) { n(v); }),
	update: Async(function(v,n) { n(v); }),
	remove: Async(function(v,n) { n(v); }),
	showEdition: Async(function(v,n) { n(v); }),
	getChanges: Async(function(v,n) { n(v); }),
	get: Async(function(v,n) { n(v); })
}

// TODO
var Todos = {
	create: Async(function(v,n) { n(v); }),
	update: Async(function(v,n) { n(v); }),
	remove: Async(function(v,n) { n(v); }),
	get: Async(function(v,n) { n(v); }),
	toggleDone: Async(function(v,n) { n(v); }),
	getDone: Async(function(v,n) { n(v); }),
	getByUuids: Async(function(v,n) { n(v); }),
	deleteItems: Async(function(v,n) { n(v); })
}

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

var Cancelable = (function() {

	var history = [];
	// TODO
	window.undo = function(f,v) {
		var o = history.pop();
		o[0](o[1]);
	}

	return function(label, action, undo) {
		return Do(function(v,n) {
			history.push([undo,v]);
			action(v);
		})
	}
}());

var NetworkActivity = (function() {
	var el = $("#loading");
	// TODO
	function before(label) {
		return Async(function(v,n) {
			el.html(label).show();
			console.log("start network", label)
			n(v);
		});
	}
	// TODO
	function after(label) {
		return Async(function(v,n) {
			el.html("").hide();
			console.log("close network", label)
			n(v);
		});
	}

	return function(label, action) {
		return Do(
			before(label),
			action,
			after(label)
		)
	}
}());

var NotCancelable = (function() {

	// TODO
	function before(label) {
		return Async(function(v,n) {
			if (confirm(label)) {
				n(v);
			}
		});
	}

	return function(label, action) {
		return Do(
			before(label),
			action
		)
	}
}());

When( App.submit )
	.then(
		Log,
		NetworkActivity(
			"Creating todo...",
			TodoService.post.onfail( App.networkError )
		),
		Log,
		Todos.create, // Need the right model in "Cancelable"
		Log,
		Cancelable(
			"Undo new todo",
			Do(
				TodoView.create,
				App.cleanUI
			),
			Do(
				NetworkActivity(
					"Deleting recent todo...",
					TodoService.del.onfail( App.networkError )
				),
				TodoView.remove,
				Todos.remove
			)
		)
	)
	.on()

var deleteItems = NotCancelable(
	"This action is definitive, are you sure?",
	Do(
		NetworkActivity(
			"Deleting todo(s)...",
			TodoService.del.onfail( App.networkError )
		),
		Todos.remove,
		TodoView.remove
	)
)

When( App.clearCompleted )
	.then(
		Todos.getDone,
		deleteItems
	)
	.on()

When( App.removeItem )
	.then(
		Todos.getByUuids,
		Todos.deleteItems
	)
	.on()

When( App.dbclickItem )
	.then(
		Todos.getByUuids,
		TodoView.showEdition,
		Cancelable(
			"Undo todo update",
			Do(
				TodoView.getChanges,
				NetworkActivity(
					"Updating todo...",
					TodoService.put.onfail( App.networkError )
				),
				Todos.update,
				TodoView.update
			),
			NetworkActivity(
				"Restauring todo...",
				TodoService.put.onfail( App.networkError )
			)
			.then( Todos.update, TodoView.update )
		)
	)
	.on()

When( App.toggleDoneItem )
	.then(
		Todos.getByUuids,
		Cancelable(
			"Undo toggle todo(s)",
			Do( 
				Todos.toggle,
				NetworkActivity(
					"Updating todo(s)...",
					TodoService.put.onfail( App.networkError )
				),
				Todos.update,
				TodoView.update
			),
			Do(
				NetworkActivity(
					"Restauring todo...",
					TodoService.put.onfail( App.networkError )
				),
				Todos.update,
				TodoView.update
			)
		)
	)
	.on()





