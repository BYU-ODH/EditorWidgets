EditorWidgets
=============

Widgets and functions that are useful for web-based editing applications.

##CommandStack
Initialize: `var stack = new EditorWidgets.CommandStack();`  
Methods:  
* push(obj) - Takes an object with the following fields:
	* undo - a function to execute to undo an action
	* redo - a function to execute to redo an action
	* context - the `this` binding for the undo and redo functions
	
	and adds it to the undo stack and clears the redo stack.
* undo() - Pops the last command object off the undo stack, executes its undo function, and adds it to the redo stack.
* redo() -	Pops the last command off the redo stack, executes its redo function, and adds it to the undo stack.


##Save(files, target, [success, [error]])
* files: a list of objects with the following fields:
	* collection - the name of the collection of files this file belongs to, if any
	* name - the name of this file
	* mime - the mime type for the file
	* data - the actual file contents
* target: the url to upload files to, or 'file' for a local save
* success(responseText): a callback function for HTTP success response codes; ignored for local saves
* error(responseText): a callback function for HTTP error response codes; ignored for local saves