(function(){
	if(typeof window.EditorWidgets !== 'object'){
		window.EditorWidgets = {};
	}
	EditorWidgets.CommandStack = function() {
		var unstack = [],
			restack = [],
			saveIndex = 0;
		/* Command object structure:
		 * context: the value of 'this' for undo/redo calls
		 * undo: the function to call to undo
		 * redo: the function to call to redo
		 * file: an identifier that allows removing commands from the stack
		 *	(e.g., if the file they relate to is closed)
		 */
		this.push = function(com){
			unstack.push(com);
			restack = []; //erase redo stack
			if(saveIndex >= unstack.length){ //check if a saved state is reachable
				saveIndex = -1;
			}
		};
		this.undo = function(){
			var c;
			if(unstack.length){
				c = unstack.pop();
				restack.push(c);
				c.undo.call(c.context);
			}
		};
		this.redo = function(){
			var c;
			if(restack.length){
				c = restack.pop();
				unstack.push(c);
				c.redo.call(c.context);
			}
		};
		this.removeEvents = function(name){
			function f(e){ return e.file !== name; }
			unstack = unstack.filter(f);
			restack = restack.filter(f);
		};
		this.renameEvents = function(o,n){
			function f(e){ if(e.file === o){ e.file = n; } }
			unstack.forEach(f);
			restack.forEach(f);
		};
		Object.defineProperties(this,{
			undoDepth: {get:function(){ return unstack.length; },enumerable:true},
			redoDepth: {get:function(){ return restack.length; },enumerable:true},
			saved: {
				get: function(){ return unstack.length === saveIndex; },
				set: function(v){
					var b = !!v;
					saveIndex = b?unstack.length:-1;
					return b;
				},
				enumerable:true
			}
		});
	};
	
	EditorWidgets.CommandStack.prototype.bindKeyEvents = function(el){
		var that = this;
		el.addEventListener("keydown",function(e){
			e = e||window.event;
			if(!e.ctrlKey){ return; }
			switch(e.keyCode){
			case 89: that.redo();
				e.preventDefault();
				break;
			case 90: that.undo();
				e.preventDefault();
				break;
			}
		},false);
	};
})();