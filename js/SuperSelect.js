(function(){
	if(typeof window.EditorWidgets !== 'object'){
		window.EditorWidgets = {};
	}

	EditorWidgets.SuperSelect = Ractive.extend({
		template: '<div style="display:inline-block;position:relative;">\
			<select style="display:none;" name="{{id}}" id="{{id}}" multiple="{{multiple}}">\
				{{#options}}<option value="{{.value}}" selected="{{checkSelected(.value, selection)}}"></option>{{/options}}\
				{{#defaultValue}}<option value="{{.value}}" selected="{{showDefault}}"></option>{{/defaultValue}}\
			</select>\
			<div class="superselect">\
				{{#(button === "left")}}<div>\
					<button class="btn" on-tap="open"><i class="{{icon}}"></i> {{text}}</button>\
				</div>{{/button}}\
				<span>\
				{{#options:i}}\
					{{#checkSelected(.value,selection)}}\
						<span class="badge badge-info pad-right-low">\
							{{.text}} {{#multiple}}<span style="color: white; cursor: pointer;" on-tap="select:{{i}}">×</span>{{/multiple}}\
						</span>\
					{{/checkSelected}}\
				{{/options}}\
				{{#showDefault}}\
						<span class="badge badge-info pad-right-low">\
							{{defaultValue.text}}\
						</span>\
				{{/showDefault}}\
				{{^selection.length}}<span>Nothing selected</span>{{/selection.length}}\
				</span>\
				{{^(button === "left")}}<div>\
					<button class="btn" on-tap="open"><i class="{{icon}}"></i> {{text}}</button>\
				</div>{{/button}}\
			</div>\
			<div class="superselectPopup {{(button === "left"?"left":"right")}}" style="display:{{open?"block":"none"}};" on-tap="clickpopup">\
				<div class="point"></div>\
				<div class="point"></div>\
				<div>\
					<input type="text" class="search-query" value="{{filterstr}}"/>\
				</div>\
				<div class="optionListing">\
					{{#options:i}}\
					{{#filter(filterstr,.text,.desc)}}\
					<div style="clear: both;" class="{{checkSelected(.value,selection)?"option selected":"option"}}" on-tap="select:{{i}}">\
						<span style="text-align:left;"><div class="check"></div>{{.text}}</span>\
							{{#desc}}<span style="float: right;">{{.desc}}</span>{{/desc}}\
					</div>\
					{{/filter}}\
					{{/options}}\
				</div>\
			</div>\
		</div>',
		data: {
			filterstr: "",
			filter: function(str,text,desc){
				return	text.toLowerCase().indexOf(str.toLowerCase()) > -1 ||
						desc.toLowerCase().indexOf(str.toLowerCase()) > -1 ;
			},
			checkSelected: function(optval,selval){
				return ~selval.indexOf(optval);
			},
			showDefault: false
		},
		onrender: function(options){
			var r = this,
				popup = this.find('.superselectPopup'),
				superSel = this.find('.superselect .btn'),
				select = this.find('select'),
				defval = this.get("defaultValue"),
				defaultExists = !!defval,
				modalId = this.get("modalId"),
				resizeEvt;

			// Allow the popup to pop out of whatever element it is in to reduce cliping
			popup.parentNode.removeChild(popup);

			// Check to see if the modal exists
			// Do this because some ractive elements are created without being used,
			// so the modals don't actually exist. So its just safer to check if the
			// modal exists first.
			if (!document.querySelectorAll("#" + modalId).length) { modalId = false; }

			if (modalId){
				// Modals don't allow selection of input elements outside of modal
				document.getElementById(modalId).appendChild(popup);
				resizeEvt = function(){
					var bodyRect = document.getElementById(modalId).getBoundingClientRect(),
						elemRect = superSel.getBoundingClientRect(),
						offsetTop = (elemRect.top + 45) - bodyRect.top,
						offsetLeft = elemRect.left - bodyRect.left;
					popup.style.top = offsetTop + "px";
					popup.style.left = offsetLeft + "px";
				};
			} else {
				document.body.appendChild(popup);
				resizeEvt = function(){
					var bodyRect = document.body.getBoundingClientRect(),
						elemRect = superSel.getBoundingClientRect(),
						offsetTop = (elemRect.top + 45) - bodyRect.top,
						offsetLeft = elemRect.left - bodyRect.left;
					popup.style.top = offsetTop + "px";
					popup.style.left = offsetLeft + "px";
				};
			}
			this.set('showDefault', (defaultExists && !(this.get("selection").length)));
			if (this.get('showDefault')){
				this.set('selection',[defval.value]);
			} else if (defaultExists){
				if (~this.get("selection").indexOf(defval.value))
					this.set('showDefault', true);
			}

			this.set('open',false);
			this.on('clickpopup',function(e){ e.original.stopPropagation(); });
			this.on('open',function(e) {
				e.original.stopPropagation();
				e.original.preventDefault();
				if(this.get("open")){
					this.set('open', false);
				}else{
					this.set('open', true);
					resizeEvt();
					this.find('input.search-query').focus();
				}
				return false;
			});
			this.on('select',function(e,which){
				var sels = this.get("selection"),
					selopt = select.options[which],
					optval = this.get("options")[which].value;
				if(this.get("multiple")){
					if(selopt.selected){
						sels.splice(sels.indexOf(optval),1);
						if (defaultExists && sels.length === 0) {
							sels.push(defval.value);
							this.set('showDefault', true);
						}
					}else{
						sels.push(optval);
						if (defaultExists && sels[0] === defval.value) {
							sels.splice(0,1);
							this.set('showDefault', false);
						}
					}
				} else {
					select.value = optval;
					if(sels[0] === optval){
						if(!defaultExists){ return; }
						this.set('selection', [defval.value]);
						this.set('showDefault', true);
					} else {
						this.set('selection', [optval]);
						this.set('showDefault', false);
					}
					this.set('open', false);
				}
				resizeEvt();
			});
			window.addEventListener("resize", function(){ if (r.get("open")) resizeEvt(); }, false);
			window.addEventListener("click", function(){ r.set('open',false); }, false);
			document.addEventListener("keyup", function(e) {
				if (e.keyCode === 27) { r.set('open',false); }
			});
		}
	});
}());