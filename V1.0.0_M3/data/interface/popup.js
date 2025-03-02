// Sound Booster by hemanta gayen
const API = chrome || browser;
const $ = (ele)=> { elemnts = document.querySelectorAll(ele); return elemnts? elemnts.length > 1 ? elemnts : elemnts[0] : null;};
const READY = (callback)=>{document.readyState === "complete" ? callback() : window.addEventListener("load", callback, {once: true})};
const STORAGE = (key)=>{ return new Promise(resolve => { API.storage.local.get([key], (result) => { resolve(result[key]);});});};
const DEBOUNCE = (callback, delay)=> {let timer; return ()=> { clearTimeout(timer); timer = setTimeout(() => {callback();}, delay)}};
const TAB_ID = ()=>{urlPara = new URLSearchParams(window.location.search);return urlPara ? urlPara.get("tabID") ? parseInt(urlPara.get("tabID"), 10) : null : null;}
const ACTIVE_TAB = ()=>{return new Promise(((resolve, reject) => {API.tabs.query({active: true}, (tabs => {API.runtime.lastError ||  resolve(tabs[0]);}))}))}
const MODE = (dark)=>{ API.action.setBadgeBackgroundColor({ color: dark ? "#026fff" : "#51005f"});if (!$("body")) return; is_dark = $("body").classList.contains('dark'); dark ? is_dark ? null: $("body").classList.add('dark') : is_dark ? $("body").classList.remove('dark'):null;}
const REMOVE_BLOCK = (block) =>{ele = $(".reset_button_block"); if (!ele) return; is_block = ele.classList.contains('hide'); block ? is_block ? null : ele.classList.add('hide') : is_block ? ele.classList.remove('hide') : null;}
const MEDIA = (id)=>{return new Promise((resolve, reject)=> {resolve(navigator.mediaDevices.getUserMedia({video: false,audio: {mandatory: {chromeMediaSource: "tab",chromeMediaSourceId: id}}}));})}
const AUDIBLE =()=>{
	return new Promise((resolve, reject) =>{
	 	API.tabs.query({
          audible: true,
          windowType: "normal"
        },(tabs)=>{
			tabs.sort((currentTab, oldTab)=> currentTab.id - oldTab.id);
			tabs.forEach(tab => {
				currentId = TAB_ID();
				if (tab.id == currentId) {
					resolve(tab);
				}
			});

        });
	});
}


class POPUP {
	constructor() {
		this.active_text = (API.i18n.getMessage('active')).length < 26 ? API.i18n.getMessage('active'):'Active tab playing audio:';
	    this.deactive_text = (API.i18n.getMessage('deactive')) < 30 ? API.i18n.getMessage('deactive'): 'There are no audio right now';
	    this.active_tab = null;

		ACTIVE_TAB().then(tab => {this.active_tab = tab});

		API.tabs.onUpdated.addListener(DEBOUNCE((() => {
            this.show();
        }), 500));

	    API.tabs.onRemoved.addListener((tabID => {
			this.remove(tabID);
	    }));

	    API.tabCapture.onStatusChanged.addListener((info=> {
	    	"active" == info.status && info.tabId && API.tabs.get(info.tabId, (e => {
	    		chrome.windows.get(e.windowId, (e => {
	    			const ID = e.id;
	    			true !== this.load("fullScreen") ? true === info.fullscreen ?
	    			(this.save("windowState", e.state),
	    				chrome.windows.update(ID, {
	    					state: "fullscreen",
	                		focused: true
	    				}, null)) : chrome.windows.update(ID, {
	                    state: this.load("windowState")
	                }, null) : chrome.windows.update(ID, {
	                    state: e.state
	                }, null)
	    		}));
	    	}));
	    }));
	}


	async theme(){
		const darkMode = await STORAGE("darkMode");
		$("#toogle").checked = darkMode !== undefined ? darkMode : false;
		MODE(darkMode !== undefined ? darkMode : false);
		$("#toogle").addEventListener("click",async (event)=> {
	        const darkMode = event.currentTarget.checked;
	        await API.storage.local.set({darkMode});
	        MODE(darkMode);
	    });
	}

	load(key){
		let storeKey = window.localStorage[key];
        return void 0 === storeKey ? null : JSON.parse(storeKey);
	}

	save(key, storeKey){
		return window.localStorage[key] = JSON.stringify(storeKey), true;
	}

	async initialize() {
		const consumerId = (await API.tabs.getCurrent())?.id;
		REMOVE_BLOCK(true);
		API.tabCapture.getMediaStreamId({
	        consumerTabId: consumerId,
	        targetTabId: TAB_ID() || this.active_tab ? this.active_tab.id : null
	    },async (streamId) =>{
	    	if (!API.runtime.lastError) {
	    		this.stream = await MEDIA(streamId);
	    		if (!API.runtime.lastError) {
	    		    this.audioCtx = new AudioContext();
				    const source = this.audioCtx.createMediaStreamSource(this.stream);
				    this.gainNode = this.audioCtx.createGain();
				    source.connect(this.gainNode);
				    this.gainNode.connect(this.audioCtx.destination);
				    console.log(this.gainNode);
	    		}
	    	}
	    });


	}

	badge(val){
		const tabID = TAB_ID();
		if (tabID && val) {
			API.action.setBadgeText({
	          text: (val).toString(),
	          tabId: tabID
	    	})
		}
	}

	message(val){
		if (this.active_tab) {
			const tabID = TAB_ID();
			if (this.active_tab.id == TAB_ID()) {
				try{
					API.tabs.sendMessage(tabID, {action: "volumeGain",volume: val},(response)=>{
						if(API.runtime.lastError){
						    console.log(API.runtime.lastError, 'Did not send');
						}else console.log(response);
					});
				}catch(err) {
			    	console.log(err.message);
			  	}
			}
		}
	
	}

	volume(val){
		this.gainNode ? (this.gainNode.gain.value = val / 100,this.badge(val),this.message(val)) : this.initialize();
	}

	remove(tabID){
		tabID ? TAB_ID() ? tabID == TAB_ID() ? window.close(): null : null: null;
	}

	async show(){
	    let audible_ele = document.querySelector(".tab");
	    if (audible_ele) {
	    	const parentElement = audible_ele.parentNode; 
            parentElement.removeChild(audible_ele); 
	    }
	    	
	    $(".tabs_title").textContent = this.deactive_text;

	    const audible_tab = await AUDIBLE();
	    if (audible_tab) {
	    	$(".tabs_title").textContent = this.active_text;
	    	const ele = $("#template_tab").content;
	    	ele.querySelector(".tab").dataset.tabId = audible_tab.id;
	    	ele.querySelector(".tab_image").src = audible_tab.favIconUrl;
	    	ele.querySelector(".tab_title").textContent = audible_tab.title;
	    	$(".tabs_list").appendChild(document.importNode(ele, true));
	    	$("title").textContent = audible_tab.title;
	    }
		
	}

	footer(){
		$(".footer_text").textContent = `Sound Booster v${API.runtime.getManifest().version}`;
		$(".footer_rate").addEventListener("click", (() => {
	        API.tabs.create({
	            url: `https://chrome.google.com/webstore/detail/volume-booster/${chrome.runtime.id}/reviews`
	        });
	    }));
	}

	translate(){
		$(".header_description").textContent = (API.i18n.getMessage('app_short_description')).length < 60 ? 
		API.i18n.getMessage('app_short_description'): "Boost your browser's audio up to 600% with a single click.";
	}

	listener(tab){
		$(".sound_slider").addEventListener("input", (event)=> {
		    var range = event.currentTarget.value;
		    $(".sound_info_current_value").innerText = range;
		    this.volume(range);
		});

		$(".mute_btn").addEventListener("click", (event)=> {
			$(".sound_slider").value = 0;
			$(".sound_info_current_value").innerText = "0";
			this.volume(0);
		});

		$(".hundred_btn").addEventListener("click", (event)=> {
			$(".sound_slider").value = 100;
			$(".sound_info_current_value").innerText = "100";
			this.volume(100);
		});

		$(".sound_info_minus").addEventListener("click", (event)=> {
			const soundVal = parseInt($(".sound_slider").value, 10) - 10;
			soundVal!==undefined ? soundVal < 0 ? 
			(this.volume(0), $(".sound_slider").value = 0, $(".sound_info_current_value").innerText = "0"):
			(this.volume(soundVal), $(".sound_slider").value = soundVal, $(".sound_info_current_value").innerText = soundVal.toString()): null;
		});

		$(".sound_info_plus").addEventListener("click", (event)=> {
			const soundVal = parseInt($(".sound_slider").value, 10) + 10;
			soundVal!==undefined ? soundVal > 600 ? 
			(this.volume(600), $(".sound_slider").value = 600, $(".sound_info_current_value").innerText = "600"):
			(this.volume(soundVal), $(".sound_slider").value = soundVal, $(".sound_info_current_value").innerText = soundVal.toString()): null;
		});


		$(".reset_button_view").addEventListener("click", (event)=> {
			if (this.gainNode == null) return;
			this.stream.getTracks().forEach((e => e.stop()));
			this.gainNode.disconnect();
			this.audioCtx.close().then(() => {
		      	this.audioCtx = null; 
		      	this.gainNode = null;
		    	REMOVE_BLOCK(false);

		    });
			
		});

		$(".tabs_list").addEventListener("click", (event) => {
	      event.preventDefault();
	      const ele = event.target.closest(".tab");
	      const tabId = parseInt(ele.dataset.tabId, 10);
	      API.tabs.update(tabId, {active: true}, (tab) => {
	          API.windows.update(tab.windowId, {
	              focused: true
	          });
	      });
	    },false);

	}

	async start(){
		this.footer();
		this.translate();
		this.theme();
		this.initialize()
		this.listener();   
	}

}

READY(() => {
	try{
		const popup = new POPUP;
		popup.start();
	}catch(err) {
    	console.log(err.message);
  	}
});
