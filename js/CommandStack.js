(function(){
	if(typeof window.EditorWidgets !== 'object'){
		window.EditorWidgets = {};
	}
	
	EditorWidgets.CommandStack = function() {
		var unstack = [],
			restack = [],
			filemap = {};
		/* Command object structure:
		 * context: the value of 'this' for undo/redo calls
		 * undo: the function to call to undo
		 * redo: the function to call to redo
		 * file: an identifier that allows removing commands from the stack
		 *	(e.g., if the file they relate to is closed)
		 */
		this.push = function(com,file){
			var fobj, indices, len;
			if(typeof file !== 'string'){
				file = com.file;
			}
			unstack.push(file);
			if(!filemap.hasOwnProperty(file)){
				filemap[file] = {
					unstack: [com],
					restack: [],
					saveIndex: 0,
					saveIndices: {}
				};
			}else{
				fobj = filemap[file];
				fobj.unstack.push(com);
				fobj.restack = [];
				len = fobj.unstack.length;
				//check if a saved state is reachable
				if(fobj.saveIndex >= len){ fobj.saveIndex = -1; }
				indices = fobj.saveIndices;
				Object.keys(indices).forEach(function(key){
					if(indices[key] >= len){ indices[key] = -1; }
				});
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
		
		this.isFileSaved = function(fname, loc){
			var fobj = filemap[fname];
			if(fobj === void 0){ return true; }
			return (loc === void 0?fobj.saveIndex:fobj.saveIndices[loc])
				=== fobj.unstack.length;
		};

		this.getFileSavedLocations = function(fname){
			var fobj = filemap[fname];
			if(fobj === void 0){ return []; }
			return Object.keys(fobj.saveIndices).filter(function(key){
				return fobj.saveIndices[key] === fobj.unstack.length;
			});
		};
		
		this.setFileSaved = function(fname, loc){
			var fobj;
			if(filemap.hasOwnProperty(fname)){
				fobj = filemap[fname];
			}else{
				fobj = {
					unstack: [],
					restack: [],
					saveIndex: -1,
					saveIndices: {}
				};
				filemap[fname] = fobj;
			}
			if(loc === void 0){ fobj.saveIndex = fobj.unstack.length; }
			else{ fobj.saveIndices[loc] = fobj.unstack.length; }
		};

		this.setFileUnsaved = function(fname, loc){
			if(!filemap.hasOwnProperty(fname)){
				filemap[fname] = {
					unstack: [],
					restack: [],
					saveIndex: -1,
					saveIndices: {}
				};
			}else if(loc === void 0){
				filemap[file].saveIndex = -1;
			}else{
				filemap[file].saveIndices[loc] = -1;
			}
		};
		
		this.fileUndoDepth = function(fname){
			var fobj = filemap[fname];
			return fobj?fobj.unstack.length:0;
		};
		
		this.fileRedoDepth = function(fname){
			var fobj = filemap[fname];
			return fobj?fobj.restack.length:0;
		};
		
		this.isSavedAt = function(loc){
			return !Object.keys(filemap).some(function(fname){
				var fobj = filemap[fname];
				return fobj.unstack.length !== fobj.saveIndices[loc];
			});
		};
		
		this.setSavedAt = function(v, loc){
			v = !!v;
			Object.keys(filemap).forEach(
			v?function(fname){
				var fobj = filemap[fname];
				fobj.saveIndices[loc] = fobj.unstack.length;
			}:function(fname){
				filemap[fname].saveIndices[loc] = -1;
			});
			return v;
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
					v?function(fname){
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
}());