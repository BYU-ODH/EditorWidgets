(function(){
	if(typeof window.EditorWidgets !== 'object'){
		window.EditorWidgets = {};
	}
	EditorWidgets.CommandStack = function() {
		var unstack = [],
			restack = [];
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
	};
})();