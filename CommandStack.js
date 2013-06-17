(function(){
	if(typeof window.EditorWidgets !== 'object'){
		window.EditorWidgets = {};
	}
	
	EditorWidgets.CommandStack = function() {
		var unstack = [],
			restack = [],
			filemap = {
				"": {
					unstack: [],
					restack: [],
					saveIndex: 0
				}
			};
		/* Command object structure:
		 * context: the value of 'this' for undo/redo calls
		 * undo: the function to call to undo
		 * redo: the function to call to redo
		 * file: an identifier that allows removing commands from the stack
		 *	(e.g., if the file they relate to is closed)
		 */
		this.push = function(com,file){
			var fobj;
			if(typeof file !== 'string'){
				file = com.file || "";
			}
			unstack.push(file);
			if(!filemap.hasOwnProperty(file)){
				filemap[file] = {
					unstack: [com],
					restack: [],
					saveIndex: 0
				};
			}else{
				fobj = filemap[file];
				fobj.unstack.push(com);
				fobj.restack = [];
				//check if a saved state is reachable
				if(fobj.saveIndex >= fobj.unstack.length){
					saveIndex = -1;
				}
			}
		};
		
		this.undo = function(){
			var f, fobj, c;
			if(unstack.length){
				f = unstack.pop();
				restack.push(f);
				fobj = filemap[f];
				c = fobj.unstack.pop();
				fobj.restack.push(c);
				c.undo.call(c.context);
			}
		};
		
		this.redo = function(){
			var f, fobj, c;
			if(restack.length){
				f = restack.pop();
				unstack.push(f);
				fobj = filemap[f];
				c = fobj.restack.pop();
				fobj.unstack.push(c);
				c.redo.call(c.context);
			}
		};
		
		this.removeEvents = function(fname){
			function f(name){ return name !== fname; }
			unstack = unstack.filter(f);
			restack = restack.filter(f);
			delete filemap[fname];
		};
		
		this.renameEvents = function(o,n){
			if(filemap.hasOwnProperty(n)){
				this.removeEvents(n);
			}
			function f(name){ return name === o ? n : name; }
			unstack = unstack.map(f);
			restack = restack.map(f);
			filemap[n] = filemap[o];
			delete filemap[o];
		};
		
		this.fileExists = function(fname){
			return filemap.hasOwnProperty(fname);
		};
		
		this.isFileSaved = function(fname){
			var fobj = filemap[fname];
			return fobj?(fobj.saveIndex === fobj.unstack.length):true;
		};
		
		this.fileUndoDepth = function(fname){
			var fobj = filemap[fname];
			return fobj?fobj.unstack.length:0;
		};
		
		this.fileRedoDepth = function(fname){
			var fobj = filemap[fname];
			return fobj?fobj.restack.length:0;
		};
		
		Object.defineProperties(this,{
			undoDepth: {get:function(){ return unstack.length; },enumerable:true},
			redoDepth: {get:function(){ return restack.length; },enumerable:true},
			fileNames: {get:function(){ return Object.keys(filemap); },enumerable:true},
			saved: {
				get: function(){
					return !Object.keys(filemap).some(function(fname){
						var fobj = filemap[fname];
						return fobj.unstack.length !== fobj.saveIndex;
					});
				},
				set: function(v){
					v = !!v;
					Object.keys(filemap).forEach(
					b?function(fname){
						var fobj = filemap[fname];
						fobj.saveIndex = fobj.unstack.length;
					}:function(fname){
						filemap[fname].saveIndex = -1;
					});
					return v;
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