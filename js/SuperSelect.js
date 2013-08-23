(function(){
	if(typeof window.EditorWidgets !== 'object'){
		window.EditorWidgets = {};
	}
	
	EditorWidgets.SuperSelect = Ractive.extend({
		template: '<div style="display:inline-block;position:relative;">\
			<select value={{selection}} style="display:none;" name="{{id}}" id="{{id}}" multiple="{{multiple}}">\
				{{#options}}<option value="{{.value}}"></option>{{/options}}\
			</select>\
			<div class="{{open?"superselect open":"superselect"}}">\
				<span>\
				{{#options}}\
					{{#checkSelected(.value,selection,multiple)}}<span class="badge badge-info pad-right-low">{{.text}}</span>{{/checkSelected}}\
				{{/options}}\
				{{^selection.length}}<span>Nothing selected</span>{{/selection.length}}\
				</span>\
				<div>\
					<button class="btn" proxy-tap="open"><i class="{{icon}}"></i> {{text}}</button>\
				</div>\
			</div>\
			<div class="superselectPopup" style="display:{{open?"block":"none"}};" proxy-tap="clickpopup">\
				<div class="point"></div>\
				<div class="point"></div>\
				<div>\
					<input type="text" class="search-query" value="{{filterstr}}"/>\
				</div>\
				<div class="optionListing">\
					{{#options:i}}\
					{{#filter(filterstr,.text)}}\
					<div class="{{checkSelected(.value,selection,multiple)?"option selected":"option"}}" proxy-tap="select:{{i}}"><div class="check"></div>{{.text}}</div>\
					{{/filter}}\
					{{/options}}\
				</div>\
			</div>\
		</div>',
		data: {
			filterstr: "",
			filter: function(str,text){ return text.toLowerCase().indexOf(str.toLowerCase()) > -1; },
			checkSelected: function(optval,selval,multiple){
				return multiple ? selval.indexOf(optval) > -1 : selval === optval;
			}
		},
		init: function(options){
			var r = this,
				popup = this.find('.superselectPopup'),
				select = this.find('select');
			
			this.set('open',false);
			this.on('clickpopup',function(e){ e.original.stopPropagation(); });
			this.on('open',function(e) {
				e.original.stopPropagation();
				e.original.preventDefault();
				if(this.data.open){
					this.set('open', false);
				}else{
					popup.style.top = select.offsetTop + 45;
					popup.style.left = select.offsetLeft + select.offsetWidth - 280;
					this.set('open', true);
				}
				return false;
			});
			this.on('select',function(e,which){
				var idx, selval = this.data.selection,
					optval = this.data.options[which].value;
				if(this.data.multiple){
					idx = selval.indexOf(optval);
					if(idx === -1){ selval.push(optval); }
					else{ selval.splice(idx,1); }
				}else{
					this.set('selection',(selval === optval)?"":optval);
				}
			});
			window.addEventListener("click", function(){ r.set('open',false); }, false);
			document.addEventListener("keyup", function(e) {
				if (e.keyCode === 27) { r.set('open',false); }
			});	
		}
	});
}());