(function(){
	if(typeof window.EditorWidgets !== 'object'){
		window.EditorWidgets = {};
	}

	EditorWidgets.CommandStack = function() {
		var unstack = [],
			restack = [],
			transaction = -1,
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
			if(typeof file !== 'string'){ file = com.file || ""; }

			com.file = file;
			unstack.push(com);

			if(!filemap.hasOwnProperty(file)){
				filemap[file] = {
					undepth: 1,
					redepth: 0,
					saveIndex: 0,
					// maps save locations to the depth in the
					// undo stack at which they were saved to
					saveIndices: {}
				};
			}else{
				fobj = filemap[file];
				fobj.undepth++;
				fobj.redepth = 0;
				// check if a saved state is reachable
				len = fobj.undepth;
				if(fobj.saveIndex >= len){ fobj.saveIndex = -1; }
				indices = fobj.saveIndices;
				Object.keys(indices).forEach(function(key){
					if(indices[key] >= len){ indices[key] = -1; }
				});
			}
		};

		this.transaction = function(work){
			if(transaction === -1){
				transaction = unstack.depth;
				if(typeof work === 'function'){
					work(this);
					this.commit();
				}
			}else if(typeof work === 'function'){
				work(this);
			}
		};

		this.commit = function(){
			var unactions;
			if(unstack.length === transaction){ transaction = -1; }
			if(transaction === -1){ return; }
			unactions = unstack.splice(transaction);
			unstack.push({
				// It would be nice to use symbols here,
				// but they aren't supported widely enough
				file: 0,
				unactions: unactions,
				reactions: unactions.slice().reverse()
			});
			transaction = -1;
		};

		this.undo = function(){
			var com;
			if(unstack.length === 0){ return; }
			if(unstack.length === transaction){
				// cancel if we undo past beginning without committing
				transaction = -1;
			}

			com = unstack.pop();
			restack.push(com);
			(typeof com.file === 'string'?[com]:com.unactions)
			.forEach(function(com){
				var fobj = filemap[com.file];
				fobj.undepth--;
				fobj.redepth++;
				com.undo.call(com.context);
			});
		};

		this.redo = function(){
			var com;
			if(restack.length === 0){ return; }

			com = restack.pop();
			unstack.push(com);
			(typeof com.file === 'string'?[com]:com.reactions)
			.forEach(function(com){
				var fobj = filemap[com.file];
				fobj.undepth++;
				fobj.redepth--;
				com.redo.call(com.context);
			});
		};

		this.removeEvents = function(fname){
			function f(com){ return com.file !== fname; }
			function ft(com){
				if(com.file !== 0){ return; }
				com.unactions = com.unactions.filter(f);
				com.reactions = com.reactions.filter(f);
			}
			unstack = unstack.filter(f);
			restack = restack.filter(f);
			unstack.forEach(ft);
			restack.forEach(ft);
			delete filemap[fname];
		};

		this.renameEvents = function(o,n){
			if(filemap.hasOwnProperty(n)){
				this.removeEvents(n);
			}
			function f(com){
				if(com.file === o){ com.file = n; }
				else if(com.file === 0){
					com.unactions.forEach(f);
					com.reactions.forEach(f);
				}
			}
			unstack.forEach(f);
			restack.forEach(f);
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
				=== fobj.undepth;
		};

		this.getFileSavedLocations = function(fname){
			var fobj = filemap[fname];
			if(fobj === void 0){ return []; }
			return Object.keys(fobj.saveIndices).filter(function(key){
				return fobj.saveIndices[key] === fobj.undepth;
			});
		};

		this.setFileSaved = function(fname, loc){
			var fobj;
			if(filemap.hasOwnProperty(fname)){
				fobj = filemap[fname];
			}else{
				fobj = {
					undepth: 0,
					redepth: 0,
					saveIndex: -1,
					saveIndices: {}
				};
				filemap[fname] = fobj;
			}
			if(loc === void 0){ fobj.saveIndex = fobj.undepth; }
			else{ fobj.saveIndices[loc] = fobj.undepth; }
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
				filemap[fname].saveIndex = -1;
			}else{
				filemap[fname].saveIndices[loc] = -1;
			}
		};

		this.fileUndoDepth = function(fname){
			var fobj = filemap[fname];
			return fobj?fobj.undepth:0;
		};

		this.fileRedoDepth = function(fname){
			var fobj = filemap[fname];
			return fobj?fobj.redepth:0;
		};

		this.isSavedAt = function(loc){
			return !Object.keys(filemap).some(function(fname){
				var fobj = filemap[fname];
				return fobj.undepth !== fobj.saveIndices[loc];
			});
		};

		this.setSavedAt = function(v, loc){
			v = !!v;
			Object.keys(filemap).forEach(
			v?function(fname){
				var fobj = filemap[fname];
				fobj.saveIndices[loc] = fobj.undepth;
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
						return fobj.undepth !== fobj.saveIndex;
					});
				},
				set: function(v){
					v = !!v;
					Object.keys(filemap).forEach(
					v?function(fname){
						var fobj = filemap[fname];
						fobj.saveIndex = fobj.undepth;
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