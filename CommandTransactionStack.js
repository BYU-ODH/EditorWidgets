(function(){
	if(typeof window.EditorWidgets !== 'object'){
		window.EditorWidgets = {};
	}
	EditorWidgets.CommandStack = function(){
		var transaction = [],
			unstack = [],
			restack = [];
		this.push = function(com){
			transaction.push(com);
			if(restack.length){ restack = []; } //erase redo stack
		};
		this.commit = function(){
			if(transaction.length){
				unstack.push(transaction);
				transaction = [];
			}
		};
		this.undo = function(){
			var c,i,obj;
			
			if(transaction.length){ c = transaction; }
			else if(unstack.length){ c = unstack.pop(); }
			else{ return; }
			
			restack.push(c);
			for(i=c.length-1;obj=c[i];i--){ obj.undo.call(obj.context); }
		};
		this.redo = function(){
			var c,i,obj;
			if(restack.length){
				c = restack.pop();
				unstack.push(c);
				for(i=0;obj=c[i];i++){ obj.redo.call(obj.context); }
			}
		};
	};
})();