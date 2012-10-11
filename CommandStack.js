(function(){
	if(typeof window.EditorWidgets !== 'object'){
		window.EditorWidgets = {};
	}
	EditorWidgets.CommandStack = function() {
		var unstack = [],
			restack = [];
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
		}
	};
})();