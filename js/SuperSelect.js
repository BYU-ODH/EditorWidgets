(function(){
	if(typeof window.EditorWidgets !== 'object'){
		window.EditorWidgets = {};
	}

	/*	text, button, icon, multiple, target,
		options, value, name, id, modal,
		defaultOption
	*/
	function SuperSelect(args){
		var that = this, open = false,
			text, icon, leftbtn, rightbtn, btnpos,
			target, parent, refnode, select, multiple,
			options, defOpt, tmpopts, modal,
			value = [], lastFilter = +(new Date),
			main = document.createElement('div'),
			rightbtn = document.createElement('button'),
			controls = document.createElement('div'),
			badgeHolder = document.createElement('span'),
			defBadge = document.createElement('span'),
			noSelection = document.createElement('span'),
			popup = document.createElement('div'),
			point = document.createElement('div'),
			filterbox = document.createElement('input'),
			filterdiv = document.createElement('div'),
			optionList = document.createElement('div');

		this.events = {};
		Object.defineProperties(this,{
			name: {
				get: function(){ return select.name; },
				set: function(n){
					n = ""+n;
					if(select.name !== n){
						select.name = n;
						this.emit("namechange");
					}
					return select.name;
				}
			},
			id: {
				get: function(){ return select.id; },
				set: function(id){
					id = ""+id;
					if(select.id !== id){
						select.id = id;
						this.emit("idchange");
					}
					return select.id;
				}
			},
			text: {
				get: function(){ return text; },
				set: function(t){
					var btn;

					t = t?""+t:"Select";
					if(text === t){ return t; }
					text = t;

					btn = leftbtn.childNodes[0];
					btn.replaceChild(document.createTextNode(text),btn.childNodes[1]);
					btn = rightbtn.childNodes[0];
					btn.replaceChild(document.createTextNode(text),btn.childNodes[1]);

					this.emit("textchange");
					return text;
				}
			},
			icon: {
				get: function(){ return icon; },
				set: function(i){
					i = ""+i;
					if(icon === i){ return i; }
					icon = i;

					leftbtn.childNodes[0].childNodes[0].className = icon;
					rightbtn.childNodes[0].childNodes[0].className = icon;

					this.emit("iconchange");
					return icon;
				}
			},
			multiple: {
				get: function(){ return multiple; },
				set: function(b){
					var that = this;

					b = !!b;
					if(multiple === b){ return b; }
					multiple = b;

					if(!multiple && value.length > 1){
						value = [value[0]];
						[].forEach.call(select.options,function(o, i){
							if(o.value !== value[0]){ that.deselect(i); }
						});
					}

					this.emit("multiplechange");
					return multiple;
				}
			},
			defaultOption: {
				get: function(){ return defOpt; },
				set: function(newdef){

					newdef = typeof newdef === "object"?newdef:null;
					if(defOpt === newdef){ return defOpt; }
					defOpt = newdef;

					if(defOpt){
						defBadge.textContent = defOpt.text;
						noSelection.style.display = "none";
						if(value.length === 0){
							defBadge.style.display = "inline";
						}
					}else{
						defBadge.style.display = "none";
						if(value.length === 0){
							noSelection.style.display = "inline";
						}
					}

					this.emit("defaultchange");
					if(value.length === 0 && defOpt){
						this.emit("valuechange");
					}
					return defOpt;
				}
			},
			open: {
				get: function(){ return open; },
				set: function(b){
					b = !!b;
					if(open === b){ return open; }
					open = b;

					popup.style.display = open?"block":"none";

					if(open){
						resize();

						// SuperSelect is (sometimes) created in modals and needs to disable their focus-stealing nature
						$(document).off('focusin.modal');
						filterbox.focus();
					}

					this.emit("openchange");
					return open;
				}
			},
			button: {
				get: function(){ return btnpos; },
				set: function(pos){
					pos = pos === "right"?pos:"left";
					if(btnpos === pos){ return pos; }
					btnpos = pos;

					popup.classList.remove(btnpos);
					if(pos === "right"){
						btnpos = "right";
						leftbtn.style.display = "none";
						rightbtn.style.display = "block";
					}else{
						btnpos = "left";
						leftbtn.style.display = "block";
						rightbtn.style.display = "none";
					}
					popup.classList.add(btnpos);

					this.emit("buttonchange");
					return btnpos;
				}
			},
			select: {
				value: function(i){
					var o = options[i];
					if(!o || o.selected){ return; }

					o.selected = true;
					o.opt.selected = true;
					o.badge.style.display = "inline";
					o.listing.classList.add("selected");

					if(!multiple){
						options.forEach(function(opt){
							if(opt !== o && opt.selected){
								opt.selected = false;
								opt.opt.selected = false;
								opt.badge.style.display = "none";
								opt.listing.classList.remove("selected");
							}
						});
					}

					updateValue();
				}
			},
			deselect: {
				value: function(i){
					var o = options[i];
					if(!o || !o.selected){ return; }
					o.selected = false;
					o.opt.selected = false;
					o.badge.style.display = "none";
					o.listing.classList.remove("selected");
					updateValue();
				}
			},
			toggle: {
				value: function(i){
					var o = options[i];
					if(!o){ return; }
					if(o.selected){ this.deselect(i); }
					else{ this.select(i); }
				}
			},
			options: {
				get: function(){
					return options.map(function(o){
						return {
							text: o.text,
							desc: o.desc,
							value: o.value,
							selected: o.selected
						};
					});
				},
				set: function(newopts){
					var max = multiple?1/0:1;
					options = newopts.map(function(o,i){
						var badge = constructBadge(o.text,i),
							listing = constructlisting(o.text,o.desc,i),
							opt = document.createElement('option'),
							selected = max > 1 && o.selected !== false && (o.selected || value.indexOf(o.value) > -1);

						opt.value = o.value;

						if(selected){
							opt.selected = true;
							badge.style.display = "inline;";
							listing.className = "option selected";
							max--;
						}else{
							opt.selected = false;
							badge.style.display = "none";
							listing.className = "option";
						}

						return {
							text: o.text||"",
							desc: o.desc||"",
							value: o.value,
							selected: selected,
							badge: badge,
							listing: listing,
							opt: opt
						};
					});

					updateValue();

					select.innerHTML = "";
					badgeHolder.innerHTML = "";
					optionList.innerHTML = "";

					badgeHolder.appendChild(defBadge);
					badgeHolder.appendChild(noSelection);

					options.forEach(function(o){
						select.appendChild(o.opt);
						badgeHolder.appendChild(o.badge);
						optionList.appendChild(o.listing);
					});

					this.emit("optionschange");
					return this.options;
				}
			},
			value: {
				get: function(){
					return	value.length > 0?value.slice():
							defOpt?[defOpt.value]:[];
				},
				set: function(val){
					if(!(val instanceof Array)){ val = [val]; }

					val = val.filter(function(v){ return options.some(function(o){ return o.value == v; }); });

					if(!multiple){ val = val.slice(0,1); }

					options.forEach(function(o){
						if(val.indexOf(o.opt.value) > -1){
							o.selected = true;
							o.opt.selected = true;
							o.badge.style.display = "inline";
							o.listing.classList.add("selected");
						}else{
							o.opt.selected = false;
							o.badge.style.display = "none";
							o.listing.classList.remove("selected");
						}
					});

					updateValue();
					return this.value;
				}
			}
		});

		target = (args.target||args.el);
		target = target instanceof Node?
			target:document.getElementById(target);
		if(!target){ throw new Error("Missing DOM Insertion Point for SuperSelect"); }
		if(target.nodeName === "SELECT"){
			select = target;
			parent = select.parentNode;
			refnode = select.nextSibling;
			multiple = select.multiple;
		}else{
			select = document.createElement('select');
			select.multiple = true;
			parent = target;
			refnode = null;
			multiple = !!args.multiple;
		}

		main.appendChild(select);

		select.style.display = "none";
		select.multiple = true;

		controls.className = "superselect";

		leftbtn = constructButton(this);
		rightbtn = constructButton(this);

		this.button = args.button;
		this.text = args.text;
		this.icon = args.icon;

		controls.appendChild(leftbtn);

		defBadge.className = "badge badge-info pad-right-low";
		noSelection.textContent = "Nothing selected";

		controls.appendChild(badgeHolder);

		controls.appendChild(rightbtn);

		main.appendChild(controls)

		main.addEventListener('click',selectHandler,false);


		popup.className = "superselectPopup";
		popup.classList.add(btnpos);
		popup.style.display = "none";

		point.className = "point";
		popup.appendChild(point);
		popup.appendChild(point.cloneNode());

		filterbox.className = "form-control search-query";
		filterbox.type = "text";

		filterbox.addEventListener('change',filterOptions,false);
		filterbox.addEventListener('keyup',filterOptions,false);

		filterdiv.appendChild(filterbox);
		popup.appendChild(filterdiv);

		optionList.className = "optionListing";
		popup.appendChild(optionList);

		popup.addEventListener('click',selectHandler,false);

		tmpopts = (args.options instanceof Array)?
			args.options:
			[].map.call(select.options,function(opt){
				return {
					text: opt.textContent,
					desc: "",
					value: opt.value,
					selected: opt.selected
				};
			});

		this.options = tmpopts;
		if(args.value instanceof Array){
			this.value = args.value;
		}
		this.defaultOption = args.defaultOption;

		if(typeof args.id === "string"){ this.id = args.id; }
		if(typeof args.name === "string"){ this.name = args.name; }

		// Modals don't allow selection of input elements outside of modal
		if(typeof args.modal === "string"){
			modal = document.getElementById(args.modal);
		}else if(args.modal instanceof Node){
			modal = args.modal;
		}else{
			modal = document.body;
		}

		modal.appendChild(popup);

		parent.insertBefore(main, refnode);

		window.addEventListener("resize", function(){ if(open) resize(); }, false);
		window.addEventListener("click", function(){ that.open = false; }, false);
		document.addEventListener("keyup", function(e){
			if(e.keyCode === 27){ that.open = false; }
		},false);

		if(value.length === 0 && this.value.length > 0){
			setTimeout(function(){ that.emit("valuechange"); },0);
		}

		function updateValue(){
			value = options
					.filter(function(o){ return o.selected; })
					.map(function(o){ return o.value; });

			if(value.length === 0){
				(defOpt?defBadge:noSelection).style.display = "inline";
			}else{
				defBadge.style.display = "none";
				noSelection.style.display = "none";
			}
			that.emit("valuechange");
		}

		function filterOptions(){
			var that = this,
				time = +(new Date);
			if(time <= lastFilter){ return; }
			lastFilter = time + 100;
			setTimeout(function(){
				var filterstr = that.value.toLowerCase();
				options.forEach(function(o){
					var filtered =
						(o.text.toLowerCase().indexOf(filterstr) > -1) ||
						(o.desc.toLowerCase().indexOf(filterstr) > -1);
					if(o.filtered !== filtered){
						o.filtered = filtered;
						o.listing.style.display = filtered?"block":"none";
					}
				});
			},100);
		}

		function selectHandler(e){
			e.stopPropagation();
			e.preventDefault();
			if(e.target.dataset.hasOwnProperty("index")){
				that.toggle(+e.target.dataset.index);
				if(!multiple){ that.open = false; }
			}
		}

		function resize(){
			var bodyRect = modal.getBoundingClientRect(),
				elemRect = (btnpos === "left"?leftbtn:rightbtn).getBoundingClientRect(),
				offsetTop = (elemRect.top + 45) - bodyRect.top,
				offsetLeft = elemRect.left - bodyRect.left;
			popup.style.top = offsetTop + "px";
			popup.style.left = offsetLeft + "px";
		}
	}

	SuperSelect.prototype.emit = function(type,data){
		var that = this, fns = this.events[type];
		if(fns instanceof Array){ fns.forEach(function(cb){ try{cb.call(that,data);}catch(ignore){} }); }
	};

	SuperSelect.prototype.addEventListener = function(name, cb){
		name = name.toLowerCase();
		if(this.events.hasOwnProperty(name)){ this.events[name].push(cb); }
		else{ this.events[name] = [cb]; }
	};

	SuperSelect.prototype.removeEventListener = function(name, cb){
		var i;
		name = name.toLowerCase();
		if(!this.events.hasOwnProperty(name)){ return; }
		i = this.events[name].indexOf(cb);
		if(~i){ this.events[name].splice(i,1); }
	};

	function constructButton(ss){
		var main = document.createElement('div'),
			btn = document.createElement('button'),
			icon = document.createElement('div');

		btn.className = "btn";
		btn.appendChild(icon);
		btn.appendChild(document.createTextNode("Select"));
		main.appendChild(btn);

		btn.addEventListener('click',function(e){
			e.stopPropagation();
			e.preventDefault();
			ss.open = !ss.open;
		},false);

		return main;
	}

	function constructBadge(text,i){
		var badge = document.createElement('span'),
			x = document.createElement('span');

		badge.className = "badge badge-info pad-right-low";
		x.dataset.index = i;

		badge.appendChild(document.createTextNode(text));
		badge.appendChild(x);
		return badge;
	}

	function constructlisting(text,desc,i){
		var main = document.createElement('div'),
			tcon = document.createElement('span'),
			dcon = document.createElement('span'),
			check = document.createElement('div');

		main.style.clear = "both";

		tcon.style.textAlign = "left";
		tcon.style.pointerEvents = "none";

		dcon.style.float = "right";
		dcon.style.pointerEvents = "none";

		check.className = "check";

		tcon.appendChild(check);
		tcon.appendChild(document.createTextNode(text));

		dcon.appendChild(document.createTextNode(desc||""));

		main.appendChild(tcon);
		main.appendChild(dcon);

		main.dataset.index = i;

		return main;
	}

	EditorWidgets.SuperSelect = SuperSelect;

	if(window.Ractive){
		Ractive.components.SuperSelect = Ractive.extend({
			template: "<span></span>",
			onrender(){
				var ss = new SuperSelect({
					target: this.find('span'),
					modal: this.get("modal")
				}), setvalue = false, setting = false, that = this;

				//SuperSelect to Ractive bindings
				ss.addEventListener('idchange',function(){
					if(setting){ return; }
					setting = true;
					that.set("id",ss.id);
					setting = false;
				});
				ss.addEventListener('namechange',function(){
					if(setting){ return; }
					setting = true;
					that.set("name",ss.name);
					setting = false;
				});
				ss.addEventListener('optionschange',function(){
					if(setting){ return; }
					setting = true;
					that.set("options", ss.options);
					setting = false;
				});
				ss.addEventListener('defaultchange',function(){
					if(setting){ return; }
					setting = true;
					that.set("defaultOption", ss.defaultOption);
					setting = false;
				});
				ss.addEventListener('multiplechange',function(){
					if(setting){ return; }
					setting = true;
					that.set("multiple", ss.multiple);
					setting = false;
				});
				ss.addEventListener('valuechange',function(){
					if(setvalue){ return; }
					setvalue = true;
					that.set("value", ss.value);
					setvalue = false;
				});
				ss.addEventListener('textchange',function(){
					if(setting){ return; }
					setting = true;
					that.set("text", ss.text);
					setting = false;
				});
				ss.addEventListener('iconchange',function(){
					if(setting){ return; }
					setting = true;
					that.set("icon", ss.icon);
					setting = false;
				});
				ss.addEventListener('buttonchange',function(){
					if(setting){ return; }
					setting = true;
					that.set("button", ss.button);
					setting = false;
				});

				//Ractive to SuperSelect bindings
				this.observe('id',function(id){
					if(setting){ return; }
					setting = true;
					ss.id = id;
					setting = false;
				});
				this.observe('name',function(name){
					if(setting){ return; }
					setting = true;
					ss.name = name;
					setting = false;
				});
				this.observe('options',function(opts){
					if(setting){ return; }
					setting = true;
					ss.options = opts;
					setting = false;
				});
				this.observe('defaultOption',function(dopt){
					if(setting){ return; }
					setting = true;
					ss.defaultOption = dopt;
					setting = false;
				});
				this.observe('multiple',function(m){
					if(setting){ return; }
					setting = true;
					ss.multiple = m;
					setting = false;
				});
				this.observe('value',function(v){
					if(setvalue){ return; }
					setvalue = true;
					ss.value = v;
					setvalue = false;
				});
				this.observe('text',function(t){
					if(setting){ return; }
					setting = true;
					ss.text = t;
					setting = false;
				});
				this.observe('icon',function(i){
					if(setting){ return; }
					setting = true;
					ss.icon = i;
					setting = false;
				});
				this.observe('button',function(b){
					if(setting){ return; }
					setting = true;
					ss.button = b;
					setting = false;
				});
			}
		});
	}
}());